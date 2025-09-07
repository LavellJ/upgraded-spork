import React, { useEffect, useState } from 'react'
import { applyUiPrefs, loadUiPrefs, saveUiPrefs, type UiPrefs } from '../ui/theme'
import { useFlags } from '../config/flags'
import { useTheme } from '../theme/useTheme'
import { useProfile } from '../profile/context'
import { SimpleLayout } from '../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../ui2/List'
import { Ic } from '../ui2/icons'

function LegacyAppearance() {
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

export default function Appearance(){
  const { teacherPanelV2, teacherAppearanceV3 } = useFlags()
  const { theme, setTheme, themes } = useTheme()
  const { profile, toggleCalmMode } = useProfile()
  const [prefs, setPrefs] = useState<UiPrefs>(loadUiPrefs())
  
  // Legacy fallback
  if (!teacherPanelV2 || !teacherAppearanceV3) return <LegacyAppearance/>
  
  const currentTheme = themes.find(t => t.value === theme) || themes[0]
  const densityLabel = prefs.density === 'compact' ? 'Compact' : 'Cozy'
  const calmOn = profile?.calmMode || false
  const hcOn = prefs.contrast === 'high'
  
  const openTheme = () => {
    // Show theme selection dialog
    const themeOptions = `=== THEME SELECTION ===

🎨 Available Themes:

${themes.map((t, i) => `${i + 1}. ${t.label}${t.value === theme ? ' (current)' : ''}`).join('\n')}

Choose a theme (1-${themes.length}):`

    const choice = prompt(themeOptions)
    const index = parseInt(choice || '') - 1
    
    if (choice && index >= 0 && index < themes.length) {
      const selectedTheme = themes[index]
      setTheme(selectedTheme.value as any)
      
      alert(`✅ Theme Updated!

New Theme: ${selectedTheme.label}
Applied: Immediately

Your interface theme has been changed and will persist across sessions.`)
    }
  }
  
  const toggleDensity = () => {
    setPrefs(p => ({ ...p, density: p.density === 'compact' ? 'comfy' : 'compact' }))
  }
  
  const toggleCalm = () => {
    // Use the actual calm mode toggle from profile context
    toggleCalmMode()
    
    const newState = !calmOn
    
    // Show feedback about what calm mode does
    alert(`${newState ? '🧘' : '🎬'} Calm Mode ${newState ? 'Enabled' : 'Disabled'}

${newState 
  ? `Calm mode reduces motion and visual effects:
• Slower animations and transitions
• Reduced particle effects
• Gentler UI feedback
• More accessible for sensitive users`
  : `Standard mode enables full visual experience:
• Normal animation speed
• Full particle effects
• Dynamic UI feedback
• Rich visual interactions`}

This setting applies immediately and is saved to your profile.`)
  }
  
  const toggleHC = () => {
    setPrefs(p => ({ ...p, contrast: p.contrast === 'high' ? 'normal' : 'high' }))
  }
  
  useEffect(() => { applyUiPrefs(prefs); saveUiPrefs(prefs) }, [prefs])
  
  return (
    <SimpleLayout title="Appearance" subtitle="Theme and layout preferences">
      <div className="space-y-6">
        <div>
          <ListSection title="Display"/>
          <ListCard>
            <ListRow 
              icon={<Ic.palette className="list-icon"/>} 
              title="Theme" 
              meta="Parchment, Dark, High Contrast" 
              value={currentTheme.name} 
              onClick={openTheme}
              data-testid="appearance-theme-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.layers className="list-icon"/>} 
              title="Density" 
              meta="Cozy or Compact" 
              value={densityLabel} 
              onClick={toggleDensity}
              data-testid="appearance-density-row"
            />
          </ListCard>
        </div>

        <div>
          <ListSection title="Map & UI"/>
          <ListCard>
            <ListRow 
              icon={<Ic.star className="list-icon"/>} 
              title="Calm Mode" 
              meta="Reduce motion and effects" 
              value={calmOn ? 'On' : 'Off'} 
              onClick={toggleCalm}
              data-testid="appearance-calm-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.shield className="list-icon"/>} 
              title="High contrast" 
              meta="Stronger outlines for visibility" 
              value={hcOn ? 'On' : 'Off'} 
              onClick={toggleHC}
              data-testid="appearance-hc-row"
            />
          </ListCard>
        </div>
      </div>
    </SimpleLayout>
  )
}