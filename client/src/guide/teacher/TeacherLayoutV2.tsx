import React, { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { DensityProvider, useDensity } from './density'
import { ToastHost } from '../../ui2/Toast'
import { useFlags } from '../../config/flags'
import { useTheme, type Theme } from '../../theme/useTheme'
import { validateThemeContrast } from '../../theme/contrast'

const TAB_CONFIG = {
  overview: { icon: '🏠', label: 'Overview' },
  quickstart: { icon: '🚀', label: 'Quick Start' },
  timeline: { icon: '📅', label: 'Timeline' },
  assignments: { icon: '📝', label: 'Assignments' },
  content: { icon: '📚', label: 'Content' },
  roster: { icon: '👥', label: 'Roster' },
  classes: { icon: '🎓', label: 'Classes' },
  dashboard: { icon: '📊', label: 'Dashboard' },
  privacy: { icon: '🔒', label: 'Privacy' },
  appearance: { icon: '🎨', label: 'Appearance' },
  consent: { icon: '✅', label: 'Consent' },
  audit: { icon: '🔍', label: 'Audit' },
  studio: { icon: '🎬', label: 'Studio' },
  pilot: { icon: '🧪', label: 'Pilot' },
  funnel: { icon: '📈', label: 'Funnel' },
  qa: { icon: '🔧', label: 'QA' },
  reports: { icon: '📋', label: 'Reports' },
  dev: { icon: '⚙️', label: 'Dev' },
}

type Tab = keyof typeof TAB_CONFIG

interface TeacherLayoutV2Props {
  activeTab: string
  onTabChange: (tab: string) => void
  onClose: () => void
  renderContent: () => ReactNode
}

export function TeacherLayoutV2({ activeTab, onTabChange, onClose, renderContent }: TeacherLayoutV2Props) {
  const { teacherThemeV2, teacherAppearanceV3, teacherPanelV2 } = useFlags()
  const { theme } = useTheme()
  const useCleanMobile = teacherPanelV2 && teacherAppearanceV3
  
  // Apply theme on mount/update when feature is enabled
  useEffect(() => {
    if (teacherThemeV2) {
      validateThemeContrast()
    }
  }, [teacherThemeV2, theme])
  
  // Apply clean mobile UI class to body when both flags enabled
  useEffect(() => {
    if (useCleanMobile) {
      document.documentElement.classList.add('clean-mobile-ui')
      document.body.classList.add('clean-mobile-ui')
      console.log('🎨 Clean mobile UI enabled - both html and body class added')
    } else {
      document.documentElement.classList.remove('clean-mobile-ui')
      document.body.classList.remove('clean-mobile-ui')
      console.log('🎨 Clean mobile UI disabled - both classes removed')
    }
    
    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('clean-mobile-ui')
      document.body.classList.remove('clean-mobile-ui')
    }
  }, [useCleanMobile])
  
  const themeClasses = teacherThemeV2 
    ? "bg-bg-base text-fg-base" 
    : "bg-black bg-opacity-50"
  
  const sidebarClasses = teacherThemeV2
    ? "w-64 bg-bg-card border-r border-border flex flex-col"
    : "w-64 bg-white border-r border-gray-200 flex flex-col"
  
  return (
    <DensityProvider>
      <div className={`fixed inset-0 z-50 flex ${themeClasses}`}>
        {/* Sidebar */}
        <aside className={sidebarClasses}>
          <div className={`p-4 flex items-center justify-between ${
            teacherThemeV2 ? 'border-b border-border' : 'border-b border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold ${
              teacherThemeV2 ? 'text-fg-base' : ''
            }`}>Teacher Panel</h2>
            <button 
              onClick={onClose}
              className={`p-1.5 rounded-lg focus-ring ${
                teacherThemeV2 ? 'hover:bg-bg-elev/60' : 'hover:bg-gray-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <nav className="flex-1 p-2 overflow-y-auto">
            <div className="space-y-1">
              {Object.entries(TAB_CONFIG).map(([tabKey, config]) => (
                <button
                  key={tabKey}
                  onClick={() => onTabChange(tabKey)}
                  className={
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left focus-ring ' +
                    (teacherThemeV2 
                      ? (activeTab === tabKey
                          ? 'bg-brand-500/10 text-brand-600'
                          : 'text-fg-muted hover:bg-bg-elev/60 hover:text-fg-base')
                      : (activeTab === tabKey
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'))
                  }
                  aria-current={activeTab === tabKey ? 'page' : undefined}
                >
                  <span aria-hidden>{config.icon}</span>
                  <span className="truncate">{config.label}</span>
                </button>
              ))}
            </div>
          </nav>
          
          <div className={`p-3 ${
            teacherThemeV2 ? 'border-t border-border' : 'border-t border-gray-200'
          }`}>
            <DensityToggle />
          </div>
        </aside>

        {/* Main content */}
        <main className={`flex-1 overflow-auto ${
          useCleanMobile ? 'bg-white' : (teacherThemeV2 ? 'bg-bg-elev' : 'bg-gray-50')
        }`}>
          <ToastHost>
            <div className={useCleanMobile ? 'p-0' : 'p-6'}>
              {renderContent()}
            </div>
          </ToastHost>
        </main>
      </div>
    </DensityProvider>
  )
}

function DensityToggle() {
  const { density, toggle } = useDensity()
  const { teacherThemeV2 } = useFlags()
  
  return (
    <button 
      onClick={toggle}
      className={`w-full px-3 py-2 text-sm rounded-lg focus-ring ${
        teacherThemeV2 
          ? 'border border-border hover:bg-bg-base text-fg-muted'
          : 'border border-gray-300 hover:bg-white'
      }`}
    >
      {density === 'cozy' ? 'Switch to Compact' : 'Switch to Cozy'}
    </button>
  )
}