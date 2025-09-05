import { ReactNode } from 'react'
import { useFlags } from '@/config/flags'

export function EmptyState({ icon, title, message, actionLabel, onAction }:{
  icon?: ReactNode; title: string; message?: string; actionLabel?: string; onAction?: () => void
}) {
  const { finalArt } = useFlags()
  return (
    <div className="flex flex-col items-center text-center gap-2 p-8">
      {icon
        ? icon
        : finalArt
          ? <img src="/art/spots/map-parchment.webp" alt="" className="h-12 w-12 art-shadow" />
          : <div className="h-10 w-10 rounded-xl bg-[rgb(var(--bg-soft))] border border-[rgb(var(--border))]" aria-hidden />
      }
      <h3 className="text-base font-semibold">{title}</h3>
      {message && <p className="subtle max-w-[48ch]">{message}</p>}
      {actionLabel && <button type="button" onClick={onAction} className="mt-2 px-3 py-2 rounded-xl border border-brand">
        {actionLabel}
      </button>}
    </div>
  )
}