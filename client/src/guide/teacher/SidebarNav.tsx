import { ReactNode } from 'react'
import { Link, useLocation } from 'wouter'

const ICONS: Record<string, ReactNode> = {
  home:   <span aria-hidden>🏠</span>,
  users:  <span aria-hidden>👥</span>,
  list:   <span aria-hidden>🗂️</span>,
  chart:  <span aria-hidden>📈</span>,
  gear:   <span aria-hidden>⚙️</span>,
}

export function NavLink({ to, icon, children }:{
  to:string; icon?: keyof typeof ICONS; children: ReactNode
}){
  const [location] = useLocation()
  const active = location.startsWith(to)
  return (
    <Link
      to={to}
      className={
        'flex items-center gap-2 px-3 py-2 rounded-lg focus-ring ' +
        (active
          ? 'bg-[rgb(var(--bg-base))] text-[rgb(var(--fg-default))]'
          : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-base))] hover:text-[rgb(var(--fg-default))]')
      }
      aria-current={active ? 'page' : undefined}
    >
      {icon ? ICONS[icon] : null}
      <span className="truncate">{children}</span>
    </Link>
  )
}