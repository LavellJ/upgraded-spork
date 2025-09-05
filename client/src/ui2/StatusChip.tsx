import clsx from 'clsx'

export function StatusChip({ kind, children }:{ kind: 'assigned'|'due'|'overdue'|'done'|'locked'|'info'; children: any }){
  const map: Record<string,string> = {
    assigned:'bg-blue-100 text-blue-800',
    due:'bg-amber-100 text-amber-800',
    overdue:'bg-red-100 text-red-800',
    done:'bg-emerald-100 text-emerald-800',
    locked:'bg-slate-200 text-slate-800',
    info:'bg-slate-100 text-slate-800'
  }
  return <span className={clsx('px-2 py-0.5 rounded-lg text-xs font-medium', map[kind])}>{children}</span>
}