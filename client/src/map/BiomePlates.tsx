import { useEffect, useMemo, useRef } from 'react'

function useUrlFlag(name: string): string | null {
  try {
    const u = new URL(window.location.href)
    return u.searchParams.get(name) || (u.hash.includes(`${name}=`) ? u.hash.split(`${name}=`)[1]?.split('&')[0] : null)
  } catch { return null }
}

export function BiomePlates({
  biome,
  enable = true,
  intensity = 8,          // px max shift for near layer at full motion
  reduceMotion = false,
}:{
  biome: 'reef'|'alpine'|'forest'|'desert'
  enable?: boolean
  intensity?: number
  reduceMotion?: boolean
}){
  const rootRef = useRef<HTMLDivElement>(null)
  
  // Check URL flag to disable parallax for snapshots
  const parallaxDisabled = useUrlFlag('parallax') === '0'
  const effectiveReduceMotion = reduceMotion || parallaxDisabled

  const urls = useMemo(() => {
    if (biome !== 'reef') return null
    return {
      far:  '/art/biomes/reef/bg-far.webp',
      mid:  '/art/biomes/reef/bg-mid.webp',
      near: '/art/biomes/reef/bg-near.webp',
    }
  }, [biome])

  useEffect(() => {
    const el = rootRef.current
    if (!el || !enable || effectiveReduceMotion) return
    let raf = 0
    let mx = 0, my = 0
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top  + rect.height / 2
      mx = (e.clientX - cx) / rect.width
      my = (e.clientY - cy) / rect.height
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const apply = () => {
      raf = 0
      const i = intensity
      // near moves most, far moves least
      el.style.setProperty('--par-x-far',  `${mx * 0.3 * i}px`)
      el.style.setProperty('--par-y-far',  `${my * 0.3 * i}px`)
      el.style.setProperty('--par-x-mid',  `${mx * 0.6 * i}px`)
      el.style.setProperty('--par-y-mid',  `${my * 0.6 * i}px`)
      el.style.setProperty('--par-x-near', `${mx * 1.0 * i}px`)
      el.style.setProperty('--par-y-near', `${my * 1.0 * i}px`)
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [enable, effectiveReduceMotion, intensity])

  if (!urls || !enable) return null
  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-0 pointer-events-none"
      aria-hidden
    >
      <img
        src={urls.far}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'translate3d(var(--par-x-far,0), var(--par-y-far,0), 0)' }}
        loading="eager"
      />
      <img
        src={urls.mid}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'translate3d(var(--par-x-mid,0), var(--par-y-mid,0), 0)' }}
        loading="lazy"
      />
      <img
        src={urls.near}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'translate3d(var(--par-x-near,0), var(--par-y-near,0), 0)' }}
        loading="lazy"
      />
      {/* Scrim to ensure text/pins remain legible across themes */}
      <div className="absolute inset-0 map-scrim"
           style={{ background: 'linear-gradient(to top, rgba(0,0,0,.10), rgba(0,0,0,.02))' }} />
    </div>
  )
}