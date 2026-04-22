export function formatVND(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toLocaleString("vi-VN");
  }
  return value.toLocaleString("vi-VN") + "₫";
}

export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString("vi-VN");
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatROAS(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateLabel(dateStr: string, mode: "day" | "week" | "month" = "day"): string {
  const d = new Date(dateStr);
  if (mode === "month") return d.toLocaleDateString("vi-VN", { month: "short", year: "numeric" });
  if (mode === "week") return `T${getWeekNumber(d)} '${String(d.getFullYear()).slice(2)}`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function getWeekNumber(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
}

export function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
