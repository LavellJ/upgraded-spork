import React from 'react';
import { Cloud, Loader } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { useSyncStatus } from '../sync/engine';

interface PendingSyncIndicatorProps {
  pendingCount?: number; // Optional override, uses sync status by default
  className?: string;
}

export function PendingSyncIndicator({ 
  pendingCount, 
  className = "" 
}: PendingSyncIndicatorProps) {
  const syncStatus = useSyncStatus();
  
  // Use actual pending count from sync status if not overridden
  const actualPendingCount = pendingCount ?? syncStatus.pending;
  
  // Don't render if no pending items
  if (actualPendingCount === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`relative inline-flex items-center ${className}`}
            data-testid="pending-sync-indicator"
          >
            {syncStatus.isSyncing ? (
              <Loader className="w-4 h-4 text-sky-600 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4 text-sky-600" />
            )}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            {actualPendingCount > 1 && (
              <span className="absolute -top-2 -right-2 text-xs font-medium text-amber-700 bg-amber-100 rounded-full w-5 h-5 flex items-center justify-center">
                {actualPendingCount > 9 ? '9+' : actualPendingCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {syncStatus.isSyncing 
              ? (actualPendingCount === 1 ? 'Syncing progress...' : `Syncing ${actualPendingCount} items...`)
              : (actualPendingCount === 1 ? '1 item pending sync' : `${actualPendingCount} items pending sync`)
            }
            {syncStatus.lastError && (
              <span className="block text-red-400 mt-1">Last sync failed</span>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}