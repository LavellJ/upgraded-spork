import { ReactNode, useEffect, useRef } from 'react'
import clsx from 'clsx'

export function DetailDrawer({
  open, onClose, title, subtitle, children, footer
}:{
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode
}){
  // ✅ If not open, unmount completely so no fixed overlay can intercept clicks
  if (!open) return null

  const ref = useRef<HTMLDivElement>(null)
  const lastActive = useRef<HTMLElement | null>(null)

  useEffect(() => {
    lastActive.current = document.activeElement as HTMLElement
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const focusables = Array.from(
          ref.current?.querySelectorAll<HTMLElement>('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])') || []
        ).filter(n=>!n.hasAttribute('disabled'))
        const i = focusables.indexOf(document.activeElement as HTMLElement)
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); focusables.at(-1)?.focus() }
        else if (!e.shiftKey && (i === focusables.length - 1)) { e.preventDefault(); focusables[0]?.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      lastActive.current?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside
        ref={ref}
        role="dialog" aria-modal="true" aria-labelledby="drawer-title" aria-describedby="drawer-subtitle"
        className={clsx(
          'absolute top-0 right-0 h-full w-full max-w-[560px] bg-bg-card border-l border-border shadow-xl'
        )}
      >
        <header className="px-5 py-4 border-b border-border">
          <h2 id="drawer-title" className="text-lg font-semibold">{title}</h2>
          {subtitle && <p id="drawer-subtitle" className="text-sm text-fg-muted">{subtitle}</p>}
        </header>
        <div className="p-5 overflow-auto h-[calc(100%-var(--hdr)-var(--ftr))]" style={{ ['--hdr' as any]:'64px', ['--ftr' as any]:(footer? '64px':'0px') }}>
          {children}
        </div>
        {footer && (
          <footer className="px-5 py-3 border-t border-border bg-bg-base sticky bottom-0">
            <div className="flex items-center justify-end gap-2">{footer}</div>
          </footer>
        )}
      </aside>
    </div>
  )
}