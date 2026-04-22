"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, AlertCircle, Activity, Users, Eye, TrendingDown, Plus, Trash2, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer, LineChart, Line,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { format } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader } from "@/components/shared/Card";
import { KPICard } from "@/components/shared/KPICard";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  loadTraffic, appendTraffic, deleteTrafficFile, clearTraffic,
  type TrafficStore, type TrafficRow, EMPTY_TRAFFIC,
} from "@/lib/trafficStore";

// ─── File parsing ─────────────────────────────────────────────────────────────

type RawRow = Record<string, string | number>;

interface ColMap {
  date?: string;
  sessions?: string;
  users?: string;
  pageviews?: string;
  bounceRate?: string;
  source?: string;
}

const CANDIDATES: Record<keyof ColMap, string[]> = {
  date:       ["date","ngày","day","time","thời gian","week","tuần","month","tháng","dimension","ga:date"],
  sessions:   ["sessions","session","phiên","lượt truy cập","visits","visit","ga:sessions"],
  users:      ["users","user","người dùng","unique visitors","active users","ga:users"],
  pageviews:  ["pageviews","pageview","page views","views","lượt xem","ga:pageviews"],
  bounceRate: ["bounce rate","bouncerate","bounce","tỷ lệ thoát","ga:bouncerate"],
  source:     ["source","nguồn","channel","kênh","medium","traffic source","default channel"],
};

function autoDetect(headers: string[]): ColMap {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const result: ColMap = {};
  for (const [key, cands] of Object.entries(CANDIDATES)) {
    const idx = lower.findIndex((h) => cands.some((c) => h.includes(c)));
    if (idx !== -1) (result as Record<string, string>)[key] = headers[idx];
  }
  return result;
}

function numVal(row: RawRow, col: string | undefined): number {
  if (!col) return 0;
  const v = row[col];
  if (typeof v === "number") return v;
  return parseFloat(String(v).replace(/[%,\s]/g, "")) || 0;
}

function parseFile(file: File): Promise<{ headers: string[]; rows: RawRow[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target!.result as ArrayBuffer), { type: "array" });
        const json = XLSX.utils.sheet_to_json<RawRow>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        if (!json.length) { reject(new Error("File trống")); return; }
        resolve({ headers: Object.keys(json[0]), rows: json });
      } catch { reject(new Error("Không đọc được file — kiểm tra định dạng CSV/Excel")); }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file"));
    reader.readAsArrayBuffer(file);
  });
}

function convertRows(rows: RawRow[], cols: ColMap): Omit<TrafficRow, "_fileId">[] {
  return rows
    .map((row) => ({
      date:          cols.date        ? String(row[cols.date]   ?? "") : "",
      sessions:      numVal(row, cols.sessions),
      users:         numVal(row, cols.users),
      pageviews:     numVal(row, cols.pageviews),
      bounceRate:    numVal(row, cols.bounceRate),
      trafficSource: cols.source      ? String(row[cols.source] ?? "") : "",
    }))
    .filter((r) => r.date !== "" || r.sessions > 0 || r.users > 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

const COL_LABELS: Record<keyof ColMap, string> = {
  date: "Ngày/Thời gian", sessions: "Sessions", users: "Users",
  pageviews: "Pageviews", bounceRate: "Bounce Rate", source: "Nguồn traffic",
};

type UploadStep = "upload" | "map";

export default function TrafficPage() {
  const [store, setStore] = useState<TrafficStore>(EMPTY_TRAFFIC);
  const [showUploader, setShowUploader] = useState(false);

  // Upload flow state
  const [uploadStep, setUploadStep] = useState<UploadStep>("upload");
  const [fileName, setFileName]     = useState("");
  const [headers, setHeaders]       = useState<string[]>([]);
  const [rawRows, setRawRows]       = useState<RawRow[]>([]);
  const [cols, setCols]             = useState<ColMap>({});
  const [error, setError]           = useState("");
  const [dragging, setDragging]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => { setStore(loadTraffic()); }, []);

  async function handleFile(file: File) {
    setError("");
    try {
      const { headers: h, rows: r } = await parseFile(file);
      setFileName(file.name);
      setHeaders(h);
      setRawRows(r);
      setCols(autoDetect(h));
      setUploadStep("map");
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  function confirmImport() {
    const converted = convertRows(rawRows, cols);
    const next = appendTraffic(converted, { name: fileName, rowCount: converted.length });
    setStore(next);
    resetUploader();
  }

  function resetUploader() {
    setShowUploader(false);
    setUploadStep("upload");
    setFileName(""); setHeaders([]); setRawRows([]); setCols({}); setError("");
  }

  function handleDeleteFile(id: string) {
    setStore(deleteTrafficFile(id));
  }

  function handleClearAll() {
    clearTraffic();
    setStore(EMPTY_TRAFFIC);
  }

  // ── Aggregations ──────────────────────────────────────────────────────────
  const totalSessions  = store.rows.reduce((s, r) => s + r.sessions,  0);
  const totalUsers     = store.rows.reduce((s, r) => s + r.users,     0);
  const totalPageviews = store.rows.reduce((s, r) => s + r.pageviews, 0);
  const avgBounce = store.rows.length > 0 && store.rows.some((r) => r.bounceRate > 0)
    ? store.rows.reduce((s, r) => s + r.bounceRate, 0) / store.rows.filter((r) => r.bounceRate > 0).length
    : null;

  // Time-series: group by date, sum sessions/users/pageviews
  const chartData = (() => {
    const map: Record<string, { sessions: number; users: number; pageviews: number }> = {};
    store.rows.forEach((r) => {
      if (!r.date) return;
      if (!map[r.date]) map[r.date] = { sessions: 0, users: 0, pageviews: 0 };
      map[r.date].sessions  += r.sessions;
      map[r.date].users     += r.users;
      map[r.date].pageviews += r.pageviews;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  })();

  // Source breakdown
  const sourceData = (() => {
    const acc: Record<string, number> = {};
    store.rows.forEach((r) => {
      const src = r.trafficSource || "Không rõ";
      acc[src] = (acc[src] || 0) + r.sessions;
    });
    return Object.entries(acc)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  })();

  const hasData = store.rows.length > 0;

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Traffic" subtitle="Phân tích lượt truy cập — dữ liệu lưu trữ theo session" />

      <div className="flex-1 p-6 space-y-6">

        {/* ── File source bar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { setShowUploader((p) => !p); if (!showUploader) setUploadStep("upload"); }}
            className={cn(
              "h-9 px-3 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors",
              showUploader
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
            )}
          >
            <Plus size={13} /> Thêm file mới
          </button>

          {store.files.map((f) => (
            <div key={f.id} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)]">
              <FileText size={12} className="text-[var(--color-primary)]" />
              <span className="max-w-[160px] truncate">{f.name}</span>
              <span className="text-[var(--color-text-muted)]">· {f.rowCount.toLocaleString()} hàng</span>
              <button onClick={() => handleDeleteFile(f.id)} className="ml-1 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}

          {hasData && (
            <button onClick={handleClearAll} className="h-9 px-3 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] transition-colors">
              <Trash2 size={13} /> Xoá tất cả
            </button>
          )}
        </div>

        {/* ── Upload panel ── */}
        {showUploader && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {uploadStep === "upload" ? "Chọn file" : `Ánh xạ cột — ${fileName}`}
              </p>
              <button onClick={resetUploader} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]">
                <X size={15} />
              </button>
            </div>
            <div className="p-5">
              {/* Step 1: Upload */}
              {uploadStep === "upload" && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all",
                    dragging ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                             : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-2)]"
                  )}
                >
                  <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  <Upload size={20} className="text-[var(--color-primary)] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[var(--color-text)] mb-1">Kéo thả hoặc click để chọn file</p>
                  <p className="text-xs text-[var(--color-text-muted)]">CSV, Excel (.xlsx, .xls) — dữ liệu sẽ được thêm vào kho hiện có</p>
                  {error && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-[var(--color-danger)] text-xs">
                      <AlertCircle size={13} /> {error}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Column mapping */}
              {uploadStep === "map" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-2)] text-xs">
                    <FileText size={14} className="text-[var(--color-primary)]" />
                    <span className="font-medium text-[var(--color-text)] truncate">{fileName}</span>
                    <span className="text-[var(--color-text-muted)]">· {rawRows.length.toLocaleString()} hàng · {headers.length} cột</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {(Object.keys(COL_LABELS) as (keyof ColMap)[]).map((key) => (
                      <div key={key}>
                        <label className="text-[11px] font-medium text-[var(--color-text-muted)] block mb-1">{COL_LABELS[key]}</label>
                        <select
                          value={cols[key] ?? ""}
                          onChange={(e) => setCols((p) => ({ ...p, [key]: e.target.value || undefined }))}
                          className={cn(
                            "w-full h-8 px-2 rounded-lg border text-xs bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none",
                            cols[key] ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"
                          )}
                        >
                          <option value="">— không dùng —</option>
                          {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setUploadStep("upload")}
                      className="h-9 px-4 rounded-lg border text-xs font-medium border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors">
                      Quay lại
                    </button>
                    <button
                      onClick={confirmImport}
                      className="h-9 px-4 rounded-lg text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={13} /> Thêm {convertRows(rawRows, cols).length.toLocaleString()} hàng vào kho
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Has data: show dashboard ── */}
        {hasData && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard title="Tổng Sessions"   value={formatNumber(totalSessions)}             icon={Activity}     iconColor="blue" />
              <KPICard title="Tổng Users"      value={formatNumber(totalUsers)}                icon={Users}        iconColor="purple" />
              <KPICard title="Tổng Pageviews"  value={formatNumber(totalPageviews)}            icon={Eye}          iconColor="green" />
              <KPICard title="Avg Bounce Rate" value={avgBounce !== null ? `${avgBounce.toFixed(1)}%` : "—"} icon={TrendingDown} iconColor="orange" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {chartData.length > 0 && (
                <Card className="xl:col-span-2">
                  <CardHeader title="Xu hướng theo thời gian" description={`${chartData.length} điểm · ${store.files.length} file`} />
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                        interval={Math.max(0, Math.floor(chartData.length / 8) - 1)} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {store.rows.some((r) => r.sessions  > 0) && <Line type="monotone" dataKey="sessions"  name="Sessions"  stroke="#3b82f6" strokeWidth={2} dot={false} />}
                      {store.rows.some((r) => r.users     > 0) && <Line type="monotone" dataKey="users"     name="Users"     stroke="#6366f1" strokeWidth={2} dot={false} />}
                      {store.rows.some((r) => r.pageviews > 0) && <Line type="monotone" dataKey="pageviews" name="Pageviews" stroke="#10b981" strokeWidth={2} dot={false} />}
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {sourceData.length > 1 && (
                <Card>
                  <CardHeader title="Phân bổ nguồn traffic" />
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sourceData} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                      <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="value" name="Sessions" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>

            {/* Data table */}
            <Card noPadding>
              <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Dữ liệu thô</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {Math.min(200, store.rows.length).toLocaleString()} / {store.rows.length.toLocaleString()} hàng
                  </p>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{store.files.length} file · cột đánh dấu <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] align-middle" /> là từ file</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      {["Ngày","Sessions","Users","Pageviews","Bounce Rate","Nguồn","File"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {store.rows.slice(0, 200).map((row, i) => {
                      const file = store.files.find((f) => f.id === row._fileId);
                      return (
                        <tr key={i} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors">
                          <td className="px-4 py-2.5 text-xs text-[var(--color-text)] whitespace-nowrap">{row.date}</td>
                          <td className="px-4 py-2.5 text-xs font-semibold text-[var(--color-text)]">{row.sessions > 0 ? formatNumber(row.sessions) : "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-[var(--color-text)]">{row.users > 0 ? formatNumber(row.users) : "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-[var(--color-text)]">{row.pageviews > 0 ? formatNumber(row.pageviews) : "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-[var(--color-text-muted)]">{row.bounceRate > 0 ? `${row.bounceRate.toFixed(1)}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-[var(--color-text-muted)] max-w-[120px] truncate">{row.trafficSource || "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-[var(--color-text-subtle)] max-w-[120px] truncate">{file?.name ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* ── Empty state ── */}
        {!hasData && !showUploader && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mb-4">
              <Activity size={28} className="text-[var(--color-text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-1">Chưa có dữ liệu traffic</p>
            <p className="text-xs text-[var(--color-text-muted)] max-w-xs mb-4">
              Upload file CSV/Excel từ Google Analytics, Facebook, TikTok... Dữ liệu được lưu trong trình duyệt và sẽ không mất khi tải lại trang.
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="h-9 px-4 rounded-lg text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] inline-flex items-center gap-1.5 transition-colors"
            >
              <Upload size={13} /> Upload file đầu tiên
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
