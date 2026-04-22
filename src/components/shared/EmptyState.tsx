import { BarChart2 } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "Không có dữ liệu",
  description = "Không có dữ liệu cho khoảng thời gian này.",
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center mb-3 text-[var(--color-text-muted)]">
        {icon ?? <BarChart2 size={22} />}
      </div>
      <p className="text-sm font-medium text-[var(--color-text)]">{title}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">{description}</p>
    </div>
  );
}
