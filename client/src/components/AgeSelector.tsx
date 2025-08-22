import { useState } from "react";

export type AgeGroup = "pre-primary" | "primary" | "upper-primary";

interface AgeSelectorProps {
  onAgeGroupSelect: (ageGroup: AgeGroup) => void;
  selectedAgeGroup?: AgeGroup;
}

export function AgeSelector({ onAgeGroupSelect, selectedAgeGroup }: AgeSelectorProps) {
  const [hoveredCard, setHoveredCard] = useState<AgeGroup | null>(null);

  const ageGroups = [
    {
      id: "pre-primary" as AgeGroup,
      title: "Little Learners",
      ageRange: "Ages 3-5",
      description: "Gentle introduction to numbers and letters through play",
      progressLabel: "Foundational Skills",
      character: (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Cute bunny for pre-primary */}
          <ellipse cx="50" cy="65" rx="22" ry="20" fill="currentColor" className="text-white animate-pulse-soft" />
          <ellipse cx="50" cy="45" rx="18" ry="16" fill="currentColor" className="text-white" />
          
          {/* Bunny ears */}
          <ellipse cx="38" cy="25" rx="6" ry="16" fill="currentColor" className="text-white animate-float" />
          <ellipse cx="62" cy="25" rx="6" ry="16" fill="currentColor" className="text-white animate-float" style={{ animationDelay: "-1s" }} />
          <ellipse cx="38" cy="25" rx="3" ry="10" fill="currentColor" className="text-warm-orange" />
          <ellipse cx="62" cy="25" rx="3" ry="10" fill="currentColor" className="text-warm-orange" />
          
          {/* Eyes */}
          <circle cx="42" cy="40" r="3" fill="currentColor" className="text-charcoal" />
          <circle cx="58" cy="40" r="3" fill="currentColor" className="text-charcoal" />
          <circle cx="43" cy="39" r="1" fill="currentColor" className="text-white" />
          <circle cx="59" cy="39" r="1" fill="currentColor" className="text-white" />
          
          {/* Nose */}
          <ellipse cx="50" cy="48" rx="2" ry="1.5" fill="currentColor" className="text-warm-orange" />
          
          {/* Cheeks */}
          <circle cx="30" cy="50" r="4" fill="currentColor" className="text-warm-orange opacity-60" />
          <circle cx="70" cy="50" r="4" fill="currentColor" className="text-warm-orange opacity-60" />
        </svg>
      ),
    },
    {
      id: "primary" as AgeGroup,
      title: "Young Explorers",
      ageRange: "Ages 6-8",
      description: "Core mathematics and reading skills with guided discovery",
      progressLabel: "Core Curriculum",
      character: (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Fox-like character for primary */}
          <ellipse cx="50" cy="70" rx="20" ry="15" fill="currentColor" className="text-white animate-pulse-soft" />
          <ellipse cx="50" cy="50" rx="16" ry="14" fill="currentColor" className="text-white" />
          
          {/* Fox ears */}
          <polygon points="30,35 35,20 45,35" fill="currentColor" className="text-white animate-float" />
          <polygon points="55,35 65,20 70,35" fill="currentColor" className="text-white animate-float" style={{ animationDelay: "-0.5s" }} />
          <polygon points="32,32 36,22 42,32" fill="currentColor" className="text-sunset-orange" />
          <polygon points="58,32 64,22 68,32" fill="currentColor" className="text-sunset-orange" />
          
          {/* Eyes */}
          <ellipse cx="42" cy="45" rx="4" ry="5" fill="currentColor" className="text-charcoal" />
          <ellipse cx="58" cy="45" rx="4" ry="5" fill="currentColor" className="text-charcoal" />
          <circle cx="43" cy="43" r="1.5" fill="currentColor" className="text-white" />
          <circle cx="59" cy="43" r="1.5" fill="currentColor" className="text-white" />
          
          {/* Snout */}
          <ellipse cx="50" cy="55" rx="6" ry="4" fill="currentColor" className="text-white" />
          <ellipse cx="50" cy="53" rx="2" ry="1.5" fill="currentColor" className="text-charcoal" />
          
          {/* Tail */}
          <ellipse cx="75" cy="65" rx="8" ry="15" fill="currentColor" className="text-sunset-orange animate-float opacity-80" style={{ animationDelay: "-2s" }} />
        </svg>
      ),
    },
    {
      id: "upper-primary" as AgeGroup,
      title: "Advanced Minds",
      ageRange: "Ages 9-12",
      description: "Complex problem solving and critical thinking development",
      progressLabel: "Advanced Topics",
      character: (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Owl for upper primary - wise and approachable */}
          <ellipse cx="50" cy="65" rx="18" ry="20" fill="currentColor" className="text-white animate-pulse-soft" />
          <circle cx="50" cy="45" r="16" fill="currentColor" className="text-white" />
          
          {/* Owl ears/tufts */}
          <polygon points="30,25 35,15 40,25" fill="currentColor" className="text-white animate-float" />
          <polygon points="60,25 65,15 70,25" fill="currentColor" className="text-white animate-float" style={{ animationDelay: "-1s" }} />
          
          {/* Large owl eyes */}
          <circle cx="42" cy="43" r="8" fill="currentColor" className="text-soft-white" />
          <circle cx="58" cy="43" r="8" fill="currentColor" className="text-soft-white" />
          <circle cx="42" cy="43" r="5" fill="currentColor" className="text-charcoal" />
          <circle cx="58" cy="43" r="5" fill="currentColor" className="text-charcoal" />
          <circle cx="44" cy="41" r="2" fill="currentColor" className="text-white" />
          <circle cx="60" cy="41" r="2" fill="currentColor" className="text-white" />
          
          {/* Beak */}
          <polygon points="50,50 46,58 54,58" fill="currentColor" className="text-warm-orange" />
          
          {/* Wing detail */}
          <ellipse cx="35" cy="60" rx="6" ry="12" fill="currentColor" className="text-accent-teal opacity-60" />
          <ellipse cx="65" cy="60" rx="6" ry="12" fill="currentColor" className="text-accent-teal opacity-60" />
          
          {/* Floating knowledge particles */}
          <circle cx="25" cy="30" r="1.5" fill="currentColor" className="text-accent-teal animate-float opacity-80" />
          <circle cx="75" cy="35" r="1" fill="currentColor" className="text-success-green animate-float opacity-80" style={{ animationDelay: "-1s" }} />
          <circle cx="20" cy="60" r="1" fill="currentColor" className="text-warm-orange animate-float opacity-80" style={{ animationDelay: "-2s" }} />
          <circle cx="80" cy="70" r="1.5" fill="currentColor" className="text-soft-purple animate-float opacity-80" style={{ animationDelay: "-0.5s" }} />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8 mb-12" data-testid="age-selector">
      {ageGroups.map((group) => (
        <div
          key={group.id}
          className={`floating-ui rounded-3xl p-8 cursor-pointer hover:scale-105 transition-all duration-500 group ${
            selectedAgeGroup === group.id ? 'ring-2 ring-sunset-orange' : ''
          }`}
          data-testid={`card-age-group-${group.id}`}
          onClick={() => onAgeGroupSelect(group.id)}
          onMouseEnter={() => setHoveredCard(group.id)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto character-silhouette">
              {group.character}
            </div>
          </div>
          <h3 className="font-display text-2xl font-semibold text-white mb-3" data-testid={`text-title-${group.id}`}>
            {group.title}
          </h3>
          <p className="text-white/70 mb-4" data-testid={`text-age-range-${group.id}`}>
            {group.ageRange}
          </p>
          <p className="text-white/60 text-sm" data-testid={`text-description-${group.id}`}>
            {group.description}
          </p>
          
          {/* Progress Preview */}
          <div className="mt-6">
            <div className="progress-landscape w-full" data-testid={`progress-preview-${group.id}`}></div>
            <p className="text-white/50 text-xs mt-2" data-testid={`text-progress-label-${group.id}`}>
              {group.progressLabel}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
