/**
 * New Pack Badge Component
 * Displays a "New" badge for content from newly enabled packs
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useNewPackContent } from '../hooks/useNewPackContent';

interface NewPackBadgeProps {
  lessonId?: string;
  packId?: string;
  className?: string;
  variant?: 'pill' | 'corner' | 'inline';
  showDaysRemaining?: boolean;
}

export function NewPackBadge({ 
  lessonId, 
  packId, 
  className = '', 
  variant = 'pill',
  showDaysRemaining = false 
}: NewPackBadgeProps) {
  const { isPackContentNew, isLessonFromNewPack, getDaysRemainingForNewTag } = useNewPackContent();
  
  const isNew = packId ? isPackContentNew(packId) : lessonId ? isLessonFromNewPack(lessonId) : false;
  
  if (!isNew) return null;

  const daysRemaining = packId ? getDaysRemainingForNewTag(packId) : 0;
  const badgeText = showDaysRemaining && daysRemaining > 0 
    ? `New (${daysRemaining}d)` 
    : 'New';

  const baseStyles = "text-xs font-medium animate-pulse";
  
  const variantStyles = {
    pill: "px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm",
    corner: "absolute -top-1 -right-1 px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] z-10",
    inline: "inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200"
  };

  return (
    <Badge 
      variant="default"
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      data-testid="new-pack-badge"
    >
      {badgeText}
    </Badge>
  );
}