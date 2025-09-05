import React from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from './Button'

export function confirm({ title, body, ok='Confirm', cancel='Cancel' }:{
  title:string; body?:string; ok?:string; cancel?:string
}): Promise<boolean>{
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  
  return new Promise(res=>{
    const close = (v:boolean)=>{ 
      root.unmount()
      host.remove()
      res(v) 
    }
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close(false)
        document.removeEventListener('keydown', handleEscape)
      }
    }
    document.addEventListener('keydown', handleEscape)
    
    root.render(
      <div className="fixed inset-0 z-[70]">
        <div className="absolute inset-0 bg-black/30" onClick={()=>close(false)} />
        <div role="dialog" aria-modal="true" className="absolute right-1/2 translate-x-1/2 top-24 w-[min(520px,calc(100%-2rem))] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))] p-5 shadow-xl">
          <h2 className="text-lg font-semibold mb-1">{title}</h2>
          {body && <p className="text-sm text-[rgb(var(--fg-muted))] mb-4">{body}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="subtle" onClick={()=>close(false)}>{cancel}</Button>
            <Button onClick={()=>close(true)}>{ok}</Button>
          </div>
        </div>
      </div>
    )
  })
}