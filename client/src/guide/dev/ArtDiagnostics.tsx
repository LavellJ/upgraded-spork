import { useEffect, useState } from 'react'
import { useFlags, Flags } from '@/config/flags'
import { assetUrl } from '@/lib/assetUrl'

type Check = { name: string; url: string; ok: boolean; status?: number }
async function probe(url: string): Promise<Check>{
  try {
    const res = await fetch(url + `?v=${crypto?.randomUUID?.() ?? Date.now()}`, { cache: 'reload' })
    return { name: url, url, ok: res.ok, status: res.status }
  } catch { return { name: url, url, ok: false, status: -1 } }
}

export default function ArtDiagnostics(){
  const flags = useFlags()
  const [checks, setChecks] = useState<Check[]>([])
  const assets = [
    ['Backpack', assetUrl('art/ui/backpack.webp')],
    ['Parchment', assetUrl('art/spots/map-parchment.webp')],
    ['Scout SVG (optional)', assetUrl('art/scout/scout.svg')],
    ['Scout Neutral (fallback)', assetUrl('art/scout/scout-neutral.webp')],
    ['Reef far', assetUrl('art/biomes/reef/bg-far.webp')],
    ['Reef mid', assetUrl('art/biomes/reef/bg-mid.webp')],
    ['Reef near', assetUrl('art/biomes/reef/bg-near.webp')],
  ] as const

  useEffect(()=>{ (async ()=>{
    const out: Check[] = []
    for (const [, url] of assets) out.push(await probe(url))
    setChecks(out)
  })() }, [flags.finalArt])

  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Art Diagnostics</h3>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={flags.finalArt} onChange={e=>Flags.set({ finalArt: e.target.checked })}/>
          <span>Final Art</span>
        </label>
      </div>
      <ul className="text-sm">
        {checks.map((c, i)=>(
          <li key={i} className={c.ok ? 'text-green-600' : 'text-red-600'}>
            {c.ok ? '✅' : '❌'} {c.url} {typeof c.status==='number' ? `(HTTP ${c.status})` : null}
          </li>
        ))}
      </ul>
      <div className="mt-2 text-xs text-[rgb(var(--fg-muted))]">
        If you see ❌/404: confirm files exist under <code>/public/art/**</code> with exactly these names.
        After adding, hard-refresh or unregister the service worker in DevTools (Application → Service Workers).
      </div>
    </section>
  )
}