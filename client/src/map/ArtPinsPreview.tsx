import { useMemo } from 'react'
import { Pin } from '@/ui/Pin'
import { useFlags } from '@/config/flags'

function useUrlFlag(name: string){
  try {
    const u = new URL(window.location.href)
    return u.searchParams.get(name) === '1' || u.hash.includes(`${name}=1`)
  } catch { return false }
}

type Biome = 'beach'|'jungle'|'volcano'|'lagoon'

export default function ArtPinsPreview({ biome }: { biome: Biome }){
  const { finalArt } = useFlags()
  const on = finalArt && (useUrlFlag('artpins') || true) // set to `|| false` if you want URL-gated only

  const samples = useMemo(() => {
    const byBiome: Record<Biome, Array<{left:number; top:number; state: Parameters<typeof Pin>[0]['state']; label:string; size?: 16|24|48}>> = {
      beach: [
        { left: 40, top: 58, state: 'next',     label: 'Next lesson (preview)', size: 48 },
        { left: 64, top: 44, state: 'overdue',  label: 'Overdue assignment (preview)', size: 24 },
      ],
      jungle: [
        { left: 52, top: 50, state: 'assigned', label: 'Assigned (preview)', size: 24 },
        { left: 70, top: 35, state: 'done',     label: 'Completed (preview)', size: 24 },
      ],
      volcano: [
        { left: 46, top: 62, state: 'due',      label: 'Due soon (preview)', size: 24 },
        { left: 62, top: 38, state: 'locked',   label: 'Locked (preview)', size: 24 },
      ],
      lagoon: [
        { left: 48, top: 56, state: 'next',     label: 'Next (preview)', size: 48 },
        { left: 66, top: 40, state: 'assigned', label: 'Assigned (preview)', size: 24 },
      ],
    }
    return byBiome[biome] ?? []
  }, [biome])

  if (!on) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30"
      aria-hidden
    >
      {samples.map((p, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto"
          style={{ left: `${p.left}%`, top: `${p.top}%` }}
        >
          <Pin state={p.state} size={p.size ?? 24} ariaLabel={p.label} />
        </div>
      ))}
    </div>
  )
}