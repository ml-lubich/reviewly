import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, indeterminate = false, onCheckedChange, ...props }, ref) => {
    const isActive = checked || indeterminate;

    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? "mixed" : checked}
        ref={ref}
        className={cn(
          "h-4 w-4 shrink-0 rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          isActive
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background hover:border-primary/50",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        <span className="flex items-center justify-center">
          {indeterminate ? (
            <Minus className="h-3 w-3" />
          ) : checked ? (
            <Check className="h-3 w-3" />
          ) : null}
        </span>
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
