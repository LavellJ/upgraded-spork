import { ReactNode } from 'react'

export function Card({ title, actions, children }:{
  title?: string; actions?: ReactNode; children: ReactNode
}){
  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] shadow-sm">
      {(title || actions) && (
        <div className="px-4 py-3 border-b border-[rgb(var(--border))] flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}