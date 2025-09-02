import React from 'react';
import { BottomSheet } from './BottomSheet';
import { motion } from 'framer-motion';

interface ScoutSheetProps {
  open: boolean;
  onClose: () => void;
  message: string;
  detailedMessage?: string;
  showJournalCTA?: boolean;
  onJournalClick?: () => void;
  calm?: boolean;
}

export function ScoutSheet({ 
  open, 
  onClose, 
  message, 
  detailedMessage,
  showJournalCTA = false,
  onJournalClick,
  calm = false
}: ScoutSheetProps) {
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: calm ? { duration: 0.3 } : {
        type: "spring",
        damping: 20,
        stiffness: 300,
        delay: 0.1
      }
    }
  };

  return (
    <BottomSheet 
      open={open} 
      onClose={onClose} 
      titleId="scout-dialog-title"
      role="dialog"
      aria-labelledby="scout-dialog-title"
      aria-describedby="scout-dialog-content"
    >
      <motion.div
        className="text-gray-800 p-2"
        initial="hidden"
        animate={open ? "visible" : "hidden"}
        variants={contentVariants}
      >
        {/* Scout Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg flex items-center justify-center border-2 border-white">
            <span className="text-2xl">🧭</span>
          </div>
          <div>
            <h2 
              id="scout-dialog-title" 
              className="text-xl font-bold text-amber-800"
            >
              Scout here!
            </h2>
            <p className="text-sm text-gray-600">Your learning companion</p>
          </div>
        </div>

        {/* Main Message */}
        <div 
          id="scout-dialog-content"
          className="space-y-4"
        >
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-lg font-medium text-amber-900 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Detailed Message */}
          {detailedMessage && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-gray-700 leading-relaxed">
                {detailedMessage}
              </p>
            </div>
          )}

          {/* Journal CTA */}
          {showJournalCTA && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800 mb-1">
                    Want to track your progress?
                  </p>
                  <p className="text-sm text-green-700">
                    Check your learning journal for insights!
                  </p>
                </div>
                <button
                  onClick={onJournalClick}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  data-testid="scout-journal-button"
                >
                  Open Journal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            data-testid="scout-close-button"
          >
            Thanks, Scout!
          </button>
        </div>
      </motion.div>
    </BottomSheet>
  );
}