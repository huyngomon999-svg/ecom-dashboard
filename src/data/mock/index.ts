import {
  generateDailyMetrics,
  generateChannelRevenue,
  generateOrders,
  generateDailyAdsMetrics,
  generateAdsPerformance,
  generateProducts,
  generateCategoryRevenue,
  generateCustomerMetrics,
  generateTopCustomers,
  generateCustomerSegments,
} from "./generator";
import { calcChange } from "@/lib/formatters";
import type { KPISummary, Order } from "../types";

// ─── Pre-generated datasets ──────────────────────────────────────────────────

export const allDailyMetrics = generateDailyMetrics(90);
export const allOrders = generateOrders(90);
export const allDailyAdsMetrics = generateDailyAdsMetrics(90);
export const allAdsPerformance = generateAdsPerformance();
export const allProducts = generateProducts();
export const allCategoryRevenue = generateCategoryRevenue(allProducts);
export const allCustomerMetrics = generateCustomerMetrics(90);
export const allTopCustomers = generateTopCustomers();
export const allCustomerSegments = generateCustomerSegments();

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function filterByDateRange<T extends { date: string }>(
  data: T[],
  from: Date,
  to: Date
): T[] {
  const f = from.toISOString().slice(0, 10);
  const t = to.toISOString().slice(0, 10);
  return data.filter((d) => d.date >= f && d.date <= t);
}

export function computeKPISummary(
  currentMetrics: ReturnType<typeof generateDailyMetrics>,
  previousMetrics: ReturnType<typeof generateDailyMetrics>
): KPISummary {
  const sum = (arr: typeof currentMetrics, key: keyof (typeof arr)[0]) =>
    arr.reduce((acc, d) => acc + (d[key] as number), 0);

  const cur = {
    revenue: sum(currentMetrics, "revenue"),
    orders: sum(currentMetrics, "orders"),
    adsSpend: sum(currentMetrics, "adsSpend"),
    profit: sum(currentMetrics, "profit"),
    newCustomers: sum(currentMetrics, "newCustomers"),
    returningCustomers: sum(currentMetrics, "returningCustomers"),
    cancelled: sum(currentMetrics, "cancelledOrders"),
    returned: sum(currentMetrics, "returnedOrders"),
  };

  const prev = {
    revenue: sum(previousMetrics, "revenue"),
    orders: sum(previousMetrics, "orders"),
    adsSpend: sum(previousMetrics, "adsSpend"),
    profit: sum(previousMetrics, "profit"),
  };

  const aov = cur.orders > 0 ? cur.revenue / cur.orders : 0;
  const prevAov = prev.orders > 0 ? prev.revenue / prev.orders : 0;
  const roas = cur.adsSpend > 0 ? cur.revenue / cur.adsSpend : 0;
  const prevRoas = prev.adsSpend > 0 ? prev.revenue / prev.adsSpend : 0;

  return {
    totalRevenue: cur.revenue,
    totalOrders: cur.orders,
    aov,
    adsSpend: cur.adsSpend,
    roas,
    profit: cur.profit,
    cancelRate: cur.orders > 0 ? (cur.cancelled / cur.orders) * 100 : 0,
    returnRate: cur.orders > 0 ? (cur.returned / cur.orders) * 100 : 0,
    newCustomers: cur.newCustomers,
    returningCustomers: cur.returningCustomers,
    revenueChange: calcChange(cur.revenue, prev.revenue),
    ordersChange: calcChange(cur.orders, prev.orders),
    aovChange: calcChange(aov, prevAov),
    adsSpendChange: calcChange(cur.adsSpend, prev.adsSpend),
    roasChange: calcChange(roas, prevRoas),
    profitChange: calcChange(cur.profit, prev.profit),
  };
}

export function getChannelRevenue(metrics: ReturnType<typeof generateDailyMetrics>) {
  const totalRevenue = metrics.reduce((s, d) => s + d.revenue, 0);
  return generateChannelRevenue(totalRevenue);
}

// Tính KPI trực tiếp từ danh sách đơn hàng (dùng khi có filter status/channel)
export function computeKPIFromOrders(
  currentOrders: Order[],
  previousOrders: Order[],
  adsSpendCur = 0,
  adsSpendPrev = 0,
  newCustomers = 0,
  returningCustomers = 0,
): KPISummary {
  const sumKey = (arr: Order[], key: keyof Order) =>
    arr.reduce((s, o) => s + (o[key] as number), 0);

  const curRevenue = sumKey(currentOrders, "revenue");
  const curProfit  = sumKey(currentOrders, "profit");
  const curOrders  = currentOrders.length;
  const curCancelled = currentOrders.filter((o) => o.status === "Đã huỷ").length;
  const curReturned  = currentOrders.filter((o) => o.status === "Hoàn hàng").length;

  const prevRevenue = sumKey(previousOrders, "revenue");
  const prevProfit  = sumKey(previousOrders, "profit");
  const prevOrders  = previousOrders.length;

  const aov     = curOrders  > 0 ? curRevenue  / curOrders  : 0;
  const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0;
  const roas     = adsSpendCur  > 0 ? curRevenue  / adsSpendCur  : 0;
  const prevRoas = adsSpendPrev > 0 ? prevRevenue / adsSpendPrev : 0;

  return {
    totalRevenue: curRevenue,
    totalOrders:  curOrders,
    aov,
    adsSpend:  adsSpendCur,
    roas,
    profit:    curProfit,
    cancelRate:  curOrders > 0 ? (curCancelled / curOrders) * 100 : 0,
    returnRate:  curOrders > 0 ? (curReturned  / curOrders) * 100 : 0,
    newCustomers,
    returningCustomers,
    revenueChange: calcChange(curRevenue, prevRevenue),
    ordersChange:  calcChange(curOrders,  prevOrders),
    aovChange:     calcChange(aov,        prevAov),
    adsSpendChange: calcChange(adsSpendCur, adsSpendPrev),
    roasChange:    calcChange(roas,        prevRoas),
    profitChange:  calcChange(curProfit,   prevProfit),
  };
}
