import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { decodeTokenString, resolveTokenFromDb } from "@/lib/tokens";

export const dynamic = "force-dynamic";


type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = params;
    const decodedId = decodeURIComponent(id);
    const db = await readDb();
    const token =
      db.tokens.find((t) => t.id === decodedId || t.tokenString === decodedId) ||
      resolveTokenFromDb(decodedId, db.tokens) ||
      decodeTokenString(decodedId);

    if (!token) {
      return NextResponse.json({ error: "TOKEN_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TOKEN_READ_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
