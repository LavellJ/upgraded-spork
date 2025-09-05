export type FeatureFlags = {
  finalArt: boolean
  // add other flags here as needed
}

const KEY = 'qi.flags.v1'

// simple event hub for changes
const EVT: EventTarget = (globalThis as any).__qiFlagsEvt || new EventTarget()
;(globalThis as any).__qiFlagsEvt = EVT

function load(): FeatureFlags {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { finalArt: false, ...JSON.parse(raw) }
  } catch {}
  return { finalArt: false }
}
function save(next: FeatureFlags) {
  localStorage.setItem(KEY, JSON.stringify(next))
}

export const Flags = {
  get: load,
  set(partial: Partial<FeatureFlags>) {
    const cur = load()
    const next = { ...cur, ...partial }
    save(next)
    EVT.dispatchEvent(new Event('change'))
    return next
  }
}

// React hook: subscribe to updates so UI re-renders on toggle
import { useSyncExternalStore } from 'react'
export function useFlags() {
  return useSyncExternalStore(
    (cb) => { EVT.addEventListener('change', cb); return () => EVT.removeEventListener('change', cb) },
    () => Flags.get(),
    () => Flags.get()
  )
}