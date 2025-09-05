import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Density = 'cozy'|'compact'
const KEY = 'qi.teacher.density'

const Ctx = createContext<{density: Density; toggle: ()=>void} | null>(null)

export function DensityProvider({ children }:{ children:any }){
  const [density, setDensity] = useState<Density>((localStorage.getItem(KEY) as Density) || 'cozy')
  useEffect(()=>{ 
    localStorage.setItem(KEY, density)
    document.documentElement.style.setProperty('--density', density==='compact' ? '0.9' : '1.0') 
  }, [density])
  const value = useMemo(()=>({ density, toggle: ()=>setDensity(d=>d==='cozy'?'compact':'cozy') }), [density])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDensity(){
  const v = useContext(Ctx)
  if (!v) throw new Error('useDensity must be inside DensityProvider')
  return v
}