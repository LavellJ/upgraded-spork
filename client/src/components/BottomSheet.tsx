import React, { useRef } from "react";
import { useFocusTrap } from '../hooks/useFocusTrap';

interface BottomSheetProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  titleId?: string;
}

// Simple bottom sheet used across Backpack / Lessons / Teacher Panel
export function BottomSheet({ open, onClose, children, titleId }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Use the focus trap hook
  useFocusTrap({
    isOpen: open,
    onClose: onClose || (() => {}),
    containerRef: sheetRef
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-bg-overlay" onClick={onClose} />
      <div 
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[min(96vw,42rem)] max-h-[88vh] overflow-auto rounded-t-3xl bg-bg-card backdrop-blur border border-fg-subtle/20 shadow-2xl p-4"
      >
        {children}
      </div>
    </div>
  );
}