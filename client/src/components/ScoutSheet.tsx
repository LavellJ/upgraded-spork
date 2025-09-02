import React from 'react';
import { BottomSheet } from './BottomSheet';
import { motion } from 'framer-motion';
import { useScoutQueue } from '../hooks/useScoutQueue';

interface ScoutSheetProps {
  open: boolean;
  onClose: () => void;
  message?: string;
  detailedMessage?: string;
  showJournalCTA?: boolean;
  onJournalClick?: () => void;
  onMoreHelpClick?: () => void;
  calm?: boolean;
}

export function ScoutSheet({ 
  open, 
  onClose, 
  message, 
  detailedMessage,
  showJournalCTA = false,
  onJournalClick,
  onMoreHelpClick,
  calm = false
}: ScoutSheetProps) {
  const { inbox, removeFromInbox } = useScoutQueue();
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

        {/* Current Critical Message */}
        {message && (
          <div 
            id="scout-dialog-content"
            className="space-y-4 mb-6"
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
                      Want some quick practice?
                    </p>
                    <p className="text-sm text-green-700">
                      Try a Journal session to boost your skills!
                    </p>
                  </div>
                  <button
                    onClick={onJournalClick}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    data-testid="scout-journal-button"
                  >
                    Quick Practice
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inbox of Actionable Messages */}
        {inbox.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📥</span>
              <h3 className="text-lg font-semibold text-gray-800">
                Scout's Inbox
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {inbox.length} item{inbox.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {inbox.map((inboxMessage, index) => (
                <motion.div
                  key={inboxMessage.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-purple-50 rounded-xl p-4 border border-purple-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-gray-800 leading-relaxed mb-2">
                        {inboxMessage.text}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(inboxMessage.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {inboxMessage.cta && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            inboxMessage.cta!.onClick();
                            removeFromInbox(inboxMessage.id);
                          }}
                          className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                          data-testid={`inbox-cta-${inboxMessage.id}`}
                        >
                          {inboxMessage.cta.label}
                        </button>
                        <button
                          onClick={() => removeFromInbox(inboxMessage.id)}
                          className="px-2 py-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          data-testid={`inbox-dismiss-${inboxMessage.id}`}
                          aria-label="Dismiss message"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3 justify-end">
          {/* More Help Button */}
          {onMoreHelpClick && (
            <button
              onClick={onMoreHelpClick}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              data-testid="scout-more-help-button"
            >
              More help
            </button>
          )}
          
          {/* Close Button */}
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