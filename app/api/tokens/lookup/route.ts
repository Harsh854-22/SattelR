import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { resolveAgentToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Body lookup — used by bots so long/short MAP_ tokens never depend on URL path. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tokenString = body?.tokenString || body?.token;
    if (!tokenString) {
      return NextResponse.json({ error: "TOKEN_REQUIRED" }, { status: 400 });
    }

    const db = await readDb();
    const token = await resolveAgentToken(String(tokenString), db.tokens);
    if (!token) {
      return NextResponse.json({ error: "TOKEN_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TOKEN_READ_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
