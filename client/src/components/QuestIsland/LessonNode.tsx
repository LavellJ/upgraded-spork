import { motion } from "framer-motion";

interface LessonNodeProps {
  id: string;
  title: string;
  biome: string;
  position: { x: number; y: number };
  completed: boolean;
  locked: boolean;
  inProgress?: boolean;
  progress?: number; // 0-100 percentage
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedMinutes?: number;
  prerequisite?: string;
  onClick: () => void;
}

export function LessonNode({ 
  id, title, biome, position, completed, locked, inProgress = false, 
  progress = 0, difficulty = 'medium', estimatedMinutes = 5, prerequisite, onClick 
}: LessonNodeProps) {
  
  const getNodeColor = () => {
    if (completed) return "from-green-400 to-emerald-500";
    if (inProgress) return "from-blue-400 to-cyan-500";
    if (locked) return "from-gray-300 to-gray-400";
    return "from-yellow-400 to-amber-500";
  };

  const getNodeIcon = () => {
    if (completed) return "✓";
    if (inProgress) return "⟳";
    if (locked) return "🔒";
    return "▶";
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy': return 'text-green-200';
      case 'hard': return 'text-red-200';
      default: return 'text-yellow-200';
    }
  };

  const getBiomeEmoji = () => {
    switch (biome) {
      case 'beach': return '🏖️';
      case 'jungle': return '🌿';
      case 'volcano': return '🌋';
      case 'lagoon': return '🌊';
      default: return '🏝️';
    }
  };

  return (
    <motion.div
      className={`absolute cursor-pointer group ${locked ? 'cursor-not-allowed' : ''}`}
      style={{ 
        left: position.x + "%", 
        top: position.y + "%",
        transform: "translate(-50%, -50%)"
      }}
      onClick={onClick}
      whileHover={!locked ? { scale: 1.1 } : {}}
      whileTap={!locked ? { scale: 0.9 } : {}}
      data-testid={`lesson-node-${id}`}
    >
      {/* Node Circle */}
      <motion.div
        className={`relative w-14 h-14 bg-gradient-to-br ${getNodeColor()} rounded-full shadow-lg border-3 border-white/60`}
        animate={
          completed ? {
            boxShadow: [
              "0 0 15px rgba(34, 197, 94, 0.4)",
              "0 0 25px rgba(34, 197, 94, 0.6)",
              "0 0 15px rgba(34, 197, 94, 0.4)"
            ]
          } :
          inProgress ? {
            boxShadow: [
              "0 0 12px rgba(59, 130, 246, 0.5)",
              "0 0 20px rgba(59, 130, 246, 0.7)",
              "0 0 12px rgba(59, 130, 246, 0.5)"
            ],
            scale: [1, 1.03, 1]
          } :
          !locked ? {
            boxShadow: [
              "0 0 10px rgba(255, 193, 7, 0.5)",
              "0 0 20px rgba(255, 193, 7, 0.8)",
              "0 0 10px rgba(255, 193, 7, 0.5)"
            ],
            scale: [1, 1.05, 1]
          } : {}
        }
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Progress Ring for In-Progress Lessons */}
        {inProgress && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              background: `conic-gradient(from 0deg, rgba(59, 130, 246, 0.8) ${progress * 3.6}deg, rgba(255, 255, 255, 0.2) ${progress * 3.6}deg)`
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Node Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl z-10">
          <motion.div
            animate={inProgress ? { rotate: 360 } : {}}
            transition={inProgress ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
          >
            {getNodeIcon()}
          </motion.div>
        </div>

        {/* Completion Sparkle */}
        {completed && (
          <motion.div
            className="absolute -inset-2"
            animate={{
              rotate: [0, 360],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <div className="absolute top-0 left-1/2 w-1 h-1 bg-yellow-300 rounded-full transform -translate-x-1/2"></div>
            <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-yellow-300 rounded-full transform -translate-x-1/2"></div>
            <div className="absolute left-0 top-1/2 w-1 h-1 bg-yellow-300 rounded-full transform -translate-y-1/2"></div>
            <div className="absolute right-0 top-1/2 w-1 h-1 bg-yellow-300 rounded-full transform -translate-y-1/2"></div>
          </motion.div>
        )}

        {/* Enhanced Hover Tooltip */}
        <motion.div
          className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm text-gray-800 text-xs px-3 py-2 rounded-xl shadow-xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 min-w-max"
          initial={{ y: 10, scale: 0.9 }}
          whileHover={{ y: 0, scale: 1 }}
        >
          {/* Lesson Title */}
          <div className="font-semibold text-sm flex items-center gap-1">
            <span className="text-base">{getBiomeEmoji()}</span>
            {title}
          </div>
          
          {/* Status and Progress */}
          <div className="flex items-center gap-2 mt-1">
            {completed && <span className="text-green-600 text-xs">✓ Completed</span>}
            {inProgress && (
              <div className="flex items-center gap-1">
                <span className="text-blue-600 text-xs">In Progress</span>
                <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{progress}%</span>
              </div>
            )}
            {locked && <span className="text-gray-500 text-xs">🔒 Locked</span>}
            {!locked && !completed && !inProgress && <span className="text-amber-600 text-xs">Ready to start!</span>}
          </div>

          {/* Lesson Details */}
          {!locked && (
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
              <span className={`${getDifficultyColor()} font-medium`}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </span>
              <span>~{estimatedMinutes} min</span>
            </div>
          )}

          {/* Prerequisite Info */}
          {locked && prerequisite && (
            <div className="text-xs text-gray-500 mt-1">
              Complete "{prerequisite}" first
            </div>
          )}
          
          {/* Arrow pointing up */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/95"></div>
          </div>
        </motion.div>
      </motion.div>

      {/* Available Node Glow */}
      {!locked && !completed && !inProgress && (
        <motion.div
          className="absolute inset-0 bg-yellow-400/40 rounded-full scale-150 blur-sm"
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1.4, 1.7, 1.4]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* In-Progress Node Glow */}
      {inProgress && (
        <motion.div
          className="absolute inset-0 bg-blue-400/40 rounded-full scale-150 blur-sm"
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1.4, 1.6, 1.4]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Unlock Animation */}
      {!locked && !completed && !inProgress && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [0, 0.7, 0] }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeOut",
            delay: Math.random() * 2 // Random delay for each node
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-yellow-400/60" />
        </motion.div>
      )}
    </motion.div>
  );
}