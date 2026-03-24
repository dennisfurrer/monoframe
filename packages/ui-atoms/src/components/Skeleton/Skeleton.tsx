import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
  className?: string;
}

const roundedClasses = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
} as const;

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ width, height, rounded = "md", className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-bg-tertiary animate-pulse",
          roundedClasses[rounded],
          className,
        )}
        style={{ width, height }}
        aria-hidden="true"
      />
    );
  },
);

Skeleton.displayName = "Skeleton";
