import React, { createContext, useContext, useState } from 'react'

type Toast = { id:string; title:string; body?:string; tone?:'info'|'success'|'warn'|'error'; ms?:number }
const Ctx = createContext<{push:(t:Omit<Toast,'id'>)=>void}>({ push: ()=>{} })

export function useToast(){ return useContext(Ctx) }

export function ToastHost({ children }:{ children:any }){
  const [toasts, set] = useState<Toast[]>([])
  function push(t: Omit<Toast,'id'>){ 
    const id = crypto.randomUUID()
    set(x=>[...x, { id, ms:3000, tone:'success', ...t }])
    setTimeout(()=>dismiss(id), t.ms ?? 3000) 
  }
  function dismiss(id:string){ set(x=>x.filter(t=>t.id!==id)) }
  
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2">
        {toasts.map(t=>(
          <div key={t.id}
            className="min-w-[240px] max-w-[360px] rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] shadow-lg p-3">
            <div className="font-semibold">{t.title}</div>
            {t.body && <div className="text-sm text-[rgb(var(--fg-muted))]">{t.body}</div>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}