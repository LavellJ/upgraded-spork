import { motion } from "framer-motion";

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
    <motion.div
      className="absolute cursor-pointer group"
      style={{ 
        left: position.x + "%", 
        top: position.y + "%",
        transform: "translate(-50%, -50%)"
      }}
      onClick={onClick}
      data-testid={`biome-${id}`}
    >
      {/* Biome Circle */}
      <motion.div
        className={`relative w-20 h-20 bg-gradient-to-br ${color} rounded-full shadow-lg`}
        animate={{ 
          boxShadow: [
            "0 4px 12px rgba(0,0,0,0.1)",
            "0 6px 20px rgba(0,0,0,0.2)", 
            "0 4px 12px rgba(0,0,0,0.1)"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Biome Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {getBiomeIcon()}
        </div>

        {/* Biome Elements */}
        {getBiomeElements()}

        {/* Hover Label */}
        <motion.div
          className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50"
          initial={{ y: 10 }}
          whileHover={{ y: 0 }}
        >
          <div className="font-semibold">{name}</div>
          <div className="text-xs opacity-80">{subject}</div>
          <div className="text-xs opacity-60">{description}</div>
          
          {/* Arrow pointing up */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-black/80"></div>
          </div>
        </motion.div>
      </motion.div>

      {/* Ambient Glow */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${color} rounded-full opacity-20 scale-125 blur-md`}
        animate={{ 
          opacity: [0.1, 0.3, 0.1],
          scale: [1.2, 1.3, 1.2]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}