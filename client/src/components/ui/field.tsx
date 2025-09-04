import React, { PropsWithChildren, ReactNode } from 'react'
import clsx from 'clsx'

export function Field({ label, hint, error, children, className }:{
  label: string; hint?: string; error?: string; children: ReactNode; className?: string
}) {
  const hasError = !!error
  return (
    <label className={clsx('block', className)}>
      <span className="block text-xs text-[rgb(var(--fg-muted))] mb-1">{label}</span>
      <div className={clsx(hasError && 'outline outline-1 outline-[rgb(var(--danger))] rounded-lg')}>{children}</div>
      {hint && !hasError && <span className="mt-1 block text-xs text-[rgb(var(--fg-subtle))]">{hint}</span>}
      {hasError && <span className="mt-1 block text-xs text-[rgb(var(--danger))]">{error}</span>}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return <input {...rest} className={clsx(
    'w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))]',
    'px-3 py-[calc(10px*var(--density))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]',
    className
  )}/>
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props
  return <select {...rest} className={clsx(
    'w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] px-3 py-[calc(10px*var(--density))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]',
    className
  )}/>
}