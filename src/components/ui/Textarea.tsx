import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { useId } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export default function Textarea({
  label,
  helperText,
  error,
  className,
  ...props
}: TextareaProps) {
  const textareaId = useId();
  const helperId = useId();
  const errorId = useId();

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-sm font-semibold text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          id={textareaId}
          className={cn(
            "w-full min-h-[96px] px-4 py-3 rounded-[var(--radius-md)] border text-base bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]",
            "resize-y leading-6",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-[var(--error)] border-2 focus:ring-[var(--error)] focus:ring-opacity-20 pr-10"
              : "border-[var(--divider)] focus:border-[var(--primary)] focus:ring-[var(--primary)] focus:ring-opacity-20",
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
            className="absolute right-3 top-3 h-4 w-4 text-[var(--error)]"
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
