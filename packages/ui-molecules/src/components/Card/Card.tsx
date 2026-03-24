import type { ReactNode, HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@monoframe/ui-atoms";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant: "flat" | "bordered" | "elevated";
  padding: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

const variantClasses = {
  flat: "bg-bg-secondary",
  bordered: "bg-bg-primary border border-border",
  elevated: "bg-bg-elevated shadow-md",
} as const;

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant, padding, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg",
          variantClasses[variant],
          paddingClasses[padding],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
