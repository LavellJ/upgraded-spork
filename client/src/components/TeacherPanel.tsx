import React, { useState } from "react";
import { BottomSheet } from "./BottomSheet";

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
}

export function TeacherPanel({ open, onClose, frameworks, framework, setFramework, protoOnly, setProtoOnly, completed, onImport, onExport, lessons }: TeacherPanelProps) {
  const [importValue, setImportValue] = useState('');
  const [exportLink, setExportLink] = useState('');
  const handleExport = () => { const link = onExport(); setExportLink(link); };
  const handleImport = () => { if (importValue.trim()) { onImport(extractQiFromInput(importValue)); setImportValue(''); } };
  
  // Dynamic totals from current loop lessons
  const totals = {
    forest: (lessons.forest || []).length,
    desert: (lessons.desert || []).length,
    ocean:  (lessons.ocean  || []).length,
    night:  (lessons.night  || []).length,
  };
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-stone-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚙️</span>
          <h3 className="font-extrabold text-lg">Teacher Panel</h3>
          <button onClick={onClose} className="ml-auto text-xs px-2 py-1 rounded-full border bg-white hover:bg-stone-50">Close</button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold mb-2">Standards Framework</label><select value={framework} onChange={(e) => setFramework(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">{frameworks.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
          <div><label className="flex items-center gap-2"><input type="checkbox" checked={protoOnly} onChange={(e) => setProtoOnly(e.target.checked)} className="rounded" />Use prototype-only mode</label><div className="text-xs text-stone-600 mt-1">When enabled, all activities use in-app prototypes instead of external links.</div></div>
          <div><div className="text-sm font-semibold mb-2">Progress Overview</div><div className="text-xs text-stone-600 space-y-1"><div>Forest (Literacy): {completed.forest?.size || 0}/{totals.forest}</div><div>Desert (Math): {completed.desert?.size || 0}/{totals.desert}</div><div>Ocean (Science): {completed.ocean?.size || 0}/{totals.ocean}</div><div>Night (HASS): {completed.night?.size || 0}/{totals.night}</div></div></div>
          <div><div className="text-sm font-semibold mb-2">Export Progress</div><button onClick={handleExport} className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition ease-out">Copy progress link</button>{exportLink && <div className="mt-2 p-2 bg-stone-100 rounded-lg text-xs break-all">{exportLink}</div>}</div>
          <div><div className="text-sm font-semibold mb-2">Import Progress</div><div className="flex gap-2"><input value={importValue} onChange={(e) => setImportValue(e.target.value)} placeholder="Paste progress link or token" className="flex-1 px-3 py-2 border rounded-lg" /><button onClick={handleImport} className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition ease-out">Import</button></div></div>
        </div>
      </div>
    </BottomSheet>
  );
}