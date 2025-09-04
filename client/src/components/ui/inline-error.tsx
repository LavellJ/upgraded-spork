export function InlineError({ message, onRetry }:{ message: string; onRetry?: () => void }) {
  return (
    <div className="p-3 rounded-xl border border-[rgb(var(--danger))]/50 bg-[rgba(var(--danger),.08)] text-[rgb(var(--danger))] flex items-center justify-between gap-3">
      <span role="alert">{message}</span>
      {onRetry && <button type="button" onClick={onRetry} className="px-2 py-1 rounded-lg border border-[rgb(var(--danger))]/50">Retry</button>}
    </div>
  )
}