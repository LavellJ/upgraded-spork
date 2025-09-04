import { useEffect, useId, useRef } from 'react'
import clsx from 'clsx'

export type TabItem = { id: string; label: string; badge?: number | string }

export default function SubTabs({
  tabs, value, onChange, ariaLabel = 'Sections'
}: {
  tabs: TabItem[]
  value: string
  onChange: (id: string) => void
  ariaLabel?: string
}) {
  const listId = useId()
  const activeIdx = Math.max(0, tabs.findIndex(t => t.id === value))
  const refs = useRef<HTMLButtonElement[]>([])

  useEffect(() => {
    // ensure active tab is scrolled into view
    const el = refs.current[activeIdx]; el?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [activeIdx])

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[rgb(var(--bg-page))] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[rgb(var(--bg-page))] to-transparent" />
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-describedby={listId}
        className="flex gap-1 overflow-x-auto no-scrollbar py-1 border-b border-[rgb(var(--border))]"
      >
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={el => { if (el) refs.current[i] = el }}
            role="tab"
            aria-selected={t.id === value}
            className={clsx(
              'px-3 py-2 rounded-t-lg whitespace-nowrap',
              'border-b-2',
              t.id === value
                ? 'border-brand text-[rgb(var(--fg-default))]'
                : 'border-transparent text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg-default))]'
            )}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') { e.preventDefault(); onChange(tabs[(activeIdx+1)%tabs.length].id) }
              if (e.key === 'ArrowLeft')  { e.preventDefault(); onChange(tabs[(activeIdx-1+tabs.length)%tabs.length].id) }
            }}
          >
            <span>{t.label}</span>
            {t.badge ? <span className="ml-2 text-xs rounded-full px-1.5 py-0.5 bg-[rgb(var(--bg-soft))] border border-[rgb(var(--border))]">{t.badge}</span> : null}
          </button>
        ))}
      </div>
      <span id={listId} className="sr-only-important">Use Left/Right arrow keys to switch tabs</span>
    </div>
  )
}