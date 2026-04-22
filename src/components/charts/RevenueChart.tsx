"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatVND, formatDate } from "@/lib/formatters";
import type { DailyMetric } from "@/data/types";

interface RevenueChartProps {
  data: DailyMetric[];
  showProfit?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border shadow-[var(--shadow-dropdown)] p-3 text-sm bg-[var(--color-surface)] border-[var(--color-border)]">
      <p className="font-semibold text-[var(--color-text)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[var(--color-text-muted)]">{p.name}:</span>
          <span className="font-semibold text-[var(--color-text)]">{formatVND(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({ data, showProfit = true }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    "Doanh thu": d.revenue,
    ...(showProfit && { "Lợi nhuận": d.profit }),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(data.length / 7)}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatVND(v, true)}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey="Doanh thu"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        {showProfit && (
          <Area
            type="monotone"
            dataKey="Lợi nhuận"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#profitGrad)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
