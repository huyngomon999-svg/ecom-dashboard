"use client";
import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, AlertCircle, Activity, Users, Eye, MousePointerClick, TrendingDown } from "lucide-react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader } from "@/components/shared/Card";
import { KPICard } from "@/components/shared/KPICard";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type RowData = Record<string, string | number>;

interface MappedColumns {
  date?: string;
  sessions?: string;
  users?: string;
  pageviews?: string;
  bounceRate?: string;
  source?: string;
  [key: string]: string | undefined;
}

const CANDIDATE_MAPS: Record<keyof MappedColumns, string[]> = {
  date:       ["date", "ngày", "day", "time", "thời gian", "week", "tuần", "month", "tháng"],
  sessions:   ["sessions", "session", "phiên", "lượt truy cập", "visits", "visit"],
  users:      ["users", "user", "người dùng", "nguoidung", "unique visitors"],
  pageviews:  ["pageviews", "pageview", "page views", "views", "lượt xem trang", "luot xem"],
  bounceRate: ["bounce rate", "bouncerate", "bounce", "tỷ lệ thoát", "ty le thoat"],
  source:     ["source", "nguồn", "channel", "kênh", "medium", "traffic source"],
};

function autoDetect(headers: string[]): MappedColumns {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const result: MappedColumns = {};
  for (const [key, candidates] of Object.entries(CANDIDATE_MAPS)) {
    const idx = lower.findIndex((h) => candidates.some((c) => h.includes(c)));
    if (idx !== -1) result[key as keyof MappedColumns] = headers[idx];
  }
  return result;
}

function parseFile(file: File): Promise<{ headers: string[]; rows: RowData[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<RowData>(ws, { defval: "" });
        if (json.length === 0) { reject(new Error("File trống hoặc không có dữ liệu")); return; }
        const headers = Object.keys(json[0]);
        resolve({ headers, rows: json });
      } catch {
        reject(new Error("Không thể đọc file. Hãy kiểm tra định dạng CSV/Excel."));
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file"));
    reader.readAsArrayBuffer(file);
  });
}

function numVal(row: RowData, col: string | undefined): number {
  if (!col) return 0;
  const v = row[col];
  if (typeof v === "number") return v;
  const s = String(v).replace(/[%,\s]/g, "");
  return parseFloat(s) || 0;
}

export default function TrafficPage() {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [cols, setCols] = useState<MappedColumns>({});
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadFile(file: File) {
    setError(null);
    try {
      const { headers: h, rows: r } = await parseFile(file);
      setFileName(file.name);
      setHeaders(h);
      setRows(r);
      setCols(autoDetect(h));
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const clearFile = () => {
    setFileName(null); setHeaders([]); setRows([]); setCols({}); setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // KPIs
  const totalSessions   = rows.reduce((s, r) => s + numVal(r, cols.sessions), 0);
  const totalUsers      = rows.reduce((s, r) => s + numVal(r, cols.users), 0);
  const totalPageviews  = rows.reduce((s, r) => s + numVal(r, cols.pageviews), 0);
  const avgBounce       = rows.length > 0 && cols.bounceRate
    ? rows.reduce((s, r) => s + numVal(r, cols.bounceRate), 0) / rows.length
    : null;

  // Time-series chart data
  const chartData = cols.date
    ? rows.map((r) => ({
        date: String(r[cols.date!] ?? ""),
        Sessions: cols.sessions ? numVal(r, cols.sessions) : undefined,
        Users: cols.users ? numVal(r, cols.users) : undefined,
        Pageviews: cols.pageviews ? numVal(r, cols.pageviews) : undefined,
      }))
    : [];

  // Source breakdown
  const sourceData = (() => {
    if (!cols.source) return [];
    const acc: Record<string, number> = {};
    rows.forEach((r) => {
      const src = String(r[cols.source!] || "Unknown");
      acc[src] = (acc[src] || 0) + numVal(r, cols.sessions || cols.users);
    });
    return Object.entries(acc)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  })();

  const hasData = rows.length > 0;

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Traffic" subtitle="Phân tích lượt truy cập từ file upload" />

      <div className="flex-1 p-6 space-y-6">
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !hasData && fileRef.current?.click()}
          className={cn(
            "relative rounded-xl border-2 border-dashed transition-all",
            hasData
              ? "border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              : "cursor-pointer p-10 text-center",
            dragging
              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
              : hasData
              ? ""
              : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-2)]"
          )}
        >
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />

          {hasData ? (
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-[var(--color-primary)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)] truncate">{fileName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{formatNumber(rows.length)} hàng · {headers.length} cột</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-danger)] transition-colors"
              >
                <X size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                className="h-8 px-3 rounded-lg border text-xs font-medium border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                Đổi file
              </button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] flex items-center justify-center mx-auto mb-4">
                <Upload size={22} className="text-[var(--color-primary)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--color-text)] mb-1">Kéo thả hoặc click để upload file</p>
              <p className="text-xs text-[var(--color-text-muted)]">Hỗ trợ CSV, Excel (.xlsx, .xls) — tối đa 50MB</p>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-danger-soft)] border border-[var(--color-danger)] text-[var(--color-danger)]">
            <AlertCircle size={16} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {hasData && (
          <>
            {/* Column mapping */}
            <Card>
              <CardHeader title="Ánh xạ cột" description="Tự động phát hiện — chỉnh lại nếu cần" />
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 pt-1">
                {(["date", "sessions", "users", "pageviews", "bounceRate", "source"] as const).map((key) => {
                  const labels: Record<string, string> = {
                    date: "Ngày/Thời gian", sessions: "Sessions", users: "Users",
                    pageviews: "Pageviews", bounceRate: "Bounce Rate", source: "Nguồn traffic",
                  };
                  return (
                    <div key={key}>
                      <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">{labels[key]}</label>
                      <select
                        value={cols[key] ?? ""}
                        onChange={(e) => setCols((prev) => ({ ...prev, [key]: e.target.value || undefined }))}
                        className="w-full h-8 px-2 rounded-lg border text-xs bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20"
                      >
                        <option value="">— không dùng —</option>
                        {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard title="Tổng Sessions" value={cols.sessions ? formatNumber(totalSessions) : "—"} icon={Activity} iconColor="blue" />
              <KPICard title="Tổng Users" value={cols.users ? formatNumber(totalUsers) : "—"} icon={Users} iconColor="purple" />
              <KPICard title="Tổng Pageviews" value={cols.pageviews ? formatNumber(totalPageviews) : "—"} icon={Eye} iconColor="green" />
              <KPICard
                title="Avg Bounce Rate"
                value={avgBounce !== null ? `${avgBounce.toFixed(1)}%` : "—"}
                icon={TrendingDown}
                iconColor="orange"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Time series */}
              {chartData.length > 0 && (cols.sessions || cols.users || cols.pageviews) && (
                <Card className="xl:col-span-2">
                  <CardHeader title="Xu hướng theo thời gian" description={`${chartData.length} điểm dữ liệu`} />
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                        interval={Math.max(0, Math.floor(chartData.length / 8) - 1)}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {cols.sessions  && <Line type="monotone" dataKey="Sessions"  stroke="#3b82f6" strokeWidth={2} dot={false} />}
                      {cols.users     && <Line type="monotone" dataKey="Users"     stroke="#6366f1" strokeWidth={2} dot={false} />}
                      {cols.pageviews && <Line type="monotone" dataKey="Pageviews" stroke="#10b981" strokeWidth={2} dot={false} />}
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Source breakdown */}
              {sourceData.length > 0 && (
                <Card className={chartData.length > 0 && (cols.sessions || cols.users || cols.pageviews) ? "" : "xl:col-span-3"}>
                  <CardHeader title="Phân bổ nguồn traffic" />
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sourceData} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                      <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>

            {/* Data table */}
            <Card noPadding>
              <div className="p-5 border-b border-[var(--color-border)]">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Dữ liệu thô</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Hiển thị {Math.min(100, rows.length)} / {formatNumber(rows.length)} hàng</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      {headers.map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap">
                          {h}
                          {Object.values(cols).includes(h) && (
                            <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] align-middle" />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((row, i) => (
                      <tr key={i} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors">
                        {headers.map((h) => (
                          <td key={h} className="px-4 py-2.5 text-xs text-[var(--color-text)] whitespace-nowrap">{String(row[h] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Empty state */}
        {!hasData && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
              <MousePointerClick size={28} className="text-[var(--color-text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-1">Chưa có dữ liệu traffic</p>
            <p className="text-xs text-[var(--color-text-muted)] max-w-xs">
              Upload file CSV hoặc Excel chứa dữ liệu lượt truy cập. Hệ thống tự động nhận diện các cột.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
