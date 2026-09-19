import { NextResponse } from "next/server";
import { mapRevertToCode, onChainSpend } from "@/lib/contract";
import { readDb, updateDb } from "@/lib/db";
import { getProduct } from "@/lib/products";
import { verifyTokenPolicy } from "@/lib/tokens";
import type { Hex } from "viem";
import type { Invoice, Order } from "@/lib/types";

type Params = { params: { id: string } };

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: Params) {
  try {
    const id = params.id;
    const body = await req.json();
    // Accept aliases used by curl/docs/bots: agent_token | token | tokenString
    const tokenString = (body?.tokenString ?? body?.agent_token ?? body?.token) as
      | string
      | undefined;
    const payerName = body?.payerName as string | undefined;
    let paymentMethod = body?.paymentMethod as "agent_token" | "cod" | "human_card" | undefined;
    // If a token was supplied without paymentMethod, treat as agent_token pay.
    if (!paymentMethod && tokenString) {
      paymentMethod = "agent_token";
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: "PAYMENT_METHOD_REQUIRED" }, { status: 400 });
    }

    const db = await readDb();
    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
    }

    const product = getProduct(order.productId);
    if (!product) {
      return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
    }

    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ error: "ORDER_NOT_PAYABLE" }, { status: 400 });
    }

    const walletAddress = process.env.NEXT_PUBLIC_OWNER_ADDRESS || "";
    const merchantAddress = process.env.DEMO_MERCHANT_ADDRESS as `0x${string}` | undefined;

    const createInvoice = (
      status: Invoice["status"],
      opts: { txHash?: string; tokenId?: string; method?: string }
    ): Invoice => ({
      id: `inv_${Date.now()}`,
      orderId: order.id,
      walletAddress,
      tokenId: opts.tokenId,
      merchant: order.merchant,
      productName: order.productName,
      amountUsd: order.amountUsd,
      status,
      txHash: opts.txHash,
      payerName,
      method: opts.method ?? paymentMethod,
      createdAt: new Date().toISOString(),
    });

    const finalizeCod = async (): Promise<Order> => {
      let updatedOrder!: Order;
      await updateDb((dbState) => {
        const o = dbState.orders.find((x) => x.id === id);
        if (!o) return;
        o.status = "COD_PENDING";
        o.paymentMethod = paymentMethod;
        updatedOrder = { ...o };
        dbState.invoices.push(createInvoice("COD_PENDING", {}));
      });
      return updatedOrder;
    };

    if (paymentMethod === "cod" || !product.trusted) {
      const updatedOrder = await finalizeCod();
      return NextResponse.json({ order: updatedOrder });
    }

    if (paymentMethod === "human_card") {
      let updatedOrder!: Order;
      let invoice!: Invoice;
      await updateDb((dbState) => {
        const o = dbState.orders.find((x) => x.id === id);
        if (!o) return;
        o.status = "PAID";
        o.paymentMethod = "human_card";
        updatedOrder = { ...o };
        invoice = createInvoice("PAID", { txHash: body?.txHash ?? "demo-card" });
        dbState.invoices.push(invoice);
      });
      return NextResponse.json({ order: updatedOrder, invoice });
    }

    if (paymentMethod === "agent_token") {
      if (!tokenString) {
        return NextResponse.json({ error: "TOKEN_REQUIRED" }, { status: 400 });
      }
      if (!merchantAddress) {
        return NextResponse.json({ error: "MERCHANT_ADDRESS_MISSING" }, { status: 500 });
      }

      const token = db.tokens.find((t) => t.tokenString === tokenString);
      if (!token) {
        return NextResponse.json({ error: "TOKEN_NOT_FOUND" }, { status: 400 });
      }

      const verification = verifyTokenPolicy({
        token,
        merchant: order.merchant,
        category: order.category,
        amountUsd: order.amountUsd,
      });
      if (!verification.ok) {
        return NextResponse.json({ error: verification.error }, { status: 400 });
      }

      try {
        const txHash = await onChainSpend({
          policyId: token.policyId as Hex,
          merchant: merchantAddress,
          amountUsd: order.amountUsd,
          category: order.category,
          website: order.merchant,
          orderId: order.id,
        });

        let updatedOrder!: Order;
        let invoice!: Invoice;
        await updateDb((dbState) => {
          const o = dbState.orders.find((x) => x.id === id);
          const t = dbState.tokens.find((x) => x.id === token.id);
          if (!o || !t) return;

          t.spentUsd += o.amountUsd;
          if (t.singleUse) {
            t.used = true;
            t.status = "used";
          }

          o.status = "PAID";
          o.paymentMethod = "agent_token";
          o.tokenId = t.id;
          updatedOrder = { ...o };

          invoice = createInvoice("PAID", { txHash, tokenId: t.id });
          dbState.invoices.push(invoice);
        });

        return NextResponse.json({ order: updatedOrder, invoice, txHash });
      } catch (err) {
        const code = mapRevertToCode(err);
        const detail = err instanceof Error ? err.message : String(err);
        console.error("onChainSpend failed", code, detail);
        // Policy violations are final. Funding/RPC failures stay PENDING so retry works.
        const fatal = new Set([
          "TOKEN_NOT_FOUND",
          "TOKEN_EXPIRED",
          "TOKEN_ALREADY_USED",
          "AMOUNT_LIMIT_EXCEEDED",
          "MERCHANT_NOT_ALLOWED",
          "CATEGORY_NOT_ALLOWED",
          "NOT_AGENT",
        ]);
        if (fatal.has(code)) {
          await updateDb((dbState) => {
            const o = dbState.orders.find((x) => x.id === id);
            if (!o) return;
            o.status = "FAILED";
            dbState.invoices.push(createInvoice("FAILED", { tokenId: token.id }));
          });
        }
        return NextResponse.json({ error: code, detail }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "INVALID_PAYMENT_METHOD" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PAYMENT_FAILED";
    console.error("pay route error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
