import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SparklinePoint { value: number }

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: "blue" | "green" | "red" | "orange" | "purple";
  sparkline?: SparklinePoint[];
  loading?: boolean;
  onClick?: () => void;
}

const ICON_COLORS = {
  blue:   "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  green:  "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  red:    "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  orange: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  purple: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
};

function MiniSparkline({ data }: { data: SparklinePoint[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d.value - min) / range) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = "vs kỳ trước",
  icon: Icon,
  iconColor = "blue",
  sparkline,
  loading,
  onClick,
}: KPICardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-8 w-32 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5 transition-all",
        onClick && "cursor-pointer hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2 truncate">{title}</p>
          <p className="text-2xl font-bold text-[var(--color-text)] leading-none mb-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded",
                  isPositive && "text-[var(--color-success)] bg-[var(--color-success-soft)]",
                  isNegative && "text-[var(--color-danger)] bg-[var(--color-danger-soft)]",
                  isNeutral && "text-[var(--color-text-muted)] bg-[var(--color-surface-2)]"
                )}
              >
                {isPositive && <TrendingUp size={10} />}
                {isNegative && <TrendingDown size={10} />}
                {isNeutral && <Minus size={10} />}
                {change >= 0 ? "+" : ""}{change?.toFixed(1)}%
              </span>
              <span className="text-xs text-[var(--color-text-subtle)]">{changeLabel}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", ICON_COLORS[iconColor])}>
              <Icon size={17} />
            </div>
          )}
          {sparkline && <MiniSparkline data={sparkline} />}
        </div>
      </div>
    </div>
  );
}
