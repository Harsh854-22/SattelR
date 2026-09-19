import { NextResponse } from "next/server";
import { onChainTopUp, readVaultBalance } from "@/lib/contract";
import { updateDb } from "@/lib/db";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amountMon = Number(body?.amountMon);

    if (!Number.isFinite(amountMon) || amountMon <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }

    const txHash = await onChainTopUp(amountMon);

    await updateDb((db) => {
      db.topups.push({
        id: `topup_${Date.now()}`,
        amountMon,
        txHash,
        createdAt: new Date().toISOString(),
      });
    });

    const vaultBalance = await readVaultBalance();
    return NextResponse.json({ txHash, vaultBalance });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TOPUP_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
