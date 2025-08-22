import { useEffect } from "react";
import { usePomodoro } from "@/hooks/usePomodoro";

interface PomodoroTimerProps {
  topicName?: string;
  onSessionComplete?: (completed: boolean) => void;
  autoStart?: boolean;
}

export function PomodoroTimer({ topicName = "Learning Session", onSessionComplete, autoStart = false }: PomodoroTimerProps) {
  const pomodoro = usePomodoro();

  const handleSessionComplete = (completed: boolean) => {
    if (onSessionComplete) {
      onSessionComplete(completed);
    }
  };

  // Auto-start timer when autoStart prop becomes true
  useEffect(() => {
    if (autoStart && !pomodoro.isRunning && pomodoro.timeLeft > 0) {
      pomodoro.start();
    }
  }, [autoStart, pomodoro.isRunning, pomodoro.timeLeft, pomodoro.start]);

  return (
    <div className="floating-ui rounded-3xl p-8" data-testid="pomodoro-timer">
      <div className="text-center">
        <h3 className="font-display text-xl font-semibold text-white mb-6" data-testid="text-session-title">
          {pomodoro.isBreak ? "Break Time" : "Focus Session"}
        </h3>
        
        {/* Sun/Moon Cycle Timer */}
        <div className="w-32 h-32 mx-auto mb-6 relative" data-testid="timer-display">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            {/* Outer circle */}
            <circle 
              cx="60" 
              cy="60" 
              r="50" 
              fill="none" 
              stroke="rgba(255,255,255,0.2)" 
              strokeWidth="3"
            />
            {/* Progress circle */}
            <circle 
              cx="60" 
              cy="60" 
              r="50" 
              fill="none" 
              stroke="url(#timerGradient)" 
              strokeWidth="3" 
              strokeDasharray="314" 
              strokeDashoffset={314 - (pomodoro.progress * 314 / 100)}
              className="transform -rotate-90 origin-center transition-all duration-1000"
            />
            {/* Icon */}
            {pomodoro.isBreak ? (
              <circle cx="60" cy="60" r="15" fill="currentColor" className="text-accent-teal animate-pulse-soft" />
            ) : (
              <>
                <circle cx="60" cy="60" r="15" fill="currentColor" className="text-warm-orange animate-pulse-soft" />
                <g className="text-warm-orange animate-float">
                  <line x1="60" y1="25" x2="60" y2="35" stroke="currentColor" strokeWidth="2" />
                  <line x1="85" y1="45" x2="78" y2="52" stroke="currentColor" strokeWidth="2" />
                  <line x1="85" y1="75" x2="78" y2="68" stroke="currentColor" strokeWidth="2" />
                  <line x1="60" y1="95" x2="60" y2="85" stroke="currentColor" strokeWidth="2" />
                  <line x1="35" y1="75" x2="42" y2="68" stroke="currentColor" strokeWidth="2" />
                  <line x1="35" y1="45" x2="42" y2="52" stroke="currentColor" strokeWidth="2" />
                </g>
              </>
            )}
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--sunset-orange)" />
                <stop offset="100%" stopColor="var(--warm-orange)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="text-white/80 text-2xl font-display font-semibold mb-2" data-testid="text-timer-display">
          {pomodoro.formatTime()}
        </div>
        <p className="text-white/60 text-sm mb-6" data-testid="text-session-type">
          {pomodoro.isBreak ? "Take a Break" : topicName}
        </p>
        
        <div className="flex justify-center space-x-4">
          <button 
            className="bg-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-colors duration-300"
            onClick={pomodoro.isRunning ? pomodoro.pause : pomodoro.start}
            data-testid="button-toggle-timer"
          >
            <i className={`fas ${pomodoro.isRunning ? 'fa-pause' : 'fa-play'} mr-2`}></i>
            {pomodoro.isRunning ? 'Pause' : 'Start'}
          </button>
          
          <button 
            className="bg-white/10 text-white/70 px-4 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors duration-300"
            onClick={pomodoro.reset}
            data-testid="button-reset-timer"
          >
            <i className="fas fa-refresh mr-2"></i>
            Reset
          </button>
          
          <button 
            className="bg-white/10 text-white/70 px-4 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors duration-300"
            onClick={pomodoro.skip}
            data-testid="button-skip-timer"
          >
            <i className="fas fa-forward mr-2"></i>
            Skip
          </button>
        </div>
        
        {/* Session count */}
        <div className="mt-4 text-white/50 text-xs" data-testid="text-session-count">
          Sessions completed: {pomodoro.sessionCount}
        </div>
      </div>
    </div>
  );
}
