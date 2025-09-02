import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompassTourProps {
  show: boolean;
  onComplete: () => void;
}

export function CompassTour({ show, onComplete }: CompassTourProps) {

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 10000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        onComplete();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[1px]"
            onClick={onComplete}
            data-testid="compass-tour-backdrop"
          />

          {/* Tour tip - centered on screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300
            }}
            className="fixed z-[95] pointer-events-auto left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compass-tour-title"
            data-testid="compass-tour-tip"
          >
            <div className="relative">
              
              {/* Tip content */}
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 max-w-xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🧭</span>
                  </div>
                  <div className="flex-1">
                    <h3 
                      id="compass-tour-title" 
                      className="font-bold text-gray-900 mb-2 text-sm"
                    >
                      Welcome to Quest Island!
                    </h3>
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                      Use the <strong>Compass</strong> to explore different biomes and discover lessons. 
                      Press <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-xs font-mono">C</kbd> anytime to navigate!
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        One-time tip
                      </div>
                      <button
                        onClick={onComplete}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                        data-testid="compass-tour-got-it"
                      >
                        Got it!
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 to-orange-200/20 rounded-xl blur-xl -z-10"></div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}