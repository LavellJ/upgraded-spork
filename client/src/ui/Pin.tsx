import React from 'react'
import clsx from 'clsx'

export type PinState = 'base'|'next'|'assigned'|'due'|'overdue'|'done'|'locked'

// Inline SVG icon paths
const ICONS = {
  check: 'M6 12.5l3.2 3.2L18 7.9',
  lock: 'M7.5 10V8a4.5 4.5 0 0 1 9 0v2M6 10h12v9c0 1.4-1.1 2.5-2.5 2.5h-7C7.1 21.5 6 20.4 6 19v-9zM12 14.5a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z',
  exclaim: 'M12 6v8M12 18a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z',
  dot: 'M12 12a4 4 0 1 1 0 8 4 4 0 0 1 0-8z'
}

const TONES: Record<PinState, { fill:string; stroke:string; icon?: keyof typeof ICONS; iconColor?: string }> = {
  base:     { fill:'rgb(var(--bg-card))',              stroke:'rgb(var(--border))' },
  next:     { fill:'rgb(var(--brand))',                stroke:'rgb(var(--fg-inverse))' },
  assigned: { fill:'rgb(var(--bg-soft))',              stroke:'rgb(var(--border))', icon: 'dot',     iconColor: 'rgb(var(--brand))' },
  due:      { fill:'rgba(var(--warning),.12)',         stroke:'rgba(var(--warning),.6)' },
  overdue:  { fill:'rgba(var(--danger),.12)',          stroke:'rgba(var(--danger),.7)', icon: 'exclaim', iconColor: 'rgb(var(--fg-inverse))' },
  done:     { fill:'transparent',                      stroke:'rgb(var(--positive))', icon: 'check', iconColor: 'rgb(var(--positive))' },
  locked:   { fill:'rgb(var(--bg-soft))',              stroke:'rgb(var(--border))',   icon: 'lock',  iconColor: 'rgb(var(--fg-muted))' },
}

export function Pin({
  state='base',
  size=24,
  selected=false,
  ariaLabel
}:{ state?: PinState; size?: 16|24|48; selected?: boolean; ariaLabel?: string }) {
  const tone = TONES[state]
  const classes = clsx(
    'transition-transform',
    'hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--brand))] rounded-full',
    selected && 'outline outline-2 outline-[rgb(var(--brand))]'
  )

  return (
    <button
      type="button"
      className={classes}
      style={{ width: size, height: size, lineHeight: 0 }}
      aria-label={ariaLabel}
      data-testid={`pin-${state}`}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden focusable="false">
        {/* Base teardrop pin shape */}
        <path 
          d="M12 2c-4 0-7 3.1-7 7 0 5.1 7 13 7 13s7-7.9 7-13c0-3.9-3-7-7-7Z" 
          fill={tone.fill} 
          stroke={tone.stroke} 
          strokeWidth="1.8" 
        />
        
        {/* Overlay icons */}
        {tone.icon === 'check' && (
          <path 
            d={ICONS.check} 
            fill="none" 
            stroke={tone.iconColor} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        )}
        
        {tone.icon === 'lock' && (
          <g stroke={tone.iconColor} fill="none" strokeWidth="2" strokeLinecap="round">
            <path d="M7.5 10V8a4.5 4.5 0 0 1 9 0v2" />
            <rect x="6" y="10" width="12" height="9" rx="2.5" />
            <circle cx="12" cy="14.5" r="1.6" fill={tone.iconColor} />
          </g>
        )}
        
        {tone.icon === 'exclaim' && (
          <g stroke={tone.iconColor} strokeWidth="2" strokeLinecap="round">
            <path d="M12 6v8" />
            <circle cx="12" cy="18" r="1.6" fill={tone.iconColor} />
          </g>
        )}
        
        {tone.icon === 'dot' && (
          <circle cx="12" cy="12" r="4" fill={tone.iconColor} />
        )}
      </svg>
    </button>
  )
}