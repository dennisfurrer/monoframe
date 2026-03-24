import type { ReactNode, ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { Spinner } from "../Spinner";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant: "primary" | "secondary" | "ghost" | "destructive";
  size: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

const sizeClasses = {
  sm: "h-7 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-base gap-2",
  lg: "h-11 px-5 text-lg gap-2.5",
} as const;

const iconSizeClasses = {
  sm: "[&>svg]:w-3.5 [&>svg]:h-3.5",
  md: "[&>svg]:w-4 [&>svg]:h-4",
  lg: "[&>svg]:w-[18px] [&>svg]:h-[18px]",
} as const;

const variantClasses = {
  primary:
    "bg-accent text-text-on-accent border-transparent hover:bg-accent-hover active:bg-accent-hover/90",
  secondary:
    "bg-bg-tertiary text-text-primary border border-border hover:bg-bg-elevated active:bg-bg-elevated/90",
  ghost:
    "bg-transparent text-text-secondary border-transparent hover:bg-bg-tertiary hover:text-text-primary active:bg-bg-tertiary/90",
  destructive:
    "bg-danger text-text-on-accent border-transparent hover:bg-danger/90 active:bg-danger/80",
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      disabled = false,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-md",
          "transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
          sizeClasses[size],
          iconSizeClasses[size],
          variantClasses[variant],
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size={size === "lg" ? "md" : "sm"} className="animate-spin" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
