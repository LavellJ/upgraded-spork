export type FeatureFlags = { 
  finalArt: boolean
  teacherPanelV2: boolean
}
const KEY = 'qi.flags.v1'
const EVT: EventTarget = (globalThis as any).__qiFlagsEvt || new EventTarget()
;(globalThis as any).__qiFlagsEvt = EVT

let cachedFlags: FeatureFlags | null = null
function load(): FeatureFlags { 
  if (cachedFlags) return cachedFlags
  try{ 
    const raw=localStorage.getItem(KEY); 
    if(raw) {
      cachedFlags = { finalArt:false, teacherPanelV2:false, ...JSON.parse(raw) }
      return cachedFlags
    }
  }catch{}; 
  cachedFlags = { finalArt:false, teacherPanelV2:false }
  return cachedFlags
}
function save(next: FeatureFlags){ 
  localStorage.setItem(KEY, JSON.stringify(next))
  cachedFlags = next
}
export const Flags = { 
  get: load, 
  set(partial: Partial<FeatureFlags>){ 
    const current = load()
    const next = { ...current, ...partial }; 
    save(next); 
    EVT.dispatchEvent(new Event('change')); 
    return next 
  } 
}
import { useSyncExternalStore } from 'react'
export function useFlags(){ 
  return useSyncExternalStore(
    (cb)=>{ 
      EVT.addEventListener('change', cb); 
      return ()=>EVT.removeEventListener('change', cb) 
    },
    ()=>Flags.get(),
    ()=>Flags.get()
  )
}