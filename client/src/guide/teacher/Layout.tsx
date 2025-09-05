import { ReactNode, useMemo, useState } from 'react'
import { useFlags } from '../../config/flags'
import { NavLink } from './SidebarNav'
import { DensityProvider, useDensity } from './density'

export default function TeacherLayout({ title, subtitle, actions, children }:{
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}){
  const { teacherPanelV2 } = useFlags()
  if (!teacherPanelV2) return <>{children}</> // fallback to legacy render

  return (
    <DensityProvider>
      <div className="min-h-screen bg-[rgb(var(--bg-base))] text-[rgb(var(--fg-base))]">
        <a href="#main" className="sr-only focus:not-sr-only focus-ring px-2 py-1 bg-black text-white">
          Skip to content
        </a>
        <div className="flex">
          <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--bg-card))]">
            <div className="px-4 py-4 text-lg font-semibold tracking-tight">Teacher Panel</div>
            <nav className="flex-1 px-2 py-2 space-y-1">
              <NavLink to="/guide/dashboard" icon="home">Dashboard</NavLink>
              <NavLink to="/guide/learners"  icon="users">Learners</NavLink>
              <NavLink to="/guide/assign"    icon="list">Assignments</NavLink>
              <NavLink to="/guide/insights"  icon="chart">Insights</NavLink>
              <NavLink to="/guide/settings"  icon="gear">Settings</NavLink>
            </nav>
            <div className="px-3 py-3 text-xs text-[rgb(var(--fg-muted))]">v2 layout</div>
          </aside>

          <main id="main" className="flex-1 min-w-0">
            <PageHeader title={title} subtitle={subtitle} actions={actions} />
            <div className="p-4 md:p-6 space-y-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DensityProvider>
  )
}

function PageHeader({ title, subtitle, actions }:{
  title: string; subtitle?: string; actions?: ReactNode
}){
  const { density, toggle } = useDensity()
  return (
    <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-[rgba(0,0,0,.05)] bg-[rgb(var(--bg-base))]/80 border-b border-[rgb(var(--border))]">
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-[rgb(var(--fg-muted))] truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggle}
            className="px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-card))] focus-ring">
            {density === 'cozy' ? 'Compact' : 'Cozy'}
          </button>
          {actions}
        </div>
      </div>
    </header>
  )
}