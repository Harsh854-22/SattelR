import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json({ invoices: db.invoices });
  } catch (err) {
    const message = err instanceof Error ? err.message : "INVOICES_READ_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
