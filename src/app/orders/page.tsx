"use client";
import { useMemo, useState } from "react";
import {
  Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight as ChevronRightIcon,
  Upload, X, ShoppingCart, DollarSign, TrendingUp, XCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { FilterBar } from "@/components/shared/FilterBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card } from "@/components/shared/Card";
import { KPICard } from "@/components/shared/KPICard";
import { OrderImporter } from "@/components/shared/OrderImporter";
import type { ImportSource } from "@/components/shared/OrderImporter";
import { useDateRange } from "@/hooks/useDateRange";
import { formatVND, formatDateFull, formatNumber } from "@/lib/formatters";
import { allOrders, filterByDateRange } from "@/data/mock";
import type { Channel, Order, OrderStatus } from "@/data/types";

const PAGE_SIZE = 20;
const ORDER_STATUSES: OrderStatus[] = ["Đã giao", "Đang giao", "Chờ xác nhận", "Đóng gói", "Đã huỷ", "Hoàn hàng"];

type SortKey = "date" | "revenue" | "profit" | "itemCount";
type SortDir = "asc" | "desc";

function exportCSV(data: Order[]) {
  const headers = ["Mã đơn","Ngày","Kênh","Khách hàng","Số sản phẩm","Doanh thu","Giảm giá","Phí ship","Trạng thái","Thanh toán","Lợi nhuận"];
  const rows = data.map((o) => [
    o.id, o.date, o.channel, o.customerName, o.itemCount,
    o.revenue, o.discount, o.shippingFee, o.status, o.paymentStatus, o.profit,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "orders.csv"; a.click();
  URL.revokeObjectURL(url);
}

const SOURCE_LABELS: Record<ImportSource, string> = {
  "TikTok Shop": "TikTok Shop",
  "Facebook":    "Facebook",
};

export default function OrdersPage() {
  const { preset, setPreset, customRange, setCustomRange, dateRange } = useDateRange();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // ── Import state ──────────────────────────────────────────────────────────
  const [importSource, setImportSource]   = useState<ImportSource | null>(null);
  const [importedOrders, setImportedOrders] = useState<Order[] | null>(null);
  const [importLabel, setImportLabel]     = useState("");

  function handleImport(orders: Order[]) {
    setImportedOrders(orders);
    setImportLabel(`${orders.length.toLocaleString()} đơn từ ${importSource}`);
    setImportSource(null);
    setPage(1);
  }

  function clearImport() {
    setImportedOrders(null);
    setImportLabel("");
    setPage(1);
  }

  // ── Base dataset: imported or mock ────────────────────────────────────────
  const baseOrders = importedOrders ?? allOrders;

  const filtered = useMemo(() => {
    let data = filterByDateRange(baseOrders, dateRange.from, dateRange.to);
    if (channels.length > 0)  data = data.filter((o) => channels.includes(o.channel));
    if (statusFilter)          data = data.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    }
    return [...data].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "date") return mul * a.date.localeCompare(b.date);
      return mul * (a[sortKey] - b[sortKey]);
    });
  }, [baseOrders, dateRange, channels, statusFilter, search, sortKey, sortDir]);

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paged       = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalRevenue = useMemo(() => filtered.reduce((s, o) => s + o.revenue, 0), [filtered]);
  const totalProfit  = useMemo(() => filtered.reduce((s, o) => s + o.profit,  0), [filtered]);
  const cancelCount  = useMemo(() => filtered.filter((o) => o.status === "Đã huỷ").length, [filtered]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp size={12} className="opacity-20" />;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Đơn hàng" subtitle="Quản lý và tra cứu đơn hàng" />

      <div className="flex-1 p-6 space-y-6">
        {/* ── Import banner ── */}
        {importedOrders && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary-soft)]">
            <p className="text-xs font-medium text-[var(--color-primary)]">
              Đang hiển thị dữ liệu thực: <span className="font-semibold">{importLabel}</span>
              {filtered.length < importedOrders.length && (
                <span className="font-normal"> · {filtered.length.toLocaleString()} đơn khớp bộ lọc hiện tại</span>
              )}
            </p>
            <button
              onClick={clearImport}
              className="h-7 px-3 rounded-lg text-xs font-medium border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-white/20 transition-colors inline-flex items-center gap-1"
            >
              <X size={12} /> Xoá import
            </button>
          </div>
        )}

        {/* ── Importer panel ── */}
        {importSource && (
          <OrderImporter
            source={importSource}
            onImport={handleImport}
            onClose={() => setImportSource(null)}
          />
        )}

        {/* ── Summary KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Tổng đơn"    value={formatNumber(filtered.length)}           icon={ShoppingCart} iconColor="blue" />
          <KPICard title="Tổng doanh thu" value={formatVND(totalRevenue, true) + "₫"} icon={DollarSign}   iconColor="purple" />
          <KPICard title="Lợi nhuận"   value={formatVND(totalProfit, true) + "₫"}     icon={TrendingUp}   iconColor="green" />
          <KPICard title="Đơn huỷ"     value={formatNumber(cancelCount)}               icon={XCircle}      iconColor="red" />
        </div>

        {/* ── Filters + toolbar ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <FilterBar selectedChannels={channels} onChannelsChange={(c) => { setChannels(c); setPage(1); }} />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ""); setPage(1); }}
              className="h-9 px-3 rounded-lg border text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20"
            >
              <option value="">Tất cả trạng thái</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Tìm mã đơn, khách hàng..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 pl-9 pr-3 rounded-lg border text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 w-52"
              />
            </div>
            <DateRangePicker
              preset={preset}
              dateRange={dateRange}
              onPresetChange={setPreset}
              onCustomRange={(r) => { setCustomRange(r); setPage(1); }}
            />

            {/* Import buttons */}
            {!importSource && (
              <div className="flex items-center gap-1">
                {(["TikTok Shop","Facebook"] as ImportSource[]).map((src) => (
                  <button
                    key={src}
                    onClick={() => { setImportSource(src); setPage(1); }}
                    className="h-9 px-3 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
                  >
                    <Upload size={13} /> {SOURCE_LABELS[src]}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => exportCSV(filtered)}
              className="h-9 px-3 rounded-lg border text-sm font-medium inline-flex items-center gap-2 bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
            >
              <Download size={14} /> CSV
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {[
                    { label: "Mã đơn",    key: null },
                    { label: "Ngày",      key: "date"      as SortKey },
                    { label: "Kênh",      key: null },
                    { label: "Khách hàng",key: null },
                    { label: "SL",        key: "itemCount" as SortKey },
                    { label: "Doanh thu", key: "revenue"   as SortKey },
                    { label: "Giảm giá",  key: null },
                    { label: "Phí ship",  key: null },
                    { label: "Trạng thái",key: null },
                    { label: "Thanh toán",key: null },
                    { label: "Lợi nhuận", key: "profit"   as SortKey },
                  ].map(({ label, key }) => (
                    <th
                      key={label}
                      onClick={key ? () => toggleSort(key) : undefined}
                      className={`text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap ${key ? "cursor-pointer hover:text-[var(--color-text)] select-none" : ""}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {key && <SortIcon k={key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-sm text-[var(--color-text-muted)]">
                      {importedOrders
                        ? "Không có đơn nào trong khoảng ngày này — thử điều chỉnh bộ lọc ngày"
                        : "Không có đơn hàng nào"}
                    </td>
                  </tr>
                ) : paged.map((o) => (
                  <tr key={o.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-primary)] font-semibold">{o.id}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">{formatDateFull(o.date)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text)]">{o.channel}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-[var(--color-text)]">{o.customerName}</div>
                      {o.customerPhone && <div className="text-[10px] text-[var(--color-text-muted)]">{o.customerPhone}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-center text-[var(--color-text)]">{o.itemCount}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-[var(--color-text)] whitespace-nowrap">{formatVND(o.revenue)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-danger)] whitespace-nowrap">{o.discount > 0 ? `-${formatVND(o.discount)}` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">{o.shippingFee > 0 ? formatVND(o.shippingFee) : "Free"}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} type="order" /></td>
                    <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} type="payment" /></td>
                    <td className={`px-4 py-3 text-xs font-semibold whitespace-nowrap ${o.profit >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                      {formatVND(o.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)]">
                {formatNumber((page - 1) * PAGE_SIZE + 1)}–{formatNumber(Math.min(page * PAGE_SIZE, filtered.length))} / {formatNumber(filtered.length)} đơn
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                        p === page ? "bg-[var(--color-primary)] text-white" : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                      }`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRightIcon size={14} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
