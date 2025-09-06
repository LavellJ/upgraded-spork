import { ReactNode } from 'react'
import { ChevronRight } from './icons'
import { useFlags } from '../config/flags'

export function ListCard({ children }:{ children: ReactNode }) {
  const { teacherThemeV2 } = useFlags()
  const cardClasses = teacherThemeV2 
    ? 'list-card overflow-hidden'
    : 'bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden'
  
  return <section className={cardClasses}>{children}</section>
}

export function ListSection({ title }:{ title:string }) {
  const { teacherThemeV2 } = useFlags()
  const titleClasses = teacherThemeV2
    ? 'px-4 pt-3 pb-1 text-[12px] font-semibold tracking-wide text-fg-muted uppercase'
    : 'px-4 pt-3 pb-1 text-[12px] font-semibold tracking-wide text-gray-600 uppercase'
  
  return <div className={titleClasses}>{title}</div>
}

export function ListRow({ icon, title, meta, value, onClick, href, role='button', ...props }:{
  icon?: ReactNode; title: string; meta?: string; value?: string; onClick?:()=>void; href?: string; role?: 'button'|'link'
  [key: string]: any
}){
  const { teacherThemeV2 } = useFlags()
  const Cmp:any = href ? 'a' : 'button'
  
  const rowClasses = teacherThemeV2
    ? 'w-full text-left list-row focus-ring'
    : 'w-full text-left flex items-center gap-3 px-4 py-4 hover:bg-gray-50 focus-ring'
  
  const titleClasses = teacherThemeV2 
    ? 'list-title truncate'
    : 'text-[15px] font-medium text-gray-900 truncate'
  
  const metaClasses = teacherThemeV2
    ? 'list-meta truncate'
    : 'text-[13px] text-gray-600 truncate'
    
  const valueClasses = teacherThemeV2
    ? 'list-value'
    : 'ml-auto text-[13px] text-gray-600'
  
  const chevronClasses = teacherThemeV2
    ? 'chevron'
    : 'w-4 h-4 text-gray-400 ml-2'

  return (
    <Cmp onClick={onClick} href={href} role={role} className={rowClasses} {...props}>
      {icon && <div className={teacherThemeV2 ? '' : 'w-6 h-6 shrink-0 text-blue-600'}>{icon}</div>}
      <div className="min-w-0">
        <div className={titleClasses}>{title}</div>
        {meta && <div className={metaClasses}>{meta}</div>}
      </div>
      {value && <div className={valueClasses}>{value}</div>}
      <ChevronRight className={chevronClasses} aria-hidden />
    </Cmp>
  )
}