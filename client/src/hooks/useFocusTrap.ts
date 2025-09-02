import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose: () => void;
  containerRef: React.RefObject<HTMLElement>;
}

export function useFocusTrap({ isOpen, onClose, containerRef }: UseFocusTrapOptions) {
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Store the currently focused element to restore later
    lastActiveElementRef.current = document.activeElement as HTMLElement;

    // Find the initial focus target
    const container = containerRef.current;
    const autoFocusElement = container.querySelector('[data-autofocus]') as HTMLElement;
    const firstHeading = container.querySelector('h1, h2, h3, h4, h5, h6') as HTMLElement;
    const firstFocusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;

    const initialTarget = autoFocusElement || firstHeading || firstFocusable;
    
    if (initialTarget) {
      // Make sure the target can receive focus
      if (initialTarget.tabIndex < 0) {
        initialTarget.tabIndex = -1;
      }
      initialTarget.focus();
    }

    // Handle keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = container.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        
        const focusableArray = Array.from(focusableElements) as HTMLElement[];
        const firstElement = focusableArray[0];
        const lastElement = focusableArray[focusableArray.length - 1];

        if (focusableArray.length === 0) {
          event.preventDefault();
          return;
        }

        if (event.shiftKey) {
          // Shift+Tab: if on first element, go to last
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: if on last element, go to first
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the element that opened the dialog
      if (lastActiveElementRef.current && document.contains(lastActiveElementRef.current)) {
        lastActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, containerRef]);

  return null;
}