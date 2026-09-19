import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { resolveOrderFromDb } from "@/lib/orders";

export const dynamic = "force-dynamic";


type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const id = decodeURIComponent(params.id);
    const db = await readDb();
    const order = resolveOrderFromDb(id, db.orders);

    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ORDER_READ_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
