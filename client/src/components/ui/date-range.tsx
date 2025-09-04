import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "../../lib/utils"
import { Button } from "./button"

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  helpText?: string;
  id?: string;
}

const DateRangePicker = React.forwardRef<HTMLButtonElement, DateRangePickerProps>(
  ({
    value,
    onChange,
    placeholder = "Select date range...",
    disabled,
    className,
    error,
    helpText,
    id,
    ...props
  }, ref) => {
    const [open, setOpen] = React.useState(false);
    
    const formatRange = (range: DateRange | undefined) => {
      if (!range) return placeholder;
      if (!range.from) return placeholder;
      if (!range.to) return format(range.from, "MMM dd, yyyy");
      return `${format(range.from, "MMM dd, yyyy")} - ${format(range.to, "MMM dd, yyyy")}`;
    };

    // Simple date range picker implementation
    // In a real app, you'd want to use a proper date picker library like react-day-picker
    const handleDateSelect = (date: Date) => {
      if (!value?.from || (value.from && value.to)) {
        // Start new range
        onChange?.({ from: date, to: undefined });
      } else if (value.from && !value.to) {
        // Complete range
        if (date >= value.from) {
          onChange?.({ from: value.from, to: date });
          setOpen(false);
        } else {
          onChange?.({ from: date, to: value.from });
          setOpen(false);
        }
      }
    };

    // Generate calendar days for current month (simplified)
    const generateCalendarDays = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      
      const days = [];
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
      }
      return days;
    };

    return (
      <div className="space-y-1">
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <PopoverPrimitive.Trigger asChild>
            <Button
              ref={ref}
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                "data-[density='compact']:h-8",
                !value && "text-fg-muted",
                error && "border-danger focus:ring-danger",
                className
              )}
              disabled={disabled}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
              {...props}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatRange(value)}
            </Button>
          </PopoverPrimitive.Trigger>
          
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              className="z-50 w-auto p-4 rounded-md border bg-bg-card shadow-md"
              side="bottom"
              align="start"
            >
              <div className="space-y-4">
                <div className="text-sm font-medium text-fg-default">
                  Select date range
                </div>
                
                {/* Simplified calendar grid */}
                <div className="grid grid-cols-7 gap-1 text-sm">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="p-2 text-center text-fg-muted font-medium">
                      {day}
                    </div>
                  ))}
                  
                  {generateCalendarDays().map(date => {
                    const isSelected = value?.from && 
                      (date.getTime() === value.from.getTime() || 
                       (value.to && date.getTime() === value.to.getTime()));
                    const isInRange = value?.from && value?.to &&
                      date >= value.from && date <= value.to;
                    
                    return (
                      <button
                        key={date.toISOString()}
                        className={cn(
                          "p-2 text-center rounded hover:bg-bg-soft transition-colors",
                          isSelected && "bg-brand text-primary-foreground",
                          isInRange && !isSelected && "bg-brand/10",
                          "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                        )}
                        onClick={() => handleDateSelect(date)}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onChange?.(undefined);
                      setOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
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

DateRangePicker.displayName = "DateRangePicker";

export { DateRangePicker, type DateRange, type DateRangePickerProps }