"use client";
import { useState } from "react";
import { ListFilter, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/data/types";

const ALL_STATUSES: OrderStatus[] = [
  "Đã giao", "Đang giao", "Đóng gói", "Chờ xác nhận", "Đã huỷ", "Hoàn hàng",
];

interface StatusFilterProps {
  selected: OrderStatus[];
  onChange: (s: OrderStatus[]) => void;
}

export function StatusFilter({ selected, onChange }: StatusFilterProps) {
  const [open, setOpen] = useState(false);

  const toggle = (s: OrderStatus) => {
    if (selected.includes(s)) onChange(selected.filter((x) => x !== s));
    else onChange([...selected, s]);
  };

  const hasFilter = selected.length > 0 && selected.length < ALL_STATUSES.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-colors",
          "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]",
          "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
          hasFilter && "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-soft)]"
        )}
      >
        <ListFilter size={14} />
        <span>Trạng thái</span>
        {hasFilter && (
          <span className="w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-[10px] flex items-center justify-center">
            {selected.length}
          </span>
        )}
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 rounded-xl border shadow-[var(--shadow-dropdown)] p-3 min-w-[190px] bg-[var(--color-surface)] border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Trạng thái đơn</span>
              <button onClick={() => onChange([])} className="text-xs text-[var(--color-primary)] hover:underline">
                Xoá
              </button>
            </div>
            {ALL_STATUSES.map((s) => (
              <label key={s} className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg hover:bg-[var(--color-surface-2)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.length === 0 || selected.includes(s)}
                  onChange={() => toggle(s)}
                  className="w-3.5 h-3.5 rounded accent-[var(--color-primary)]"
                />
                <span className="text-sm text-[var(--color-text)]">{s}</span>
              </label>
            ))}
            <button
              onClick={() => { onChange([]); setOpen(false); }}
              className="mt-2 w-full py-1.5 rounded-lg text-xs font-medium text-center text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
            >
              Tất cả trạng thái
            </button>
          </div>
        </>
      )}

      {/* Active tags */}
      {hasFilter && (
        <div className="flex items-center gap-1 flex-wrap mt-2">
          {selected.map((s) => (
            <button
              key={s}
              onClick={() => toggle(s)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] transition-colors"
            >
              {s} <X size={10} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
