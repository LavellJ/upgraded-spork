import React, { useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useReadability } from '../hooks/useReadability';

interface BottomSheetProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  titleId?: string;
}

// Simple bottom sheet used across Backpack / Lessons / Teacher Panel
export function BottomSheet({ open, onClose, children, titleId }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { settings } = useReadability();
  
  // Check for reduced motion preference
  const shouldReduceMotion = settings.reducedMotion || 
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  
  // Use the focus trap hook
  useFocusTrap({
    isOpen: open,
    onClose: onClose || (() => {}),
    containerRef: sheetRef
  });

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40">
          <motion.div 
            className="absolute inset-0 bg-bg-overlay" 
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0.001 } : { duration: 0.2 }}
          />
          <motion.div 
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[min(96vw,42rem)] max-h-[88vh] overflow-auto rounded-t-3xl bg-bg-card backdrop-blur border border-fg-subtle/20 shadow-2xl p-4"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={shouldReduceMotion ? 
              { duration: 0.001 } : 
              { 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                duration: 0.3
              }
            }
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}