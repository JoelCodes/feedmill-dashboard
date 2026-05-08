import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export default function Input({
  label,
  helperText,
  error,
  className,
  ...props
}: InputProps) {
  const inputId = useId();
  const helperId = useId();
  const errorId = useId();

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            "w-full h-11 px-3 rounded-[var(--radius-md)] border text-sm bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]",
            "focus:outline-none",
            error
              ? "border-[var(--error)] border-2 pr-10"
              : "border-[var(--divider)] focus:border-[var(--primary)] focus:border-2",
            "disabled:bg-[var(--bg-page)] disabled:text-[var(--text-secondary)] disabled:cursor-not-allowed",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-required={props.required}
          {...props}
        />
        {error && (
          <AlertCircle
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--error)]"
            aria-hidden="true"
          />
        )}
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-xs text-[var(--error)]"
        >
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-[var(--text-secondary)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
