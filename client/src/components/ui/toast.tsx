import { createContext, useContext, useState, ReactNode } from 'react'

type Toast = { id: number; kind:'success'|'warn'|'error'; text: string }
const Ctx = createContext<{ push:(t:Omit<Toast,'id'>)=>void }|null>(null)

export function ToastProvider({ children }:{ children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  function push(t: Omit<Toast,'id'>) {
    const id = Date.now() + Math.random()
    setItems(s => [...s, { id, ...t }]); setTimeout(()=>setItems(s=>s.filter(i=>i.id!==id)), 4000)
  }
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2" aria-live="polite" aria-atomic="true">
        {items.map(i => (
          <div key={i.id} className={`px-3 py-2 rounded-xl border ${
            i.kind==='success' ? 'bg-[rgba(var(--positive),.12)] border-[rgba(var(--positive),.5)] text-[rgb(var(--positive))]' :
            i.kind==='warn'    ? 'bg-[rgba(var(--warning),.12)] border-[rgba(var(--warning),.5)] text-[rgb(var(--warning))]' :
                                 'bg-[rgba(var(--danger),.12)] border-[rgba(var(--danger),.5)] text-[rgb(var(--danger))]'
          }`}>
            {i.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast(){ const c = useContext(Ctx); if(!c) throw new Error('useToast outside provider'); return c }
