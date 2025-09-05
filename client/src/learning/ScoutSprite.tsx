import { useEffect, useMemo, useRef, useState } from 'react'
import { Flags } from '@/config/flags'
import { onScoutEvent } from '@/learning/scout'

type Expr = 'neutral'|'happy'|'thinking'|'encouraging'|'alert'|'celebrate'

function mapEventToExpr(t: string, { hintsUsed }: any): Expr {
  switch (t) {
    case 'firstMiss':       return 'thinking'
    case 'hintUsed':        return hintsUsed >= 2 ? 'encouraging' : 'thinking'
    case 'branchingTaken':  return 'encouraging'
    case 'masteryAchieved': return 'happy'
    case 'celebrate':       return 'celebrate'
    case 'alert':           return 'alert'
    default:                return 'neutral'
  }
}

export default function ScoutSprite({ size=96 }: { size?: number }) {
  const { finalArt } = Flags.get()
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null)
  const [expr, setExpr] = useState<Expr>('neutral')
  const hostRef = useRef<HTMLSpanElement>(null)

  // Load sprite text if present
  useEffect(() => {
    let cancelled = false
    if (!finalArt) return
    fetch('/art/scout/scout.svg', { cache: 'force-cache' })
      .then(r => (r.ok ? r.text() : null))
      .then(txt => { if (!cancelled) setSvgMarkup(txt) })
      .catch(() => { /* keep raster fallback */ })
    return () => { cancelled = true }
  }, [finalArt])

  // Listen for Scout events → update expression briefly
  useEffect(() => {
    return onScoutEvent(({ type, detail }) => {
      const next = mapEventToExpr(type, detail ?? {})
      setExpr(next)
      // decay back to neutral after 2.5s
      window.setTimeout(() => setExpr('neutral'), 2500)
    })
  }, [])

  // Apply expression by hiding/showing groups in the inline SVG
  useEffect(() => {
    if (!svgMarkup || !hostRef.current) return
    const svg = hostRef.current.querySelector('svg')
    if (!svg) return
    // Hide all pose-* groups, show the one we want
    const poses = svg.querySelectorAll('[id^="pose-"]')
    poses.forEach((g) => ((g as any).style.display = 'none'))
    const active = svg.querySelector(`#pose-${expr}`) as any
    if (active) active.style.display = 'inline'
  }, [svgMarkup, expr])

  // Render
  if (finalArt && svgMarkup) {
    return (
      <span
        ref={hostRef}
        className="art-shadow block rounded-xl select-none"
        style={{ width: size, height: size, lineHeight: 0 }}
        aria-hidden
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: svgMarkup.replace(
          /<svg([^>]*)>/,
          `<svg$1 width="${size}" height="${size}" focusable="false" aria-hidden="true">`
        ) }}
      />
    )
  }

  // Fallback — your canonical raster neutral pose
  return (
    <img
      src="/art/scout/scout-neutral.webp"
      width={size}
      height={size}
      alt="Scout"
      className="art-shadow rounded-xl select-none"
      draggable={false}
    />
  )
}