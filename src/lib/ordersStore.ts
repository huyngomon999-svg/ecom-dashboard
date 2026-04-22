// Persists imported orders (Facebook / TikTok Shop) in localStorage.
// Each source is stored independently; importing a source replaces its previous data.

import type { Order } from "@/data/types";

const KEY = "ecom_orders_v1";

interface RawStore {
  Facebook?: Order[];
  "TikTok Shop"?: Order[];
}

function load(): RawStore {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "null") ?? {}; }
  catch { return {}; }
}

function save(s: RawStore) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export type OrderSource = "Facebook" | "TikTok Shop";

export function getStoredOrders(): Order[] {
  const s = load();
  return [...(s.Facebook ?? []), ...(s["TikTok Shop"] ?? [])];
}

export function getSourceMeta(): { source: OrderSource; count: number }[] {
  const s = load();
  return ([
    { source: "Facebook"    as OrderSource, count: s.Facebook?.length ?? 0 },
    { source: "TikTok Shop" as OrderSource, count: s["TikTok Shop"]?.length ?? 0 },
  ] as { source: OrderSource; count: number }[]).filter((x) => x.count > 0);
}

export function saveSourceOrders(source: OrderSource, orders: Order[]) {
  const s = load();
  s[source] = orders;
  save(s);
}

export function clearSourceOrders(source: OrderSource) {
  const s = load();
  delete s[source];
  save(s);
}

export function clearAllOrders() {
  try { localStorage.removeItem(KEY); } catch {}
}
