import type { Progress, Topic } from "@shared/schema";

interface ProgressLandscapeProps {
  progress: Progress[];
  topics: Topic[];
}

export function ProgressLandscape({ progress, topics }: ProgressLandscapeProps) {
  const getProgressForTopic = (topicId: string) => {
    return progress.find(p => p.topicId === topicId);
  };

  const getOverallProgress = () => {
    if (progress.length === 0) return 0;
    const totalCompletion = progress.reduce((sum, p) => sum + (p.completionPercentage || 0), 0);
    return Math.round(totalCompletion / progress.length);
  };

  return (
    <div className="floating-ui rounded-3xl p-8" data-testid="progress-landscape">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display text-xl font-semibold text-white" data-testid="text-journey-title">
          Learning Journey
        </h3>
        <div className="text-white/70 text-sm" data-testid="text-overall-progress">
          <span>{getOverallProgress()}%</span> Complete
        </div>
      </div>
      
      {/* Landscape Progress Visualization */}
      <div className="relative h-32 overflow-hidden rounded-2xl bg-gradient-to-r from-deep-purple/20 to-soft-purple/20" data-testid="landscape-visualization">
        <svg viewBox="0 0 800 120" className="absolute inset-0 w-full h-full">
          {/* Completed areas (bright) */}
          <path 
            d="M0,120 L0,80 Q100,60 200,70 T400,65 L400,120 Z" 
            fill="url(#progressCompleted)" 
            className="animate-pulse-soft"
          />
          {/* Current area (medium) */}
          <path 
            d="M400,120 L400,65 Q500,55 600,60 L600,120 Z" 
            fill="url(#progressCurrent)"
          />
          {/* Future areas (dim) */}
          <path 
            d="M600,120 L600,60 Q700,50 800,55 L800,120 Z" 
            fill="url(#progressFuture)" 
            opacity="0.3"
          />
          
          <defs>
            <linearGradient id="progressCompleted" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--success-green)" />
              <stop offset="100%" stopColor="var(--accent-teal)" />
            </linearGradient>
            <linearGradient id="progressCurrent" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--warm-orange)" />
              <stop offset="100%" stopColor="var(--sunset-orange)" />
            </linearGradient>
            <linearGradient id="progressFuture" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--soft-purple)" />
              <stop offset="100%" stopColor="var(--deep-purple)" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Progress marker */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 animate-float"
          style={{ left: `${Math.min(90, Math.max(10, getOverallProgress()))}%` }}
          data-testid="progress-marker"
        >
          <div className="w-6 h-6 bg-warm-orange rounded-full border-2 border-white shadow-lg"></div>
        </div>
      </div>
      
      {/* Topic Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8" data-testid="topic-progress-cards">
        {topics.map((topic) => {
          const topicProgress = getProgressForTopic(topic.id);
          const completionPercentage = topicProgress?.completionPercentage || 0;
          const isUnlocked = topic.isUnlocked === "true";
          
          return (
            <div key={topic.id} className="text-center" data-testid={`card-topic-${topic.id}`}>
              <div className="mb-2">
                {completionPercentage >= 100 ? (
                  <div className="progress-landscape w-full" data-testid={`progress-complete-${topic.id}`}></div>
                ) : completionPercentage > 0 ? (
                  <div className="bg-gradient-to-r from-sunset-orange to-warm-orange h-1 rounded-full" data-testid={`progress-current-${topic.id}`}></div>
                ) : isUnlocked ? (
                  <div className="bg-white/40 h-1 rounded-full" data-testid={`progress-unlocked-${topic.id}`}></div>
                ) : (
                  <div className="bg-white/20 h-1 rounded-full" data-testid={`progress-locked-${topic.id}`}></div>
                )}
              </div>
              <p className={`text-sm font-medium mb-1 ${isUnlocked ? 'text-white/80' : 'text-white/60'}`} data-testid={`text-topic-name-${topic.id}`}>
                {topic.name}
              </p>
              <p className={`text-xs ${
                completionPercentage >= 100 ? 'text-success-green' :
                completionPercentage > 0 ? 'text-warm-orange' :
                isUnlocked ? 'text-white/60' : 'text-white/50'
              }`} data-testid={`text-topic-status-${topic.id}`}>
                {completionPercentage >= 100 ? 'Complete' :
                 completionPercentage > 0 ? 'In Progress' :
                 isUnlocked ? 'Available' : 'Locked'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
