import type { ReactNode, LabelHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  size: "sm" | "md";
  required?: boolean;
  children: ReactNode;
}

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm",
} as const;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ size, required = false, children, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "font-medium text-text-secondary",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
    );
  },
);

Label.displayName = "Label";
