import { ReactNode } from 'react'
import { ChevronRight } from './icons'

export function ListCard({ children }:{ children: ReactNode }) {
  return <section className="list-card overflow-hidden">{children}</section>
}
export function ListSection({ title }:{ title:string }) {
  return <div className="px-4 pt-3 pb-1 text-[12px] font-semibold tracking-wide text-fg-muted uppercase">{title}</div>
}
export function ListRow({ icon, title, meta, value, onClick, href, role='button' }:{
  icon?: ReactNode; title: string; meta?: string; value?: string; onClick?:()=>void; href?: string; role?: 'button'|'link'
}){
  const isLink = !!href
  const Cmp:any = isLink ? 'a' : 'button'
  return (
    <Cmp
      {...(isLink ? { href } : { type:'button' })}   // ✅ prevent form-submit; proper link when href set
      onClick={onClick} role={role}
      className="w-full text-left list-row focus-ring"
    >
      {icon}
      <div className="min-w-0">
        <div className="list-title truncate">{title}</div>
        {meta && <div className="list-meta truncate">{meta}</div>}
      </div>
      {value && <div className="list-value">{value}</div>}
      <ChevronRight className="chevron" aria-hidden />
    </Cmp>
  )
}