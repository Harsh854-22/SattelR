import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";


type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = params;
    const db = await readDb();
    const order = db.orders.find((o) => o.id === id);

    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ORDER_READ_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
