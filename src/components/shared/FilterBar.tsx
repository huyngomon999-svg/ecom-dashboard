"use client";
import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHANNELS, type Channel } from "@/data/types";

interface FilterBarProps {
  selectedChannels: Channel[];
  onChannelsChange: (c: Channel[]) => void;
  extra?: React.ReactNode;
}

export function FilterBar({ selectedChannels, onChannelsChange, extra }: FilterBarProps) {
  const [open, setOpen] = useState(false);

  const toggle = (c: Channel) => {
    if (selectedChannels.includes(c)) {
      onChannelsChange(selectedChannels.filter((x) => x !== c));
    } else {
      onChannelsChange([...selectedChannels, c]);
    }
  };

  const hasFilters = selectedChannels.length > 0 && selectedChannels.length < CHANNELS.length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <button
          onClick={() => setOpen((p) => !p)}
          className={cn(
            "inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-colors",
            "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]",
            "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
            hasFilters && "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-soft)]"
          )}
        >
          <Filter size={14} />
          <span>Kênh bán</span>
          {hasFilters && (
            <span className="w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-[10px] flex items-center justify-center">
              {selectedChannels.length}
            </span>
          )}
          <ChevronDown size={12} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full mt-2 z-50 rounded-xl border shadow-[var(--shadow-dropdown)] p-3 min-w-[180px] bg-[var(--color-surface)] border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Kênh bán hàng</span>
                <button
                  onClick={() => onChannelsChange([])}
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  Xoá
                </button>
              </div>
              {CHANNELS.map((c) => (
                <label key={c} className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg hover:bg-[var(--color-surface-2)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChannels.length === 0 || selectedChannels.includes(c)}
                    onChange={() => toggle(c)}
                    className="w-3.5 h-3.5 rounded accent-[var(--color-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text)]">{c}</span>
                </label>
              ))}
              <button
                onClick={() => { onChannelsChange([]); setOpen(false); }}
                className="mt-2 w-full py-1.5 rounded-lg text-xs font-medium text-center text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
              >
                Tất cả kênh
              </button>
            </div>
          </>
        )}
      </div>

      {hasFilters && (
        <div className="flex items-center gap-1 flex-wrap">
          {selectedChannels.map((c) => (
            <button
              key={c}
              onClick={() => toggle(c)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] transition-colors"
            >
              {c}
              <X size={10} />
            </button>
          ))}
        </div>
      )}

      {extra}
    </div>
  );
}
