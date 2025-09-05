import React, { useState, useEffect, lazy, Suspense } from "react";
import { BottomSheet } from "./BottomSheet";
import { ErrorBoundary } from "./ErrorBoundary";
import { getEvents, clearEvents, downloadEventsCSV } from '../lib/analytics';
import { getLastEvents, clearEvents as clearTelemetryEvents } from '../telemetry/events';
import { ThemeToggle } from './ThemeToggle';
import { learnerCache } from '../learning/model';
import { computeInsights } from '../learning/insights';
import type { SkillInsight } from '../learning/insights';
import { useProfile } from '../profile/context';
import type { AgeBand } from '../profile/model';
import { Timeline } from '../guide/Timeline';
import { Privacy } from '../settings/Privacy';
// Import Consent component directly for now to debug
import { Consent } from '../settings/Consent';
import { QuickStart } from '../teacher/QuickStart';
import { QAPanel } from './QAPanel';
import { ReportsTab } from './ReportsTab';
import { downloadCsv, getCsvStats } from '../guide/exportCsv';
import { loadEvents, getEventsRange } from '../progress';
import { Download } from 'lucide-react';
import { AssignmentCreator } from '../guide/AssignmentCreator';
import { AssignmentsManager } from '../guide/AssignmentsManager';
import { AssignmentsSummary } from '../guide/AssignmentsSummary';
import { CloudSyncSettings } from '../auth/CloudSyncSettings';
import { PrefetchSettings } from './PrefetchSettings';
import { InsightsCard } from '../guide/InsightsCard';
import { isGuide, toggleGuideMode } from '../guide/auth';
import { getEventsByKind } from '../progress/events';
import { AuditLogView } from './AuditLogView';
import { RosterManagement } from './RosterManagement';
import { RosterImport } from '../guide/RosterImport';
import { FunnelViewer } from '../debug/FunnelViewer';
import { getAllAssignments, setVariant, getScoutDwellVariant, SCOUT_DWELL_VARIANTS } from '../ab/model';
import { getScoutDwellAnalytics } from '../ab/analytics';
import { FeatureFlagsPanel } from './FeatureFlagsPanel';
import { ContentStudio } from '../authoring/Studio';
import { CoverageReportComponent } from '../authoring/CoverageReport';
import { ContentPackSettings } from './ContentPackSettings';
import { PrivacyHub } from '../guide/privacy/PrivacyHub';
import { Classes } from '../guide/Classes';
import { Dashboard } from '../guide/Dashboard';
import { FeedbackPanel } from '../feedback/FeedbackPanel';
import { useFlags, Flags } from '../config/flags';
import { TeacherLayoutV2 } from '../guide/teacher/TeacherLayoutV2';
import TabContentV2 from '../guide/teacher/TabContentV2';

// Lazy import Appearance settings
const Appearance = lazy(() => import('../settings/Appearance'));

// Import TriageBoard for development mode
import { TriageBoard } from '../guide/dev/TriageBoard';
import PinGallery from '../guide/dev/PinGallery';
import ScoutGallery from '../guide/dev/ScoutGallery';
import ArtDiagnostics from '../guide/dev/ArtDiagnostics';

const SUBJECTS = {
  forest: { label: "Literacy", color: "#3B7D44" },
  desert: { label: "Math", color: "#C96A2B" },
  ocean:  { label: "Science", color: "#3BA7B6" },
  night:  { label: "HASS", color: "#404A73" },
};

// Define tab types and constants
const TABS = ['overview', 'quickstart', 'timeline', 'assignments', 'content', 'roster', 'classes', 'dashboard', 'privacy', 'appearance', 'consent', 'audit', 'studio', 'pilot', 'funnel', 'qa', 'reports', 'dev'] as const;
type Tab = typeof TABS[number];

// Progress encode/decode helpers (URL-safe Base64)
const b64urlEncode = (s: string) => { const bytes = new TextEncoder().encode(s); let bin = ''; bytes.forEach(b => bin += String.fromCharCode(b)); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const b64urlDecode = (s: string) => { const n = s.replace(/-/g, '+').replace(/_/g, '/'); const pad = n.length % 4 ? '='.repeat(4 - (n.length % 4)) : ''; const str = atob(n + pad); const bytes = new Uint8Array(str.length); for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i); return new TextDecoder().decode(bytes); };

const extractQiFromInput = (input: string) => { try { const url = new URL(input); const q = url.searchParams.get('qi'); if (q) return q; } catch { } const m = String(input || '').match(/[?&#]qi=([A-Za-z0-9_-]+)/); return m ? m[1] : String(input || '').trim(); };

interface TeacherPanelProps {
  open: boolean;
  onClose: () => void;
  frameworks: string[];
  framework: string;
  setFramework: (framework: string) => void;
  protoOnly: boolean;
  setProtoOnly: (protoOnly: boolean) => void;
  completed: {
    forest: Set<string>;
    desert: Set<string>;
    ocean: Set<string>;
    night: Set<string>;
  };
  onImport: (token: string) => void;
  onExport: () => string;
  lessons: any;
  loop: number;
  onResetCurrentLoop: () => void;
  onFactoryReset: () => void;
  teacherPins: boolean;
  setTeacherPins: (v: boolean) => void;
  onOpenJournal?: (skillId: string) => void;
}

// Snapshot helpers
const SNAP_KEY = 'qi_snapshots';
type Snapshot = { ts: string; loop: number; link: string };

function loadSnaps(): Snapshot[] {
  try { return JSON.parse(localStorage.getItem(SNAP_KEY) || '[]'); } catch { return []; }
}
function saveSnaps(snaps: Snapshot[]) {
  try { localStorage.setItem(SNAP_KEY, JSON.stringify(snaps)); } catch {}
}

export function TeacherPanel({ open, onClose, frameworks, framework, setFramework, protoOnly, setProtoOnly, completed, onImport, onExport, lessons, loop, onResetCurrentLoop, onFactoryReset, teacherPins, setTeacherPins, onOpenJournal }: TeacherPanelProps) {
  const [importValue, setImportValue] = useState('');
  const [exportLink, setExportLink] = useState('');
  const [snaps, setSnaps] = useState<Snapshot[]>(() => loadSnaps());
  const [showAuthoring, setShowAuthoring] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<string>('all');
  
  // Final Art toggle for DEV tab
  const flags = useFlags();
  const finalArtEnabled = flags.finalArt;
  const teacherPanelV2Enabled = flags.teacherPanelV2;
  
  const handleFinalArtToggle = (enabled: boolean) => {
    Flags.set({ finalArt: enabled });
  };
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Profile context - TEMP: commenting out during context debugging
  // const { profile, updateProfile } = useProfile();
  const profile = { ageBand: 'primary', calmMode: true };
  const updateProfile = (updates: any) => { console.log('updateProfile called:', updates); };
  
  // Helper to get current biome for QA panel
  const getCurrentBiome = (): 'forest' | 'desert' | 'ocean' | 'night' => {
    // Map time of day to biomes - simplified for QA testing
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'forest';
    if (hour >= 12 && hour < 18) return 'desert'; 
    if (hour >= 18 && hour < 22) return 'ocean';
    return 'night';
  };
  
  // Compute insights data
  const learnerState = learnerCache.getState();
  const insights = computeInsights(learnerState, framework, loop, profile.ageBand);
  
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';

  // URL sync for tab navigation
  useEffect(() => {
    if (open) {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab') as Tab | null;
      if (urlTab && TABS.includes(urlTab)) {
        setActiveTab(urlTab);
      }
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', activeTab);
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
  }, [activeTab, open]);

  // Tab navigation handler
  const handleTabClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const tab = event.currentTarget.dataset.tab as Tab;
    if (tab && TABS.includes(tab)) {
      setActiveTab(tab);
    }
  };

  // Development helper
  useEffect(() => {
    if (isDev) {
      (window as any).__openConsent = () => setActiveTab('consent');
      (window as any).__openGuideTab = (tab: Tab) => {
        if (TABS.includes(tab)) {
          setActiveTab(tab);
        }
      };
    }
    return () => {
      if (isDev) {
        delete (window as any).__openConsent;
        delete (window as any).__openGuideTab;
      }
    };
  }, [isDev]);
  
  const handleExport = () => { const link = onExport(); setExportLink(link); };
  const handleImport = () => { 
    if (importValue.trim()) { 
      try {
        onImport(extractQiFromInput(importValue)); 
        setImportValue(''); 
        alert('Progress imported successfully!');
      } catch {
        alert('Invalid progress data — please check your link.');
      }
    } 
  };
  
  // Dynamic totals from current loop lessons
  const totals = {
    forest: (lessons.forest || []).length,
    desert: (lessons.desert || []).length,
    ocean:  (lessons.ocean  || []).length,
    night:  (lessons.night  || []).length,
  };
  const done = {
    forest: completed.forest?.size || 0,
    desert: completed.desert?.size || 0,
    ocean:  completed.ocean?.size  || 0,
    night:  completed.night?.size  || 0,
  };
  
  // Recent analytics
  const recent = getEvents().slice(-10).reverse();
  
  // Recent telemetry events (DEV only)
  const recentTelemetry = getLastEvents(10);
  
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportValue(text || '');
    } catch {
      alert('Clipboard not available — please paste manually.');
    }
  };
  // Extract content rendering logic
  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm font-medium text-stone-700 mb-2">🏠 Learning Overview</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {Object.entries(SUBJECTS).map(([biome, subject]) => (
                <div key={biome} className="space-y-1">
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="font-medium">{subject.label}</span>
                  </div>
                  <div className="text-stone-600">
                    {done[biome as keyof typeof done]}/{totals[biome as keyof typeof totals]} completed
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
    // Add more tab content as needed...
    return <div className="p-4 text-center text-gray-500">Tab content for {activeTab}</div>
  }

  // Use new layout when flag is enabled
  if (teacherPanelV2Enabled && open) {
    return <TeacherLayoutV2 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onClose={onClose}
      renderContent={() => <TabContentV2 tab={activeTab} />} 
    />
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-stone-800 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚙️</span>
          <h3 className="font-extrabold text-lg">Teacher Panel</h3>
          <div className="ml-auto flex items-center gap-2">
            {isDev && (
              <button
                onClick={() => setShowAuthoring(!showAuthoring)}
                className={`text-xs px-3 py-1 rounded-full border transition ease-out ${
                  showAuthoring 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white hover:bg-stone-50'
                }`}
              >
                {showAuthoring ? '🔧 Exit Authoring' : '🔧 Authoring'}
              </button>
            )}
            <ThemeToggle />
            <button onClick={onClose} className="text-xs px-2 py-1 rounded-full border bg-white hover:bg-stone-50">Close</button>
          </div>
        </div>

        {showAuthoring && isDev ? (
          <div className="flex-1 min-h-0 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-bold text-blue-800 mb-2">🔧 Content Authoring Tool</h3>
            <p className="text-blue-700">Authoring tool will be available here when implementation is complete.</p>
            <div className="mt-4 p-3 bg-blue-100 rounded border">
              <div className="text-sm text-blue-800">
                <strong>Features coming:</strong>
                <ul className="list-disc ml-4 mt-2">
                  <li>Live JSON editor with validation</li>
                  <li>Real-time prototype question preview</li>
                  <li>Import/Export functionality</li>
                  <li>Schema validation with error reporting</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-auto">
          <div><label className="block text-sm font-semibold mb-2">Standards Framework</label><select value={framework} onChange={(e) => setFramework(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">{frameworks.map(f => <option key={f} value={f}>{f}</option>)}</select><div className="text-[11px] text-stone-600 mt-1">This sets which framework code appears in Lesson Detail. (Registry supports Generic / ACARA / NZC.)</div></div>
          <div><label className="flex items-center gap-2"><input type="checkbox" checked={protoOnly} onChange={(e) => setProtoOnly(e.target.checked)} className="rounded" />Use prototype-only mode</label><div className="text-xs text-stone-600 mt-1">When enabled, all activities use in-app prototypes instead of external links.</div></div>
          
          {/* Learner Profile Card */}
          <div className="mt-4 border-t pt-3">
            <div className="text-sm font-semibold mb-2">
              👤 Learner Profile (beta)
              <span className="ml-2 text-xs text-stone-500 font-normal">
                Updated: {new Date(profile.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="space-y-3">
                {/* Name field */}
                <div>
                  <label htmlFor="learner-name" className="block text-xs font-medium text-purple-800 mb-1">
                    Name / Nickname
                  </label>
                  <input
                    id="learner-name"
                    type="text"
                    value={profile.name || ''}
                    onChange={(e) => updateProfile({ name: e.target.value })}
                    placeholder="Enter learner's name..."
                    className="w-full px-2 py-1 text-sm border rounded bg-white"
                    data-testid="input-learner-name"
                  />
                </div>
                
                {/* Age band field */}
                <div>
                  <label htmlFor="age-band" className="block text-xs font-medium text-purple-800 mb-1">
                    Age Band
                  </label>
                  <select
                    id="age-band"
                    value={profile.ageBand || ''}
                    onChange={(e) => updateProfile({ ageBand: e.target.value as AgeBand })}
                    className="w-full px-2 py-1 text-sm border rounded bg-white"
                    data-testid="select-age-band"
                  >
                    <option value="">Select age band...</option>
                    <option value="5-6">5-6 years</option>
                    <option value="7-8">7-8 years</option>
                    <option value="9-10">9-10 years</option>
                    <option value="11-12">11-12 years</option>
                  </select>
                </div>
                
                {/* Calm mode toggle */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={profile.calmMode}
                      onChange={(e) => updateProfile({ calmMode: e.target.checked })}
                      className="rounded"
                      data-testid="checkbox-calm-mode"
                    />
                    <span className="text-xs font-medium text-purple-800">Calm Mode</span>
                  </label>
                  <div className="text-[11px] text-purple-600 mt-1">
                    Reduces animations and sounds for a more peaceful experience
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div><div className="text-sm font-semibold mb-2">Progress Overview</div><div className="grid grid-cols-2 gap-2">{Object.entries(SUBJECTS).map(([biome, subject]) => (<div key={biome} className="p-2 bg-stone-50 rounded-lg"><div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">{subject.label}</span><span className="text-xs text-stone-600">{done[biome]}/{totals[biome]}</span></div><div className="h-1.5 bg-stone-200 rounded"><div className="h-1.5 rounded" style={{ width: `${totals[biome] ? (done[biome]/totals[biome])*100 : 0}%`, background: subject.color }} /></div></div>))}</div><div className="mt-4"><label className="flex items-center gap-2"><input type="checkbox" checked={teacherPins} onChange={(e)=>setTeacherPins(e.target.checked)} className="rounded" />Show lesson pins on map (Teacher)</label><div className="text-[11px] text-stone-600 mt-1">Hidden by default. When Compass is equipped, only the next lesson pin shows.</div></div></div>
          <div><div className="text-sm font-semibold mb-2">Export Progress</div><div className="flex gap-2 flex-wrap"><button onClick={() => { const link = onExport(); try { navigator.clipboard.writeText(link); } catch {} alert('Progress link copied to clipboard.'); }} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ease-out">Copy progress link</button><button onClick={() => { const link = onExport(); try { navigator.clipboard.writeText(link); } catch {} const next = [{ ts: new Date().toISOString(), loop, link }, ...snaps].slice(0, 5); setSnaps(next); saveSnaps(next); alert('Snapshot saved (and link copied).'); }} className="px-3 py-2 rounded-lg border bg-white hover:bg-stone-50 transition ease-out">Save snapshot</button>{exportLink && <div className="mt-2 p-2 bg-stone-100 rounded-lg text-xs break-all">{exportLink}</div>}</div><div className="mt-3"><div className="text-sm font-semibold mb-1">Snapshots (last 5)</div>{snaps.length === 0 ? (<div className="text-xs text-stone-500">No snapshots yet.</div>) : (<ul className="space-y-1">{snaps.map((s, i) => (<li key={s.ts + i} className="flex items-center gap-2 text-xs"><span className="opacity-70">{new Date(s.ts).toLocaleString()}</span><span className="opacity-70">• Loop {s.loop}</span><button onClick={() => { try { navigator.clipboard.writeText(s.link); } catch {} alert('Snapshot link copied.'); }} className="ml-2 px-2 py-1 rounded-full border bg-white hover:bg-stone-50">Copy</button><button onClick={() => onImport(s.link)} className="px-2 py-1 rounded-full border bg-white hover:bg-stone-50">Restore</button></li>))}</ul>)}{snaps.length > 0 && (<button onClick={() => { setSnaps([]); saveSnaps([]); }} className="mt-2 px-2 py-1 rounded-full border bg-white hover:bg-stone-50 text-[11px] text-stone-600">Clear snapshots</button>)}</div></div>
          <div><div className="text-sm font-semibold mb-2">Import Progress</div><div className="flex gap-2 mb-2"><label className="sr-only" htmlFor="import-input">Import progress link or token</label><input id="import-input" value={importValue} onChange={(e) => setImportValue(e.target.value)} placeholder="Paste progress link or token" className="flex-1 px-3 py-2 border rounded-lg" /><button onClick={handlePaste} className="px-2 py-1 rounded-full border bg-white hover:bg-stone-50 text-xs" aria-label="Paste from clipboard">Paste</button><button onClick={handleImport} className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition ease-out">Import</button></div></div>
          {/* Insights Card */}
          <div className="mt-4 border-t pt-3">
            <div className="text-sm font-semibold mb-2">
              Insights (beta)
              <span className="ml-2 text-xs text-stone-500 font-normal">
                Framework: {framework}
              </span>
            </div>
            
            {/* Strengths & Needs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {/* Strengths */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-xs font-medium text-green-800 mb-2">
                  💪 Top Strengths
                </div>
                {insights.strengths.length > 0 ? (
                  <div className="space-y-1">
                    {insights.strengths.map(skill => (
                      <div key={skill.skillId} className="flex items-center justify-between text-xs">
                        <span className="text-green-700 truncate">{skill.displayName}</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{skill.percentage}%</span>
                          {skill.trend && (
                            <span className="text-green-600">
                              {skill.trend === 'up' ? '↗' : skill.trend === 'down' ? '↘' : '→'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-green-600">
                    Complete more lessons to see strengths
                  </div>
                )}
              </div>

              {/* Needs */}
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <div className="text-xs font-medium text-orange-800 mb-2">
                  🎯 Areas for Growth
                </div>
                {insights.needs.length > 0 ? (
                  <div className="space-y-1">
                    {insights.needs.map(skill => (
                      <div key={skill.skillId} className="flex items-center justify-between text-xs">
                        <span className="text-orange-700 truncate">{skill.displayName}</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{skill.percentage}%</span>
                          {skill.trend && (
                            <span className="text-orange-600">
                              {skill.trend === 'up' ? '↗' : skill.trend === 'down' ? '↘' : '→'}
                            </span>
                          )}
                          <button
                            onClick={() => onOpenJournal?.(skill.skillId)}
                            className="ml-1 px-1.5 py-0.5 bg-orange-200 hover:bg-orange-300 rounded text-[10px] font-medium text-orange-800 transition-colors"
                            title="Quick 3-question practice"
                            data-testid={`journal-${skill.skillId}`}
                          >
                            Journal 3
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-orange-600">
                    Start some lessons to identify focus areas
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Next Step */}
            {insights.suggestedNextStep && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs font-medium text-blue-800 mb-1">
                  🧭 Suggested Next Step
                </div>
                <div className="text-xs text-blue-700">
                  <span className="font-medium">
                    {insights.suggestedNextStep.biome.charAt(0).toUpperCase() + insights.suggestedNextStep.biome.slice(1)} Lesson {insights.suggestedNextStep.lessonId.toUpperCase()}
                  </span>
                  <div className="text-blue-600 mt-1">
                    {insights.suggestedNextStep.reason}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Telemetry Debug Card (DEV only) */}
          {isDev && recentTelemetry.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <div className="text-sm font-semibold mb-2">
                🔧 Telemetry Events (DEV) 
                <span className="ml-2 text-xs text-stone-500 font-normal">
                  Last {recentTelemetry.length} events
                </span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {recentTelemetry.map((event, index) => (
                  <div key={`${event.timestamp}-${index}`} className="text-xs p-2 bg-yellow-50 rounded border border-yellow-200">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-yellow-800">
                        {event.type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-yellow-600 text-[10px]">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.payload && Object.keys(event.payload).length > 0 && (
                      <div className="mt-1 text-yellow-700 text-[10px] font-mono bg-yellow-100 p-1 rounded">
                        {JSON.stringify(event.payload, null, 1).slice(0, 200)}
                        {JSON.stringify(event.payload).length > 200 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <button 
                  onClick={() => {
                    clearTelemetryEvents();
                    alert('Telemetry events cleared.');
                  }} 
                  className="px-2 py-1 rounded border bg-white hover:bg-stone-50 text-xs text-stone-600"
                >
                  Clear Events
                </button>
                <button 
                  onClick={() => {
                    const events = getLastEvents(50);
                    console.log('Telemetry Buffer:', events);
                    alert(`${events.length} events logged to console.`);
                  }} 
                  className="px-2 py-1 rounded border bg-white hover:bg-stone-50 text-xs text-stone-600"
                >
                  Log to Console
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 border-t pt-3"><div className="text-sm font-semibold mb-2">Quick Practice</div><div className="space-y-2 mb-3"><button onClick={() => { if (typeof onOpenJournal === 'function') onOpenJournal('literacy.phonics'); }} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ease-out text-sm w-full">Practice Phonics</button><button onClick={() => { if (typeof onOpenJournal === 'function') onOpenJournal('math.addition'); }} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ease-out text-sm w-full">Practice Math</button><button onClick={() => { if (typeof onOpenJournal === 'function') onOpenJournal('science.forces'); }} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ease-out text-sm w-full">Practice Science</button></div></div>
          
          {/* Analytics & Timeline Section */}
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center gap-2 mb-3 flex-wrap" role="tablist" aria-label="Teacher Panel Navigation">
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'overview'}
                aria-controls="tab-content-overview"
                id="tab-overview"
                data-tab="overview"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'overview' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-overview"
              >
                📊 Overview
              </button>
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'quickstart'}
                aria-controls="tab-content-quickstart"
                id="tab-quickstart"
                data-tab="quickstart"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'quickstart' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-quickstart"
              >
                🚀 Quick Start
              </button>
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'timeline'}
                aria-controls="tab-content-timeline"
                id="tab-timeline"
                data-tab="timeline"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'timeline' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-timeline"
              >
                📅 Timeline
              </button>
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'assignments'}
                aria-controls="tab-content-assignments"
                id="tab-assignments"
                data-tab="assignments"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'assignments' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-assignments"
              >
                🎯 Assignments
              </button>
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'privacy'}
                aria-controls="tab-content-privacy"
                id="tab-privacy"
                data-tab="privacy"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'privacy' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-privacy"
              >
                🛡️ Privacy & Data
              </button>
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'appearance'}
                aria-controls="tab-content-appearance"
                id="tab-appearance"
                data-tab="appearance"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'appearance' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-appearance"
              >
                🎨 Appearance
              </button>
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'consent'}
                aria-controls="tab-content-consent"
                id="tab-consent"
                data-tab="consent"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'consent' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-consent"
              >
                ✋ Consent
              </button>
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'content'}
                aria-controls="tab-content-content"
                id="tab-content"
                data-tab="content"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'content' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-content"
              >
                📊 Content
              </button>
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'roster'}
                aria-controls="tab-content-roster"
                id="tab-roster"
                data-tab="roster"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'roster' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-roster"
              >
                👥 Learners
              </button>
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'classes'}
                aria-controls="tab-content-classes"
                id="tab-classes"
                data-tab="classes"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'classes' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-classes"
              >
                🏫 Classes
              </button>
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'dashboard'}
                aria-controls="tab-content-dashboard"
                id="tab-dashboard"
                data-tab="dashboard"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-dashboard"
              >
                📊 Dashboard
              </button>
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'audit'}
                aria-controls="tab-content-audit"
                id="tab-audit"
                data-tab="audit"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'audit' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-audit"
              >
                📋 Admin
              </button>
              {/* Content Studio - DEV only */}
              {process.env.NODE_ENV === 'development' && (
                <button 
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'studio'}
                  aria-controls="tab-content-studio"
                  id="tab-studio"
                  data-tab="studio"
                  onClick={handleTabClick}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                    activeTab === 'studio' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border hover:bg-stone-50'
                  }`}
                  data-testid="tab-studio"
                >
                  🔧 Studio
                </button>
              )}
              {/* Pilot Controls - DEV only */}
              {process.env.NODE_ENV === 'development' && (
                <button 
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'pilot'}
                  aria-controls="tab-content-pilot"
                  id="tab-pilot"
                  data-tab="pilot"
                  onClick={handleTabClick}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                    activeTab === 'pilot' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border hover:bg-stone-50'
                  }`}
                  data-testid="tab-pilot"
                >
                  🚀 Pilot
                </button>
              )}
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'funnel'}
                aria-controls="tab-content-funnel"
                id="tab-funnel"
                data-tab="funnel"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'funnel' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-funnel"
              >
                🧪 Funnel
              </button>
              {/* QA Panel - DEV only */}
              {process.env.NODE_ENV === 'development' && (
                <button 
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'qa'}
                  aria-controls="tab-content-qa"
                  id="tab-qa"
                  data-tab="qa"
                  onClick={handleTabClick}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                    activeTab === 'qa' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border hover:bg-stone-50'
                  }`}
                  data-testid="tab-qa"
                >
                  📱 QA
                </button>
              )}
              {/* Reports Tab */}
              <button 
                type="button"
                role="tab"
                aria-selected={activeTab === 'reports'}
                aria-controls="tab-content-reports"
                id="tab-reports"
                data-tab="reports"
                onClick={handleTabClick}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                  activeTab === 'reports' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border hover:bg-stone-50'
                }`}
                data-testid="tab-reports"
              >
                📊 Reports
              </button>
              {/* Dev Tab - development only */}
              {isDev && (
                <button 
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'dev'}
                  aria-controls="tab-content-dev"
                  id="tab-dev"
                  data-tab="dev"
                  onClick={handleTabClick}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ease-out ${
                    activeTab === 'dev' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white border hover:bg-stone-50'
                  }`}
                  data-testid="tab-dev"
                >
                  🐛 Triage
                </button>
              )}
            </div>

            {activeTab === 'roster' ? (
              <div className="space-y-6">
                <RosterImport />
                <div className="border-t pt-6">
                  <RosterManagement />
                </div>
              </div>
            ) : activeTab === 'overview' ? (
              <div>
                <div className="text-sm font-semibold mb-2">Analytics (local)</div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <button 
                    onClick={() => {
                      const events = loadEvents();
                      downloadCsv(events);
                    }} 
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition ease-out text-sm"
                    data-testid="button-export-csv"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button 
                    onClick={() => downloadEventsCSV()} 
                    className="px-2 py-1 rounded-full border bg-white hover:bg-stone-50 transition ease-out text-xs"
                  >
                    Export legacy CSV
                  </button>
                  <button 
                    onClick={() => { 
                      clearEvents(); 
                      alert('Cleared local analytics buffer'); 
                    }} 
                    className="px-2 py-1 rounded-full border bg-white hover:bg-stone-50 transition ease-out text-xs"
                  >
                    Clear buffer
                  </button>
                  <span className="text-[11px] text-stone-600">{getEvents().length} event(s) captured</span>
                </div>
                
                {(() => {
                  const progressEvents = loadEvents();
                  const stats = getCsvStats(progressEvents);
                  return (
                    <div className="mb-3 p-3 bg-stone-50 rounded-lg">
                      <div className="text-xs font-medium mb-2">📈 Progress Summary</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Total Events: <span className="font-medium">{stats.totalEvents}</span></div>
                        <div>Lesson Events: <span className="font-medium">{stats.lessonEvents}</span></div>
                        <div>Journal Events: <span className="font-medium">{stats.journalEvents}</span></div>
                        <div>Guide Events: <span className="font-medium">{stats.guideAckEvents}</span></div>
                        {stats.dateRange && (
                          <div className="col-span-2">Range: <span className="font-medium">{stats.dateRange.start} - {stats.dateRange.end}</span></div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                <div>
                  <div className="text-sm font-semibold mb-2">Recent activity</div>
                  {recent.length === 0 ? (
                    <div className="text-xs text-stone-500">No events yet.</div>
                  ) : (
                    <ul className="space-y-1 text-xs text-stone-700">
                      {recent.map((e, i) => (
                        <li key={`${e.ts}-${e.action}-${i}`} className="flex items-center gap-2">
                          <span>⏺</span>
                          <span className="opacity-70">
                            {new Date(e.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </span>
                          <span className="font-semibold">{e.action}</span>
                          <span className="opacity-70">{e.biome ?? ''} {e.lessonId ?? ''}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : activeTab === 'quickstart' ? (
              <div 
                id="tab-content-quickstart" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-quickstart"
                className="max-h-96 overflow-y-auto space-y-4"
              >
                <QuickStart 
                  onCreateLearner={() => {
                    // Switch to Learners tab for roster management
                    setActiveTab('roster');
                  }}
                  onStartLesson={() => {
                    // Close Teacher Panel to show lessons
                    onClose();
                  }}
                  onOpenJournal={() => {
                    // Use existing journal function if available
                    if (onOpenJournal) {
                      onOpenJournal('quickstart.demo');
                    }
                  }}
                />
              </div>
            ) : activeTab === 'timeline' ? (
              <div className="max-h-96 overflow-y-auto">
                <Timeline 
                  selectedStandard={selectedStandard}
                  onStandardChange={setSelectedStandard}
                  onStartJournal={onOpenJournal}
                />
              </div>
            ) : activeTab === 'assignments' ? (
              <div className="max-h-96 overflow-y-auto space-y-4">
                <AssignmentsSummary onOpenJournal={onOpenJournal} />
                <AssignmentsManager />
                
                {/* Legacy Assignment Creator */}
                <details className="mt-4">
                  <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                    Legacy Assignment Creator (V1)
                  </summary>
                  <div className="mt-2 p-3 border rounded bg-gray-50">
                    <AssignmentCreator selectedFramework={framework} />
                  </div>
                </details>
              </div>
            ) : activeTab === 'content' ? (
              <div 
                id="tab-content-content" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-content"
                className="max-h-96 overflow-y-auto space-y-4"
              >
                <ContentPackSettings />
                <CoverageReportComponent />
              </div>
            ) : activeTab === 'privacy' ? (
              <div 
                id="tab-content-privacy" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-privacy"
                className="max-h-96 overflow-y-auto space-y-4"
              >
                <PrivacyHub />
              </div>
            ) : activeTab === 'appearance' ? (
              <div 
                id="tab-content-appearance" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-appearance"
                className="max-h-96 overflow-y-auto space-y-4"
              >
                <Suspense fallback={<div className="p-4 subtle">Loading…</div>}>
                  <Appearance />
                </Suspense>
              </div>
            ) : activeTab === 'consent' ? (
              <div 
                id="tab-content-consent" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-consent"
                className="max-h-96 overflow-y-auto space-y-4"
              >
                <Consent open={true} onClose={() => setActiveTab('overview')} inline={true} />
              </div>
            ) : activeTab === 'studio' && process.env.NODE_ENV === 'development' ? (
              <div 
                id="tab-content-studio" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-studio"
                className="h-96 overflow-hidden"
              >
                <ContentStudio />
              </div>
            ) : activeTab === 'pilot' ? (
              <div 
                id="tab-content-pilot" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-pilot"
                className="max-h-96 overflow-y-auto space-y-4"
              >
                <FeedbackPanel />
                <FeatureFlagsPanel />
              </div>
            ) : activeTab === 'audit' ? (
              <div className="max-h-96 overflow-y-auto space-y-4">
                {/* DEV: A/B Experiments */}
                {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-purple-600">🔬</span>
                      <h3 className="font-medium text-purple-800">Experiments (DEV)</h3>
                    </div>
                    
                    {(() => {
                      const assignments = getAllAssignments();
                      const scoutAnalytics = getScoutDwellAnalytics(7);
                      const currentVariant = getScoutDwellVariant();
                      
                      return (
                        <div className="space-y-3">
                          {/* Current Assignments */}
                          <div>
                            <div className="text-xs font-medium text-purple-700 mb-2">Current Assignments</div>
                            <div className="bg-white rounded p-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span>scout.dwell:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono bg-purple-100 px-1 rounded">{currentVariant}</span>
                                  <select 
                                    value={currentVariant}
                                    onChange={(e) => {
                                      setVariant('scout.dwell', e.target.value);
                                      window.location.reload(); // Refresh to apply changes
                                    }}
                                    className="text-xs border rounded px-1"
                                  >
                                    {SCOUT_DWELL_VARIANTS.map(v => (
                                      <option key={v} value={v}>Override: {v}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Variant Metrics */}
                          <div>
                            <div className="text-xs font-medium text-purple-700 mb-2">
                              Scout Dwell Metrics (7 days) - {scoutAnalytics.totalImpressions} impressions
                            </div>
                            {scoutAnalytics.variants.length === 0 ? (
                              <div className="text-xs text-purple-600 bg-white rounded p-2">
                                No data yet. Interact with Scout messages to generate metrics.
                              </div>
                            ) : (
                              <div className="bg-white rounded p-2 space-y-2">
                                {scoutAnalytics.variants.map(variant => (
                                  <div key={variant.variant} className="flex items-center justify-between text-xs">
                                    <span className="font-mono">{variant.variant}:</span>
                                    <div className="flex items-center gap-3 text-right">
                                      <span>CTR: {(variant.ctr * 100).toFixed(1)}%</span>
                                      <span>Dwell: {variant.medianDwellMs}ms</span>
                                      <span className="text-purple-600">({variant.impressions})</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                    }
                  </div>
                )}
                
                {/* Guide Mode Toggle */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">👨‍🏫</span>
                      <h3 className="font-medium text-orange-800">Guide Mode</h3>
                    </div>
                    <button
                      onClick={() => {
                        toggleGuideMode();
                        // Force re-render to show updated state
                        window.location.reload();
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ease-out ${
                        isGuide() 
                          ? 'bg-orange-600 text-white' 
                          : 'bg-white text-orange-600 border border-orange-300'
                      }`}
                      data-testid="guide-mode-toggle"
                    >
                      {isGuide() ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <p className="text-xs text-orange-700 mb-2">
                    Guide mode enables adult acknowledgement for critical actions like data clearing and cloud sync changes.
                  </p>
                  <div className="text-xs text-orange-600">
                    <strong>Status:</strong> {isGuide() ? 'Guide privileges enabled' : 'Standard learner mode'}
                  </div>
                </div>

                {/* Audit Log */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h3 className="font-medium text-gray-800 mb-3">📋 Audit Log</h3>
                  <AuditLogView />
                </div>
              </div>
            ) : activeTab === 'funnel' ? (
              <div className="max-h-96 overflow-y-auto">
                <FunnelViewer />
              </div>
            ) : activeTab === 'qa' && process.env.NODE_ENV === 'development' ? (
              <div 
                id="tab-content-qa" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-qa"
                className="max-h-96 overflow-y-auto space-y-4"
              >
                <QAPanel currentBiome={getCurrentBiome()} />
              </div>
            ) : activeTab === 'classes' ? (
              <div 
                id="tab-content-classes" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-classes"
                className="max-h-96 overflow-y-auto space-y-4"
              >
                <Classes />
              </div>
            ) : activeTab === 'dashboard' ? (
              <div 
                id="tab-content-dashboard" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-dashboard"
                className="max-h-96 overflow-y-auto"
              >
                <Dashboard />
              </div>
            ) : activeTab === 'reports' ? (
              <div 
                id="tab-content-reports" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-reports"
                className="max-h-96 overflow-y-auto space-y-4"
              >
                <ReportsTab />
              </div>
            ) : activeTab === 'dev' && isDev ? (
              <div 
                id="tab-content-dev" 
                role="region" 
                aria-live="polite" 
                aria-labelledby="tab-dev"
                className="max-h-96 overflow-y-auto space-y-4"
              >
                <div className="space-y-6">
                  <ArtDiagnostics />
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">📍 Pin Gallery</h3>
                    <p className="text-xs text-gray-500 mb-4">Visual test gallery for all pin states and sizes</p>
                    <PinGallery />
                  </div>
                  
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">🧭 Scout Gallery</h3>
                    <p className="text-xs text-gray-500 mb-4">Visual test gallery for Scout expressions and events</p>
                    <ScoutGallery />
                  </div>
                  
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">🔍 Triage Board</h3>
                    <TriageBoard userId="dev-user" />
                  </div>
                </div>
              </div>
            ) : (
              <div>Unknown tab</div>
            )}
          </div>
          <div className="mt-5 border-t pt-3"><div className="text-sm font-semibold mb-2 text-red-700">Danger zone</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><button onClick={() => { if (confirm('Reset progress for the current loop? This keeps your loop number and backpack.')) { onResetCurrentLoop(); alert('Current loop progress has been reset.'); } }} className="px-3 py-2 rounded-lg border bg-white hover:bg-stone-50 text-red-700">Reset current loop</button><button onClick={() => { if (confirm('Factory reset everything? This sets Loop to 1 and clears progress and backpack.')) { onFactoryReset(); alert('All progress reset. Back to Loop 1.'); } }} className="px-3 py-2 rounded-lg border bg-white hover:bg-stone-50 text-red-700">Factory reset (all)</button><button onClick={() => { if (confirm('Reset learner model? This clears all skill mastery data.')) { learnerCache.reset(); alert('Learner model has been reset.'); } }} className="px-3 py-2 rounded-lg border bg-white hover:bg-stone-50 text-red-700">Reset learner model</button></div><div className="mt-2 text-[11px] text-stone-600">Tip: Use Export to snapshot progress before you reset.</div></div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}