export type FeatureFlags = { finalArt: boolean }
const KEY = 'qi.flags.v1'
const EVT: EventTarget = (globalThis as any).__qiFlagsEvt || new EventTarget()
;(globalThis as any).__qiFlagsEvt = EVT
function load(){ try{ const raw=localStorage.getItem(KEY); if(raw) return { finalArt:false, ...JSON.parse(raw) } }catch{}; return { finalArt:false } }
function save(next: any){ localStorage.setItem(KEY, JSON.stringify(next)) }
export const Flags = { get: load, set(partial: Partial<FeatureFlags>){ const next = { ...load(), ...partial }; save(next); EVT.dispatchEvent(new Event('change')); return next } }
import { useSyncExternalStore } from 'react'
export function useFlags(){ return useSyncExternalStore(
  (cb)=>{ EVT.addEventListener('change', cb); return ()=>EVT.removeEventListener('change', cb) },
  ()=>Flags.get(),
  ()=>Flags.get()
)}