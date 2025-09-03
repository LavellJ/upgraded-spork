import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

/**
 * Simple sparkline component for showing trends in small space
 * No external dependencies - pure SVG implementation
 */
export function Sparkline({ 
  data, 
  width = 60, 
  height = 20, 
  color = '#3b82f6', 
  strokeWidth = 1.5,
  className = '' 
}: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <svg width={width} height={height} className={className}>
        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#e5e7eb" strokeWidth={1} />
      </svg>
    );
  }

  if (data.length === 1) {
    // Single data point - show as a dot
    return (
      <svg width={width} height={height} className={className}>
        <circle cx={width/2} cy={height/2} r={2} fill={color} />
      </svg>
    );
  }

  // Calculate min/max for scaling
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const valueRange = maxValue - minValue;
  
  // If all values are the same, draw a horizontal line
  if (valueRange === 0) {
    return (
      <svg width={width} height={height} className={className}>
        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke={color} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  // Generate path points
  const padding = 2;
  const plotWidth = width - (padding * 2);
  const plotHeight = height - (padding * 2);
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * plotWidth;
    const y = padding + plotHeight - ((value - minValue) / valueRange) * plotHeight;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return (
    <svg width={width} height={height} className={className}>
      <path 
        d={pathData} 
        fill="none" 
        stroke={color} 
        strokeWidth={strokeWidth}
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Optional: Add dots for each data point */}
      {data.length <= 10 && data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * plotWidth;
        const y = padding + plotHeight - ((value - minValue) / valueRange) * plotHeight;
        return (
          <circle 
            key={index}
            cx={x} 
            cy={y} 
            r={1} 
            fill={color}
          />
        );
      })}
    </svg>
  );
}