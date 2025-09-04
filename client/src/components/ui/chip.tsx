import clsx from 'clsx'
import React from 'react'

export function Chip({ kind, children }:{ kind:'assigned'|'due'|'overdue'|'done'|'info'; children: React.ReactNode }) {
  const map = {
    assigned: 'bg-[rgb(var(--bg-soft))] text-[rgb(var(--fg-default))] border-[rgb(var(--border))]',
    due: 'bg-[rgba(var(--warning),.12)] text-[rgb(var(--warning))] border-[rgba(var(--warning),.5)]',
    overdue: 'bg-[rgba(var(--danger),.12)] text-[rgb(var(--danger))] border-[rgba(var(--danger),.5)]',
    done: 'bg-[rgba(var(--positive),.12)] text-[rgb(var(--positive))] border-[rgba(var(--positive),.5)]',
    info: 'bg-[rgb(var(--bg-soft))] text-[rgb(var(--fg-default))] border-[rgb(var(--border))]',
  } as const
  return <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border', map[kind])}>{children}</span>
}