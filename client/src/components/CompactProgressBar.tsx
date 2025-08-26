import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { Progress, Topic } from "@shared/schema";

interface CompactProgressBarProps {
  studentId: string;
}

export function CompactProgressBar({ studentId }: CompactProgressBarProps) {
  // Fetch progress data
  const { data: progress = [] } = useQuery<Progress[]>({
    queryKey: ['/api/progress', studentId],
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ['/api/topics'],
  });

  // Calculate overall progress
  const getOverallProgress = () => {
    if (progress.length === 0) return 0;
    const totalCompletion = progress.reduce((sum, p) => sum + (p.completionPercentage || 0), 0);
    return Math.round(totalCompletion / progress.length);
  };

  // Get current learning path (like in ProgressLandscape)
  const getCurrentPath = () => {
    const overallProgress = getOverallProgress();
    if (overallProgress >= 80) return { 
      name: 'Eagle Heights', 
      icon: '🦅',
      color: 'from-purple-400 to-blue-500'
    };
    if (overallProgress >= 60) return { 
      name: 'Owl Valley', 
      icon: '🦉',
      color: 'from-cyan-400 to-blue-400'
    };
    if (overallProgress >= 40) return { 
      name: 'Squirrel Forest', 
      icon: '🐿️',
      color: 'from-green-400 to-emerald-500'
    };
    if (overallProgress >= 20) return { 
      name: 'Fox Meadows', 
      icon: '🦊',
      color: 'from-yellow-400 to-green-400'
    };
    return { 
      name: 'Bunny Garden', 
      icon: '🐰',
      color: 'from-orange-400 to-yellow-400'
    };
  };

  // Get completed and current topic counts
  const getProgressStats = () => {
    const completedTopics = topics.filter(topic => {
      const prog = progress.find(p => p.topicId === topic.id);
      return prog && (prog.completionPercentage || 0) >= 85;
    }).length;

    const inProgressTopics = topics.filter(topic => {
      const prog = progress.find(p => p.topicId === topic.id);
      return prog && (prog.completionPercentage || 0) > 0 && (prog.completionPercentage || 0) < 85;
    }).length;

    return { completedTopics, inProgressTopics, totalTopics: topics.length };
  };

  const currentPath = getCurrentPath();
  const stats = getProgressStats();
  const overallProgress = getOverallProgress();

  return (
    <motion.div
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      data-testid="compact-progress-bar"
    >
      <div className="floating-ui rounded-2xl px-6 py-3">
        <div className="flex items-center space-x-6">
          {/* Current Path Info */}
          <div className="flex items-center space-x-3">
            <div className="text-lg">{currentPath.icon}</div>
            <div>
              <div className="text-white font-medium text-sm">{currentPath.name}</div>
              <div className="text-white/60 text-xs">{overallProgress}% explored</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-4">
            <div className="w-32 bg-white/20 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${currentPath.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, overallProgress)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="text-white/80 text-sm font-medium">
              {overallProgress}%
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-green-400">🏆</span>
              <span className="text-white/70">{stats.completedTopics}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-orange-400">🎯</span>
              <span className="text-white/70">{stats.inProgressTopics}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-purple-400">📍</span>
              <span className="text-white/70">{stats.totalTopics}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}