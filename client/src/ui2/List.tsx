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
    : 'w-full text-left flex items-center px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0 min-h-[60px] focus-ring'
  
  const titleClasses = teacherThemeV2 
    ? 'list-title'
    : 'text-base font-normal text-gray-900 leading-tight'
  
  const metaClasses = teacherThemeV2
    ? 'list-meta'
    : 'text-sm text-gray-500 mt-1 leading-tight'
    
  const valueClasses = teacherThemeV2
    ? 'list-value'
    : 'text-sm text-gray-600 mr-2'
  
  const chevronClasses = teacherThemeV2
    ? 'chevron'
    : 'w-5 h-5 text-gray-400'

  return (
    <Cmp onClick={onClick} href={href} role={role} className={rowClasses} {...props}>
      {icon && <div className={teacherThemeV2 ? '' : 'mr-4'}>{icon}</div>}
      <div className={teacherThemeV2 ? 'list-content' : 'flex-1 min-w-0'}>
        <div className={titleClasses}>{title}</div>
        {meta && <div className={metaClasses}>{meta}</div>}
      </div>
      {value && <div className={valueClasses}>{value}</div>}
      <ChevronRight className={chevronClasses} aria-hidden />
    </Cmp>
  )
}