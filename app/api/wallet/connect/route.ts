import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const wallet = body?.wallet;

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json({ error: "WALLET_REQUIRED" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, wallet });
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
}
