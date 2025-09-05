import { ReactNode } from 'react'
import clsx from 'clsx'
import { useFlags } from '../config/flags'

export function Card({ title, actions, children, className, onClick }:{
  title?: string; actions?: ReactNode; children: ReactNode; className?: string; onClick?: () => void
}){
  const { teacherThemeV2 } = useFlags()
  
  const cardClasses = teacherThemeV2
    ? clsx("rounded-2xl border border-border bg-bg-card shadow-sm", className)
    : clsx("rounded-2xl border border-gray-200 bg-white shadow-sm", className)
  
  const headerClasses = teacherThemeV2
    ? "px-4 py-3 border-b border-border flex items-center justify-between"
    : "px-4 py-3 border-b border-gray-200 flex items-center justify-between"
  
  const titleClasses = teacherThemeV2
    ? "text-base font-semibold text-fg-base"
    : "text-base font-semibold"
  
  return (
    <section className={cardClasses} onClick={onClick}>
      {(title || actions) && (
        <div className={headerClasses}>
          <h2 className={titleClasses}>{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}