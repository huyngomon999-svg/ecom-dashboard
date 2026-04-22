// Persists traffic data across sessions via localStorage.

export interface TrafficRow {
  date: string;           // raw date label from file
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  trafficSource: string;  // value from "source/medium" column
  _fileId: string;        // which import this row belongs to
}

export interface TrafficFile {
  id: string;
  name: string;
  addedAt: string;   // ISO datetime
  rowCount: number;
}

export interface TrafficStore {
  rows: TrafficRow[];
  files: TrafficFile[];
}

const KEY = "ecom_traffic_v1";
export const EMPTY_TRAFFIC: TrafficStore = { rows: [], files: [] };

export function loadTraffic(): TrafficStore {
  if (typeof window === "undefined") return EMPTY_TRAFFIC;
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null") ?? EMPTY_TRAFFIC;
  } catch {
    return EMPTY_TRAFFIC;
  }
}

export function appendTraffic(
  newRows: Omit<TrafficRow, "_fileId">[],
  meta: { name: string; rowCount: number }
): TrafficStore {
  const store = loadTraffic();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const next: TrafficStore = {
    rows: [...store.rows, ...newRows.map((r) => ({ ...r, _fileId: id }))],
    files: [...store.files, { id, name: meta.name, addedAt: new Date().toISOString(), rowCount: meta.rowCount }],
  };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function deleteTrafficFile(fileId: string): TrafficStore {
  const store = loadTraffic();
  const next: TrafficStore = {
    rows:  store.rows.filter((r) => r._fileId !== fileId),
    files: store.files.filter((f) => f.id !== fileId),
  };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function clearTraffic(): void {
  try { localStorage.removeItem(KEY); } catch {}
}
