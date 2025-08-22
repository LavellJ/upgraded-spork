import { useState, useEffect, useCallback } from "react";

interface PomodoroState {
  timeLeft: number; // seconds
  isRunning: boolean;
  isBreak: boolean;
  sessionCount: number;
}

export function usePomodoro(focusTime = 25 * 60, breakTime = 5 * 60) {
  const [state, setState] = useState<PomodoroState>({
    timeLeft: focusTime,
    isRunning: false,
    isBreak: false,
    sessionCount: 0,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state.isRunning && state.timeLeft > 0) {
      interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (state.timeLeft === 0) {
      // Timer finished
      setState(prev => ({
        ...prev,
        isRunning: false,
        isBreak: !prev.isBreak,
        timeLeft: prev.isBreak ? focusTime : breakTime,
        sessionCount: prev.isBreak ? prev.sessionCount + 1 : prev.sessionCount,
      }));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning, state.timeLeft, focusTime, breakTime]);

  const start = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: true }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      timeLeft: focusTime,
      isRunning: false,
      isBreak: false,
      sessionCount: 0,
    });
  }, [focusTime]);

  const skip = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      isBreak: !prev.isBreak,
      timeLeft: prev.isBreak ? focusTime : breakTime,
      sessionCount: prev.isBreak ? prev.sessionCount + 1 : prev.sessionCount,
    }));
  }, [focusTime, breakTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    start,
    pause,
    reset,
    skip,
    formatTime: () => formatTime(state.timeLeft),
    progress: state.isBreak 
      ? ((breakTime - state.timeLeft) / breakTime) * 100
      : ((focusTime - state.timeLeft) / focusTime) * 100,
  };
}
