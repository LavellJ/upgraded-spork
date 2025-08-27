import React from "react";
import { motion } from "framer-motion";

interface QuestPathProps {
  biomes: Array<{
    id: string;
    position: { x: number; y: number };
    order: number;
  }>;
}

// Component for the glowing yellow path connecting biomes in S-curve
export function QuestPath({ biomes }: QuestPathProps) {
  // Sort biomes by order for path generation
  const sortedBiomes = [...biomes].sort((a, b) => a.order - b.order);
  
  // Generate SVG path connecting biome centers
  const generatePath = () => {
    if (sortedBiomes.length < 2) return "";
    
    const pathCommands = sortedBiomes.map((biome, index) => {
      const x = (biome.position.x / 100) * window.innerWidth;
      const y = (biome.position.y / 100) * window.innerHeight;
      
      if (index === 0) {
        return `M ${x} ${y}`;
      }
      
      // Create smooth curves between points
      const prevBiome = sortedBiomes[index - 1];
      const prevX = (prevBiome.position.x / 100) * window.innerWidth;
      const prevY = (prevBiome.position.y / 100) * window.innerHeight;
      
      // Control points for smooth S-curve
      const controlX1 = prevX + (x - prevX) * 0.5;
      const controlY1 = prevY;
      const controlX2 = prevX + (x - prevX) * 0.5;
      const controlY2 = y;
      
      return `C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${x} ${y}`;
    });
    
    return pathCommands.join(" ");
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Glowing effect for the path */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Animated gradient for the path */}
          <linearGradient id="pathGradient" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8">
              <animate attributeName="stop-opacity" 
                values="0.6;1;0.6" 
                dur="3s" 
                repeatCount="indefinite"/>
            </stop>
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="1">
              <animate attributeName="stop-opacity" 
                values="0.8;1;0.8" 
                dur="3s" 
                repeatCount="indefinite" 
                begin="0.5s"/>
            </stop>
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.8">
              <animate attributeName="stop-opacity" 
                values="0.6;1;0.6" 
                dur="3s" 
                repeatCount="indefinite" 
                begin="1s"/>
            </stop>
          </linearGradient>
        </defs>
        
        {/* Main glowing path */}
        <motion.path
          d={generatePath()}
          stroke="url(#pathGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
        />
        
        {/* Secondary glow layer for extra brightness */}
        <motion.path
          d={generatePath()}
          stroke="#fbbf24"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          opacity="0.3"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 2, delay: 1.2, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}