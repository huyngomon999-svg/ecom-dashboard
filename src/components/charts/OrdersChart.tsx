"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatDate, formatNumber } from "@/lib/formatters";
import type { DailyMetric } from "@/data/types";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border shadow-[var(--shadow-dropdown)] p-3 text-sm bg-[var(--color-surface)] border-[var(--color-border)]">
      <p className="font-semibold text-[var(--color-text)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[var(--color-text-muted)]">{p.name}:</span>
          <span className="font-semibold text-[var(--color-text)]">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function OrdersChart({ data }: { data: DailyMetric[] }) {
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    "Đơn hàng": d.orders,
    "Đã huỷ": d.cancelledOrders,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={6}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(data.length / 7)}
        />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-surface-2)" }} />
        <Bar dataKey="Đơn hàng" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Đã huỷ" fill="#ef4444" radius={[3, 3, 0, 0]} opacity={0.7} />
      </BarChart>
    </ResponsiveContainer>
  );
}
