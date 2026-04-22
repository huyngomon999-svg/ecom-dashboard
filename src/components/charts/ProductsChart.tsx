"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { formatVND, formatNumber } from "@/lib/formatters";
import type { Product, CategoryRevenue } from "@/data/types";

function TooltipProduct({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border shadow-[var(--shadow-dropdown)] p-3 text-sm bg-[var(--color-surface)] border-[var(--color-border)] max-w-[200px]">
      <p className="font-semibold text-[var(--color-text)] mb-1 text-xs leading-tight">{d.name}</p>
      <p className="text-xs text-[var(--color-text-muted)]">Doanh thu: <span className="font-semibold text-[var(--color-text)]">{formatVND(d.revenue)}</span></p>
      <p className="text-xs text-[var(--color-text-muted)]">Đã bán: <span className="font-semibold text-[var(--color-text)]">{formatNumber(d.quantitySold)}</span></p>
    </div>
  );
}

export function TopProductsChart({ data }: { data: Product[] }) {
  const top10 = data.slice(0, 10).map((p) => ({
    ...p,
    shortName: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 60, left: 130, bottom: 0 }} barSize={10}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatVND(v, true)}
        />
        <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={130} />
        <Tooltip content={<TooltipProduct />} cursor={{ fill: "var(--color-surface-2)" }} />
        <Bar dataKey="revenue" name="Doanh thu" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const CAT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899"];

export function CategoryPieChart({ data }: { data: CategoryRevenue[] }) {
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="revenue" nameKey="category" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: any) => formatVND(v)}
            contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.map((d, i) => (
          <div key={d.category} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
            <span className="text-xs text-[var(--color-text-muted)] flex-1 truncate">{d.category}</span>
            <span className="text-xs font-semibold text-[var(--color-text)]">{d.share.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
