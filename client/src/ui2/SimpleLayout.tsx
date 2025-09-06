import React, { ReactNode } from 'react'
import { useFlags } from '../config/flags'

interface SimpleLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function SimpleLayout({ title, subtitle, children }: SimpleLayoutProps) {
  const { teacherThemeV2 } = useFlags()
  
  const titleClasses = teacherThemeV2 
    ? 'text-2xl font-semibold text-fg-base'
    : 'text-2xl font-semibold text-gray-900'
  
  const subtitleClasses = teacherThemeV2
    ? 'text-sm text-fg-muted'
    : 'text-sm text-gray-600'
  
  const containerClasses = teacherThemeV2
    ? 'min-h-screen bg-bg-app'
    : 'min-h-screen bg-gray-50'
  
  return (
    <div className={containerClasses}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className={titleClasses}>{title}</h1>
          {subtitle && <p className={subtitleClasses}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}