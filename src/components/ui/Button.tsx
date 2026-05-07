import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--primary)] text-[var(--text-white)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] disabled:bg-[var(--primary-disabled)] focus-visible:ring-[var(--primary)]",
        secondary:
          "bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--divider)] hover:opacity-90 active:opacity-80",
        ghost:
          "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-card)] active:opacity-80",
        destructive:
          "bg-[var(--error)] text-[var(--text-white)] hover:bg-[var(--error-hover)] active:bg-[var(--error-active)] disabled:bg-[var(--error-disabled)] focus-visible:ring-[var(--error)]",
      },
      size: {
        sm: "h-8 px-3 text-sm gap-2",
        md: "h-10 px-4 text-base gap-2",
        lg: "h-12 px-6 text-lg gap-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  variant,
  size,
  loading,
  icon,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
