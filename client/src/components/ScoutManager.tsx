import React, { useEffect, useState } from 'react';
import { ScoutBubble } from './ScoutBubble';
import { ScoutSheet } from './ScoutSheet';
import { useScoutQueue } from '../hooks/useScoutQueue';
import { setScoutQueueFunctions } from '../learning/scoutQueue';
import { useProfile } from '../profile/context';

interface ScoutManagerProps {
  position?: { x: number; y: number };
  visible?: boolean;
}

/**
 * ScoutManager orchestrates Scout's message display using the new queue system.
 * It handles both bubble and sheet display based on message priority.
 */
export function ScoutManager({ 
  position = { x: 20, y: 20 }, 
  visible = true 
}: ScoutManagerProps) {
  const { profile } = useProfile();
  const { current, enqueue, dismiss, flushInfoMessages } = useScoutQueue();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Initialize scout queue functions on mount
  useEffect(() => {
    setScoutQueueFunctions(enqueue, flushInfoMessages);
  }, [enqueue, flushInfoMessages]);

  // Handle critical messages by opening the sheet
  useEffect(() => {
    if (current?.priority === 'critical') {
      setSheetOpen(true);
    }
  }, [current]);

  const handleBubbleClick = () => {
    if (current?.priority === 'critical') {
      setSheetOpen(true);
    } else {
      dismiss();
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    if (current?.priority === 'critical') {
      dismiss();
    }
  };

  const handleJournalClick = () => {
    // Navigate to journal session
    // This would be implemented based on your routing system
    console.log('Navigating to journal session...');
    setSheetOpen(false);
    dismiss();
  };

  return (
    <>
      {/* Scout Bubble - shows for all non-critical messages */}
      {current && current.priority !== 'critical' && (
        <ScoutBubble
          onClick={handleBubbleClick}
          calm={profile.calmMode}
          position={position}
          visible={visible}
        />
      )}

      {/* Scout Sheet - shows for critical messages or when clicked */}
      <ScoutSheet
        open={sheetOpen}
        onClose={handleSheetClose}
        message={current?.text || ''}
        detailedMessage={current?.priority === 'critical' ? 
          'This is an important message that requires your attention.' : 
          undefined}
        showJournalCTA={!!current?.cta}
        onJournalClick={handleJournalClick}
        calm={profile.calmMode}
      />
    </>
  );
}