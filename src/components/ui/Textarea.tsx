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
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          id={textareaId}
          className={cn(
            "min-h-[100px] w-full rounded-[var(--radius-md)] border bg-[var(--bg-card)] px-3 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]",
            "resize-y leading-6",
            "focus:outline-none",
            error
              ? "border-2 border-[var(--error)] pr-10"
              : "border-[var(--divider)] focus:border-2 focus:border-[var(--primary)]",
            "disabled:cursor-not-allowed disabled:bg-[var(--bg-page)] disabled:text-[var(--text-secondary)]",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-required={props.required}
          {...props}
        />
        {error && (
          <AlertCircle
            className="absolute top-3 right-3 h-4 w-4 text-[var(--error)]"
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
