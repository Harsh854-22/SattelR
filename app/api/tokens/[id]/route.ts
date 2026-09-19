import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";


type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = params;
    const db = await readDb();
    const token = db.tokens.find((t) => t.id === id || t.tokenString === id);

    if (!token) {
      return NextResponse.json({ error: "TOKEN_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TOKEN_READ_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
