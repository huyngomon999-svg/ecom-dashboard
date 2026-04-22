"use client";
import { useState } from "react";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import type { DatePreset, DateRange } from "@/data/types";

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày qua", value: "7d" },
  { label: "30 ngày qua", value: "30d" },
  { label: "90 ngày qua", value: "90d" },
  { label: "Tuỳ chỉnh", value: "custom" },
];

interface DateRangePickerProps {
  preset: DatePreset;
  dateRange: DateRange;
  onPresetChange: (p: DatePreset) => void;
  onCustomRange: (r: DateRange) => void;
}

export function DateRangePicker({ preset, dateRange, onPresetChange, onCustomRange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const label = PRESETS.find((p) => p.value === preset)?.label ?? "Chọn ngày";
  const rangeLabel =
    preset !== "custom"
      ? label
      : `${format(dateRange.from, "dd/MM")} – ${format(dateRange.to, "dd/MM/yyyy")}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-colors",
          "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]",
          "hover:bg-[var(--color-surface-2)]",
          open && "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-opacity-20"
        )}
      >
        <CalendarIcon size={14} className="text-[var(--color-text-muted)]" />
        <span>{rangeLabel}</span>
        <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={cn(
            "absolute right-0 top-full mt-2 z-50 rounded-xl border shadow-[var(--shadow-dropdown)] p-4",
            "bg-[var(--color-surface)] border-[var(--color-border)]",
            "min-w-[280px]"
          )}>
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PRESETS.filter((p) => p.value !== "custom").map((p) => (
                <button
                  key={p.value}
                  onClick={() => { onPresetChange(p.value); setOpen(false); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    preset === p.value
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="border-t border-[var(--color-border)] pt-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">Chọn khoảng ngày tuỳ chỉnh</p>
              <DayPicker
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onCustomRange({ from: range.from, to: range.to });
                    onPresetChange("custom");
                    setOpen(false);
                  }
                }}
                numberOfMonths={1}
                className="text-sm"
                classNames={{
                  months: "flex gap-4",
                  month: "space-y-3",
                  caption: "flex justify-between items-center px-1",
                  caption_label: "text-sm font-semibold text-[var(--color-text)]",
                  nav: "flex items-center gap-1",
                  nav_button: "w-7 h-7 rounded-lg hover:bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "w-9 text-center text-[10px] font-medium text-[var(--color-text-muted)] uppercase",
                  row: "flex mt-1",
                  cell: "w-9 text-center",
                  day: "w-9 h-9 rounded-lg text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer",
                  day_selected: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
                  day_today: "font-bold text-[var(--color-primary)]",
                  day_range_middle: "bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-none",
                  day_outside: "text-[var(--color-text-subtle)] opacity-50",
                  day_disabled: "opacity-25 cursor-not-allowed",
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
