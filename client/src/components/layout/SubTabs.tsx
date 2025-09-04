import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

export interface SubTabItem {
  id: string;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

export interface SubTabsProps {
  items: SubTabItem[];
  activeId: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function SubTabs({ items, activeId, onTabChange, className }: SubTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  // Check scroll shadows
  const checkScrollShadows = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth);
  };

  // Scroll active tab into view
  const scrollActiveIntoView = () => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const activeTab = activeTabRef.current;
      const container = scrollContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeTab.getBoundingClientRect();
      
      const isVisible = 
        activeRect.left >= containerRect.left && 
        activeRect.right <= containerRect.right;
      
      if (!isVisible) {
        activeTab.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center' 
        });
      }
    }
  };

  useEffect(() => {
    checkScrollShadows();
    scrollActiveIntoView();
  }, [activeId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollShadows);
      const resizeObserver = new ResizeObserver(checkScrollShadows);
      resizeObserver.observe(container);
      
      // Initial check
      checkScrollShadows();
      
      return () => {
        container.removeEventListener('scroll', checkScrollShadows);
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Left scroll shadow */}
      {showLeftShadow && (
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-bg-card to-transparent z-10 pointer-events-none" />
      )}
      
      {/* Right scroll shadow */}
      {showRightShadow && (
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-bg-card to-transparent z-10 pointer-events-none" />
      )}

      {/* Scrollable tabs container */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Tabs */}
        <div 
          role="tablist"
          className="flex border-b border-border bg-bg-card"
          aria-label="Section navigation"
        >
          {items.map((item) => (
            <button
              key={item.id}
              ref={item.id === activeId ? activeTabRef : null}
              role="tab"
              type="button"
              tabIndex={item.id === activeId ? 0 : -1}
              aria-selected={item.id === activeId}
              aria-controls={`panel-${item.id}`}
              disabled={item.disabled}
              className={cn(
                "group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                "border-b-2 border-transparent",
                "hover:text-fg-default hover:bg-bg-soft",
                "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                item.id === activeId
                  ? "text-brand border-brand bg-bg-soft"
                  : "text-fg-muted"
              )}
              onClick={() => !item.disabled && onTabChange(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!item.disabled) onTabChange(item.id);
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  const currentIndex = items.findIndex(i => i.id === item.id);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                  const prevItem = items[prevIndex];
                  if (!prevItem.disabled) onTabChange(prevItem.id);
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  const currentIndex = items.findIndex(i => i.id === item.id);
                  const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                  const nextItem = items[nextIndex];
                  if (!nextItem.disabled) onTabChange(nextItem.id);
                }
              }}
              data-testid={`tab-${item.id}`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span 
                  className={cn(
                    "inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full",
                    item.id === activeId
                      ? "bg-brand/10 text-brand"
                      : "bg-fg-muted/10 text-fg-muted"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}