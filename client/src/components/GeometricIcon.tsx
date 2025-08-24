import { motion } from "framer-motion";

interface GeometricIconProps {
  type: "badge" | "subject";
  variant: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
}

export function GeometricIcon({ type, variant, size = "md", animated = true, className = "" }: GeometricIconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-16 h-16"
  };

  const getBadgeCharacter = (variant: string) => {
    const characters = {
      "first_steps": (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Cute bunny - first steps */}
          <ellipse cx="50" cy="65" rx="22" ry="20" fill="currentColor" className="text-amber-300 animate-pulse-soft" />
          <ellipse cx="50" cy="45" rx="18" ry="16" fill="currentColor" className="text-amber-200" />
          
          {/* Bunny ears */}
          <ellipse cx="38" cy="25" rx="6" ry="16" fill="currentColor" className="text-amber-300 animate-float" />
          <ellipse cx="62" cy="25" rx="6" ry="16" fill="currentColor" className="text-amber-300 animate-float" style={{ animationDelay: "-1s" }} />
          <ellipse cx="38" cy="25" rx="3" ry="10" fill="currentColor" className="text-orange-400" />
          <ellipse cx="62" cy="25" rx="3" ry="10" fill="currentColor" className="text-orange-400" />
          
          {/* Eyes */}
          <circle cx="42" cy="40" r="3" fill="currentColor" className="text-charcoal" />
          <circle cx="58" cy="40" r="3" fill="currentColor" className="text-charcoal" />
          <circle cx="43" cy="39" r="1" fill="currentColor" className="text-white" />
          <circle cx="59" cy="39" r="1" fill="currentColor" className="text-white" />
          
          {/* Nose */}
          <ellipse cx="50" cy="48" rx="2" ry="1.5" fill="currentColor" className="text-orange-400" />
          
          {/* Cheeks */}
          <circle cx="30" cy="50" r="4" fill="currentColor" className="text-orange-300 opacity-60" />
          <circle cx="70" cy="50" r="4" fill="currentColor" className="text-orange-300 opacity-60" />
        </svg>
      ),
      
      "daily_learner": (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Squirrel */}
          <ellipse cx="50" cy="70" rx="18" ry="16" fill="currentColor" className="text-emerald-300 animate-pulse-soft" />
          <ellipse cx="50" cy="50" rx="15" ry="13" fill="currentColor" className="text-emerald-200" />
          
          {/* Squirrel ears */}
          <polygon points="35,35 40,20 45,35" fill="currentColor" className="text-emerald-300 animate-float" />
          <polygon points="55,35 60,20 65,35" fill="currentColor" className="text-emerald-300 animate-float" style={{ animationDelay: "-0.5s" }} />
          
          {/* Eyes */}
          <circle cx="43" cy="45" r="4" fill="currentColor" className="text-charcoal" />
          <circle cx="57" cy="45" r="4" fill="currentColor" className="text-charcoal" />
          <circle cx="44" cy="43" r="1.5" fill="currentColor" className="text-white" />
          <circle cx="58" cy="43" r="1.5" fill="currentColor" className="text-white" />
          
          {/* Nose */}
          <ellipse cx="50" cy="52" rx="1.5" ry="1" fill="currentColor" className="text-teal-500" />
          
          {/* Big fluffy tail */}
          <ellipse cx="75" cy="60" rx="15" ry="25" fill="currentColor" className="text-teal-400 animate-float opacity-80" style={{ animationDelay: "-2s" }} />
          <ellipse cx="72" cy="55" rx="10" ry="18" fill="currentColor" className="text-emerald-300 opacity-90" />
          
          {/* Cheeks */}
          <circle cx="32" cy="50" r="3" fill="currentColor" className="text-teal-300 opacity-60" />
          <circle cx="68" cy="50" r="3" fill="currentColor" className="text-teal-300 opacity-60" />
        </svg>
      ),
      
      "focus_master": (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Owl - focus master */}
          <ellipse cx="50" cy="65" rx="18" ry="20" fill="currentColor" className="text-purple-300 animate-pulse-soft" />
          <circle cx="50" cy="45" r="16" fill="currentColor" className="text-purple-200" />
          
          {/* Owl ears/tufts */}
          <polygon points="30,25 35,15 40,25" fill="currentColor" className="text-purple-300 animate-float" />
          <polygon points="60,25 65,15 70,25" fill="currentColor" className="text-purple-300 animate-float" style={{ animationDelay: "-1s" }} />
          
          {/* Large owl eyes */}
          <circle cx="42" cy="43" r="8" fill="currentColor" className="text-indigo-100" />
          <circle cx="58" cy="43" r="8" fill="currentColor" className="text-indigo-100" />
          <circle cx="42" cy="43" r="5" fill="currentColor" className="text-charcoal" />
          <circle cx="58" cy="43" r="5" fill="currentColor" className="text-charcoal" />
          <circle cx="44" cy="41" r="2" fill="currentColor" className="text-white" />
          <circle cx="60" cy="41" r="2" fill="currentColor" className="text-white" />
          
          {/* Beak */}
          <polygon points="50,50 46,58 54,58" fill="currentColor" className="text-indigo-400" />
          
          {/* Wing detail */}
          <ellipse cx="35" cy="60" rx="6" ry="12" fill="currentColor" className="text-indigo-400 opacity-60" />
          <ellipse cx="65" cy="60" rx="6" ry="12" fill="currentColor" className="text-indigo-400 opacity-60" />
        </svg>
      ),
      
      "knowledge_seeker": (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Koala */}
          <ellipse cx="50" cy="65" rx="20" ry="18" fill="currentColor" className="text-rose-300 animate-pulse-soft" />
          <circle cx="50" cy="48" r="16" fill="currentColor" className="text-rose-200" />
          
          {/* Koala ears */}
          <circle cx="35" cy="30" r="12" fill="currentColor" className="text-rose-300 animate-float" />
          <circle cx="65" cy="30" r="12" fill="currentColor" className="text-rose-300 animate-float" style={{ animationDelay: "-1s" }} />
          <circle cx="35" cy="30" r="6" fill="currentColor" className="text-pink-400" />
          <circle cx="65" cy="30" r="6" fill="currentColor" className="text-pink-400" />
          
          {/* Eyes */}
          <circle cx="43" cy="45" r="3" fill="currentColor" className="text-charcoal" />
          <circle cx="57" cy="45" r="3" fill="currentColor" className="text-charcoal" />
          <circle cx="44" cy="44" r="1" fill="currentColor" className="text-white" />
          <circle cx="58" cy="44" r="1" fill="currentColor" className="text-white" />
          
          {/* Nose */}
          <ellipse cx="50" cy="52" rx="3" ry="2" fill="currentColor" className="text-pink-500" />
          
          {/* Cheeks */}
          <circle cx="30" cy="52" r="4" fill="currentColor" className="text-pink-300 opacity-60" />
          <circle cx="70" cy="52" r="4" fill="currentColor" className="text-pink-300 opacity-60" />
        </svg>
      ),
      
      "topic_champion": (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Kangaroo */}
          <ellipse cx="50" cy="75" rx="16" ry="18" fill="currentColor" className="text-yellow-300 animate-pulse-soft" />
          <ellipse cx="50" cy="50" rx="14" ry="15" fill="currentColor" className="text-yellow-200" />
          
          {/* Kangaroo ears */}
          <ellipse cx="38" cy="20" rx="4" ry="18" fill="currentColor" className="text-yellow-300 animate-float" />
          <ellipse cx="62" cy="20" rx="4" ry="18" fill="currentColor" className="text-yellow-300 animate-float" style={{ animationDelay: "-1s" }} />
          <ellipse cx="38" cy="20" rx="2" ry="12" fill="currentColor" className="text-amber-400" />
          <ellipse cx="62" cy="20" rx="2" ry="12" fill="currentColor" className="text-amber-400" />
          
          {/* Eyes */}
          <circle cx="43" cy="45" r="3" fill="currentColor" className="text-charcoal" />
          <circle cx="57" cy="45" r="3" fill="currentColor" className="text-charcoal" />
          <circle cx="44" cy="44" r="1" fill="currentColor" className="text-white" />
          <circle cx="58" cy="44" r="1" fill="currentColor" className="text-white" />
          
          {/* Snout */}
          <ellipse cx="50" cy="55" rx="5" ry="3" fill="currentColor" className="text-yellow-200" />
          <ellipse cx="50" cy="54" rx="1.5" ry="1" fill="currentColor" className="text-amber-500" />
          
          {/* Tail */}
          <ellipse cx="80" cy="70" rx="6" ry="20" fill="currentColor" className="text-amber-400 animate-float opacity-80" style={{ animationDelay: "-2s" }} />
          
          {/* Champion sparkles */}
          <circle cx="25" cy="30" r="1.5" fill="currentColor" className="text-yellow-400 animate-float opacity-80" />
          <circle cx="75" cy="35" r="1" fill="currentColor" className="text-amber-400 animate-float opacity-80" style={{ animationDelay: "-1s" }} />
        </svg>
      ),
      
      "perfect_week": (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Special bunny with week stars */}
          <ellipse cx="50" cy="65" rx="22" ry="20" fill="currentColor" className="text-cyan-300 animate-pulse-soft" />
          <ellipse cx="50" cy="45" rx="18" ry="16" fill="currentColor" className="text-cyan-200" />
          
          {/* Bunny ears */}
          <ellipse cx="38" cy="25" rx="6" ry="16" fill="currentColor" className="text-cyan-300 animate-float" />
          <ellipse cx="62" cy="25" rx="6" ry="16" fill="currentColor" className="text-cyan-300 animate-float" style={{ animationDelay: "-1s" }} />
          <ellipse cx="38" cy="25" rx="3" ry="10" fill="currentColor" className="text-blue-400" />
          <ellipse cx="62" cy="25" rx="3" ry="10" fill="currentColor" className="text-blue-400" />
          
          {/* Eyes */}
          <circle cx="42" cy="40" r="3" fill="currentColor" className="text-charcoal" />
          <circle cx="58" cy="40" r="3" fill="currentColor" className="text-charcoal" />
          <circle cx="43" cy="39" r="1" fill="currentColor" className="text-white" />
          <circle cx="59" cy="39" r="1" fill="currentColor" className="text-white" />
          
          {/* Nose */}
          <ellipse cx="50" cy="48" rx="2" ry="1.5" fill="currentColor" className="text-blue-400" />
          
          {/* Perfect week stars */}
          <polygon points="20,25 22,30 27,30 23,33 25,38 20,35 15,38 17,33 13,30 18,30" fill="currentColor" className="text-cyan-400 animate-float opacity-80" />
          <polygon points="75,35 77,40 82,40 78,43 80,48 75,45 70,48 72,43 68,40 73,40" fill="currentColor" className="text-blue-400 animate-float opacity-80" style={{ animationDelay: "-1s" }} />
          <polygon points="25,70 27,75 32,75 28,78 30,83 25,80 20,83 22,78 18,75 23,75" fill="currentColor" className="text-cyan-400 animate-float opacity-80" style={{ animationDelay: "-2s" }} />
        </svg>
      ),
      
      "genius_streak": (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Eagle */}
          <ellipse cx="50" cy="70" rx="18" ry="16" fill="currentColor" className="text-violet-300 animate-pulse-soft" />
          <ellipse cx="50" cy="50" rx="15" ry="14" fill="currentColor" className="text-violet-200" />
          
          {/* Eagle head crest */}
          <polygon points="40,30 50,15 60,30" fill="currentColor" className="text-violet-300 animate-float" />
          
          {/* Eyes */}
          <circle cx="43" cy="45" r="4" fill="currentColor" className="text-charcoal" />
          <circle cx="57" cy="45" r="4" fill="currentColor" className="text-charcoal" />
          <circle cx="44" cy="43" r="1.5" fill="currentColor" className="text-white" />
          <circle cx="58" cy="43" r="1.5" fill="currentColor" className="text-white" />
          
          {/* Beak */}
          <polygon points="50,52 46,60 54,60" fill="currentColor" className="text-purple-400" />
          
          {/* Wings */}
          <ellipse cx="25" cy="65" rx="12" ry="20" fill="currentColor" className="text-purple-400 animate-float opacity-70" style={{ animationDelay: "-1s" }} />
          <ellipse cx="75" cy="65" rx="12" ry="20" fill="currentColor" className="text-purple-400 animate-float opacity-70" style={{ animationDelay: "-0.5s" }} />
          
          {/* Genius lightning */}
          <polygon points="15,35 25,35 20,50 30,50 15,70 20,55 15,55" fill="currentColor" className="text-violet-400 animate-float opacity-80" />
          <polygon points="80,40 85,30 90,40 85,35 90,45 85,40" fill="currentColor" className="text-purple-400 animate-float opacity-80" style={{ animationDelay: "-1s" }} />
        </svg>
      ),
      
      "dedication_master": (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Wolf */}
          <ellipse cx="50" cy="70" rx="18" ry="16" fill="currentColor" className="text-indigo-300 animate-pulse-soft" />
          <ellipse cx="50" cy="50" rx="16" ry="15" fill="currentColor" className="text-indigo-200" />
          
          {/* Wolf ears */}
          <polygon points="35,35 40,18 45,35" fill="currentColor" className="text-indigo-300 animate-float" />
          <polygon points="55,35 60,18 65,35" fill="currentColor" className="text-indigo-300 animate-float" style={{ animationDelay: "-0.5s" }} />
          <polygon points="37,32 40,22 43,32" fill="currentColor" className="text-blue-400" />
          <polygon points="57,32 60,22 63,32" fill="currentColor" className="text-blue-400" />
          
          {/* Eyes */}
          <ellipse cx="42" cy="45" rx="3" ry="4" fill="currentColor" className="text-charcoal" />
          <ellipse cx="58" cy="45" rx="3" ry="4" fill="currentColor" className="text-charcoal" />
          <circle cx="43" cy="44" r="1" fill="currentColor" className="text-white" />
          <circle cx="59" cy="44" r="1" fill="currentColor" className="text-white" />
          
          {/* Snout */}
          <ellipse cx="50" cy="58" rx="6" ry="5" fill="currentColor" className="text-indigo-200" />
          <ellipse cx="50" cy="56" rx="2" ry="1.5" fill="currentColor" className="text-blue-500" />
          
          {/* Dedication stars */}
          <circle cx="20" cy="30" r="1.5" fill="currentColor" className="text-blue-400 animate-float opacity-80" />
          <circle cx="80" cy="35" r="1" fill="currentColor" className="text-indigo-400 animate-float opacity-80" style={{ animationDelay: "-1s" }} />
          <circle cx="25" cy="75" r="1" fill="currentColor" className="text-blue-300 animate-float opacity-80" style={{ animationDelay: "-2s" }} />
        </svg>
      )
    };
    return characters[variant as keyof typeof characters] || characters.first_steps;
  };

  const getSubjectGeometry = (variant: string) => {
    const geometries = {
      mathematics: {
        shape: "cube",
        gradient: "from-orange-400 to-red-500",
        shadow: "drop-shadow-md"
      },
      literacy: {
        shape: "wave",
        gradient: "from-blue-400 to-indigo-500", 
        shadow: "drop-shadow-md"
      },
      science: {
        shape: "crystal",
        gradient: "from-green-400 to-emerald-500",
        shadow: "drop-shadow-md"
      }
    };
    return geometries[variant as keyof typeof geometries] || geometries.mathematics;
  };

  const baseSize = sizeClasses[size];

  if (type === "badge") {
    return (
      <motion.div 
        className={`${baseSize} ${className} character-silhouette`}
        {...(animated && {
          animate: { 
            scale: [1, 1.05, 1],
            rotateZ: [0, 2, -2, 0]
          },
          transition: { 
            duration: 4,
            repeat: Infinity,
            repeatType: "loop" as const,
            ease: "easeInOut"
          }
        })}
      >
        {getBadgeCharacter(variant)}
      </motion.div>
    );
  }

  // Subject icons (keep the geometric approach for these)
  const geometry = getSubjectGeometry(variant);
  const shapeProps = {
    className: `${baseSize} bg-gradient-to-br ${geometry.gradient} ${geometry.shadow} ${className}`,
    ...(animated && {
      animate: { 
        rotateY: [0, 360],
        scale: [1, 1.1, 1]
      },
      transition: { 
        duration: 4,
        repeat: Infinity,
        repeatType: "loop" as const,
        ease: "easeInOut"
      }
    })
  };

  switch (geometry.shape) {
    case "cube":
      return (
        <motion.div 
          {...shapeProps}
          className={`${baseSize} bg-gradient-to-br ${geometry.gradient} ${geometry.shadow} ${className} rounded-md transform perspective-1000 rotate-x-12 rotate-y-12`}
          style={{ transformStyle: "preserve-3d" }}
        />
      );
      
    case "wave":
      return (
        <motion.div {...shapeProps}>
          <div className="w-full h-full wave bg-gradient-to-br from-blue-400 to-indigo-500 filter drop-shadow-md"></div>
        </motion.div>
      );
      
    case "crystal":
      return (
        <motion.div {...shapeProps}>
          <div className="w-full h-full crystal bg-gradient-to-br from-green-400 to-emerald-500 filter drop-shadow-md"></div>
        </motion.div>
      );
      
    default:
      return (
        <motion.div 
          {...shapeProps}
          className={`${baseSize} bg-gradient-to-br ${geometry.gradient} ${geometry.shadow} ${className} rounded-lg`}
        />
      );
  }
}