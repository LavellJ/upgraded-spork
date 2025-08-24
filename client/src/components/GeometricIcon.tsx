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

  const getBadgeGeometry = (variant: string) => {
    const geometries = {
      "first_steps": {
        shape: "triangle",
        gradient: "from-amber-300 to-orange-400",
        shadow: "drop-shadow-lg"
      },
      "daily_learner": {
        shape: "diamond",
        gradient: "from-emerald-300 to-teal-400", 
        shadow: "drop-shadow-lg"
      },
      "focus_master": {
        shape: "hexagon",
        gradient: "from-purple-300 to-indigo-400",
        shadow: "drop-shadow-lg"
      },
      "knowledge_seeker": {
        shape: "circle",
        gradient: "from-rose-300 to-pink-400",
        shadow: "drop-shadow-lg"
      },
      "topic_champion": {
        shape: "star",
        gradient: "from-yellow-300 to-amber-400",
        shadow: "drop-shadow-lg"
      },
      "perfect_week": {
        shape: "pentagon",
        gradient: "from-cyan-300 to-blue-400",
        shadow: "drop-shadow-lg"
      },
      "genius_streak": {
        shape: "arrow",
        gradient: "from-violet-300 to-purple-400",
        shadow: "drop-shadow-lg"
      },
      "dedication_master": {
        shape: "octagon",
        gradient: "from-indigo-300 to-blue-400",
        shadow: "drop-shadow-lg"
      }
    };
    return geometries[variant as keyof typeof geometries] || geometries.first_steps;
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

  const geometry = type === "badge" ? getBadgeGeometry(variant) : getSubjectGeometry(variant);
  const baseSize = sizeClasses[size];

  const renderShape = () => {
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
      case "triangle":
        return (
          <motion.div {...shapeProps}>
            <div className="w-full h-full relative">
              <div className="absolute inset-0 triangle-up bg-gradient-to-br from-amber-300 to-orange-400 filter drop-shadow-lg"></div>
            </div>
          </motion.div>
        );
        
      case "diamond":
        return (
          <motion.div 
            {...shapeProps} 
            style={{ transform: "rotate(45deg)" }}
            className={`${baseSize} bg-gradient-to-br ${geometry.gradient} ${geometry.shadow} ${className} rounded-lg`}
          />
        );
        
      case "hexagon":
        return (
          <motion.div {...shapeProps}>
            <div className="w-full h-full hexagon bg-gradient-to-br from-purple-300 to-indigo-400 filter drop-shadow-lg"></div>
          </motion.div>
        );
        
      case "circle":
        return (
          <motion.div 
            {...shapeProps}
            className={`${baseSize} bg-gradient-to-br ${geometry.gradient} ${geometry.shadow} ${className} rounded-full`}
          />
        );
        
      case "star":
        return (
          <motion.div {...shapeProps}>
            <div className="w-full h-full star bg-gradient-to-br from-yellow-300 to-amber-400 filter drop-shadow-lg"></div>
          </motion.div>
        );
        
      case "pentagon":
        return (
          <motion.div {...shapeProps}>
            <div className="w-full h-full pentagon bg-gradient-to-br from-cyan-300 to-blue-400 filter drop-shadow-lg"></div>
          </motion.div>
        );
        
      case "arrow":
        return (
          <motion.div {...shapeProps}>
            <div className="w-full h-full arrow-up bg-gradient-to-br from-violet-300 to-purple-400 filter drop-shadow-lg"></div>
          </motion.div>
        );
        
      case "octagon":
        return (
          <motion.div {...shapeProps}>
            <div className="w-full h-full octagon bg-gradient-to-br from-indigo-300 to-blue-400 filter drop-shadow-lg"></div>
          </motion.div>
        );
        
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
  };

  return renderShape();
}