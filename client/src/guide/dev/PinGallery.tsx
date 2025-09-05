import { Pin } from '../../ui/Pin'

export default function PinGallery(){
  const states = ['base','next','assigned','due','overdue','done','locked'] as const
  return (
    <div className="p-4 space-y-4">
      {[16,24,48].map(sz=>(
        <div key={sz} className="flex items-center gap-3">
          {states.map(s => <div key={s+sz} className="flex flex-col items-center gap-1">
            <Pin state={s} size={sz as 16|24|48} ariaLabel={`Pin ${s}`} />
            <span className="text-[10px] text-[rgb(var(--fg-muted))]">{s}</span>
          </div>)}
        </div>
      ))}
    </div>
  )
}