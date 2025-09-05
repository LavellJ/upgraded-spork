import React from 'react'
import clsx from 'clsx'

type Variant = 'primary'|'secondary'|'subtle'|'danger'
type Size = 'sm'|'md'|'lg'

export function Button({ variant='primary', size='md', iconLeft, iconRight, className, ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant; size?: Size; iconLeft?: React.ReactNode; iconRight?: React.ReactNode
  }){
  const v = {
    primary:  'bg-[rgb(var(--brand))] text-white hover:opacity-90',
    secondary:'bg-[rgb(var(--bg-card))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-base))]',
    subtle:   'bg-transparent border border-[rgb(var(--border))] text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-base))]',
    danger:   'bg-red-600 text-white hover:bg-red-700'
  }[variant]
  const s = { 
    sm:'px-2.5 py-1.5 text-sm rounded-lg', 
    md:'px-3.5 py-2 text-sm rounded-xl', 
    lg:'px-4 py-2.5 text-base rounded-2xl' 
  }[size]
  return (
    <button {...props}
      className={clsx('inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-ring', v, s, className)}>
      {iconLeft}{props.children}{iconRight}
    </button>
  )
}