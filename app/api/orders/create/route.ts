import { NextResponse } from "next/server";
import { updateDb } from "@/lib/db";
import { encodeOrderId } from "@/lib/orders";
import { getProduct } from "@/lib/products";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const productId = body?.productId;
    const qty = body?.qty != null ? Number(body.qty) : 1;
    const deliveryMethod = body?.deliveryMethod as "online" | "cod" | undefined;

    if (!productId) {
      return NextResponse.json({ error: "PRODUCT_ID_REQUIRED" }, { status: 400 });
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: "INVALID_QTY" }, { status: 400 });
    }

    const product = getProduct(productId);
    if (!product) {
      return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
    }

    const resolvedDelivery: "online" | "cod" =
      deliveryMethod ??
      (product.delivery.includes("online") ? "online" : product.delivery[0]);

    if (!product.delivery.includes(resolvedDelivery)) {
      return NextResponse.json({ error: "DELIVERY_NOT_AVAILABLE" }, { status: 400 });
    }

    const orderBase: Omit<Order, "id"> = {
      productId: product.id,
      productName: product.name,
      merchant: product.merchant,
      amountUsd: product.priceUsd * qty,
      category: product.category,
      deliveryMethod: resolvedDelivery,
      paymentMethod: "agent_token",
      status: "PENDING_PAYMENT",
      createdAt: new Date().toISOString(),
      qty,
    };
    const order: Order = { ...orderBase, id: encodeOrderId(orderBase) };

    await updateDb((db) => {
      db.orders.push(order);
    });

    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ORDER_CREATE_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
