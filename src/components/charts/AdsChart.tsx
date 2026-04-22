"use client";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatVND, formatDate, formatROAS } from "@/lib/formatters";
import type { DailyAdsMetric } from "@/data/types";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border shadow-[var(--shadow-dropdown)] p-3 text-sm bg-[var(--color-surface)] border-[var(--color-border)]">
      <p className="font-semibold text-[var(--color-text)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[var(--color-text-muted)]">{p.name}:</span>
          <span className="font-semibold text-[var(--color-text)]">
            {p.name === "ROAS" ? formatROAS(p.value) : formatVND(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AdsSpendRevenueChart({ data }: { data: DailyAdsMetric[] }) {
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    "Chi phí Ads": d.spend,
    "Revenue Ads": d.revenue,
    ROAS: d.roas,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(data.length / 7)}
        />
        <YAxis
          yAxisId="money"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatVND(v, true)}
          width={52}
        />
        <YAxis
          yAxisId="roas"
          orientation="right"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}x`}
          width={32}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar yAxisId="money" dataKey="Chi phí Ads" fill="#f59e0b" radius={[3, 3, 0, 0]} barSize={6} opacity={0.8} />
        <Bar yAxisId="money" dataKey="Revenue Ads" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={6} opacity={0.8} />
        <Line yAxisId="roas" type="monotone" dataKey="ROAS" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
