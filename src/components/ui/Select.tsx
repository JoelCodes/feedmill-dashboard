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
          className="text-sm font-semibold text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "w-full h-10 px-4 pr-10 rounded-[var(--radius-md)] border text-base bg-[var(--bg-card)] text-[var(--text-primary)] cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-[var(--error)] border-2 focus:ring-[var(--error)] focus:ring-opacity-20"
              : "border-[var(--divider)] focus:border-[var(--primary)] focus:ring-[var(--primary)] focus:ring-opacity-20",
            "disabled:bg-[var(--bg-page)] disabled:text-[var(--text-secondary)] disabled:cursor-not-allowed",
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
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--error)] pointer-events-none"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)] pointer-events-none"
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
