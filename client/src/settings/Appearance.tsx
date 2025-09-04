import React, { useEffect, useState } from 'react'
import { applyUiPrefs, loadUiPrefs, saveUiPrefs, type UiPrefs } from '../ui/theme'

export default function AppearanceSettings() {
  const [prefs, setPrefs] = useState<UiPrefs>(loadUiPrefs())

  useEffect(() => { applyUiPrefs(prefs); saveUiPrefs(prefs) }, [prefs])

  return (
    <div className="card p-4 md:p-6">
      <h2 className="page-title mb-2">Appearance</h2>
      <p className="subtle mb-4">Adjust theme, contrast, and density for the Teacher Panel.</p>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Theme */}
        <div>
          <label className="block text-sm mb-2">Theme</label>
          <div className="flex gap-2">
            {(['auto','light','dark'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setPrefs(p => ({ ...p, theme: t }))}
                className={`px-3 py-2 rounded-xl border ${prefs.theme===t ? 'bg-[rgb(var(--bg-soft))] border-brand' : 'border-[rgb(var(--border))]'}`}
                aria-pressed={prefs.theme===t}
              >{t}</button>
            ))}
          </div>
        </div>

        {/* Contrast */}
        <div>
          <label className="block text-sm mb-2">Contrast</label>
          <div className="flex gap-2">
            {(['normal','high'] as const).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setPrefs(p => ({ ...p, contrast: c }))}
                className={`px-3 py-2 rounded-xl border ${prefs.contrast===c ? 'bg-[rgb(var(--bg-soft))] border-brand' : 'border-[rgb(var(--border))]'}`}
                aria-pressed={prefs.contrast===c}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Density */}
        <div>
          <label className="block text-sm mb-2">Density</label>
          <div className="flex gap-2">
            {(['comfy','compact'] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setPrefs(p => ({ ...p, density: d }))}
                className={`px-3 py-2 rounded-xl border ${prefs.density===d ? 'bg-[rgb(var(--bg-soft))] border-brand' : 'border-[rgb(var(--border))]'}`}
                aria-pressed={prefs.density===d}
              >{d}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}