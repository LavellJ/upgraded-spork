import React from 'react';
import { Cloud, Loader } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface PendingSyncIndicatorProps {
  pendingCount?: number;
  className?: string;
}

export function PendingSyncIndicator({ 
  pendingCount = 0, 
  className = "" 
}: PendingSyncIndicatorProps) {
  // Don't render if no pending items
  if (pendingCount === 0) {
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
            <Cloud className="w-4 h-4 text-sky-600" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            {pendingCount > 1 && (
              <span className="absolute -top-2 -right-2 text-xs font-medium text-amber-700 bg-amber-100 rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {pendingCount === 1 ? 'Syncing progress...' : `Syncing ${pendingCount} items...`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}