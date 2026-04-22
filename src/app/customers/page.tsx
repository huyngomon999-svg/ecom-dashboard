"use client";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Users, UserPlus, RefreshCw, DollarSign } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/shared/KPICard";
import { Card, CardHeader } from "@/components/shared/Card";
import { SegmentBadge } from "@/components/shared/StatusBadge";
import { useDateRange } from "@/hooks/useDateRange";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { formatVND, formatNumber, formatDate, formatDateFull } from "@/lib/formatters";
import { allCustomerMetrics, allTopCustomers, allCustomerSegments, filterByDateRange } from "@/data/mock";

const SEGMENT_COLORS: Record<string, string> = {
  VIP: "#f59e0b",
  Loyal: "#10b981",
  Regular: "#3b82f6",
  New: "#6366f1",
  "At Risk": "#ef4444",
};

export default function CustomersPage() {
  const { preset, setPreset, customRange, setCustomRange, dateRange } = useDateRange();

  const metrics = useMemo(
    () => filterByDateRange(allCustomerMetrics, dateRange.from, dateRange.to),
    [dateRange]
  );

  const totalNew = useMemo(() => metrics.reduce((s, d) => s + d.newCustomers, 0), [metrics]);
  const totalReturning = useMemo(() => metrics.reduce((s, d) => s + d.returningCustomers, 0), [metrics]);
  const totalCustomers = totalNew + totalReturning;
  const totalRevenue = useMemo(() => allTopCustomers.reduce((s, c) => s + c.totalSpend, 0), []);

  const chartData = useMemo(
    () => metrics.map((d) => ({
      date: formatDate(d.date),
      "Khách mới": d.newCustomers,
      "Quay lại": d.returningCustomers,
    })),
    [metrics]
  );

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Khách hàng" subtitle="Phân tích và phân khúc khách hàng" preset={preset} onPresetChange={setPreset} />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-end">
          <DateRangePicker
            preset={preset}
            dateRange={dateRange}
            onPresetChange={setPreset}
            onCustomRange={(r) => setCustomRange(r)}
          />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Tổng khách" value={formatNumber(totalCustomers)} icon={Users} iconColor="blue" />
          <KPICard title="Khách mới" value={formatNumber(totalNew)} icon={UserPlus} iconColor="purple" />
          <KPICard title="Khách quay lại" value={formatNumber(totalReturning)} icon={RefreshCw} iconColor="green" />
          <KPICard title="Tổng chi tiêu (top KH)" value={formatVND(totalRevenue, true) + "₫"} icon={DollarSign} iconColor="orange" />
        </div>

        {/* Customer trend chart */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader title="Xu hướng khách hàng" description="Khách mới vs khách quay lại" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={Math.floor(metrics.length / 7)} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="Khách mới" stroke="#6366f1" strokeWidth={2} fill="url(#newGrad)" dot={false} />
                <Area type="monotone" dataKey="Quay lại" stroke="#10b981" strokeWidth={2} fill="url(#retGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Segments */}
          <Card>
            <CardHeader title="Phân khúc khách hàng" />
            <div className="space-y-3">
              {allCustomerSegments.map((s) => (
                <div key={s.segment}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <SegmentBadge segment={s.segment} />
                      <span className="text-xs text-[var(--color-text-muted)]">{formatNumber(s.count)} KH</span>
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-text)]">{s.share}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${s.share}%`,
                        background: SEGMENT_COLORS[s.segment] ?? "#94a3b8",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Top customers table */}
        <Card noPadding>
          <div className="p-5 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Top khách hàng</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Sắp xếp theo tổng chi tiêu</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {["#", "Khách hàng", "Số đơn", "Tổng chi tiêu", "AOV", "Mua gần nhất", "Phân khúc"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTopCustomers.map((c, i) => (
                  <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-5 py-3 text-xs text-[var(--color-text-subtle)]">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="text-xs font-medium text-[var(--color-text)]">{c.name}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">{c.phone}</div>
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-[var(--color-text)]">{formatNumber(c.orderCount)}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-[var(--color-text)] whitespace-nowrap">{formatVND(c.totalSpend)}</td>
                    <td className="px-5 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">{formatVND(c.avgOrderValue)}</td>
                    <td className="px-5 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">{formatDateFull(c.lastOrderDate)}</td>
                    <td className="px-5 py-3"><SegmentBadge segment={c.segment} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
