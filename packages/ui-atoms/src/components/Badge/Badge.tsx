import type { ReactNode, HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: "success" | "danger" | "warning" | "info" | "neutral";
  size: "sm" | "md";
  children: ReactNode;
}

const sizeClasses = {
  sm: "h-[18px] px-1.5 text-[10px]",
  md: "h-[22px] px-2 text-xs",
} as const;

const variantClasses = {
  success: "bg-success-muted text-success",
  danger: "bg-danger-muted text-danger",
  warning: "bg-warning-muted text-warning",
  info: "bg-info-muted text-info",
  neutral: "bg-bg-tertiary text-text-secondary",
} as const;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant, size, children, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-sm",
          "whitespace-nowrap",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
