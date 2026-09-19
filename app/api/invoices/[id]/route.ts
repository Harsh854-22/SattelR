import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";


type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = params;
    const db = await readDb();
    const invoice = db.invoices.find((inv) => inv.id === id);

    if (!invoice) {
      return NextResponse.json({ error: "INVOICE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (err) {
    const message = err instanceof Error ? err.message : "INVOICE_READ_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
