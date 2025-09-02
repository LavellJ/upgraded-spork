import React from 'react';
import { useTimeOfDay } from "@/hooks/useTimeOfDay";

export function AtmosphericBackground() {
  const timeOfDay = useTimeOfDay();

  const getGradientClass = () => {
    switch (timeOfDay) {
      case "morning":
        return "gradient-bg-morning";
      case "afternoon":
        return "gradient-bg-afternoon";
      case "evening":
        return "gradient-bg-evening";
      default:
        return "gradient-bg-morning";
    }
  };

  return (
    <>
      {/* Main background gradient */}
      <div className={`fixed inset-0 ${getGradientClass()} transition-all duration-1000 z-0`} />
      
      {/* Parallax landscape layers */}
      <div className="fixed inset-0 opacity-20 z-0">
        <svg viewBox="0 0 1200 800" className="w-full h-full">
          <defs>
            <linearGradient id="hillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-teal)" />
              <stop offset="100%" stopColor="var(--success-green)" />
            </linearGradient>
          </defs>
          <path 
            d="M0,600 Q300,450 600,500 T1200,400 L1200,800 L0,800 Z" 
            fill="url(#hillGradient)" 
            className="animate-float"
          />
          <path 
            d="M0,700 Q400,550 800,600 T1200,550 L1200,800 L0,800 Z" 
            fill="url(#hillGradient)" 
            opacity="0.6" 
            className="animate-float"
            style={{ animationDelay: "-2s" }}
          />
        </svg>
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-accent-teal rounded-full opacity-60 animate-float" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-success-green rounded-full opacity-80 animate-float" style={{ animationDelay: "-2s" }} />
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-warm-orange rounded-full opacity-70 animate-float" style={{ animationDelay: "-4s" }} />
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-sky-blue rounded-full opacity-60 animate-float" style={{ animationDelay: "-1s" }} />
      </div>
    </>
  );
}
