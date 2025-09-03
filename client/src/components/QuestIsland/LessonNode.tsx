import React from "react";
import { motion } from "framer-motion";
import balloonIcon from '@assets/097fe560-b8ac-4192-b450-4f106e9ff693_1756279378478.png';
import lockIcon from '@assets/9252541e-bdfc-4bfa-ab60-c69c63a4297e_1756279935456.png';
import { getPinAriaLabel } from '../../data/meta';
import { getActiveAssignedLessonsForCurrentLearner } from '../../guide/assign';

interface LessonNodeProps {
  id: string;
  title: string;
  biome: string;
  position: { x: number; y: number };
  completed: boolean;
  locked: boolean;
  onClick: () => void;
  isVisible?: boolean;
}

export function LessonNode({ id, title, biome, position, completed, locked, onClick, isVisible = true }: LessonNodeProps) {
  // Check if this lesson is part of an active assignment for the current learner
  const activeAssignedLessons = getActiveAssignedLessonsForCurrentLearner();
  const isAssigned = activeAssignedLessons.includes(id);

  const getNodeColor = () => {
    if (isAssigned) {
      return "from-blue-400 to-indigo-500"; // Blue gradient for assigned lessons
    }
    return "from-yellow-400 to-amber-500";
  };

  const getNodeIcon = () => {
    return "●";
  };

  return (
    <button
      className={`absolute cursor-pointer group border-0 bg-transparent p-0 ${locked ? 'cursor-not-allowed' : ''}`}
      style={{ 
        left: position.x + "%", 
        top: position.y + "%",
        transform: "translate(-50%, -50%)"
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={getPinAriaLabel({ title })}
      tabIndex={isVisible ? 0 : -1}
      aria-hidden={!isVisible}
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
            className="object-contain drop-shadow-lg"
            style={{ width: '52.8px', height: '52.8px' }}
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
        /* Hot Air Balloon with Circle Background for Available Lessons */
        <motion.div
          className="relative"
          animate={{
            y: [0, -8, 0],
            rotate: [0, 2, -2, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {/* Circle Background to indicate current progress - changes color for assignments */}
          <motion.div
            className={`absolute inset-0 w-12 h-12 bg-gradient-to-br ${getNodeColor()} rounded-full shadow-lg -z-10 m-auto`}
            animate={isAssigned ? {
              scale: [1, 1.4, 1],
              boxShadow: [
                "0 4px 12px rgba(59, 130, 246, 0.4)",
                "0 8px 25px rgba(59, 130, 246, 0.8)", 
                "0 4px 12px rgba(59, 130, 246, 0.4)"
              ]
            } : {
              scale: [1, 1.3, 1],
              boxShadow: [
                "0 4px 12px rgba(255, 193, 7, 0.4)",
                "0 8px 25px rgba(255, 193, 7, 0.8)", 
                "0 4px 12px rgba(255, 193, 7, 0.4)"
              ]
            }}
            transition={{ duration: isAssigned ? 1.2 : 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Hot Air Balloon on top */}
          <motion.img 
            src={balloonIcon} 
            alt="Available" 
            className="object-contain drop-shadow-lg relative z-10"
            style={{ width: '52.8px', height: '52.8px' }}
            animate={{
              filter: [
                "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                "drop-shadow(0 6px 12px rgba(255, 193, 7, 0.5))",
                "drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
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
      
      {/* Assignment Badge - shows target icon for assigned lessons */}
      {isAssigned && !completed && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full shadow-lg flex items-center justify-center z-20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: 1, 
            rotate: 0,
            y: [0, -2, 0]
          }}
          transition={{ 
            scale: { duration: 0.3, ease: "backOut" },
            rotate: { duration: 0.5, ease: "backOut" },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <span className="text-white text-xs">🎯</span>
        </motion.div>
      )}
    </button>
  );
}