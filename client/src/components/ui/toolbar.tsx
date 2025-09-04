import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "../../lib/utils"
import { Input } from "./input"

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
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
        {/* Left side - Search and filters */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Search input */}
          {onSearchChange && (
            <div className="relative min-w-0 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-fg-muted" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-9 data-[density='compact']:h-8"
                data-testid="toolbar-search"
              />
            </div>
          )}
          
          {/* Additional left content (filters, etc.) */}
          {leftContent && (
            <div className="flex items-center gap-2">
              {leftContent}
            </div>
          )}
          
          {/* Custom children for left side */}
          {children && !rightContent && children}
        </div>

        {/* Right side - Actions */}
        {rightContent && (
          <div className="flex items-center gap-2 shrink-0">
            {rightContent}
          </div>
        )}
        
        {/* Custom children for right side when rightContent exists */}
        {children && rightContent && children}
      </div>
    )
  }
)
Toolbar.displayName = "Toolbar"

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
  Toolbar, 
  ToolbarLeft, 
  ToolbarRight, 
  ToolbarSeparator,
  type ToolbarProps 
}