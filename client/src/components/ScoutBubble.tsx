import React from 'react';
import { motion } from 'framer-motion';

interface ScoutBubbleProps {
  message: string;
  onClick: () => void;
  calm?: boolean;
  position?: { x: number; y: number };
  visible?: boolean;
}

export function ScoutBubble({ 
  message, 
  onClick, 
  calm = false, 
  position = { x: 20, y: 20 }, 
  visible = true 
}: ScoutBubbleProps) {
  if (!visible) return null;

  const bubbleVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: calm ? { duration: 0.2 } : {
        type: "spring",
        damping: 15,
        stiffness: 300
      }
    },
    hover: calm ? {} : { scale: 1.05 },
    tap: calm ? {} : { scale: 0.95 }
  };

  const avatarBounce = calm ? {} : {
    y: [0, -2, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <motion.div
      className="fixed z-50 pointer-events-none"
      style={{ left: position.x, top: position.y }}
      initial="hidden"
      animate="visible"
      variants={bubbleVariants}
    >
      {/* Scout Avatar */}
      <motion.div
        className="relative mb-2 pointer-events-auto cursor-pointer"
        onClick={onClick}
        whileHover="hover"
        whileTap="tap"
        variants={bubbleVariants}
        animate={avatarBounce}
        data-testid="scout-avatar"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg flex items-center justify-center border-2 border-white">
          <span className="text-lg">🧭</span>
        </div>
        
        {/* Active indicator */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
          <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
        </div>
      </motion.div>

      {/* Message Bubble */}
      <motion.div
        className="relative max-w-xs pointer-events-auto cursor-pointer"
        onClick={onClick}
        whileHover="hover"
        whileTap="tap"
        variants={bubbleVariants}
        data-testid="scout-message-bubble"
      >
        <div className="bg-white/95 backdrop-blur-sm text-gray-800 rounded-2xl shadow-lg p-3 border border-white/20">
          <p className="text-sm font-medium leading-relaxed">{message}</p>
          
          {/* Speech bubble tail */}
          <div className="absolute -top-2 left-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white/95"></div>
        </div>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 to-orange-200/20 rounded-2xl blur-xl -z-10"></div>
      </motion.div>
      
      {/* Click hint */}
      <div className="mt-1 text-center">
        <span className="text-xs text-gray-600/80 bg-white/60 px-2 py-1 rounded-full">
          Click for more
        </span>
      </div>
    </motion.div>
  );
}