import React from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '../profile/context';
import { formatDue } from '../guide/assign';

export type AssignmentState = 'assigned' | 'due_soon' | 'overdue' | 'done';

interface AssignmentBadgeProps {
  state: AssignmentState;
  dueAt?: number;
  className?: string;
}

export function AssignmentBadge({ state, dueAt, className = '' }: AssignmentBadgeProps) {
  const { profile } = useProfile();
  const isCalm = profile.calmMode;

  const getBadgeConfig = () => {
    switch (state) {
      case 'assigned':
        return {
          bg: 'bg-blue-500',
          text: 'text-white',
          label: 'Assigned',
          icon: '📋',
          ariaLabel: `Assigned${dueAt ? ` • Due ${formatDue(dueAt)}` : ''}`
        };
      case 'due_soon':
        return {
          bg: 'bg-amber-500',
          text: 'text-white',
          label: 'Due soon',
          icon: '⏰',
          ariaLabel: `Due soon${dueAt ? ` • Due ${formatDue(dueAt)}` : ''}`
        };
      case 'overdue':
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          label: 'Overdue',
          icon: '⚠️',
          ariaLabel: `Overdue${dueAt ? ` • Due ${formatDue(dueAt)}` : ''}`
        };
      case 'done':
        return {
          bg: 'bg-green-500',
          text: 'text-white',
          label: 'Complete',
          icon: '✓',
          ariaLabel: 'Assignment complete'
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-white',
          label: 'Unknown',
          icon: '?',
          ariaLabel: 'Unknown status'
        };
    }
  };

  const config = getBadgeConfig();
  
  const MotionWrapper = isCalm ? 'div' : motion.div;
  const motionProps = isCalm ? {} : {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      y: state === 'done' ? 0 : [0, -1, 0]
    },
    transition: { 
      scale: { duration: 0.3, ease: "backOut" },
      rotate: { duration: 0.5, ease: "backOut" },
      y: state === 'done' ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  };

  return (
    <MotionWrapper
      className={`absolute -top-2 -right-2 min-w-[24px] h-6 ${config.bg} rounded-full shadow-lg flex items-center justify-center z-20 px-1 ${className}`}
      aria-label={config.ariaLabel}
      role="status"
      {...motionProps}
    >
      <span className={`${config.text} text-xs font-medium`} aria-hidden="true">
        {config.icon}
      </span>
    </MotionWrapper>
  );
}

// formatDue is now imported from assign.ts