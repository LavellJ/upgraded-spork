import { motion } from "framer-motion";
import balloonIcon from '@assets/097fe560-b8ac-4192-b450-4f106e9ff693_1756279378478.png';
import lockIcon from '@assets/9252541e-bdfc-4bfa-ab60-c69c63a4297e_1756279935456.png';

interface LessonNodeProps {
  id: string;
  title: string;
  biome: string;
  position: { x: number; y: number };
  completed: boolean;
  locked: boolean;
  onClick: () => void;
}

export function LessonNode({ id, title, biome, position, completed, locked, onClick }: LessonNodeProps) {
  const getNodeColor = () => {
    return "from-yellow-400 to-amber-500";
  };

  const getNodeIcon = () => {
    return "●";
  };

  return (
    <div
      className={`absolute cursor-pointer group ${locked ? 'cursor-not-allowed' : ''}`}
      style={{ 
        left: position.x + "%", 
        top: position.y + "%",
        transform: "translate(-50%, -50%)"
      }}
      onClick={onClick}
      data-testid={`lesson-node-${id}`}
    >
      {completed ? (
        /* Hot Air Balloon Button for Completed Lessons */
        <motion.div
          className="relative"
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <img 
            src={balloonIcon} 
            alt="Completed" 
            className="w-12 h-12 object-contain drop-shadow-lg"
          />
        </motion.div>
      ) : locked ? (
        /* Lock Button for Locked Lessons */
        <motion.div
          className="relative"
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img 
            src={lockIcon} 
            alt="Locked" 
            className="w-12 h-12 object-contain drop-shadow-lg opacity-80"
          />
        </motion.div>
      ) : (
        /* Node Circle for Available Lessons */
        <motion.div
          className={`relative w-12 h-12 bg-gradient-to-br ${getNodeColor()} rounded-full shadow-lg`}
          animate={{
            boxShadow: [
              "0 0 10px rgba(255, 193, 7, 0.5)",
              "0 0 20px rgba(255, 193, 7, 0.8)",
              "0 0 10px rgba(255, 193, 7, 0.5)"
            ],
            scale: [1, 1.05, 1]
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Node Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
            {getNodeIcon()}
          </div>
        </motion.div>
      )}

      {/* Hover Label */}
      <motion.div
        className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30"
        initial={{ y: 5 }}
        whileHover={{ y: 0 }}
      >
        {title}
        {locked && <span className="ml-2 opacity-60">(Locked)</span>}
        
        {/* Arrow pointing up */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-2 border-r-2 border-b-2 border-l-transparent border-r-transparent border-b-black/80"></div>
        </div>
      </motion.div>

      {/* Available Node Glow */}
      {!locked && !completed && (
        <motion.div
          className="absolute inset-0 bg-yellow-400/30 rounded-full scale-150 blur-sm"
          animate={{ 
            opacity: [0.2, 0.5, 0.2],
            scale: [1.4, 1.6, 1.4]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}