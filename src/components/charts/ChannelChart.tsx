"use client";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatVND, formatNumber } from "@/lib/formatters";
import type { ChannelRevenue } from "@/data/types";

const CHANNEL_COLORS: Record<string, string> = {
  "TikTok Shop": "#ff2d55",
  "Shopee":      "#ee4d2d",
  "Website":     "#3b82f6",
  "Facebook":    "#1877f2",
  "Zalo":        "#0068ff",
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border shadow-[var(--shadow-dropdown)] p-3 text-sm bg-[var(--color-surface)] border-[var(--color-border)]">
      <p className="font-semibold text-[var(--color-text)] mb-1">{d.channel}</p>
      <p className="text-xs text-[var(--color-text-muted)]">Doanh thu: <span className="font-semibold text-[var(--color-text)]">{formatVND(d.revenue)}</span></p>
      <p className="text-xs text-[var(--color-text-muted)]">Tỷ lệ: <span className="font-semibold text-[var(--color-text)]">{d.share.toFixed(1)}%</span></p>
    </div>
  );
}

export function ChannelPieChart({ data }: { data: ChannelRevenue[] }) {
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="channel"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={72}
            paddingAngle={3}
          >
            {data.map((entry) => (
              <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.map((d) => (
          <div key={d.channel} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: CHANNEL_COLORS[d.channel] ?? "#94a3b8" }}
            />
            <span className="text-xs text-[var(--color-text-muted)] flex-1 truncate">{d.channel}</span>
            <span className="text-xs font-semibold text-[var(--color-text)]">{d.share.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChannelBarChart({ data }: { data: ChannelRevenue[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 80, bottom: 0 }} barSize={10}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatVND(v, true)}
        />
        <YAxis type="category" dataKey="channel" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-surface-2)" }} />
        <Bar dataKey="revenue" name="Doanh thu" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] ?? "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
