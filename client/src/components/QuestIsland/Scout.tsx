import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

interface ScoutProps {
  position: { x: number; y: number };
  target?: string | null;
  onReachTarget?: () => void;
}

export function Scout({ position, target, onReachTarget }: ScoutProps) {
  const controls = useAnimation();

  useEffect(() => {
    if (target) {
      // Scout moves to target and points
      controls.start({
        x: position.x + "%",
        y: position.y + "%",
        transition: { duration: 2, ease: "easeInOut" }
      }).then(() => {
        onReachTarget?.();
      });
    }
  }, [target, position, controls, onReachTarget]);

  return (
    <motion.div
      className="absolute z-20"
      style={{ 
        left: position.x + "%", 
        top: position.y + "%",
        transform: "translate(-50%, -50%)"
      }}
      animate={controls}
      data-testid="scout-character"
    >
      {/* Scout Character */}
      <motion.div
        className="relative w-12 h-12"
        animate={{ 
          y: [0, -2, 0],
          rotate: [0, 2, -2, 0]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        {/* Scout Body */}
        <div className="w-8 h-10 bg-gradient-to-b from-blue-400 to-blue-500 rounded-full mx-auto shadow-lg">
          {/* Scout Face */}
          <div className="w-6 h-6 bg-gradient-to-b from-amber-100 to-amber-200 rounded-full mx-auto mt-1 relative">
            {/* Eyes */}
            <div className="absolute top-2 left-1 w-1 h-1 bg-gray-800 rounded-full"></div>
            <div className="absolute top-2 right-1 w-1 h-1 bg-gray-800 rounded-full"></div>
            {/* Smile */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-2 h-1 border-b-2 border-gray-700 rounded-full"></div>
          </div>
          
          {/* Scout Hat */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-gradient-to-b from-green-500 to-green-600 rounded-t-full"></div>
          
          {/* Scout Backpack */}
          <div className="absolute top-3 -right-1 w-3 h-4 bg-gradient-to-b from-brown-400 to-brown-500 rounded-md"></div>
        </div>

        {/* Pointing Animation when target is selected */}
        {target && (
          <motion.div
            className="absolute -top-2 -right-2 text-yellow-400"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 2, repeat: 3 }}
          >
            <i className="fas fa-hand-point-right text-lg"></i>
          </motion.div>
        )}

        {/* Scout Speech Bubble (optional) */}
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-lg shadow-md whitespace-nowrap"
          initial={{ opacity: 0, scale: 0.8, y: 5 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0.8, 1, 1, 0.8],
            y: [5, 0, 0, 5]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            repeatDelay: 6,
            ease: "easeInOut" 
          }}
        >
          Let's explore!
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-2 border-r-2 border-t-4 border-l-transparent border-r-transparent border-t-white/90"></div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}