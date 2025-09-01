import React, { useEffect } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

// Simple bottom sheet used across Backpack / Lessons / Teacher Panel
export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-stone-900/40" onClick={onClose} />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[min(96vw,42rem)] max-h-[88vh] overflow-auto rounded-t-3xl bg-white/95 backdrop-blur border border-stone-900/10 shadow-2xl p-4">
        {children}
      </div>
    </div>
  );
}