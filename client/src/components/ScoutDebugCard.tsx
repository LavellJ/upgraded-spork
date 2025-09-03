import React, { useState, useEffect } from 'react';
import { useScoutQueue } from '../hooks/useScoutQueue';
import { useProfile } from '../profile/context';
import { getScoutStats, resetScoutState, getScoutCooldownInfo } from '../learning/scoutQueue';

interface LogEntry {
  timestamp: string;
  type: 'enqueue' | 'dismiss' | 'auto-dismiss' | 'flush' | 'critical';
  messageId?: string;
  priority?: string;
  text?: string;
}

// Global log storage for debugging
let debugLogs: LogEntry[] = [];

export function addDebugLog(entry: LogEntry) {
  debugLogs.push({
    ...entry,
    timestamp: new Date().toISOString().split('T')[1].split('.')[0] // HH:MM:SS format
  });
  
  // Keep only last 20 entries
  if (debugLogs.length > 20) {
    debugLogs = debugLogs.slice(-20);
  }
}

/**
 * ScoutDebugCard - DEV environment debug panel for Scout queue testing
 * Shows current message, queue state, and recent activity logs
 * Only visible in development environment
 */
export function ScoutDebugCard() {
  // Only show in development
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  const { current, pendingCount, inbox, enqueue, dismiss, flushInfoMessages, pauseTimer, resumeTimer } = useScoutQueue();
  const { profile, updateProfile } = useProfile();
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [scoutStats, setScoutStats] = useState(getScoutStats());
  const [cooldownInfo, setCooldownInfo] = useState(getScoutCooldownInfo());
  
  if (!isDev) return null;

  // Update logs and stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs([...debugLogs]);
      setScoutStats(getScoutStats());
      setCooldownInfo(getScoutCooldownInfo());
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Log queue events
  useEffect(() => {
    if (current) {
      addDebugLog({
        type: 'enqueue',
        messageId: current.id,
        priority: current.priority,
        text: current.text.substring(0, 30) + (current.text.length > 30 ? '...' : ''),
        timestamp: ''
      });
    }
  }, [current?.id]);

  const handleTestMessage = (priority: 'info' | 'actionable' | 'critical') => {
    const messageText = `Test ${priority} message ${Date.now()}`;
    enqueue({
      id: `test-${priority}-${Date.now()}`,
      text: messageText,
      priority,
      ...(priority === 'actionable' ? {
        cta: {
          label: 'Test Action',
          onClick: () => {
            addDebugLog({ type: 'dismiss', messageId: 'test-cta-clicked', timestamp: '' });
            alert('Test CTA clicked!');
          }
        }
      } : {})
    });
  };

  const handleDismiss = () => {
    if (current) {
      addDebugLog({
        type: 'dismiss',
        messageId: current.id,
        timestamp: ''
      });
    }
    dismiss();
  };

  const handleFlush = () => {
    addDebugLog({ type: 'flush', timestamp: '' });
    flushInfoMessages();
  };

  const toggleCalmMode = () => {
    updateProfile({ calmMode: !profile.calmMode });
  };

  if (!isVisible) {
    return (
      <div 
        data-testid="scout-debug-toggle"
        className="fixed bottom-4 right-4 z-50"
      >
        <button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg font-mono"
        >
          🐛 Scout Debug
        </button>
      </div>
    );
  }

  return (
    <div 
      data-testid="scout-debug-card"
      className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-md max-h-96 overflow-hidden"
    >
      <div className="bg-purple-600 text-white px-3 py-2 flex justify-between items-center">
        <span className="font-mono text-sm font-bold">🐛 Scout Debug</span>
        <button
          data-testid="scout-debug-close"
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-300 font-bold text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="p-3 text-xs font-mono space-y-3 overflow-y-auto max-h-80">
        {/* Current State */}
        <div className="border-b border-gray-200 pb-2">
          <h4 className="font-bold text-purple-600 mb-1">Current State</h4>
          <div className="space-y-1">
            <div data-testid="debug-current">
              Current: {current ? (
                <span className="text-green-600">
                  [{current.priority}] {current.text.substring(0, 40)}
                  {current.text.length > 40 ? '...' : ''}
                </span>
              ) : (
                <span className="text-gray-500">None</span>
              )}
            </div>
            <div data-testid="debug-pending">
              Pending: <span className="text-blue-600">{pendingCount}</span>
            </div>
            <div data-testid="debug-inbox">
              Inbox: <span className="text-orange-600">{inbox.length}</span>
            </div>
            <div data-testid="debug-calm-mode">
              Calm Mode: <span className={profile.calmMode ? 'text-green-600' : 'text-gray-500'}>
                {profile.calmMode ? 'ON (4.5s)' : 'OFF (3s)'}
              </span>
            </div>
          </div>
        </div>

        {/* Scout Stats & Cooldown */}
        <div className="border-b border-gray-200 pb-2">
          <h4 className="font-bold text-purple-600 mb-1">Scout Stats</h4>
          <div className="space-y-1">
            <div data-testid="debug-wrong-count">
              Wrong Answers: <span className="text-red-600">{scoutStats.wrongAnswerCount}</span>
            </div>
            <div data-testid="debug-streak">
              Current Streak: <span className="text-green-600">{scoutStats.currentStreak}</span>
            </div>
            <div data-testid="debug-help-count">
              Help Requests: <span className="text-blue-600">{scoutStats.moreHelpCount}</span>
            </div>
            <div data-testid="debug-cooldown" className={cooldownInfo.isInCooldown ? 'text-red-600 font-bold' : 'text-gray-600'}>
              Cooldown: {cooldownInfo.isInCooldown ? 'ACTIVE' : 'None'}
            </div>
            {cooldownInfo.isInCooldown && (
              <div data-testid="debug-cooldown-details" className="text-xs text-red-500">
                Sessions: {cooldownInfo.recentSessionCount}/2 in 10min
                {cooldownInfo.nextCooldownReset && (
                  <div>Resets: {new Date(cooldownInfo.nextCooldownReset).toLocaleTimeString()}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Test Actions */}
        <div className="border-b border-gray-200 pb-2">
          <h4 className="font-bold text-purple-600 mb-2">Test Actions</h4>
          <div className="grid grid-cols-2 gap-1">
            <button
              data-testid="debug-test-info"
              onClick={() => handleTestMessage('info')}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs"
            >
              Info
            </button>
            <button
              data-testid="debug-test-actionable"
              onClick={() => handleTestMessage('actionable')}
              className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs"
            >
              Actionable
            </button>
            <button
              data-testid="debug-test-critical"
              onClick={() => handleTestMessage('critical')}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-xs"
            >
              Critical
            </button>
            <button
              data-testid="debug-dismiss"
              onClick={handleDismiss}
              disabled={!current}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <button
              data-testid="debug-flush"
              onClick={handleFlush}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs"
            >
              Flush Info
            </button>
            <button
              data-testid="debug-calm-toggle"
              onClick={toggleCalmMode}
              className={`px-2 py-1 rounded text-xs ${
                profile.calmMode 
                  ? 'bg-green-100 hover:bg-green-200 text-green-800' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {profile.calmMode ? 'Calm ON' : 'Calm OFF'}
            </button>
          </div>
          <div className="mt-1">
            <button
              data-testid="debug-pause-timer"
              onClick={pauseTimer}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-2 py-1 rounded text-xs mr-1"
            >
              Pause Timer
            </button>
            <button
              data-testid="debug-resume-timer"
              onClick={resumeTimer}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-2 py-1 rounded text-xs"
            >
              Resume Timer
            </button>
          </div>
        </div>

        {/* Recent Logs */}
        <div>
          <h4 className="font-bold text-purple-600 mb-2">Recent Activity</h4>
          <div 
            data-testid="debug-logs"
            className="space-y-1 max-h-32 overflow-y-auto"
          >
            {logs.slice(-5).reverse().map((log, index) => (
              <div key={index} className="text-xs">
                <span className="text-gray-500">{log.timestamp}</span>{' '}
                <span className={`font-semibold ${
                  log.type === 'enqueue' ? 'text-green-600' :
                  log.type === 'dismiss' ? 'text-red-600' :
                  log.type === 'critical' ? 'text-red-800' :
                  log.type === 'flush' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {log.type}
                </span>
                {log.messageId && (
                  <>
                    {' '}
                    <span className="text-blue-600">[{log.priority}]</span>
                    {' '}
                    <span className="text-gray-700">{log.text}</span>
                  </>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500 italic">No activity yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}