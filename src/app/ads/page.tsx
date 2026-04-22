"use client";
import { useMemo } from "react";
import { Megaphone, TrendingUp, Target, MousePointerClick, BarChart2, ShoppingCart } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/shared/KPICard";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { Card, CardHeader } from "@/components/shared/Card";
import { AdsSpendRevenueChart } from "@/components/charts/AdsChart";
import { AdsStatusBadge } from "@/components/shared/StatusBadge";
import { useDateRange } from "@/hooks/useDateRange";
import { formatVND, formatNumber, formatROAS, formatPercent } from "@/lib/formatters";
import { allDailyAdsMetrics, allAdsPerformance, filterByDateRange } from "@/data/mock";

export default function AdsPage() {
  const { preset, setPreset, customRange, setCustomRange, dateRange } = useDateRange();

  const metrics = useMemo(
    () => filterByDateRange(allDailyAdsMetrics, dateRange.from, dateRange.to),
    [dateRange]
  );

  const totals = useMemo(() => {
    const spend = metrics.reduce((s, d) => s + d.spend, 0);
    const revenue = metrics.reduce((s, d) => s + d.revenue, 0);
    const orders = metrics.reduce((s, d) => s + d.orders, 0);
    const clicks = metrics.reduce((s, d) => s + d.clicks, 0);
    const impressions = metrics.reduce((s, d) => s + d.impressions, 0);
    return {
      spend,
      revenue,
      orders,
      clicks,
      impressions,
      roas: spend > 0 ? revenue / spend : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpa: orders > 0 ? spend / orders : 0,
    };
  }, [metrics]);

  const platformGroups = useMemo(() => {
    const g: Record<string, typeof allAdsPerformance> = {};
    allAdsPerformance.forEach((c) => {
      if (!g[c.platform]) g[c.platform] = [];
      g[c.platform].push(c);
    });
    return g;
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Ads & Marketing" subtitle="Hiệu quả quảng cáo Facebook, TikTok, Google" preset={preset} onPresetChange={setPreset} />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-end">
          <DateRangePicker
            preset={preset}
            dateRange={dateRange}
            onPresetChange={setPreset}
            onCustomRange={(r) => setCustomRange(r)}
          />
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard title="Chi phí Ads" value={formatVND(totals.spend, true) + "₫"} icon={Megaphone} iconColor="orange" />
          <KPICard title="Revenue Ads" value={formatVND(totals.revenue, true) + "₫"} icon={TrendingUp} iconColor="blue" />
          <KPICard title="ROAS" value={formatROAS(totals.roas)} icon={BarChart2} iconColor="green" />
          <KPICard title="CPC" value={formatVND(totals.cpc)} icon={MousePointerClick} iconColor="purple" />
          <KPICard title="CPM" value={formatVND(totals.cpm)} icon={Target} iconColor="orange" />
          <KPICard title="Đơn từ Ads" value={formatNumber(totals.orders)} icon={ShoppingCart} iconColor="blue" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5 text-center">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">CTR</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{totals.ctr.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5 text-center">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">CPA</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{formatVND(totals.cpa)}</p>
          </div>
          <div className="rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5 text-center">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Lượt hiển thị</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{formatNumber(totals.impressions, true)}</p>
          </div>
          <div className="rounded-xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5 text-center">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Lượt click</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{formatNumber(totals.clicks, true)}</p>
          </div>
        </div>

        {/* Ads chart */}
        <Card>
          <CardHeader title="Chi phí Ads vs Doanh thu & ROAS" description="Theo ngày" />
          <AdsSpendRevenueChart data={metrics} />
        </Card>

        {/* Campaign table */}
        <Card noPadding>
          <div className="p-5 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Hiệu quả theo Campaign</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {["Campaign", "Platform", "Chi phí", "Revenue", "ROAS", "Impressions", "Clicks", "CTR", "CPC", "CPA", "Đơn", "Trạng thái"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allAdsPerformance.map((c) => (
                  <tr key={c.campaignId} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-[var(--color-text)] max-w-[180px] truncate">{c.campaignName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${
                        c.platform === "Facebook" ? "text-blue-500" :
                        c.platform === "TikTok" ? "text-pink-500" : "text-green-500"
                      }`}>{c.platform}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-[var(--color-text)] whitespace-nowrap">{formatVND(c.spend, true)}₫</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text)] whitespace-nowrap">{formatVND(c.revenue, true)}₫</td>
                    <td className={`px-4 py-3 text-xs font-bold ${c.roas >= 3 ? "text-[var(--color-success)]" : c.roas >= 2 ? "text-[var(--color-warning)]" : "text-[var(--color-danger)]"}`}>
                      {formatROAS(c.roas)}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">{formatNumber(c.impressions, true)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">{formatNumber(c.clicks, true)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">{c.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">{formatVND(c.cpc)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">{formatVND(c.cpa)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text)]">{formatNumber(c.orders)}</td>
                    <td className="px-4 py-3"><AdsStatusBadge status={c.status} /></td>
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
