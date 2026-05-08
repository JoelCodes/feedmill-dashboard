import { cn } from "@/lib/utils";
import { ChevronDown, AlertCircle } from "lucide-react";
import { useId } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export default function Select({
  label,
  helperText,
  error,
  options,
  className,
  ...props
}: SelectProps) {
  const selectId = useId();
  const helperId = useId();
  const errorId = useId();

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "h-11 w-full cursor-pointer appearance-none rounded-[var(--radius-md)] border bg-[var(--bg-card)] px-3 pr-10 text-sm text-[var(--text-primary)]",
            "focus:outline-none",
            error
              ? "border-2 border-[var(--error)]"
              : "border-[var(--divider)] focus:border-2 focus:border-[var(--primary)]",
            "disabled:cursor-not-allowed disabled:bg-[var(--bg-page)] disabled:text-[var(--text-secondary)]",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-required={props.required}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <AlertCircle
            className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--error)]"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]"
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
