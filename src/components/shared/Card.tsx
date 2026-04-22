import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export function Card({ children, className, noPadding, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)]",
        !noPadding && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
        {description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
