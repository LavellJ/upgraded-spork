import * as React from "react"
import { PropsWithChildren, ReactNode } from 'react'
import { Search } from "lucide-react"
import { cn } from "../../lib/utils"
import clsx from 'clsx'

export function Toolbar({ left, right, className }:{
  left?: ReactNode; right?: ReactNode; className?: string
}) {
  return (
    <div className={clsx(
      'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
      'py-3 px-4 md:px-6 border-b border-[rgb(var(--border))]',
      'data-[density="compact"]:py-2 data-[density="compact"]:px-3',
      className
    )}>
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  )
}

// Legacy compatibility - keep existing components for now
interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

const ToolbarLegacy = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ 
    className, 
    searchValue, 
    searchPlaceholder = "Search...", 
    onSearchChange,
    leftContent,
    rightContent,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between gap-4 py-3 px-4 bg-bg-card border-b border-border",
          "data-[density='compact']:py-2 data-[density='compact']:px-3",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {leftContent}
          {children && !rightContent && children}
        </div>
        {rightContent && (
          <div className="flex items-center gap-2 shrink-0">
            {rightContent}
          </div>
        )}
        {children && rightContent && children}
      </div>
    )
  }
)
ToolbarLegacy.displayName = "ToolbarLegacy"

// Sub-components for common toolbar patterns
interface ToolbarSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

const ToolbarLeft = React.forwardRef<HTMLDivElement, ToolbarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 flex-1 min-w-0", className)}
      {...props}
    />
  )
)
ToolbarLeft.displayName = "ToolbarLeft"

const ToolbarRight = React.forwardRef<HTMLDivElement, ToolbarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 shrink-0", className)}
      {...props}
    />
  )
)
ToolbarRight.displayName = "ToolbarRight"

const ToolbarSeparator = React.forwardRef<HTMLDivElement, ToolbarSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("h-4 w-px bg-border mx-1", className)}
      {...props}
    />
  )
)
ToolbarSeparator.displayName = "ToolbarSeparator"

export { 
  ToolbarLegacy, 
  ToolbarLeft, 
  ToolbarRight, 
  ToolbarSeparator,
  type ToolbarProps 
}