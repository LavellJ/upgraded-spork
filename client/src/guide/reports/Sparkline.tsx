/**
 * Accessible sparkline chart component
 * Provides visual trends with screen reader support and high-contrast colors
 */

import React, { useMemo } from 'react';

export interface SparklineProps {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  className?: string;
  ariaLabel: string;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  formatValue?: (value: number) => string;
}

/**
 * Accessible sparkline component with SVG and hidden data table
 * Respects prefers-reduced-motion and provides high contrast colors
 */
export function Sparkline({
  data,
  labels,
  width = 100,
  height = 20,
  className = '',
  ariaLabel,
  color = 'rgb(59, 125, 68)', // forest green
  strokeWidth = 1.5,
  showDots = false,
  formatValue = (value) => value.toString()
}: SparklineProps) {
  const pathData = useMemo(() => {
    if (data.length === 0) return '';

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue;
    
    // Handle flat data (no variation)
    if (range === 0) {
      const y = height / 2;
      return `M 0 ${y} L ${width} ${y}`;
    }

    // Generate path points
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      return { x, y, value };
    });

    // Create SVG path
    const pathString = points
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L';
        return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      })
      .join(' ');

    return pathString;
  }, [data, width, height]);

  const dotPoints = useMemo(() => {
    if (!showDots || data.length === 0) return [];

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue;

    if (range === 0) {
      return data.map((value, index) => ({
        x: (index / (data.length - 1)) * width,
        y: height / 2,
        value
      }));
    }

    return data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - ((value - minValue) / range) * height,
      value
    }));
  }, [data, width, height, showDots]);

  // Generate unique IDs for accessibility
  const chartId = useMemo(() => `sparkline-${Math.random().toString(36).substr(2, 9)}`, []);
  const tableId = useMemo(() => `sparkline-table-${Math.random().toString(36).substr(2, 9)}`, []);

  if (data.length === 0) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <svg width={width} height={height} role="img" aria-label="No data available">
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="2,2"
            opacity={0.5}
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-labelledby={chartId}
        aria-describedby={tableId}
        className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        tabIndex={0}
      >
        <title id={chartId}>{ariaLabel}</title>
        
        {/* Main trend line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="motion-reduce:transition-none"
        />
        
        {/* Optional dots for data points */}
        {showDots && dotPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={1.5}
            fill={color}
            className="motion-reduce:transition-none"
          />
        ))}
      </svg>

      {/* Screen reader accessible data table (visually hidden) */}
      <table id={tableId} className="sr-only">
        <caption>Data table for {ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Point</th>
            <th scope="col">Value</th>
            {labels && <th scope="col">Label</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((value, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{formatValue(value)}</td>
              {labels && <td>{labels[index] || `Point ${index + 1}`}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Multi-line sparkline for comparing two series
 * Used for per-class comparisons with maximum 2 lines
 */
export interface MultiSparklineProps {
  series: Array<{
    data: number[];
    label: string;
    color: string;
  }>;
  labels?: string[];
  width?: number;
  height?: number;
  className?: string;
  ariaLabel: string;
  strokeWidth?: number;
  formatValue?: (value: number) => string;
}

export function MultiSparkline({
  series,
  labels,
  width = 100,
  height = 20,
  className = '',
  ariaLabel,
  strokeWidth = 1.5,
  formatValue = (value) => value.toString()
}: MultiSparklineProps) {
  // Limit to 2 series maximum for readability
  const limitedSeries = series.slice(0, 2);

  const pathsData = useMemo(() => {
    if (limitedSeries.length === 0) return [];

    // Get global min/max across all series
    const allValues = limitedSeries.flatMap(s => s.data);
    if (allValues.length === 0) return [];

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue;

    return limitedSeries.map(seriesItem => {
      if (seriesItem.data.length === 0) return { ...seriesItem, path: '' };

      // Handle flat data
      if (range === 0) {
        const y = height / 2;
        return {
          ...seriesItem,
          path: `M 0 ${y} L ${width} ${y}`
        };
      }

      // Generate path points
      const points = seriesItem.data.map((value, index) => {
        const x = (index / (seriesItem.data.length - 1)) * width;
        const y = height - ((value - minValue) / range) * height;
        return { x, y };
      });

      // Create SVG path
      const pathString = points
        .map((point, index) => {
          const command = index === 0 ? 'M' : 'L';
          return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
        })
        .join(' ');

      return {
        ...seriesItem,
        path: pathString
      };
    });
  }, [limitedSeries, width, height]);

  const chartId = useMemo(() => `multi-sparkline-${Math.random().toString(36).substr(2, 9)}`, []);
  const tableId = useMemo(() => `multi-sparkline-table-${Math.random().toString(36).substr(2, 9)}`, []);

  if (limitedSeries.length === 0) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <svg width={width} height={height} role="img" aria-label="No data available">
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="2,2"
            opacity={0.5}
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-labelledby={chartId}
        aria-describedby={tableId}
        className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        tabIndex={0}
      >
        <title id={chartId}>{ariaLabel}</title>
        
        {/* Render each series line */}
        {pathsData.map((seriesItem, seriesIndex) => (
          <path
            key={seriesIndex}
            d={seriesItem.path}
            fill="none"
            stroke={seriesItem.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={seriesIndex === 1 ? '3,2' : 'none'} // Second line is dashed
            className="motion-reduce:transition-none"
          />
        ))}
      </svg>

      {/* Screen reader accessible data table */}
      <table id={tableId} className="sr-only">
        <caption>Multi-series data table for {ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Point</th>
            {limitedSeries.map((s, i) => (
              <th key={i} scope="col">{s.label}</th>
            ))}
            {labels && <th scope="col">Label</th>}
          </tr>
        </thead>
        <tbody>
          {labels ? labels.map((label, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              {limitedSeries.map((s, seriesIndex) => (
                <td key={seriesIndex}>
                  {s.data[index] !== undefined ? formatValue(s.data[index]) : 'N/A'}
                </td>
              ))}
              <td>{label}</td>
            </tr>
          )) : 
          // If no labels, use the longest series to determine row count
          Array.from({ length: Math.max(...limitedSeries.map(s => s.data.length)) }, (_, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              {limitedSeries.map((s, seriesIndex) => (
                <td key={seriesIndex}>
                  {s.data[index] !== undefined ? formatValue(s.data[index]) : 'N/A'}
                </td>
              ))}
            </tr>
          ))
          }
        </tbody>
      </table>
    </div>
  );
}