import React from 'react'
import clsx from 'clsx'

export type PinState = 'base'|'next'|'assigned'|'due'|'overdue'|'done'|'locked'

export function Pin({
  state='base',
  size=24,
  selected=false,
  ariaLabel
}:{
  state?: PinState
  size?: 16|24|48
  selected?: boolean
  ariaLabel?: string
}){
  const s = size
  const classes = clsx('transition-transform', selected && 'outline outline-2 outline-[rgb(var(--brand))] rounded-full')
  
  // Base teardrop path (viewBox 24) scaled via width/height; styled with tokens per state
  const styles: Record<PinState, {fill:string; stroke:string; icon?:string}> = {
    base:     { fill:'rgb(var(--bg-card))',              stroke:'rgb(var(--border))' },
    next:     { fill:'rgb(var(--brand))',                stroke:'rgb(var(--fg-inverse))' },
    assigned: { fill:'rgb(var(--bg-soft))',              stroke:'rgb(var(--border))' },
    due:      { fill:'rgba(var(--warning),.12)',         stroke:'rgba(var(--warning),.6)' },
    overdue:  { fill:'rgba(var(--danger),.12)',          stroke:'rgba(var(--danger),.7)' },
    done:     { fill:'transparent',                      stroke:'rgb(var(--positive))' },
    locked:   { fill:'rgb(var(--bg-soft))',              stroke:'rgb(var(--border))' },
  }
  
  const tone = styles[state]
  
  return (
    <button
      type="button"
      className={classes}
      style={{ width:s, height:s, lineHeight:0 }}
      aria-label={ariaLabel}
      data-testid={`pin-${state}`}
    >
      <svg viewBox="0 0 24 24" width={s} height={s} aria-hidden focusable="false">
        <path 
          d="M12 2c-4 0-7 3.1-7 7 0 5.1 7 13 7 13s7-7.9 7-13c0-3.9-3-7-7-7Z" 
          fill={tone.fill} 
          stroke={tone.stroke} 
          strokeWidth="1.8" 
        />
        {state==='done'    && <path d="M7 12.5l3 3 7-7" stroke={tone.stroke} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {state==='locked'  && <circle cx="12" cy="12" r="3.5" fill="rgb(var(--bg-card))" stroke="rgb(var(--border))" strokeWidth="1.2" />}
        {state==='overdue' && <text x="12" y="14" textAnchor="middle" fontSize="10" fill="rgb(var(--fg-inverse))">!</text>}
        {state==='assigned'&& <circle cx="17" cy="17" r="2.2" fill="rgb(var(--brand))" />}
      </svg>
    </button>
  )
}