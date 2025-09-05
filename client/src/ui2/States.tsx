import React from 'react'

export function Empty({ title, message, action }: { title:string; message?:string; action?:React.ReactNode }){
  return (
    <div className="text-center p-10 border border-[rgb(var(--border))] rounded-2xl">
      <div className="text-base font-semibold">{title}</div>
      {message && <p className="text-sm text-[rgb(var(--fg-muted))] mt-1">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function ErrorState({ title='Something went wrong', detail }: { title?:string; detail?:string }){
  return (
    <div className="text-center p-10 border border-red-300/40 bg-red-50/10 rounded-2xl">
      <div className="text-base font-semibold text-red-800">{title}</div>
      {detail && <p className="text-sm text-[rgb(var(--fg-muted))] mt-1">{detail}</p>}
    </div>
  )
}

export function LoadingRows(){ 
  return <div className="p-6 text-sm text-[rgb(var(--fg-muted))]">Loading…</div> 
}