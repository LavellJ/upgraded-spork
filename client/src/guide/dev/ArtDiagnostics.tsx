import { useEffect, useState } from 'react'
import { useFlags, Flags } from '../../config/flags'

async function check(url: string){
  try {
    const r = await fetch(url + `?v=${Date.now()}`, { method:'GET', cache:'reload' })
    return r.ok
  } catch { return false }
}

export default function ArtDiagnostics(){
  const flags = useFlags()
  const [res, setRes] = useState<{[k:string]:boolean}>({})
  
  useEffect(()=>{
    let cancelled = false
    const checkAssets = async () => {
      const entries = [
        ['/art/ui/backpack.webp','Backpack'],
        ['/art/spots/map-parchment.webp','Parchment'],
        ['/art/scout/scout.svg','Scout SVG (optional)'],
        ['/art/scout/scout-neutral.webp','Scout Neutral (fallback)'],
      ]
      const out: Record<string, boolean> = {}
      for (const [url, name] of entries){ 
        if (cancelled) return
        out[name] = await check(url) 
      }
      if (!cancelled) setRes(out)
    }
    checkAssets()
    return () => { cancelled = true }
  }, [flags.finalArt])
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
        {Object.entries(res).map(([k,v])=>(
          <li key={k} className={v ? 'text-green-600' : 'text-red-600'}>
            {v ? '✅' : '❌'} {k}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[rgb(var(--fg-muted))]">
        If assets show ❌, ensure files exist under <code>/public/art/**</code> and hard-refresh to bust any PWA cache.
      </p>
    </section>
  )
}