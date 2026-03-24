import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export interface SpinnerProps {
  size: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-3.5 h-3.5 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-7 h-7 border-[3px]",
} as const;

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size, color, className }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn(
          "inline-block rounded-full",
          "border-current border-t-transparent",
          "animate-spin",
          sizeClasses[size],
          !color && "text-text-secondary",
          className,
        )}
        style={color ? { borderColor: color, borderTopColor: "transparent" } : undefined}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  },
);

Spinner.displayName = "Spinner";
