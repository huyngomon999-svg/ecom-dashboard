"use client";
import { useMemo, useState } from "react";
import { DollarSign, TrendingUp, ShoppingCart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/shared/KPICard";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { Card, CardHeader } from "@/components/shared/Card";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { ChannelBarChart } from "@/components/charts/ChannelChart";
import { useDateRange } from "@/hooks/useDateRange";
import { formatVND, formatNumber, formatPercent, formatDateFull, calcChange } from "@/lib/formatters";
import { allDailyMetrics, filterByDateRange, computeKPISummary, getChannelRevenue } from "@/data/mock";

export default function RevenuePage() {
  const { preset, setPreset, customRange, setCustomRange, dateRange, previousRange } = useDateRange();
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  const metrics = useMemo(
    () => filterByDateRange(allDailyMetrics, dateRange.from, dateRange.to),
    [dateRange]
  );
  const prevMetrics = useMemo(
    () => filterByDateRange(allDailyMetrics, previousRange.from, previousRange.to),
    [previousRange]
  );

  const kpi = useMemo(() => computeKPISummary(metrics, prevMetrics), [metrics, prevMetrics]);
  const channelRevenue = useMemo(() => getChannelRevenue(metrics), [metrics]);

  const tableData = useMemo(() =>
    [...metrics].reverse().map((d, i) => {
      const prev = prevMetrics[prevMetrics.length - 1 - i];
      return {
        ...d,
        change: prev ? calcChange(d.revenue, prev.revenue) : null,
      };
    }),
    [metrics, prevMetrics]
  );

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Doanh thu"
        subtitle="Phân tích doanh thu chi tiết theo thời gian"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-surface-2)]">
            {(["day", "week", "month"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  groupBy === g
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {g === "day" ? "Ngày" : g === "week" ? "Tuần" : "Tháng"}
              </button>
            ))}
          </div>
          <DateRangePicker
            preset={preset}
            dateRange={dateRange}
            onPresetChange={setPreset}
            onCustomRange={(r) => setCustomRange(r)}
          />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Tổng doanh thu"
            value={formatVND(kpi.totalRevenue, true) + "₫"}
            change={kpi.revenueChange}
            icon={DollarSign}
            iconColor="blue"
            sparkline={metrics.slice(-14).map((d) => ({ value: d.revenue }))}
          />
          <KPICard
            title="Tổng đơn hàng"
            value={formatNumber(kpi.totalOrders)}
            change={kpi.ordersChange}
            icon={ShoppingCart}
            iconColor="purple"
          />
          <KPICard
            title="AOV"
            value={formatVND(kpi.aov, true) + "₫"}
            change={kpi.aovChange}
            icon={TrendingUp}
            iconColor="green"
          />
          <KPICard
            title="Lợi nhuận"
            value={formatVND(kpi.profit, true) + "₫"}
            change={kpi.profitChange}
            icon={TrendingUp}
            iconColor="green"
            sparkline={metrics.slice(-14).map((d) => ({ value: d.profit }))}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader title="Xu hướng doanh thu & lợi nhuận" description="So sánh với kỳ trước" />
            <RevenueChart data={metrics} showProfit />
          </Card>
          <Card>
            <CardHeader title="Doanh thu theo kênh" />
            <ChannelBarChart data={channelRevenue} />
          </Card>
        </div>

        {/* Detailed table */}
        <Card noPadding>
          <div className="p-5 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Chi tiết theo ngày</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">So sánh với kỳ trước cùng vị trí</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {["Ngày", "Doanh thu", "vs kỳ trước", "Đơn hàng", "AOV", "Chi phí Ads", "Lợi nhuận"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(0, 30).map((d) => (
                  <tr key={d.date} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-5 py-3 text-xs text-[var(--color-text-muted)]">{formatDateFull(d.date)}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-[var(--color-text)]">{formatVND(d.revenue)}</td>
                    <td className="px-5 py-3">
                      {d.change !== null ? (
                        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                          d.change >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                        }`}>
                          {d.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {Math.abs(d.change).toFixed(1)}%
                        </span>
                      ) : <span className="text-xs text-[var(--color-text-subtle)]">—</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--color-text)]">{formatNumber(d.orders)}</td>
                    <td className="px-5 py-3 text-xs text-[var(--color-text)]">{formatVND(d.orders > 0 ? d.revenue / d.orders : 0)}</td>
                    <td className="px-5 py-3 text-xs text-[var(--color-text)]">{formatVND(d.adsSpend)}</td>
                    <td className={`px-5 py-3 text-xs font-semibold ${d.profit >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                      {formatVND(d.profit)}
                    </td>
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
