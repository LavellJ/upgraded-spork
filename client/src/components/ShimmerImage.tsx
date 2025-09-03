import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReadability } from '../hooks/useReadability';

interface ShimmerImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  lqipSrc?: string;
  className?: string;
  priority?: boolean; // For above-the-fold images
}

/**
 * ShimmerImage component for lazy loading with smooth fade-in
 * Prevents layout shifts by reserving space and shows shimmer while loading
 */
export function ShimmerImage({
  src,
  alt,
  width,
  height,
  lqipSrc,
  className = '',
  priority = false
}: ShimmerImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showLQIP, setShowLQIP] = useState(!!lqipSrc);
  const imgRef = useRef<HTMLImageElement>(null);
  const { settings } = useReadability();
  
  // Check for reduced motion preference
  const shouldReduceMotion = settings.reducedMotion || 
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Reserve aspect ratio to prevent layout shifts
  const aspectRatio = height / width;
  const reservedStyle = {
    aspectRatio: `${width} / ${height}`,
    width: '100%',
    height: 'auto'
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setShowLQIP(false);
  };

  const handleError = () => {
    setIsError(true);
    setShowLQIP(false);
  };

  const handleLQIPLoad = () => {
    // Keep LQIP visible until main image loads
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={reservedStyle}
    >
      {/* Shimmer background animation */}
      {!isLoaded && !isError && (
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] ${
            shouldReduceMotion ? '' : 'animate-[shimmer_1.5s_ease-in-out_infinite]'
          }`}
          style={{
            animation: shouldReduceMotion ? 'none' : 'shimmer 1.5s ease-in-out infinite',
            backgroundImage: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
            backgroundSize: '200% 100%'
          }}
        />
      )}

      {/* Low Quality Image Placeholder (LQIP) */}
      {lqipSrc && showLQIP && (
        <img
          src={lqipSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          onLoad={handleLQIPLoad}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <motion.img
        ref={imgRef}
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={shouldReduceMotion ? { duration: 0.001 } : { duration: 0.3, ease: 'easeOut' }}
        style={{ 
          willChange: isLoaded ? 'auto' : 'opacity'
        }}
      />

      {/* Error state */}
      {isError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500"
          style={reservedStyle}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm">Image unavailable</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add shimmer keyframes to global CSS if not already present
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  
  // Only add if shimmer animation doesn't exist
  if (!document.head.querySelector('style[data-shimmer]')) {
    style.setAttribute('data-shimmer', 'true');
    document.head.appendChild(style);
  }
}