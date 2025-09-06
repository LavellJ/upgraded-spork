import React from 'react'
import { useFlags } from '../config/flags'
import { SimpleLayout } from '../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../ui2/List'
import { Ic } from '../ui2/icons'
import * as Flags from '../config/flags'

function LegacyDevPanel() {
  return (
    <div className="card p-4 md:p-6">
      <h2 className="page-title mb-2">Development</h2>
      <p className="subtle mb-4">Developer tools and feature flags.</p>
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Feature Flags</h3>
          <p className="text-sm text-gray-600">Toggle experimental features.</p>
        </div>
      </div>
    </div>
  )
}

export function DevPanel(){
  const { teacherPanelV2, teacherAppearanceV3, finalArt, teacherThemeV2 } = useFlags()
  
  // Only show in development and when flags are enabled
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev || !teacherPanelV2 || !teacherAppearanceV3) return <LegacyDevPanel/>
  
  const handleFinalArtToggle = () => {
    Flags.set({ finalArt: !finalArt })
  }
  
  const handleThemeToggle = () => {
    Flags.set({ teacherThemeV2: !teacherThemeV2 })
  }
  
  const handleAppearanceToggle = () => {
    Flags.set({ teacherAppearanceV3: !teacherAppearanceV3 })
  }
  
  const handlePanelToggle = () => {
    Flags.set({ teacherPanelV2: !teacherPanelV2 })
  }
  
  const handleResetFlags = () => {
    if (confirm('Reset all feature flags to defaults?')) {
      Flags.set({ finalArt: false, teacherPanelV2: false, teacherThemeV2: false, teacherAppearanceV3: false })
    }
  }
  
  return (
    <SimpleLayout title="Development" subtitle="Developer tools and feature flags">
      <div className="space-y-6">
        <div>
          <ListSection title="Feature Flags"/>
          <ListCard>
            <ListRow 
              icon={<Ic.star className="list-icon"/>} 
              title="Final Art" 
              meta="Enable art assets and visual polish" 
              value={finalArt ? 'On' : 'Off'}
              onClick={handleFinalArtToggle}
              data-testid="dev-final-art-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.layers className="list-icon"/>} 
              title="Teacher Panel v2" 
              meta="Enhanced teacher layout and navigation" 
              value={teacherPanelV2 ? 'On' : 'Off'}
              onClick={handlePanelToggle}
              data-testid="dev-panel-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.palette className="list-icon"/>} 
              title="Teacher Theme v2" 
              meta="Accessible color tokens and themes" 
              value={teacherThemeV2 ? 'On' : 'Off'}
              onClick={handleThemeToggle}
              data-testid="dev-theme-row"
            />
            <div className="divider" />
            <ListRow 
              icon={<Ic.layers className="list-icon"/>} 
              title="Appearance v3" 
              meta="List-first settings UI" 
              value={teacherAppearanceV3 ? 'On' : 'Off'}
              onClick={handleAppearanceToggle}
              data-testid="dev-appearance-row"
            />
          </ListCard>
        </div>

        <div>
          <ListSection title="Development Tools"/>
          <ListCard>
            <ListRow 
              icon={<Ic.shield className="list-icon" style={{color: '#dc2626'}}/>} 
              title="Reset all flags" 
              meta="Restore all feature flags to defaults" 
              onClick={handleResetFlags}
              data-testid="dev-reset-row"
            />
          </ListCard>
        </div>
      </div>
    </SimpleLayout>
  )
}