import React from 'react'
import { useProfile } from '../profile/context'

interface RouteBreadcrumbsProps {
  points: Array<{ leftPct: number; topPct: number }>
  emphasis?: 'normal' | 'highlight'
  animated?: boolean
}

export function RouteBreadcrumbs({ 
  points, 
  emphasis = 'normal', 
  animated = true 
}: RouteBreadcrumbsProps) {
  const { profile } = useProfile()
  const isCalm = profile?.calmMode || false
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const disableAnimations = isCalm || prefersReducedMotion || !animated
  
  // Early return if less than 2 points
  if (points.length < 2) return null
  
  // Detect high-contrast mode
  const isHighContrast = typeof document !== 'undefined' && document.documentElement.getAttribute('data-contrast') === 'high'
  
  // Color selection based on emphasis and high-contrast
  const strokeColor = isHighContrast 
    ? 'rgb(var(--fg-default))'
    : emphasis === 'highlight' 
      ? 'rgb(var(--brand))' 
      : 'rgb(var(--fg-muted))'
      
  const dotColor = isHighContrast
    ? 'rgb(var(--fg-default))'
    : emphasis === 'highlight'
      ? 'rgb(var(--brand))'
      : 'rgb(var(--fg-muted))'

  // Create path segments between consecutive points
  const pathSegments: Array<{ start: { leftPct: number; topPct: number }; end: { leftPct: number; topPct: number } }> = []
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    pathSegments.push({ start, end })
  }

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10"
      aria-hidden="true"
    >
      <svg 
        className="w-full h-full" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        {/* Draw path lines */}
        {pathSegments.map((segment, index) => {
          const pathId = `route-path-${index}`
          const pathLength = Math.sqrt(
            Math.pow(segment.end.leftPct - segment.start.leftPct, 2) +
            Math.pow(segment.end.topPct - segment.start.topPct, 2)
          )
          
          return (
            <g key={pathId}>
              {/* Main path line */}
              <line
                x1={segment.start.leftPct}
                y1={segment.start.topPct}
                x2={segment.end.leftPct}
                y2={segment.end.topPct}
                stroke={strokeColor}
                strokeWidth="2"
                strokeDasharray={disableAnimations ? "4,4" : "8,4"}
                opacity="0.7"
              >
                {/* Animated dash offset if animations enabled */}
                {!disableAnimations && (
                  <animate
                    attributeName="stroke-dashoffset"
                    values="0;12;0"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                )}
              </line>
            </g>
          )
        })}
        
        {/* Draw dots at points */}
        {points.map((point, index) => (
          <circle
            key={`dot-${index}`}
            cx={point.leftPct}
            cy={point.topPct}
            r="1.5"
            fill={dotColor}
            opacity="0.8"
          >
            {/* Subtle pulse animation if enabled */}
            {!disableAnimations && index === 0 && (
              <animate
                attributeName="r"
                values="1.5;2.2;1.5"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        ))}
      </svg>
    </div>
  )
}