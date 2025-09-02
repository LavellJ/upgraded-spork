import React, { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { getEvents, clearEvents, downloadEventsCSV } from '../lib/analytics';
import { ThemeToggle } from './ThemeToggle';
import { learnerCache } from '../learning/model';

const SUBJECTS = {
  forest: { label: "Literacy", color: "#3B7D44" },
  desert: { label: "Math", color: "#C96A2B" },
  ocean:  { label: "Science", color: "#3BA7B6" },
  night:  { label: "HASS", color: "#404A73" },
};

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

export function TeacherPanel({ open, onClose, frameworks, framework, setFramework, protoOnly, setProtoOnly, completed, onImport, onExport, lessons, loop, onResetCurrentLoop, onFactoryReset, teacherPins, setTeacherPins }: TeacherPanelProps) {
  const [importValue, setImportValue] = useState('');
  const [exportLink, setExportLink] = useState('');
  const [snaps, setSnaps] = useState<Snapshot[]>(() => loadSnaps());
  const [showAuthoring, setShowAuthoring] = useState(false);
  
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
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
  
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportValue(text || '');
    } catch {
      alert('Clipboard not available — please paste manually.');
    }
  };
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
          <div><div className="text-sm font-semibold mb-2">Progress Overview</div><div className="grid grid-cols-2 gap-2">{Object.entries(SUBJECTS).map(([biome, subject]) => (<div key={biome} className="p-2 bg-stone-50 rounded-lg"><div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">{subject.label}</span><span className="text-xs text-stone-600">{done[biome]}/{totals[biome]}</span></div><div className="h-1.5 bg-stone-200 rounded"><div className="h-1.5 rounded" style={{ width: `${totals[biome] ? (done[biome]/totals[biome])*100 : 0}%`, background: subject.color }} /></div></div>))}</div><div className="mt-4"><label className="flex items-center gap-2"><input type="checkbox" checked={teacherPins} onChange={(e)=>setTeacherPins(e.target.checked)} className="rounded" />Show lesson pins on map (Teacher)</label><div className="text-[11px] text-stone-600 mt-1">Hidden by default. When Compass is equipped, only the next lesson pin shows.</div></div></div>
          <div><div className="text-sm font-semibold mb-2">Export Progress</div><div className="flex gap-2 flex-wrap"><button onClick={() => { const link = onExport(); try { navigator.clipboard.writeText(link); } catch {} alert('Progress link copied to clipboard.'); }} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ease-out">Copy progress link</button><button onClick={() => { const link = onExport(); try { navigator.clipboard.writeText(link); } catch {} const next = [{ ts: new Date().toISOString(), loop, link }, ...snaps].slice(0, 5); setSnaps(next); saveSnaps(next); alert('Snapshot saved (and link copied).'); }} className="px-3 py-2 rounded-lg border bg-white hover:bg-stone-50 transition ease-out">Save snapshot</button>{exportLink && <div className="mt-2 p-2 bg-stone-100 rounded-lg text-xs break-all">{exportLink}</div>}</div><div className="mt-3"><div className="text-sm font-semibold mb-1">Snapshots (last 5)</div>{snaps.length === 0 ? (<div className="text-xs text-stone-500">No snapshots yet.</div>) : (<ul className="space-y-1">{snaps.map((s, i) => (<li key={s.ts + i} className="flex items-center gap-2 text-xs"><span className="opacity-70">{new Date(s.ts).toLocaleString()}</span><span className="opacity-70">• Loop {s.loop}</span><button onClick={() => { try { navigator.clipboard.writeText(s.link); } catch {} alert('Snapshot link copied.'); }} className="ml-2 px-2 py-1 rounded-full border bg-white hover:bg-stone-50">Copy</button><button onClick={() => onImport(s.link)} className="px-2 py-1 rounded-full border bg-white hover:bg-stone-50">Restore</button></li>))}</ul>)}{snaps.length > 0 && (<button onClick={() => { setSnaps([]); saveSnaps([]); }} className="mt-2 px-2 py-1 rounded-full border bg-white hover:bg-stone-50 text-[11px] text-stone-600">Clear snapshots</button>)}</div></div>
          <div><div className="text-sm font-semibold mb-2">Import Progress</div><div className="flex gap-2 mb-2"><label className="sr-only" htmlFor="import-input">Import progress link or token</label><input id="import-input" value={importValue} onChange={(e) => setImportValue(e.target.value)} placeholder="Paste progress link or token" className="flex-1 px-3 py-2 border rounded-lg" /><button onClick={handlePaste} className="px-2 py-1 rounded-full border bg-white hover:bg-stone-50 text-xs" aria-label="Paste from clipboard">Paste</button><button onClick={handleImport} className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition ease-out">Import</button></div></div>
          <div className="mt-4 border-t pt-3"><div className="text-sm font-semibold mb-2">Quick Practice</div><div className="space-y-2 mb-3"><button onClick={() => { if (typeof onOpenJournal === 'function') onOpenJournal('literacy.phonics'); }} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ease-out text-sm w-full">Practice Phonics</button><button onClick={() => { if (typeof onOpenJournal === 'function') onOpenJournal('math.addition'); }} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ease-out text-sm w-full">Practice Math</button><button onClick={() => { if (typeof onOpenJournal === 'function') onOpenJournal('science.forces'); }} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ease-out text-sm w-full">Practice Science</button></div></div>
          
          <div className="mt-4 border-t pt-3"><div className="text-sm font-semibold mb-2">Analytics (local)</div><div className="flex items-center gap-2 mb-3"><button onClick={() => downloadEventsCSV()} className="px-2 py-1 rounded-full border bg-white hover:bg-stone-50 transition ease-out text-xs">Export events CSV</button><button onClick={() => { clearEvents(); alert('Cleared local analytics buffer'); }} className="px-2 py-1 rounded-full border bg-white hover:bg-stone-50 transition ease-out text-xs">Clear buffer</button><span className="text-[11px] text-stone-600">{getEvents().length} event(s) captured</span></div><div><div className="text-sm font-semibold mb-2">Recent activity</div>{recent.length === 0 ? (<div className="text-xs text-stone-500">No events yet.</div>) : (<ul className="space-y-1 text-xs text-stone-700">{recent.map((e, i) => (<li key={`${e.ts}-${e.action}-${i}`} className="flex items-center gap-2"><span>⏺</span><span className="opacity-70">{new Date(e.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span><span className="font-semibold">{e.action}</span><span className="opacity-70">{e.biome ?? ''} {e.lessonId ?? ''}</span></li>))}</ul>)}</div></div>
          <div className="mt-5 border-t pt-3"><div className="text-sm font-semibold mb-2 text-red-700">Danger zone</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><button onClick={() => { if (confirm('Reset progress for the current loop? This keeps your loop number and backpack.')) { onResetCurrentLoop(); alert('Current loop progress has been reset.'); } }} className="px-3 py-2 rounded-lg border bg-white hover:bg-stone-50 text-red-700">Reset current loop</button><button onClick={() => { if (confirm('Factory reset everything? This sets Loop to 1 and clears progress and backpack.')) { onFactoryReset(); alert('All progress reset. Back to Loop 1.'); } }} className="px-3 py-2 rounded-lg border bg-white hover:bg-stone-50 text-red-700">Factory reset (all)</button><button onClick={() => { if (confirm('Reset learner model? This clears all skill mastery data.')) { learnerCache.reset(); alert('Learner model has been reset.'); } }} className="px-3 py-2 rounded-lg border bg-white hover:bg-stone-50 text-red-700">Reset learner model</button></div><div className="mt-2 text-[11px] text-stone-600">Tip: Use Export to snapshot progress before you reset.</div></div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}