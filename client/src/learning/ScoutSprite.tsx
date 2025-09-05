import React from 'react'
import { Flags } from '../config/flags'

type Expr = 'neutral'|'happy'|'thinking'|'encouraging'|'alert'|'celebrate'

export default function ScoutSprite({ size=96, expr='neutral' }:{ size?: number; expr?: Expr }){
  const { finalArt } = Flags.get()
  
  // For now we only have neutral raster; expressions map to the same asset.
  if (finalArt){
    return (
      <img 
        src="/art/scout/scout-neutral.webp" 
        width={size} 
        height={size} 
        alt="" 
        className="art-shadow rounded-xl select-none" 
        data-expression={expr}
      />
    )
  }
  
  return (
    <div 
      style={{width:size,height:size}} 
      aria-hidden 
      className="rounded-xl bg-[rgb(var(--bg-soft))] flex items-center justify-center"
      data-expression={expr}
    >
      🧭
    </div>
  )
}