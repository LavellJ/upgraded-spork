import React from 'react';
import { cn } from '../../lib/utils';

interface GuideShellProps {
  children: React.ReactNode;
  className?: string;
}

export function GuideShell({ children, className }: GuideShellProps) {
  return (
    <div className={cn(
      "flex flex-col min-h-screen bg-bg-page",
      className
    )}>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-bg-card border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          {/* Header content will be rendered here by PageHeader */}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}