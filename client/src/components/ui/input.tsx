import * as React from "react"

import { cn } from "../../lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
  helpText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helpText, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-bg-card px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-fg-default placeholder:text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "data-[density='compact']:h-8 data-[density='compact']:px-2 data-[density='compact']:py-1",
            error ? "border-danger focus-visible:ring-danger" : "border-border",
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
          {...props}
        />
        {error && (
          <p id={`${props.id}-error`} className="text-sm text-danger">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${props.id}-help`} className="subtle">
            {helpText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
