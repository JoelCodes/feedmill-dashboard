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
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        cardVariants({ variant }),
        isClickable &&
          "cursor-pointer hover:opacity-95 transition-opacity active:scale-[0.98]",
        className
      )}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
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
        "px-4 py-4 border-b border-[var(--divider)]",
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
    <div className={cn("px-4 py-4 flex-1", className)} {...props}>
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
        "px-4 py-4 border-t border-[var(--divider)] flex justify-end gap-2",
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
