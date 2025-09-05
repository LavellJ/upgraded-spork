import { ReactNode } from 'react'

export function StickyTable({ header, children }:{
  header: ReactNode; children: ReactNode
}){
  return (
    <div className="overflow-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))]">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-[rgb(var(--bg-card))] z-10 border-b border-[rgb(var(--border))]">
          {header}
        </thead>
        <tbody className="[&_tr:hover]:bg-[rgb(var(--bg-base))]/60">{children}</tbody>
      </table>
    </div>
  )
}