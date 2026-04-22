import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/data/types";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "muted" | "primary";

const ORDER_STATUS_MAP: Record<OrderStatus, BadgeVariant> = {
  "Đã giao": "success",
  "Đang giao": "primary",
  "Đóng gói": "info",
  "Chờ xác nhận": "warning",
  "Đã huỷ": "danger",
  "Hoàn hàng": "muted",
};

const PAYMENT_STATUS_MAP: Record<PaymentStatus, BadgeVariant> = {
  "Đã thanh toán": "success",
  "Chưa thanh toán": "warning",
  "Hoàn tiền": "danger",
};

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  danger:  "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  info:    "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  muted:   "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  danger:  "bg-[var(--color-danger)]",
  info:    "bg-[var(--color-info)]",
  primary: "bg-[var(--color-primary)]",
  muted:   "bg-[var(--color-text-muted)]",
};

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | string;
  type?: "order" | "payment" | "custom";
  variant?: BadgeVariant;
  dot?: boolean;
}

export function StatusBadge({ status, type = "order", variant, dot = true }: StatusBadgeProps) {
  const resolvedVariant =
    variant ??
    (type === "order"
      ? ORDER_STATUS_MAP[status as OrderStatus] ?? "muted"
      : PAYMENT_STATUS_MAP[status as PaymentStatus] ?? "muted");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap",
        VARIANT_STYLES[resolvedVariant]
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", DOT_COLORS[resolvedVariant])} />
      )}
      {status}
    </span>
  );
}

interface AdsStatusBadgeProps {
  status: "active" | "paused" | "ended";
}

export function AdsStatusBadge({ status }: AdsStatusBadgeProps) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: "success", label: "Đang chạy" },
    paused: { variant: "warning", label: "Tạm dừng" },
    ended:  { variant: "muted",   label: "Kết thúc" },
  };
  const { variant, label } = map[status];
  return <StatusBadge status={label} type="custom" variant={variant} />;
}

interface SegmentBadgeProps {
  segment: string;
}

export function SegmentBadge({ segment }: SegmentBadgeProps) {
  const map: Record<string, BadgeVariant> = {
    VIP: "warning",
    Loyal: "success",
    Regular: "primary",
    New: "info",
    "At Risk": "danger",
  };
  return <StatusBadge status={segment} type="custom" variant={map[segment] ?? "muted"} />;
}
