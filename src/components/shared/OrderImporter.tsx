"use client";
import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { Upload, FileText, X, Check, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/formatters";
import type { Order, OrderStatus, PaymentStatus, Channel } from "@/data/types";

export type ImportSource = "TikTok Shop" | "Facebook";

// ─── Column mapping ───────────────────────────────────────────────────────────

interface ColMap {
  orderId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  revenue: string;
  discount: string;
  shippingFee: string;
  itemCount: string;
  status: string;
  paymentStatus: string;
}

const COL_LABELS: Record<keyof ColMap, string> = {
  orderId:       "Mã đơn hàng *",
  date:          "Ngày đặt *",
  revenue:       "Tổng tiền *",
  customerName:  "Tên khách hàng",
  customerPhone: "Số điện thoại",
  discount:      "Giảm giá",
  shippingFee:   "Phí vận chuyển",
  itemCount:     "Số lượng SP",
  status:        "Trạng thái đơn",
  paymentStatus: "Trạng thái TT",
};

const CANDIDATES: Record<keyof ColMap, string[]> = {
  orderId:       ["order id","mã đơn","order number","id đơn","orderId","order no","mã đơn hàng","order_id","so don"],
  date:          ["date","ngày","created","order date","ngày tạo","thời gian","created at","order time","purchase date","ngay dat","order created"],
  customerName:  ["customer","buyer","người mua","tên khách","khách hàng","recipient","buyer name","customer name","tên người nhận","buyer username"],
  customerPhone: ["phone","sdt","số điện thoại","mobile","contact","điện thoại","recipient phone","buyer phone"],
  revenue:       ["total","tổng","revenue","amount","order total","total amount","tổng tiền","thành tiền","doanh thu","payment amount","grand total","tong tien","order amount"],
  discount:      ["discount","giảm giá","coupon","voucher","promo","seller discount","platform discount","discount amount","giam gia"],
  shippingFee:   ["shipping","vận chuyển","phí giao","freight","delivery fee","ship fee","shipping fee","delivery charge","phi ship"],
  itemCount:     ["quantity","số lượng","item","qty","items","units","sl","item count","so luong","quantity ordered"],
  status:        ["status","trạng thái","order status","fulfillment","tình trạng","trang thai","fulfillment status"],
  paymentStatus: ["payment status","payment","thanh toán","paid","trạng thái thanh toán","payment method"],
};

function autoDetect(headers: string[]): Partial<ColMap> {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const result: Partial<ColMap> = {};
  for (const [key, cands] of Object.entries(CANDIDATES)) {
    const idx = lower.findIndex((h) => cands.some((c) => h.includes(c) || c.includes(h)));
    if (idx !== -1) (result as Record<string, string>)[key] = headers[idx];
  }
  return result;
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeStatus(raw: string): OrderStatus {
  const s = (raw ?? "").toLowerCase();
  if (/delivered|complete|hoàn thành|đã giao|thành công|giao thành công/i.test(s)) return "Đã giao";
  if (/shipping|shipped|in transit|đang giao|đang vận|vận chuyển/i.test(s))         return "Đang giao";
  if (/pack|processing|preparing|đóng gói|chờ lấy|ready to ship|picked up/i.test(s)) return "Đóng gói";
  if (/pending|confirm|chờ xác|chờ thanh|new|to pay|unpaid/i.test(s))               return "Chờ xác nhận";
  if (/cancel|hủy|huỷ|cancelled/i.test(s))                                           return "Đã huỷ";
  if (/return|refund|hoàn/i.test(s))                                                 return "Hoàn hàng";
  return "Chờ xác nhận";
}

function normalizePayment(raw: string, status: OrderStatus): PaymentStatus {
  if (status === "Đã huỷ" || status === "Hoàn hàng") return "Hoàn tiền";
  const s = (raw ?? "").toLowerCase();
  if (/paid|đã thanh|completed payment|payment received/i.test(s)) return "Đã thanh toán";
  if (/unpaid|chưa thanh|pending payment|to pay/i.test(s))         return "Chưa thanh toán";
  return ["Đã giao","Đang giao","Đóng gói"].includes(status) ? "Đã thanh toán" : "Chưa thanh toán";
}

function parseAmount(val: string | number): number {
  if (typeof val === "number") return val;
  const s = String(val).replace(/[₫đ$€,\s]/gi, "").replace(/\./g, "");
  return parseFloat(s) || 0;
}

function parseOrderDate(val: string | number): string {
  if (!val && val !== 0) return format(new Date(), "yyyy-MM-dd");
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  }
  // Excel serial
  if (/^\d{5}$/.test(s)) {
    const d = new Date((parseInt(s) - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) return format(d, "yyyy-MM-dd");
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? format(new Date(), "yyyy-MM-dd") : format(d, "yyyy-MM-dd");
}

// ─── File parser ─────────────────────────────────────────────────────────────

type RawRow = Record<string, string | number>;

function parseFile(file: File): Promise<{ headers: string[]; rows: RawRow[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: "" });
        if (!json.length) { reject(new Error("File trống hoặc không đọc được dữ liệu")); return; }
        resolve({ headers: Object.keys(json[0]), rows: json });
      } catch {
        reject(new Error("Không đọc được file — kiểm tra lại định dạng CSV/Excel"));
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file"));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Converter ───────────────────────────────────────────────────────────────

const SOURCE_CHANNEL: Record<ImportSource, Channel> = {
  "TikTok Shop": "TikTok Shop",
  "Facebook":    "Facebook",
};

function convertRows(rows: RawRow[], colMap: Partial<ColMap>, source: ImportSource): Order[] {
  const channel = SOURCE_CHANNEL[source];
  let seq = 1;
  return rows
    .map((row): Order | null => {
      const revenue = colMap.revenue ? parseAmount(row[colMap.revenue]) : 0;
      if (revenue <= 0) return null; // skip empty/header rows
      const rawId = colMap.orderId ? String(row[colMap.orderId] ?? "").trim() : "";
      const id = rawId || `${source.replace(/\s/g,"").toUpperCase()}-${seq++}`;
      const date = colMap.date ? parseOrderDate(row[colMap.date]) : format(new Date(), "yyyy-MM-dd");
      const discount    = colMap.discount    ? parseAmount(row[colMap.discount])    : 0;
      const shippingFee = colMap.shippingFee ? parseAmount(row[colMap.shippingFee]) : 0;
      const itemCount   = colMap.itemCount   ? (parseInt(String(row[colMap.itemCount])) || 1) : 1;
      const rawStatus   = colMap.status      ? String(row[colMap.status]  ?? "") : "";
      const rawPayment  = colMap.paymentStatus ? String(row[colMap.paymentStatus] ?? "") : "";
      const status = normalizeStatus(rawStatus);
      const paymentStatus = normalizePayment(rawPayment, status);
      const profit = Math.round((revenue - discount) * 0.22 - shippingFee * 0.3);
      return {
        id,
        date,
        channel,
        customerName:  colMap.customerName  ? String(row[colMap.customerName]  ?? "Khách hàng") : "Khách hàng",
        customerPhone: colMap.customerPhone ? String(row[colMap.customerPhone] ?? "") : "",
        itemCount,
        revenue,
        discount,
        shippingFee,
        status,
        paymentStatus,
        profit,
      };
    })
    .filter((o): o is Order => o !== null);
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  source: ImportSource;
  onImport: (orders: Order[]) => void;
  onClose: () => void;
}

type Step = "upload" | "map" | "preview";

export function OrderImporter({ source, onImport, onClose }: Props) {
  const [step, setStep]       = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows]       = useState<RawRow[]>([]);
  const [colMap, setColMap]   = useState<Partial<ColMap>>({});
  const [error, setError]     = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    try {
      const { headers: h, rows: r } = await parseFile(file);
      setFileName(file.name);
      setHeaders(h);
      setRows(r);
      setColMap(autoDetect(h));
      setStep("map");
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  function setCol(key: keyof ColMap, val: string) {
    setColMap((prev) => ({ ...prev, [key]: val || undefined }));
  }

  const canProceed = !!(colMap.orderId && colMap.date && colMap.revenue);
  const preview = step === "preview" ? convertRows(rows, colMap, source).slice(0, 5) : [];
  const total   = step === "preview" ? convertRows(rows, colMap, source).length : rows.length;

  const STEP_LABELS: Record<Step, string> = {
    upload:  "Chọn file CSV hoặc Excel",
    map:     "Ánh xạ cột dữ liệu",
    preview: "Xác nhận & import",
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Import đơn hàng — {source}</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{STEP_LABELS[step]}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-5">
        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all",
              dragging
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-2)]"
            )}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] flex items-center justify-center mx-auto mb-3">
              <Upload size={20} className="text-[var(--color-primary)]" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text)] mb-1">Kéo thả hoặc click để chọn file</p>
            <p className="text-xs text-[var(--color-text-muted)]">Hỗ trợ CSV, Excel (.xlsx, .xls)</p>
            {source === "TikTok Shop" && (
              <p className="text-xs text-[var(--color-text-subtle)] mt-2">
                TikTok Seller Center → Đơn hàng → Export Excel
              </p>
            )}
            {source === "Facebook" && (
              <p className="text-xs text-[var(--color-text-subtle)] mt-2">
                Meta Commerce Manager → Đơn hàng → Xuất báo cáo
              </p>
            )}
            {error && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-[var(--color-danger)] text-xs">
                <AlertCircle size={13} /> {error}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Column mapping ── */}
        {step === "map" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-2)]">
              <FileText size={15} className="text-[var(--color-primary)] flex-shrink-0" />
              <span className="text-xs font-medium text-[var(--color-text)] truncate">{fileName}</span>
              <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">· {rows.length.toLocaleString()} hàng · {headers.length} cột</span>
            </div>

            <p className="text-xs text-[var(--color-text-muted)]">
              Ghép các cột trong file của bạn với các trường bên dưới. Cột đánh dấu <span className="text-[var(--color-danger)]">*</span> là bắt buộc.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {(Object.keys(COL_LABELS) as (keyof ColMap)[]).map((key) => (
                <div key={key}>
                  <label className="text-[11px] font-medium text-[var(--color-text-muted)] block mb-1">{COL_LABELS[key]}</label>
                  <select
                    value={colMap[key] ?? ""}
                    onChange={(e) => setCol(key, e.target.value)}
                    className={cn(
                      "w-full h-8 px-2 rounded-lg border text-xs bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 truncate",
                      colMap[key] ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"
                    )}
                  >
                    <option value="">— không dùng —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-[var(--color-text-muted)]">
                {Object.values(colMap).filter(Boolean).length} / {Object.keys(COL_LABELS).length} cột đã ghép
              </p>
              <div className="flex gap-2">
                <button onClick={() => setStep("upload")}
                  className="h-9 px-4 rounded-lg border text-xs font-medium border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors">
                  Quay lại
                </button>
                <button
                  onClick={() => setStep("preview")}
                  disabled={!canProceed}
                  className={cn(
                    "h-9 px-4 rounded-lg text-xs font-medium transition-colors",
                    canProceed
                      ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] cursor-not-allowed"
                  )}
                >
                  Xem trước →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Preview ── */}
        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--color-text-muted)]">
              Sẽ import <span className="font-semibold text-[var(--color-text)]">{total.toLocaleString()} đơn hàng</span> từ {source}.
              Xem trước 5 đơn đầu:
            </p>

            <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                    {["Mã đơn","Ngày","Kênh","Khách hàng","Doanh thu","Giảm giá","Trạng thái"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((o, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-3 py-2 font-mono text-[var(--color-primary)] whitespace-nowrap">{o.id}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)] whitespace-nowrap">{o.date}</td>
                      <td className="px-3 py-2 text-[var(--color-text)]">{o.channel}</td>
                      <td className="px-3 py-2 text-[var(--color-text)] max-w-[120px] truncate">{o.customerName}</td>
                      <td className="px-3 py-2 font-semibold text-[var(--color-text)] whitespace-nowrap">{formatVND(o.revenue)}</td>
                      <td className="px-3 py-2 text-[var(--color-danger)] whitespace-nowrap">{o.discount > 0 ? `-${formatVND(o.discount)}` : "—"}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)] whitespace-nowrap">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep("map")}
                className="h-9 px-4 rounded-lg border text-xs font-medium border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors">
                ← Chỉnh cột
              </button>
              <button
                onClick={() => onImport(convertRows(rows, colMap, source))}
                className="h-9 px-4 rounded-lg text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] inline-flex items-center gap-1.5 transition-colors"
              >
                <Check size={13} /> Xác nhận import {total.toLocaleString()} đơn
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
