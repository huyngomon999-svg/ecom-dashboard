"use client";
import { useMemo, useState } from "react";
import { Search, Package, DollarSign, TrendingUp, BarChart2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/shared/KPICard";
import { Card, CardHeader } from "@/components/shared/Card";
import { TopProductsChart, CategoryPieChart } from "@/components/charts/ProductsChart";
import { formatVND, formatNumber, formatPercent } from "@/lib/formatters";
import { allProducts, allCategoryRevenue } from "@/data/mock";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"revenue" | "quantitySold" | "profit" | "returnRate">("revenue");
  const [category, setCategory] = useState("");

  const categories = useMemo(() => {
    const s = new Set(allProducts.map((p) => p.category));
    return Array.from(s).sort();
  }, []);

  const filtered = useMemo(() => {
    let data = [...allProducts];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (category) data = data.filter((p) => p.category === category);
    return data.sort((a, b) => b[sortKey] - a[sortKey]);
  }, [search, category, sortKey]);

  const totalRevenue = useMemo(() => filtered.reduce((s, p) => s + p.revenue, 0), [filtered]);
  const totalProfit = useMemo(() => filtered.reduce((s, p) => s + p.profit, 0), [filtered]);
  const totalSold = useMemo(() => filtered.reduce((s, p) => s + p.quantitySold, 0), [filtered]);

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Sản phẩm" subtitle="Phân tích hiệu quả sản phẩm và danh mục" />

      <div className="flex-1 p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Tổng SKU" value={formatNumber(allProducts.length)} icon={Package} iconColor="blue" />
          <KPICard title="Tổng doanh thu" value={formatVND(totalRevenue, true) + "₫"} icon={DollarSign} iconColor="purple" />
          <KPICard title="Tổng lợi nhuận" value={formatVND(totalProfit, true) + "₫"} icon={TrendingUp} iconColor="green" />
          <KPICard title="Đã bán (SP)" value={formatNumber(totalSold)} icon={BarChart2} iconColor="orange" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader title="Top 10 sản phẩm bán chạy" description="Theo doanh thu" />
            <TopProductsChart data={allProducts} />
          </Card>
          <Card>
            <CardHeader title="Doanh thu theo danh mục" />
            <CategoryPieChart data={allCategoryRevenue} />
          </Card>
        </div>

        {/* Filters + table */}
        <Card noPadding>
          <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Tất cả sản phẩm</h3>
            <div className="flex items-center gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 px-3 rounded-lg border text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                className="h-9 px-3 rounded-lg border text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none"
              >
                <option value="revenue">Sắp theo doanh thu</option>
                <option value="quantitySold">Sắp theo số lượng</option>
                <option value="profit">Sắp theo lợi nhuận</option>
                <option value="returnRate">Sắp theo tỷ lệ hoàn</option>
              </select>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Tên sản phẩm, SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 pr-3 rounded-lg border text-sm bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-subtle)] focus:outline-none w-48"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {["#", "SKU", "Sản phẩm", "Danh mục", "Giá bán", "Giá vốn", "Đã bán", "Doanh thu", "Lợi nhuận", "Tỷ lệ hoàn"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
                  return (
                    <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors">
                      <td className="px-4 py-3 text-xs text-[var(--color-text-subtle)]">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">{p.sku}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-[var(--color-text)] max-w-[200px]">{p.name}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">{p.category}</td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text)] whitespace-nowrap">{formatVND(p.price)}</td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">{formatVND(p.costPrice)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[var(--color-text)]">{formatNumber(p.quantitySold)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[var(--color-text)] whitespace-nowrap">{formatVND(p.revenue, true)}₫</td>
                      <td className="px-4 py-3">
                        <div className={`text-xs font-semibold whitespace-nowrap ${p.profit >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                          {formatVND(p.profit, true)}₫
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)]">Margin {margin.toFixed(0)}%</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${p.returnRate > 3 ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"}`}>
                          {p.returnRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
