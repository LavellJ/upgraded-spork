import { ReactNode, useEffect, useMemo, useState } from 'react'

type Option = { value: string; label: string }

export function useUrlState<T extends Record<string,string>>(defaults: T){
  const [state, setState] = useState<T>(() => {
    const u = new URL(window.location.href)
    const out: any = { ...defaults }
    Object.keys(defaults).forEach(k => { const v = u.searchParams.get(k); if (v!=null) out[k] = v })
    return out
  })
  useEffect(()=> {
    const u = new URL(window.location.href)
    Object.entries(state).forEach(([k,v])=> { if (v) u.searchParams.set(k, v as string); else u.searchParams.delete(k) })
    history.replaceState({}, '', u)
  }, [state])
  return [state, setState] as const
}

export function FilterBar({
  children
}:{ children: ReactNode }){
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-200 rounded-xl bg-white">
      {children}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder='Search', 'aria-label': ariaLabel='Search' }:{
  value: string; onChange: (v:string)=>void; placeholder?: string; 'aria-label'?: string
}){
  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
      <span className="text-sm text-gray-500">🔎</span>
      <input
        aria-label={ariaLabel}
        className="bg-transparent outline-none text-sm min-w-[12ch]"
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

export function Select({ label, value, onChange, options }:{
  label: string; value: string; onChange:(v:string)=>void; options: Option[]
}){
  return (
    <label className="text-sm text-gray-600 flex items-center gap-2">
      <span>{label}</span>
      <select
        className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50"
        value={value}
        onChange={e=>onChange(e.target.value)}
        aria-label={label}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}