import type { ReactNode } from "react";
import { cn, Label } from "@monoframe/ui-atoms";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label size="sm" htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
      {!error && hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
