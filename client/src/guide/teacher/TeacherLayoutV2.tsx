import React, { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { DensityProvider, useDensity } from './density'
import { ToastHost } from '../../ui2/Toast'
import { useFlags } from '../../config/flags'
import { useTheme, type Theme } from '../../theme/useTheme'
import { validateThemeContrast } from '../../theme/contrast'
import { Ic } from '../../ui2/icons'
import IconButton from '../../ui2/IconButton'

const TAB_CONFIG = {
  overview: { icon: <Ic.star className="list-icon" />, label: 'Overview' },
  quickstart: { icon: <Ic.star className="list-icon" />, label: 'Quick Start' },
  timeline: { icon: <Ic.calendar className="list-icon" />, label: 'Timeline' },
  assignments: { icon: <Ic.doc className="list-icon" />, label: 'Assignments' },
  content: { icon: <Ic.book className="list-icon" />, label: 'Content' },
  roster: { icon: <Ic.profile className="list-icon" />, label: 'Roster' },
  classes: { icon: <Ic.layers className="list-icon" />, label: 'Classes' },
  dashboard: { icon: <Ic.star className="list-icon" />, label: 'Dashboard' },
  privacy: { icon: <Ic.shield className="list-icon" />, label: 'Privacy' },
  appearance: { icon: <Ic.palette className="list-icon" />, label: 'Appearance' },
  consent: { icon: <Ic.shield className="list-icon" />, label: 'Consent' },
  audit: { icon: <Ic.doc className="list-icon" />, label: 'Audit' },
  studio: { icon: <Ic.book className="list-icon" />, label: 'Studio' },
  pilot: { icon: <Ic.star className="list-icon" />, label: 'Pilot' },
  funnel: { icon: <Ic.filter className="list-icon" />, label: 'Funnel' },
  qa: { icon: <Ic.star className="list-icon" />, label: 'QA' },
  reports: { icon: <Ic.doc className="list-icon" />, label: 'Reports' },
  dev: { icon: <Ic.palette className="list-icon" />, label: 'Dev' },
}

type Tab = keyof typeof TAB_CONFIG

interface TeacherLayoutV2Props {
  activeTab: string
  onTabChange: (tab: string) => void
  onClose: () => void
  renderContent: () => ReactNode
}

export function TeacherLayoutV2({ activeTab, onTabChange, onClose, renderContent }: TeacherLayoutV2Props) {
  const { teacherThemeV2 } = useFlags()
  const { theme } = useTheme()
  
  // Apply theme on mount/update when feature is enabled
  useEffect(() => {
    if (teacherThemeV2) {
      validateThemeContrast()
    }
  }, [teacherThemeV2, theme])
  
  const themeClasses = teacherThemeV2 
    ? "bg-[rgb(var(--bg-base))] text-[rgb(var(--fg-base))]" 
    : "bg-black bg-opacity-50"
  
  const sidebarClasses = teacherThemeV2
    ? "w-64 bg-[rgb(var(--bg-card))] border-r border-[rgb(var(--border))] flex flex-col"
    : "w-64 bg-white border-r border-gray-200 flex flex-col"
  
  return (
    <DensityProvider>
      <div className={`fixed inset-0 z-50 flex ${themeClasses}`}>
        {/* Sidebar */}
        <aside className={sidebarClasses}>
          <div className={`p-4 flex items-center justify-between ${
            teacherThemeV2 ? 'border-b border-[rgb(var(--border))]' : 'border-b border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold ${
              teacherThemeV2 ? 'text-[rgb(var(--fg-base))]' : ''
            }`}>Teacher Panel</h2>
            <IconButton 
              onClick={onClose}
              aria-label="Close teacher panel"
              className={teacherThemeV2 ? '' : 'hover:bg-gray-100'}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>
          
          <nav className="flex-1 p-2 overflow-y-auto" tabIndex={0} aria-label="Teacher navigation">
            <div className="space-y-1">
              {Object.entries(TAB_CONFIG).map(([tabKey, config]) => (
                <button
                  key={tabKey}
                  onClick={() => onTabChange(tabKey)}
                  className={
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left focus-ring transition-colors ' +
                    (teacherThemeV2 
                      ? (activeTab === tabKey
                          ? 'bg-[rgb(var(--bg-base))] text-[rgb(var(--fg-base))] border-l-2 border-[rgb(var(--brand-500))]'
                          : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-elev))]/60 hover:text-[rgb(var(--fg-base))]')
                      : (activeTab === tabKey
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'))
                  }
                  aria-current={activeTab === tabKey ? 'page' : undefined}
                >
                  {config.icon}
                  <span className="truncate text-sm font-medium">{config.label}</span>
                </button>
              ))}
            </div>
          </nav>
          
          <div className={`p-3 ${
            teacherThemeV2 ? 'border-t border-[rgb(var(--border))]' : 'border-t border-gray-200'
          }`}>
            <DensityToggle />
          </div>
        </aside>

        {/* Main content */}
        <section role="main" aria-labelledby="tp-title" className={`flex-1 overflow-auto ${
          teacherThemeV2 ? 'bg-[rgb(var(--bg-elev))]' : 'bg-gray-50'
        }`}>
          <ToastHost>
            <div className="p-6">
              {renderContent()}
            </div>
          </ToastHost>
        </section>
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
          ? 'border border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-base))] text-[rgb(var(--fg-muted))]'
          : 'border border-gray-300 hover:bg-white'
      }`}
    >
      {density === 'cozy' ? 'Switch to Compact' : 'Switch to Cozy'}
    </button>
  )
}