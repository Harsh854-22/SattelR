import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { normalizeCategory, verifyTokenPolicy } from "@/lib/tokens";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tokenString = body?.tokenString;
    const merchant = body?.merchant;
    const category = body?.category;
    const amountUsd = Number(body?.amountUsd);

    if (!tokenString || !merchant || !category) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }

    const db = await readDb();
    const token = db.tokens.find((t) => t.tokenString === tokenString);

    if (!token) {
      return NextResponse.json(
        { ok: false, ownerName: "OWNER", remaining: 0, error: "TOKEN_NOT_FOUND" },
        { status: 400 }
      );
    }

    const result = verifyTokenPolicy({
      token,
      merchant,
      category: normalizeCategory(category),
      amountUsd,
    });

    const remaining = token.amountLimitUsd - token.spentUsd;
    const ownerName = token.agentName || "OWNER";

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, ownerName, remaining, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, ownerName, remaining });
  } catch (err) {
    const message = err instanceof Error ? err.message : "VERIFY_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
