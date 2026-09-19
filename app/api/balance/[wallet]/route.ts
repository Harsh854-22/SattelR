import { NextResponse } from "next/server";
import { readVaultBalance } from "@/lib/contract";

export const dynamic = "force-dynamic";


type Params = { params: { wallet: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { wallet } = params;
    const vaultBalance = await readVaultBalance();
    return NextResponse.json({ wallet, vaultBalance });
  } catch (err) {
    const message = err instanceof Error ? err.message : "BALANCE_READ_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
