import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function HelpOverlay({ open, onClose }: HelpOverlayProps) {
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
          data-testid="help-overlay"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Help Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 
                  id="help-title" 
                  className="text-2xl font-bold text-gray-900 flex items-center gap-2"
                >
                  <span className="text-2xl">❓</span>
                  Help & Shortcuts
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close help overlay"
                  data-testid="help-close-button"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Keyboard Shortcuts */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-lg">⌨️</span>
                  Keyboard Shortcuts
                </h3>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Open/close Backpack</span>
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">B</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Toggle Compass (biome view)</span>
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">C</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Show this help</span>
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">?</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Resume last lesson</span>
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">R</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Toggle Teacher Mode</span>
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">T</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Access Privacy & Data settings</span>
                    <span className="text-sm text-gray-600">Teacher Panel → Privacy tab</span>
                  </div>
                </div>
              </section>

              {/* Icon Legend */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  Icon Legend
                </h3>
                <div className="grid gap-3">
                  <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <span className="text-lg">🧭</span>
                    </div>
                    <div>
                      <div className="font-medium text-amber-900">Compass</div>
                      <div className="text-sm text-amber-700">Navigate between learning biomes (Forest, Desert, Ocean, Night)</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                      <span className="text-lg">🎒</span>
                    </div>
                    <div>
                      <div className="font-medium text-blue-900">Backpack</div>
                      <div className="text-sm text-blue-700">View your earned tools, charms, and achievements</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <span className="text-lg">📍</span>
                    </div>
                    <div>
                      <div className="font-medium text-green-900">Lesson Pins</div>
                      <div className="text-sm text-green-700">Interactive lessons scattered across each biome</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <span className="text-lg">🧭</span>
                    </div>
                    <div>
                      <div className="font-medium text-orange-900">Scout</div>
                      <div className="text-sm text-orange-700">Your AI learning companion providing hints and encouragement</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Calm Mode */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-lg">🌙</span>
                  Calm Mode
                </h3>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-indigo-800 leading-relaxed">
                    When Calm Mode is enabled, animations and sound effects are reduced for a more peaceful learning experience. 
                    Perfect for focused study sessions or when you prefer a gentler interface.
                  </p>
                  <div className="mt-3 text-sm text-indigo-600">
                    Toggle Calm Mode in the Guide panel (press 'T' for teacher tools)
                  </div>
                </div>
              </section>

              {/* Navigation Tips */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  Navigation Tips
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="font-medium text-yellow-900 mb-1">Getting Started</div>
                    <div className="text-sm text-yellow-800">Use the Compass (C) to explore different biomes and find lessons that match your interests</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-medium text-green-900 mb-1">Progress Tracking</div>
                    <div className="text-sm text-green-800">Your Backpack (B) shows completed lessons and unlocked achievements</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-900 mb-1">Need Help?</div>
                    <div className="text-sm text-blue-800">Scout appears automatically to provide hints and encouragement during lessons</div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="text-center text-sm text-gray-600">
                Press <kbd className="px-1 py-0.5 bg-white border rounded text-xs font-mono">Esc</kbd> or click outside to close this help
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}