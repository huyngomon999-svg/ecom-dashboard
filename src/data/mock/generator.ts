import { addDays, format, subDays } from "date-fns";
import type {
  DailyMetric,
  ChannelRevenue,
  Order,
  DailyAdsMetric,
  AdsPerformance,
  Product,
  CategoryRevenue,
  CustomerMetric,
  TopCustomer,
  CustomerSegment,
  Channel,
  OrderStatus,
  PaymentStatus,
} from "../types";

// ─── Seeded random ───────────────────────────────────────────────────────────

let seed = 42;
function rand(min: number, max: number): number {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  const t = ((seed >>> 0) / 0xffffffff);
  return min + t * (max - min);
}
function randInt(min: number, max: number) { return Math.floor(rand(min, max + 1)); }
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function trendValue(base: number, day: number, total: number, noise = 0.12): number {
  const trend = 1 + (day / total) * 0.2;
  const weekday = new Date(Date.now() - (total - day) * 86400000).getDay();
  const wdBonus = weekday === 0 || weekday === 6 ? 1.15 : weekday === 5 ? 1.08 : 1;
  const n = 1 + (rand(0, 1) - 0.5) * noise;
  return base * trend * wdBonus * n;
}

// ─── Daily Metrics (90 days) ─────────────────────────────────────────────────

export function generateDailyMetrics(days = 90): DailyMetric[] {
  seed = 42;
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(today, days - 1 - i);
    const revenue = trendValue(48_000_000, i, days, 0.18);
    const orders = Math.round(trendValue(22, i, days, 0.2));
    const adsSpend = revenue * rand(0.07, 0.13);
    const profit = revenue * rand(0.18, 0.28) - adsSpend;
    return {
      date: format(d, "yyyy-MM-dd"),
      revenue: Math.round(revenue),
      orders,
      adsSpend: Math.round(adsSpend),
      profit: Math.round(profit),
      newCustomers: Math.round(orders * rand(0.45, 0.7)),
      returningCustomers: Math.round(orders * rand(0.3, 0.55)),
      cancelledOrders: Math.round(orders * rand(0.03, 0.08)),
      returnedOrders: Math.round(orders * rand(0.01, 0.04)),
    };
  });
}

// ─── Channel Revenue ─────────────────────────────────────────────────────────

export function generateChannelRevenue(totalRevenue: number): ChannelRevenue[] {
  seed = 77;
  const channels: { channel: Channel; weight: number }[] = [
    { channel: "TikTok Shop", weight: 0.34 },
    { channel: "Shopee", weight: 0.28 },
    { channel: "Website", weight: 0.22 },
    { channel: "Facebook", weight: 0.11 },
    { channel: "Zalo", weight: 0.05 },
  ];
  return channels.map(({ channel, weight }) => ({
    channel,
    revenue: Math.round(totalRevenue * weight * (1 + (rand(0, 1) - 0.5) * 0.05)),
    orders: Math.round(totalRevenue * weight / 450_000),
    share: weight * 100,
  }));
}

// ─── Orders ──────────────────────────────────────────────────────────────────

const CHANNELS: Channel[] = ["Website", "TikTok Shop", "Shopee", "Facebook", "Zalo"];
const ORDER_STATUSES: OrderStatus[] = ["Đã giao", "Đang giao", "Chờ xác nhận", "Đóng gói", "Đã huỷ", "Hoàn hàng"];
const STATUS_WEIGHTS = [0.58, 0.15, 0.09, 0.10, 0.05, 0.03];
const PAYMENT_STATUSES: PaymentStatus[] = ["Đã thanh toán", "Chưa thanh toán", "Hoàn tiền"];
const CUSTOMER_NAMES = [
  "Nguyễn Thị Mai", "Trần Văn Hùng", "Lê Thị Lan", "Phạm Minh Khoa",
  "Hoàng Thị Hoa", "Vũ Văn Nam", "Đặng Thị Thu", "Bùi Minh Tuấn",
  "Ngô Thị Hằng", "Trịnh Văn Đức", "Đinh Thị Ngọc", "Lý Minh Phong",
  "Phan Thị Linh", "Đỗ Văn Quân", "Hồ Thị Yến", "Võ Minh Long",
];

function pickWeighted<T>(items: T[], weights: number[]): T {
  const r = rand(0, 1);
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += weights[i];
    if (r < sum) return items[i];
  }
  return items[items.length - 1];
}

export function generateOrders(days = 90): Order[] {
  seed = 123;
  const today = new Date();
  const orders: Order[] = [];
  let idCounter = 10001;

  for (let d = 0; d < days; d++) {
    const date = format(subDays(today, days - 1 - d), "yyyy-MM-dd");
    const count = randInt(15, 32);
    for (let i = 0; i < count; i++) {
      const revenue = Math.round(rand(180_000, 1_200_000) / 1000) * 1000;
      const discount = Math.round(revenue * rand(0, 0.12) / 1000) * 1000;
      const shippingFee = pick([0, 15000, 20000, 25000, 30000]);
      const status = pickWeighted(ORDER_STATUSES, STATUS_WEIGHTS);
      const profit = Math.round((revenue - discount) * rand(0.18, 0.28) - shippingFee * 0.3);
      orders.push({
        id: `DH${idCounter++}`,
        date,
        channel: pick(CHANNELS),
        customerName: pick(CUSTOMER_NAMES),
        customerPhone: `09${randInt(10000000, 99999999)}`,
        itemCount: randInt(1, 5),
        revenue,
        discount,
        shippingFee,
        status,
        paymentStatus: status === "Đã huỷ" || status === "Hoàn hàng"
          ? "Hoàn tiền"
          : pick(["Đã thanh toán", "Đã thanh toán", "Đã thanh toán", "Chưa thanh toán"]),
        profit,
        trackingCode: status !== "Chờ xác nhận" && status !== "Đã huỷ"
          ? `GHTK${randInt(100000000, 999999999)}`
          : undefined,
      });
    }
  }
  return orders.sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Ads Metrics ─────────────────────────────────────────────────────────────

export function generateDailyAdsMetrics(days = 90): DailyAdsMetric[] {
  seed = 88;
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(today, days - 1 - i);
    const spend = trendValue(3_800_000, i, days, 0.2);
    const roas = rand(2.8, 4.8);
    const revenue = spend * roas;
    const impressions = Math.round(spend * rand(180, 260));
    const clicks = Math.round(impressions * rand(0.012, 0.028));
    const orders = Math.round(clicks * rand(0.028, 0.055));
    return {
      date: format(d, "yyyy-MM-dd"),
      spend: Math.round(spend),
      revenue: Math.round(revenue),
      impressions,
      clicks,
      orders,
      roas: Math.round(roas * 100) / 100,
      cpc: clicks > 0 ? Math.round(spend / clicks) : 0,
      cpm: Math.round((spend / impressions) * 1000),
      ctr: Math.round((clicks / impressions) * 10000) / 100,
      cpa: orders > 0 ? Math.round(spend / orders) : 0,
    };
  });
}

export function generateAdsPerformance(): AdsPerformance[] {
  seed = 55;
  const campaigns = [
    { name: "FB - Mùa hè bùng nổ", platform: "Facebook" as const },
    { name: "FB - Retargeting - All", platform: "Facebook" as const },
    { name: "FB - Lookalike - Top 1%", platform: "Facebook" as const },
    { name: "TikTok - Viral Trending", platform: "TikTok" as const },
    { name: "TikTok - Conversion - W", platform: "TikTok" as const },
    { name: "GG - Search Brand", platform: "Google" as const },
    { name: "GG - Shopping - All SKU", platform: "Google" as const },
  ];
  return campaigns.map((c, i) => {
    const spend = Math.round(rand(8_000_000, 45_000_000) / 100000) * 100000;
    const roas = rand(2.5, 5.2);
    const revenue = Math.round(spend * roas);
    const impressions = Math.round(spend * rand(150, 280));
    const clicks = Math.round(impressions * rand(0.01, 0.03));
    const orders = Math.round(clicks * rand(0.025, 0.06));
    return {
      campaignId: `camp_${i + 1}`,
      campaignName: c.name,
      platform: c.platform,
      spend,
      revenue,
      roas: Math.round(roas * 100) / 100,
      impressions,
      clicks,
      orders,
      cpc: clicks > 0 ? Math.round(spend / clicks) : 0,
      ctr: Math.round((clicks / impressions) * 10000) / 100,
      cpa: orders > 0 ? Math.round(spend / orders) : 0,
      status: pick(["active", "active", "active", "paused", "ended"]) as AdsPerformance["status"],
    };
  });
}

// ─── Products ────────────────────────────────────────────────────────────────

const PRODUCT_DATA = [
  { name: "Áo thun oversize unisex", sku: "AT-OS-001", category: "Áo thun", price: 285_000 },
  { name: "Quần jeans slim nam", sku: "QJ-SL-002", category: "Quần", price: 450_000 },
  { name: "Váy hoa midi nữ", sku: "VH-MD-003", category: "Váy", price: 320_000 },
  { name: "Áo sơ mi trắng công sở", sku: "SM-TG-004", category: "Áo sơ mi", price: 380_000 },
  { name: "Quần short kaki", sku: "QS-KK-005", category: "Quần", price: 220_000 },
  { name: "Áo khoác denim xanh", sku: "AK-DN-006", category: "Áo khoác", price: 620_000 },
  { name: "Đầm wrap crinkle", sku: "DM-WR-007", category: "Váy", price: 420_000 },
  { name: "Áo polo nam basic", sku: "PL-BK-008", category: "Áo thun", price: 265_000 },
  { name: "Quần tây âu slim", sku: "QT-SL-009", category: "Quần", price: 490_000 },
  { name: "Áo croptop ribbed", sku: "CT-RB-010", category: "Áo thun", price: 185_000 },
  { name: "Áo blazer basic nữ", sku: "BL-BK-011", category: "Áo khoác", price: 720_000 },
  { name: "Quần jogger cotton", sku: "JG-CT-012", category: "Quần", price: 280_000 },
  { name: "Set bộ linen mùa hè", sku: "SB-LN-013", category: "Set bộ", price: 580_000 },
  { name: "Chân váy chữ A midi", sku: "CV-CA-014", category: "Váy", price: 295_000 },
  { name: "Hoodie basic unisex", sku: "HD-BS-015", category: "Áo khoác", price: 440_000 },
];

export function generateProducts(): Product[] {
  seed = 33;
  return PRODUCT_DATA.map((p) => {
    const qtySold = randInt(80, 680);
    const revenue = p.price * qtySold * rand(0.92, 1.0);
    const costRatio = rand(0.42, 0.58);
    const costPrice = Math.round(p.price * costRatio);
    const profit = revenue - costPrice * qtySold;
    return {
      id: p.sku,
      sku: p.sku,
      name: p.name,
      category: p.category,
      price: p.price,
      costPrice,
      quantitySold: qtySold,
      revenue: Math.round(revenue),
      profit: Math.round(profit),
      returnRate: Math.round(rand(0.5, 4.5) * 10) / 10,
      aov: p.price * rand(1, 1.8),
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

export function generateCategoryRevenue(products: Product[]): CategoryRevenue[] {
  const map: Record<string, number> = {};
  let total = 0;
  products.forEach((p) => {
    map[p.category] = (map[p.category] || 0) + p.revenue;
    total += p.revenue;
  });
  return Object.entries(map)
    .map(([category, revenue]) => ({ category, revenue, share: (revenue / total) * 100 }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ─── Customers ───────────────────────────────────────────────────────────────

export function generateCustomerMetrics(days = 90): CustomerMetric[] {
  seed = 99;
  const today = new Date();
  return Array.from({ length: days }, (_, i) => ({
    date: format(subDays(today, days - 1 - i), "yyyy-MM-dd"),
    newCustomers: randInt(8, 22),
    returningCustomers: randInt(5, 16),
  }));
}

export function generateTopCustomers(): TopCustomer[] {
  seed = 66;
  const segments: TopCustomer["segment"][] = ["VIP", "Loyal", "Regular", "New", "At Risk"];
  const segWeights = [0.1, 0.2, 0.35, 0.25, 0.1];
  return Array.from({ length: 20 }, (_, i) => {
    const orders = randInt(3, 28);
    const aov = Math.round(rand(320_000, 1_200_000) / 10000) * 10000;
    return {
      id: `CUS${1001 + i}`,
      name: CUSTOMER_NAMES[i % CUSTOMER_NAMES.length],
      phone: `09${randInt(10000000, 99999999)}`,
      orderCount: orders,
      totalSpend: orders * aov,
      avgOrderValue: aov,
      lastOrderDate: format(subDays(new Date(), randInt(0, 30)), "yyyy-MM-dd"),
      segment: pickWeighted(segments, segWeights),
    };
  }).sort((a, b) => b.totalSpend - a.totalSpend);
}

export function generateCustomerSegments(): CustomerSegment[] {
  return [
    { segment: "VIP", count: 48, revenue: 142_000_000, share: 22 },
    { segment: "Loyal", count: 187, revenue: 198_000_000, share: 31 },
    { segment: "Regular", count: 412, revenue: 156_000_000, share: 24 },
    { segment: "New", count: 634, revenue: 98_000_000, share: 15 },
    { segment: "At Risk", count: 203, revenue: 52_000_000, share: 8 },
  ];
}
