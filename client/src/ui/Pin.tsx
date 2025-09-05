import React from 'react'
import clsx from 'clsx'
import { useProfile } from '../profile/context'

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
  ariaLabel,
  onClick,
  collisionOffset,
  tooltip
}:{ 
  state?: PinState; 
  size?: 16|24|48; 
  selected?: boolean; 
  ariaLabel?: string;
  onClick?: () => void;
  collisionOffset?: { x: number; y: number };
  tooltip?: { title: string; dueAt?: number };
}) {
  const { profile } = useProfile();
  const isCalm = profile?.calmMode || false;
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const disableAnimations = isCalm || prefersReducedMotion;

  // Detect projector mode and high-contrast mode
  const isProjectorMode = typeof document !== 'undefined' && document.documentElement.hasAttribute('data-projector-font-scale');
  const isHighContrast = typeof document !== 'undefined' && document.documentElement.getAttribute('data-contrast') === 'high';
  
  // Adjust size for projector mode (bump up one step)
  const effectiveSize = isProjectorMode ? (size === 16 ? 24 : size === 24 ? 48 : 48) : size;
  
  // Adjust stroke width for projector mode 
  const strokeWidth = isProjectorMode ? "2.3" : "1.8";
  
  const tone = TONES[state];
  
  // High contrast adjustments for done state
  const adjustedTone = isHighContrast && state === 'done' 
    ? { ...tone, fill: 'rgb(var(--positive))', stroke: 'rgb(var(--fg-default))' }
    : tone;
  
  const classes = clsx(
    'transition-transform relative',
    !disableAnimations && 'hover:-translate-y-px',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--brand))] rounded-full',
    selected && 'outline outline-2 outline-[rgb(var(--brand))]'
  )

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  // Ensure minimum hit target of 44x44
  const hitAreaSize = Math.max(44, effectiveSize);
  const offsetStyle = collisionOffset ? { 
    transform: `translate(${collisionOffset.x}px, ${collisionOffset.y}px)` 
  } : {};

  return (
    <div className="group relative" style={offsetStyle}>
      {/* Collision connector line if offset */}
      {collisionOffset && (collisionOffset.x !== 0 || collisionOffset.y !== 0) && (
        <div 
          className="absolute border-l border-[rgb(var(--border))] opacity-60 z-0"
          style={{
            left: -collisionOffset.x,
            top: -collisionOffset.y,
            width: Math.abs(collisionOffset.x),
            height: Math.abs(collisionOffset.y),
            transformOrigin: '0 0'
          }}
        />
      )}
      
      <button
        type="button"
        role="button"
        className={classes}
        style={{ 
          width: hitAreaSize, 
          height: hitAreaSize, 
          lineHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label={ariaLabel}
        aria-pressed={selected}
        aria-current={selected ? "true" : undefined}
        data-testid={`pin-${state}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
      <svg viewBox="0 0 24 24" width={effectiveSize} height={effectiveSize} aria-hidden focusable="false">
        {/* Selection ring - inner glow effect with subtle stroke */}
        {selected && (
          <path 
            d="M12 2c-4 0-7 3.1-7 7 0 5.1 7 13 7 13s7-7.9 7-13c0-3.9-3-7-7-7Z" 
            fill="none" 
            stroke="rgb(var(--brand))" 
            strokeWidth="0.8"
            opacity="0.6"
          />
        )}
        
        {/* Base teardrop pin shape */}
        <path 
          d="M12 2c-4 0-7 3.1-7 7 0 5.1 7 13 7 13s7-7.9 7-13c0-3.9-3-7-7-7Z" 
          fill={adjustedTone.fill} 
          stroke={adjustedTone.stroke} 
          strokeWidth={strokeWidth} 
        />
        
        {/* Overlay icons */}
        {adjustedTone.icon === 'check' && (
          <path 
            d={ICONS.check} 
            fill="none" 
            stroke={adjustedTone.iconColor} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        )}
        
        {adjustedTone.icon === 'lock' && (
          <g stroke={adjustedTone.iconColor} fill="none" strokeWidth="2" strokeLinecap="round">
            <path d="M7.5 10V8a4.5 4.5 0 0 1 9 0v2" />
            <rect x="6" y="10" width="12" height="9" rx="2.5" />
            <circle cx="12" cy="14.5" r="1.6" fill={adjustedTone.iconColor} />
          </g>
        )}
        
        {adjustedTone.icon === 'exclaim' && (
          <g stroke={adjustedTone.iconColor} strokeWidth="2" strokeLinecap="round">
            <path d="M12 6v8" />
            <circle cx="12" cy="18" r="1.6" fill={adjustedTone.iconColor} />
          </g>
        )}
        
        {adjustedTone.icon === 'dot' && (
          <circle cx="12" cy="12" r="4" fill={adjustedTone.iconColor} />
        )}
        </svg>
        
        {/* Tooltip on hover/focus */}
        {tooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
            {tooltip.title}
            {tooltip.dueAt && <div className="text-xs opacity-75">Due {new Date(tooltip.dueAt).toLocaleDateString()}</div>}
          </div>
        )}
      </button>
    </div>
  )
}