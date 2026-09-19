import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { resolveAgentToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * List is ephemeral on Vercel. Pass ?token=MAP_… to resolve a live on-chain token.
 * Bots should use POST /api/tokens/lookup with { tokenString }.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenParam = searchParams.get("token") || searchParams.get("tokenString");
    const db = await readDb();

    if (tokenParam) {
      const token = await resolveAgentToken(tokenParam, db.tokens);
      if (!token) {
        return NextResponse.json({ tokens: [], error: "TOKEN_NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ tokens: [token] });
    }

    return NextResponse.json({
      tokens: db.tokens,
      hint:
        "Vault list is local/ephemeral. Resolve a live token with ?token=MAP_… or POST /api/tokens/lookup",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TOKENS_READ_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
