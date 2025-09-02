import React from 'react';
import { BottomSheet } from './BottomSheet';

interface HelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function HelpOverlay({ open, onClose }: HelpOverlayProps) {
  return (
    <BottomSheet open={open} onClose={onClose} titleId="help-title">
      <div className="text-fg-primary">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">❓</span>
          <h3 id="help-title" className="font-extrabold text-lg" tabIndex={-1} data-autofocus>Keyboard Shortcuts</h3>
          <button 
            onClick={onClose} 
            className="ml-auto text-xs px-2 py-1 rounded-full border border-bg-border bg-bg-primary hover:bg-bg-secondary"
            data-testid="button-close-help"
          >
            Close
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-bg-secondary border border-bg-border">
            <h4 className="font-semibold text-sm mb-2">Navigation</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span>Open/Close Backpack</span>
                <kbd className="px-2 py-1 bg-bg-primary border border-bg-border rounded text-xs font-mono">b</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Toggle Compass</span>
                <kbd className="px-2 py-1 bg-bg-primary border border-bg-border rounded text-xs font-mono">c</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Show Help</span>
                <kbd className="px-2 py-1 bg-bg-primary border border-bg-border rounded text-xs font-mono">?</kbd>
              </div>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-bg-secondary border border-bg-border">
            <h4 className="font-semibold text-sm mb-2">Actions</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span>Resume Last Lesson</span>
                <kbd className="px-2 py-1 bg-bg-primary border border-bg-border rounded text-xs font-mono">r</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Toggle Teacher Mode</span>
                <kbd className="px-2 py-1 bg-bg-primary border border-bg-border rounded text-xs font-mono">t</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Close Overlays</span>
                <kbd className="px-2 py-1 bg-bg-primary border border-bg-border rounded text-xs font-mono">Esc</kbd>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-fg-muted mt-4">
            <p className="mb-2">💡 <strong>Tips:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• Shortcuts work when you're not typing in input fields</li>
              <li>• Compass highlights the next lesson when equipped</li>
              <li>• Use Backpack to equip learning tools and collect badges</li>
              <li>• Calm Mode keeps shortcuts working while reducing animations</li>
            </ul>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}