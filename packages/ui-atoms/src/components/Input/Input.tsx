import type { ReactNode, InputHTMLAttributes, ChangeEvent } from "react";
import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  type: "text" | "number" | "password" | "email" | "search";
  size: "sm" | "md";
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeClasses = {
  sm: "h-8 px-2.5 text-sm",
  md: "h-10 px-3 text-base",
} as const;

const iconWrapperSizeClasses = {
  sm: "px-2.5",
  md: "px-3",
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type,
      size,
      placeholder,
      value,
      onChange,
      error,
      disabled = false,
      leftIcon,
      rightIcon,
      className,
      ...props
    },
    ref,
  ) => {
    const hasError = Boolean(error);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className="flex flex-col gap-1">
        <div className="relative flex items-center">
          {leftIcon && (
            <div
              className={cn(
                "absolute left-0 flex items-center justify-center text-text-secondary",
                iconWrapperSizeClasses[size],
                "[&>svg]:w-4 [&>svg]:h-4",
              )}
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              "w-full rounded-md border bg-bg-deep text-text-primary",
              "placeholder:text-text-muted",
              "transition-colors duration-fast",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              sizeClasses[size],
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              !hasError && !disabled && "border-border focus:border-accent focus:ring-accent/20",
              hasError && "border-danger focus:border-danger focus:ring-danger/20",
              disabled && "bg-bg-tertiary border-border-muted text-text-muted cursor-not-allowed",
              type === "number" && "font-mono",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div
              className={cn(
                "absolute right-0 flex items-center justify-center text-text-secondary",
                iconWrapperSizeClasses[size],
                "[&>svg]:w-4 [&>svg]:h-4",
              )}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {hasError && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  },
);

Input.displayName = "Input";
