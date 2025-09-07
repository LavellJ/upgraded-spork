// Dev-only helpers (do not import in prod code paths)
export async function runA11yScan() {
  const axe = await import('axe-core')
  // inject axe into document
  const script = document.createElement('script')
  script.textContent = axe.source
  document.documentElement.appendChild(script)
  // @ts-ignore
  return await (window as any).axe.run(document, {
    rules: { 'color-contrast': { enabled: true } },
    resultTypes: ['violations']
  })
}

export type Vitals = { LCP?: number; CLS?: number; INP?: number }
export function startVitals(cb:(v:Vitals)=>void){
  import('web-vitals').then(({ onLCP, onCLS, onINP })=>{
    onLCP((m)=>cb({ LCP: m.value }))
    onCLS((m)=>cb({ CLS: m.value }))
    onINP((m)=>cb({ INP: m.value }))
  })
}