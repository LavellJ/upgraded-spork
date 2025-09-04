import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Badge } from "./badge"

interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  helpText?: string;
  id?: string;
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select options...", 
    disabled, 
    className,
    error,
    helpText,
    id,
    ...props 
  }, ref) => {
    const [open, setOpen] = React.useState(false);
    
    const selectedOptions = options.filter(option => value.includes(option.value));
    
    const handleSelect = (optionValue: string) => {
      const newValue = value.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    };
    
    const handleRemove = (optionValue: string, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onChange(value.filter(v => v !== optionValue));
    };
    
    return (
      <div className="space-y-1">
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <PopoverPrimitive.Trigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
              disabled={disabled}
              className={cn(
                "w-full justify-between h-auto min-h-[2.5rem] px-3 py-2",
                "data-[density='compact']:min-h-[2rem] data-[density='compact']:px-2",
                error && "border-danger focus:ring-danger",
                className
              )}
              {...props}
            >
              <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                {selectedOptions.length === 0 ? (
                  <span className="text-fg-muted">{placeholder}</span>
                ) : (
                  selectedOptions.map(option => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {option.label}
                      <button
                        type="button"
                        onClick={(e) => handleRemove(option.value, e)}
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        disabled={disabled}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {option.label}</span>
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverPrimitive.Trigger>
          
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              className="z-50 w-[--radix-popover-trigger-width] max-h-[300px] overflow-y-auto rounded-md border bg-bg-card p-1 shadow-md"
              side="bottom"
              align="start"
            >
              {options.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                    "hover:bg-bg-subtle focus:bg-bg-subtle",
                    option.disabled && "pointer-events-none opacity-50"
                  )}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border",
                      value.includes(option.value) 
                        ? "bg-brand text-primary-foreground border-brand" 
                        : "border-border"
                    )}>
                      {value.includes(option.value) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    <span>{option.label}</span>
                  </div>
                </div>
              ))}
              {options.length === 0 && (
                <div className="py-2 text-center text-sm text-fg-muted">
                  No options available
                </div>
              )}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
        
        {error && (
          <p id={`${id}-error`} className="text-sm text-danger">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${id}-help`} className="subtle">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect, type MultiSelectOption, type MultiSelectProps }