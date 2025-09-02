import { motion } from "framer-motion";
import { useState } from "react";
import { getBiomeAriaLabel } from '../../data/meta';
import { getAsset, type BiomeId } from '../../lib/assetResolver';

interface BiomeProps {
  id: string;
  name: string;
  subject: string;
  position: { x: number; y: number };
  color: string;
  description: string;
  onClick: () => void;
}

export function Biome({ id, name, subject, position, color, description, onClick }: BiomeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovered(true);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isHovered) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const getBiomeIcon = () => {
    switch (id) {
      case "beach":
        return "🏖️";
      case "jungle":
        return "🌿";
      case "volcano":
        return "🌋";
      case "lagoon":
        return "🌊";
      default:
        return "🏝️";
    }
  };

  const getBiomeImage = () => {
    // Map legacy biome IDs to standardized biome IDs
    const biomeIdMap: Record<string, BiomeId> = {
      "beach": "night",
      "jungle": "forest", 
      "volcano": "desert",
      "lagoon": "ocean"
    };
    
    const standardId = biomeIdMap[id];
    if (!standardId) {
      console.warn(`Unknown biome ID: ${id}`);
      return getAsset('biome', 'forest'); // fallback
    }
    
    return getAsset('biome', standardId);
  };


  const getBiomeElements = () => {
    switch (id) {
      case "beach":
        return (
          <>
            {/* Waves */}
            <motion.div
              className="absolute -bottom-2 -left-2 w-16 h-4 bg-blue-200/50 rounded-full"
              animate={{ 
                scaleX: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-1 -right-2 w-12 h-3 bg-blue-300/40 rounded-full"
              animate={{ 
                scaleX: [1, 1.2, 1],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </>
        );
      case "jungle":
        return (
          <>
            {/* Leaves */}
            <motion.div
              className="absolute -top-2 -left-1 w-3 h-3 bg-green-400/60 rounded-full"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -top-1 right-2 w-2 h-2 bg-green-300/70 rounded-full"
              animate={{ 
                rotate: [0, -15, 15, 0],
                y: [0, -2, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            />
          </>
        );
      case "volcano":
        return (
          <>
            {/* Smoke */}
            <motion.div
              className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-4 h-6 bg-gray-400/30 rounded-t-full"
              animate={{ 
                scaleY: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
                y: [0, -3, 0]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Glow */}
            <motion.div
              className="absolute inset-0 bg-orange-400/20 rounded-full blur-sm scale-110"
              animate={{ 
                opacity: [0.1, 0.3, 0.1],
                scale: [1.1, 1.2, 1.1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        );
      case "lagoon":
        return (
          <>
            {/* Sparkles */}
            <motion.div
              className="absolute top-2 left-2 w-1 h-1 bg-cyan-300 rounded-full"
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-2 right-3 w-1 h-1 bg-blue-300 rounded-full"
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
    <motion.button
      className="absolute cursor-pointer group border-0 bg-transparent p-0"
      style={{ 
        left: position.x + "%", 
        top: position.y + "%",
        transform: "translate(-50%, -50%)"
      }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={getBiomeAriaLabel(id, name)}
      data-testid={`biome-${id}`}
    >
      {/* Biome Circle */}
      <motion.div
        className={`relative rounded-full shadow-lg overflow-hidden`}
        style={{ width: '246.4px', height: '246.4px' }}
        animate={{ 
          boxShadow: [
            "0 4px 12px rgba(0,0,0,0.1)",
            "0 6px 20px rgba(0,0,0,0.2)", 
            "0 4px 12px rgba(0,0,0,0.1)"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Biome image background */}
        <div 
          className="absolute inset-0 rounded-full"
          style={getBiomeImage() ? {
            backgroundImage: `url(${getBiomeImage()})`,
            backgroundSize: '110%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'auto',
            WebkitBackfaceVisibility: 'hidden' as any,
            backfaceVisibility: 'hidden',
            WebkitTransform: 'translateZ(0)' as any,
            transform: 'translateZ(0)',
            filter: 'blur(0px)',
          } : {}}
        />
        
        {/* Fallback gradient background for biomes without images */}
        {!getBiomeImage() && (
          <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-full`} />
        )}

        {/* Biome Elements */}
        {getBiomeElements()}

      </motion.div>

    </motion.button>

    {/* Fixed Position Tooltip */}
    {isHovered && (
      <div
        className="fixed bg-black/90 text-white text-sm px-4 py-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none"
        style={{
          left: mousePosition.x + 10,
          top: mousePosition.y - 80,
          zIndex: 99999
        }}
      >
        <div className="font-semibold">{name}</div>
        <div className="text-xs opacity-80">{subject}</div>
        <div className="text-xs opacity-60">{description}</div>
      </div>
    )}
    </>
  );
}