import { ReactNode } from 'react'
import clsx from 'clsx'

export function Card({ title, actions, children, className, onClick }:{
  title?: string; actions?: ReactNode; children: ReactNode; className?: string; onClick?: () => void
}){
  return (
    <section className={clsx("rounded-2xl border border-gray-200 bg-white shadow-sm", className)} onClick={onClick}>
      {(title || actions) && (
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}