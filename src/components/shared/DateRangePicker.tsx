"use client";
import { useState } from "react";
import { CalendarIcon, ChevronDown, Check } from "lucide-react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import type { DatePreset, DateRange } from "@/data/types";

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: "Hôm nay",    value: "today" },
  { label: "7 ngày",     value: "7d"    },
  { label: "30 ngày",    value: "30d"   },
  { label: "90 ngày",    value: "90d"   },
];

interface DateRangePickerProps {
  preset: DatePreset;
  dateRange: DateRange;
  onPresetChange: (p: DatePreset) => void;
  onCustomRange: (r: DateRange) => void;
}

export function DateRangePicker({
  preset, dateRange, onPresetChange, onCustomRange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // Pending = chưa bấm OK
  const [pendingFrom, setPendingFrom] = useState<Date | undefined>(undefined);
  const [pendingTo,   setPendingTo]   = useState<Date | undefined>(undefined);

  function handleOpen() {
    setPendingFrom(dateRange.from);
    setPendingTo(dateRange.to);
    setOpen(true);
  }

  function handlePreset(p: DatePreset) {
    onPresetChange(p);
    setOpen(false);
  }

  function handleSelect(range: { from?: Date; to?: Date } | undefined) {
    setPendingFrom(range?.from);
    setPendingTo(range?.to);
  }

  function handleOK() {
    const from = pendingFrom ?? dateRange.from;
    const to   = pendingTo   ?? pendingFrom ?? dateRange.to;
    onCustomRange({ from, to });
    onPresetChange("custom");
    setOpen(false);
  }

  const rangeLabel = preset === "custom"
    ? `${format(dateRange.from, "dd/MM")} – ${format(dateRange.to, "dd/MM/yyyy")}`
    : PRESETS.find((p) => p.value === preset)?.label ?? "Chọn ngày";

  const pendingLabel =
    pendingFrom && pendingTo
      ? `${format(pendingFrom, "dd/MM/yyyy")} → ${format(pendingTo, "dd/MM/yyyy")}`
      : pendingFrom
      ? `${format(pendingFrom, "dd/MM/yyyy")} → chọn ngày kết thúc`
      : "Bấm chọn ngày bắt đầu";

  const canConfirm = !!pendingFrom;

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
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
            "absolute right-0 top-full mt-2 z-50 rounded-xl border shadow-[var(--shadow-dropdown)]",
            "bg-[var(--color-surface)] border-[var(--color-border)]",
            "p-4 min-w-[300px]"
          )}>
            {/* Preset shortcuts */}
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePreset(p.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    preset === p.value && !open
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="border-t border-[var(--color-border)] pt-3">
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-3">
                Chọn khoảng ngày tuỳ chỉnh
              </p>

              {/* Calendar */}
              <DayPicker
                mode="range"
                selected={{ from: pendingFrom, to: pendingTo }}
                onSelect={(range) => handleSelect(
                  range
                    ? { from: range.from ?? undefined, to: range.to ?? undefined }
                    : undefined
                )}
                numberOfMonths={1}
                classNames={{
                  months:         "flex gap-6",
                  month:          "space-y-2",
                  month_caption:  "flex justify-between items-center px-1 mb-1",
                  caption_label:  "text-sm font-semibold text-[var(--color-text)]",
                  nav:            "flex items-center gap-1",
                  button_previous:"w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors",
                  button_next:    "w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors",
                  month_grid:     "w-full border-collapse",
                  weekdays:       "flex",
                  weekday:        "w-9 text-center text-[10px] font-medium text-[var(--color-text-muted)] uppercase pb-1",
                  week:           "flex mt-1",
                  day:            "w-9 h-9 text-center",
                  day_button:     "w-9 h-9 rounded-lg text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer",
                  selected:       "bg-[var(--color-primary)] text-white rounded-lg",
                  today:          "font-bold text-[var(--color-primary)]",
                  range_start:    "bg-[var(--color-primary)] text-white rounded-l-lg rounded-r-none",
                  range_end:      "bg-[var(--color-primary)] text-white rounded-r-lg rounded-l-none",
                  range_middle:   "bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-none",
                  outside:        "text-[var(--color-text-subtle)] opacity-40",
                  disabled:       "opacity-25 cursor-not-allowed",
                }}
              />

              {/* Selected range preview + OK */}
              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <p className={cn(
                  "text-xs mb-3 font-medium",
                  pendingFrom && pendingTo
                    ? "text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)]"
                )}>
                  {pendingLabel}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 h-8 rounded-lg text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleOK}
                    disabled={!canConfirm}
                    className={cn(
                      "flex-1 h-8 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors",
                      canConfirm
                        ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                        : "bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] cursor-not-allowed"
                    )}
                  >
                    <Check size={12} /> OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
