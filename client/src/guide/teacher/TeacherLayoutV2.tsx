import React, { ReactNode } from 'react'
import { X } from 'lucide-react'
import { DensityProvider, useDensity } from './density'

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
  return (
    <DensityProvider>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Teacher Panel</h2>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 focus-ring"
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
                    (activeTab === tabKey
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                  }
                  aria-current={activeTab === tabKey ? 'page' : undefined}
                >
                  <span aria-hidden>{config.icon}</span>
                  <span className="truncate">{config.label}</span>
                </button>
              ))}
            </div>
          </nav>
          
          <div className="p-3 border-t border-gray-200">
            <DensityToggle />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </DensityProvider>
  )
}

function DensityToggle() {
  const { density, toggle } = useDensity()
  return (
    <button 
      onClick={toggle}
      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-white focus-ring"
    >
      {density === 'cozy' ? 'Switch to Compact' : 'Switch to Cozy'}
    </button>
  )
}