import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "bg-[var(--bg-card)] rounded-[var(--radius-lg)] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border border-[var(--divider)]",
        elevated: "shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
}

function Card({ variant, className, children, onClick, ...props }: CardProps) {
  const baseClassName = cn(cardVariants({ variant }), className);

  // Non-interactive card (no onClick)
  if (!onClick) {
    return (
      <div className={baseClassName} {...props}>
        {children}
      </div>
    );
  }

  // Interactive card with full keyboard support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div
      className={cn(
        baseClassName,
        "cursor-pointer transition-opacity hover:opacity-95 active:scale-[0.98]"
      )}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "border-b border-[var(--divider)] px-4 py-4",
        className
      )}
      {...props}
    >
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {children}
      </h3>
    </div>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn("flex-1 px-4 py-4", className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        "flex justify-end gap-2 border-t border-[var(--divider)] px-4 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
