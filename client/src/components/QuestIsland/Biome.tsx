import { motion } from "framer-motion";
import { useState } from "react";

// Import biome illustrations
import jungleBiome from '@assets/generated_images/altos_jungle_biome.png';
import lagoonBiome from '@assets/generated_images/altos_lagoon_biome.png';
import volcanoBiome from '@assets/generated_images/altos_volcano_biome.png';
import beachBiome from '@assets/generated_images/altos_beach_biome.png';
import meadowBiome from '@assets/generated_images/altos_meadow_biome.png';

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
      case "meadow":
        return "🌸";
      default:
        return "🏝️";
    }
  };

  const getBiomeImage = () => {
    switch (id) {
      case "beach":
        return beachBiome;
      case "jungle":
        return jungleBiome;
      case "volcano":
        return volcanoBiome;
      case "lagoon":
        return lagoonBiome;
      case "meadow":
        return meadowBiome;
      default:
        return null;
    }
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
      case "meadow":
        return (
          <>
            {/* Floating petals */}
            <motion.div
              className="absolute top-1 left-3 w-2 h-2 bg-pink-300/60 rounded-full"
              animate={{ 
                y: [0, -5, 0],
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-3 right-2 w-1.5 h-1.5 bg-yellow-300/50 rounded-full"
              animate={{ 
                rotate: [0, 360],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
    <motion.div
      className="absolute cursor-pointer group"
      style={{ 
        left: position.x + "%", 
        top: position.y + "%",
        transform: "translate(-50%, -50%)"
      }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      data-testid={`biome-${id}`}
    >
      {/* Biome Circle */}
      <motion.div
        className={`relative w-48 h-48 rounded-full shadow-lg overflow-hidden`}
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
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {}}
        />
        
        {/* Fallback gradient background for biomes without images */}
        {!getBiomeImage() && (
          <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-full`} />
        )}

        {/* Biome Elements */}
        {getBiomeElements()}

      </motion.div>

    </motion.div>

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