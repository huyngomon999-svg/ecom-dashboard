// ─── Channels ───────────────────────────────────────────────────────────────

export type Channel = "Website" | "TikTok Shop" | "Shopee" | "Facebook" | "Zalo";

export const CHANNELS: Channel[] = ["Website", "TikTok Shop", "Shopee", "Facebook", "Zalo"];

// ─── Date Range ──────────────────────────────────────────────────────────────

export type DatePreset = "today" | "7d" | "30d" | "90d" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

// ─── Revenue / Daily Metrics ─────────────────────────────────────────────────

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
  adsSpend: number;
  profit: number;
  newCustomers: number;
  returningCustomers: number;
  cancelledOrders: number;
  returnedOrders: number;
}

export interface ChannelRevenue {
  channel: Channel;
  revenue: number;
  orders: number;
  share: number; // percent
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "Đã giao"
  | "Đang giao"
  | "Chờ xác nhận"
  | "Đã huỷ"
  | "Hoàn hàng"
  | "Đóng gói";

export type PaymentStatus = "Đã thanh toán" | "Chưa thanh toán" | "Hoàn tiền";

export interface Order {
  id: string;
  date: string; // YYYY-MM-DD
  channel: Channel;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  revenue: number;
  discount: number;
  shippingFee: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  profit: number;
  trackingCode?: string;
}

// ─── Ads / Marketing ─────────────────────────────────────────────────────────

export interface DailyAdsMetric {
  date: string;
  spend: number;
  revenue: number; // attributed revenue
  impressions: number;
  clicks: number;
  orders: number;
  roas: number;
  cpc: number;
  cpm: number;
  ctr: number;
  cpa: number;
}

export interface AdsPerformance {
  campaignId: string;
  campaignName: string;
  platform: "Facebook" | "TikTok" | "Google";
  spend: number;
  revenue: number;
  roas: number;
  impressions: number;
  clicks: number;
  orders: number;
  cpc: number;
  ctr: number;
  cpa: number;
  status: "active" | "paused" | "ended";
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  image?: string;
  price: number;
  costPrice: number;
  quantitySold: number;
  revenue: number;
  profit: number;
  returnRate: number; // percent
  aov: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  share: number;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export interface CustomerMetric {
  date: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpend: number;
  avgOrderValue: number;
  lastOrderDate: string;
  segment: "VIP" | "Loyal" | "Regular" | "New" | "At Risk";
}

export interface CustomerSegment {
  segment: string;
  count: number;
  revenue: number;
  share: number;
}

// ─── KPI Summary ─────────────────────────────────────────────────────────────

export interface KPISummary {
  totalRevenue: number;
  totalOrders: number;
  aov: number;
  adsSpend: number;
  roas: number;
  profit: number;
  cancelRate: number;
  returnRate: number;
  newCustomers: number;
  returningCustomers: number;
  // change vs previous period
  revenueChange: number;
  ordersChange: number;
  aovChange: number;
  adsSpendChange: number;
  roasChange: number;
  profitChange: number;
}
