import type { Order } from "./types";

/** Self-describing order id so create → pay works across Vercel instances. */
export function encodeOrderId(order: Omit<Order, "id">): string {
  const json = JSON.stringify(order);
  return `order_${Buffer.from(json, "utf8").toString("base64url")}`;
}

export function decodeOrderId(id: string): Order | null {
  const raw = String(id || "").trim();
  if (!raw.startsWith("order_")) return null;
  try {
    const json = Buffer.from(raw.slice(6), "base64url").toString("utf8");
    if (!json.startsWith("{")) return null;
    const data = JSON.parse(json) as Omit<Order, "id">;
    if (!data?.productId || !data?.merchant) return null;
    return { ...data, id: raw };
  } catch {
    return null;
  }
}

export function resolveOrderFromDb(id: string, orders: Order[]): Order | null {
  return orders.find((o) => o.id === id) || decodeOrderId(id);
}
