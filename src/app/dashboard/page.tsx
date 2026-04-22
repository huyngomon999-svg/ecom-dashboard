"use client";
import { useMemo, useState } from "react";
import {
  DollarSign, ShoppingCart, TrendingUp,
  Megaphone, BarChart2, Users, UserPlus, RefreshCw, ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/shared/KPICard";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { FilterBar } from "@/components/shared/FilterBar";
import { StatusFilter } from "@/components/shared/StatusFilter";
import { Card, CardHeader } from "@/components/shared/Card";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { OrdersChart } from "@/components/charts/OrdersChart";
import { AdsSpendRevenueChart } from "@/components/charts/AdsChart";
import { ChannelPieChart } from "@/components/charts/ChannelChart";
import { TopProductsChart } from "@/components/charts/ProductsChart";
import { StatusBadge } from "@/components/shared/StatusBadge";

import { useDateRange } from "@/hooks/useDateRange";
import { formatVND, formatNumber, formatROAS } from "@/lib/formatters";
import {
  allDailyMetrics, allDailyAdsMetrics, allProducts, allOrders,
  filterByDateRange, computeKPISummary, computeKPIFromOrders, getChannelRevenue,
} from "@/data/mock";
import type { Channel, OrderStatus } from "@/data/types";

export default function DashboardPage() {
  const { preset, setPreset, customRange, setCustomRange, dateRange, previousRange } = useDateRange();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);

  const metrics     = useMemo(() => filterByDateRange(allDailyMetrics,    dateRange.from,    dateRange.to),    [dateRange]);
  const prevMetrics = useMemo(() => filterByDateRange(allDailyMetrics,    previousRange.from, previousRange.to), [previousRange]);
  const adsMetrics  = useMemo(() => filterByDateRange(allDailyAdsMetrics, dateRange.from,    dateRange.to),    [dateRange]);

  const hasFilter = channels.length > 0 || statuses.length > 0;

  const filteredOrders = useMemo(() => {
    let d = filterByDateRange(allOrders, dateRange.from, dateRange.to);
    if (channels.length > 0) d = d.filter((o) => channels.includes(o.channel));
    if (statuses.length  > 0) d = d.filter((o) => statuses.includes(o.status));
    return d;
  }, [dateRange, channels, statuses]);

  const filteredPrevOrders = useMemo(() => {
    let d = filterByDateRange(allOrders, previousRange.from, previousRange.to);
    if (channels.length > 0) d = d.filter((o) => channels.includes(o.channel));
    if (statuses.length  > 0) d = d.filter((o) => statuses.includes(o.status));
    return d;
  }, [previousRange, channels, statuses]);

  const adsSpendCur        = useMemo(() => metrics.reduce((s, d) => s + d.adsSpend, 0),        [metrics]);
  const adsSpendPrev       = useMemo(() => prevMetrics.reduce((s, d) => s + d.adsSpend, 0),    [prevMetrics]);
  const newCustomers       = useMemo(() => metrics.reduce((s, d) => s + d.newCustomers, 0),    [metrics]);
  const returningCustomers = useMemo(() => metrics.reduce((s, d) => s + d.returningCustomers, 0), [metrics]);

  const kpi = useMemo(() =>
    hasFilter
      ? computeKPIFromOrders(filteredOrders, filteredPrevOrders, adsSpendCur, adsSpendPrev, newCustomers, returningCustomers)
      : computeKPISummary(metrics, prevMetrics),
    [hasFilter, filteredOrders, filteredPrevOrders, metrics, prevMetrics, adsSpendCur, adsSpendPrev, newCustomers, returningCustomers]
  );

  const channelRevenue = useMemo(() => getChannelRevenue(metrics), [metrics]);
  const topProducts    = useMemo(() => allProducts.slice(0, 10), []);
  const recentOrders   = useMemo(() => filteredOrders.slice(0, 10), [filteredOrders]);

  const sparkline = (key: "revenue" | "orders" | "profit" | "adsSpend") =>
    metrics.slice(-14).map((d) => ({ value: d[key] }));

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Tổng quan" subtitle="Theo dõi hiệu quả kinh doanh realtime" />

      <div className="flex-1 p-6 space-y-6">
        {/* Filter bar */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-2 flex-wrap">
            <FilterBar selectedChannels={channels} onChannelsChange={setChannels} />
            <StatusFilter selected={statuses} onChange={setStatuses} />
          </div>
          <DateRangePicker
            preset={preset}
            dateRange={dateRange}
            onPresetChange={setPreset}
            onCustomRange={(r) => setCustomRange(r)}
          />
        </div>

        {/* KPI row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <KPICard title="Tổng doanh thu"  value={formatVND(kpi.totalRevenue, true) + "₫"} change={kpi.revenueChange}  icon={DollarSign} iconColor="blue"   sparkline={sparkline("revenue")} />
          <KPICard title="Tổng đơn hàng"   value={formatNumber(kpi.totalOrders)}            change={kpi.ordersChange}   icon={ShoppingCart} iconColor="purple" sparkline={sparkline("orders")} />
          <KPICard title="AOV"              value={formatVND(kpi.aov, true) + "₫"}          change={kpi.aovChange}      icon={TrendingUp}   iconColor="green" />
          <KPICard title="Chi phí Ads"      value={formatVND(kpi.adsSpend, true) + "₫"}     change={kpi.adsSpendChange} icon={Megaphone}    iconColor="orange" sparkline={sparkline("adsSpend")} />
          <KPICard title="ROAS"             value={formatROAS(kpi.roas)}                     change={kpi.roasChange}     icon={BarChart2}    iconColor="blue" />
        </div>

        {/* KPI row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Lợi nhuận ước tính" value={formatVND(kpi.profit, true) + "₫"} change={kpi.profitChange} icon={TrendingUp} iconColor="green" sparkline={sparkline("profit")} />
          <KPICard title="Tỷ lệ huỷ đơn"     value={`${kpi.cancelRate.toFixed(1)}%`}                              icon={RefreshCw}  iconColor="red" />
          <KPICard title="Khách hàng mới"     value={formatNumber(kpi.newCustomers)}                               icon={UserPlus}   iconColor="purple" />
          <KPICard title="Khách quay lại"     value={formatNumber(kpi.returningCustomers)}                         icon={Users}      iconColor="green" />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader title="Doanh thu & Lợi nhuận" description={`${metrics.length} ngày`}
              action={<Link href="/revenue" className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">Xem chi tiết <ArrowRight size={12} /></Link>}
            />
            <RevenueChart data={metrics} showProfit />
          </Card>
          <Card>
            <CardHeader title="Doanh thu theo kênh" />
            <ChannelPieChart data={channelRevenue} />
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Đơn hàng theo ngày"
              action={<Link href="/orders" className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">Xem đơn hàng <ArrowRight size={12} /></Link>}
            />
            <OrdersChart data={metrics} />
          </Card>
          <Card>
            <CardHeader title="Ads Spend vs Revenue"
              action={<Link href="/ads" className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">Xem Ads <ArrowRight size={12} /></Link>}
            />
            <AdsSpendRevenueChart data={adsMetrics} />
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Top sản phẩm bán chạy"
              action={<Link href="/products" className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">Xem tất cả <ArrowRight size={12} /></Link>}
            />
            <TopProductsChart data={topProducts} />
          </Card>

          <Card noPadding>
            <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Đơn hàng gần đây</h3>
                {hasFilter && <p className="text-xs text-[var(--color-primary)] mt-0.5">Đang lọc — {recentOrders.length} đơn</p>}
              </div>
              <Link href="/orders" className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">Xem tất cả <ArrowRight size={12} /></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {["Mã đơn","Kênh","Doanh thu","Trạng thái"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">Không có đơn hàng phù hợp</td></tr>
                  ) : recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-[var(--color-text)]">{o.id}</td>
                      <td className="px-5 py-3 text-xs text-[var(--color-text-muted)]">{o.channel}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-[var(--color-text)]">{formatVND(o.revenue)}</td>
                      <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
