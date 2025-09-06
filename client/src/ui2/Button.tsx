import clsx from 'clsx'
type Variant = 'primary'|'secondary'|'subtle'|'danger'
type Size = 'sm'|'md'|'lg'

export function Button(
  { variant='primary', size='md', iconLeft, iconRight, className, type, ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant; size?: Size; iconLeft?: React.ReactNode; iconRight?: React.ReactNode
  }
){
  const v = {
    primary:  'bg-brand-500 text-white hover:opacity-90',
    secondary:'bg-bg-card border border-border hover:bg-bg-base',
    subtle:   'bg-transparent border border-border text-fg-muted hover:bg-bg-base',
    danger:   'bg-danger-500 text-white hover:opacity-90'
  }[variant]
  const s = { sm:'px-2.5 py-1.5 text-sm rounded-lg', md:'px-3.5 py-2 text-sm rounded-xl', lg:'px-4 py-2.5 text-base rounded-2xl' }[size]

  // ✅ default to type="button" to avoid accidental form submissions
  const safeType = type ?? 'button'

  return (
    <button {...props} type={safeType}
      className={clsx('inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-ring', v, s, className)}>
      {iconLeft}{props.children}{iconRight}
    </button>
  )
}