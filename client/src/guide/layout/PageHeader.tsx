import { ReactNode } from 'react'

type Crumb = { label: string; onClick?: () => void; href?: string }

export default function PageHeader({
  title, subtitle, actions, crumbs
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  crumbs?: Crumb[]
}) {
  return (
    <div className="mb-4 md:mb-6">
      {crumbs?.length ? (
        <nav aria-label="Breadcrumb" className="mb-1 text-sm subtle">
          <ol className="flex gap-2">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                {c.href ? <a href={c.href} className="underline hover:no-underline">{c.label}</a>
                         : <button type="button" onClick={c.onClick} className="underline hover:no-underline">{c.label}</button>}
                {i < crumbs.length-1 && <span aria-hidden>›</span>}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="subtle">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}