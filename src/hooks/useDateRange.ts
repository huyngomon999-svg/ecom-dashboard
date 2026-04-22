"use client";
import { useState, useMemo } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import type { DatePreset, DateRange } from "@/data/types";

export function useDateRange() {
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [customRange, setCustomRange] = useState<DateRange | null>(null);

  const dateRange = useMemo<DateRange>(() => {
    const today = new Date();
    if (preset === "custom" && customRange) return customRange;
    if (preset === "today") return { from: startOfDay(today), to: endOfDay(today) };
    if (preset === "7d") return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
    if (preset === "90d") return { from: startOfDay(subDays(today, 89)), to: endOfDay(today) };
    // 30d default
    return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
  }, [preset, customRange]);

  const previousRange = useMemo<DateRange>(() => {
    const diffMs = dateRange.to.getTime() - dateRange.from.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);
    return {
      from: subDays(dateRange.from, diffDays),
      to: subDays(dateRange.to, diffDays),
    };
  }, [dateRange]);

  return { preset, setPreset, customRange, setCustomRange, dateRange, previousRange };
}
