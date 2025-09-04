export function Skeleton({ className='' }:{ className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[rgb(var(--bg-soft))] ${className}`} />
}
