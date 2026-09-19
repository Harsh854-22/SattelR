import { NextResponse } from "next/server";
import { onChainGrantPermission } from "@/lib/contract";
import { updateDb } from "@/lib/db";
import { makeTokenId, makeTokenString, normalizeCategory } from "@/lib/tokens";
import type { AgentToken } from "@/lib/types";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const body = await req.json();

    const agentName = body?.agentName;
    const purpose = body?.purpose;
    const category = body?.category;
    const webMode = body?.webMode;
    const amountLimitUsd = Number(body?.amountLimitUsd);
    const expiry = body?.expiry ?? null;
    const singleUse = Boolean(body?.singleUse);
    const promptTemplate = body?.promptTemplate ?? "";

    if (!agentName || !purpose || !category || !webMode) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }
    if (!Number.isFinite(amountLimitUsd) || amountLimitUsd <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }
    if (webMode !== "Allowlist" && webMode !== "Blocklist") {
      return NextResponse.json({ error: "INVALID_WEB_MODE" }, { status: 400 });
    }

    const normalizedCategory = normalizeCategory(category);
    const allowedWebsites: string[] =
      Array.isArray(body?.allowedWebsites) && body.allowedWebsites.length > 0
        ? body.allowedWebsites
        : ["trusted-gadgets.example"];

    const agentAddress =
      (body?.agentWallet as `0x${string}` | undefined) ||
      (process.env.NEXT_PUBLIC_AGENT_ADDRESS as `0x${string}` | undefined);
    if (!agentAddress) {
      return NextResponse.json({ error: "AGENT_ADDRESS_MISSING" }, { status: 400 });
    }

    const ownerWallet = process.env.NEXT_PUBLIC_OWNER_ADDRESS;
    if (!ownerWallet) {
      return NextResponse.json({ error: "OWNER_ADDRESS_MISSING" }, { status: 500 });
    }

    const expiryUnix = expiry ? Math.floor(new Date(expiry).getTime() / 1000) : 0;

    const { policyId, txHash } = await onChainGrantPermission({
      agent: agentAddress,
      amountLimitUsd,
      category: normalizedCategory,
      allowedWebsites,
      expiryUnix,
      singleUse,
    });

    const tokenString = makeTokenString();
    const id = makeTokenId();

    const token: AgentToken = {
      id,
      tokenString,
      ownerWallet,
      agentWallet: agentAddress,
      agentName,
      purpose,
      policyId,
      amountLimitUsd,
      spentUsd: 0,
      category: normalizedCategory,
      allowedWebsites,
      webMode,
      expiry: expiry ? new Date(expiry).toISOString() : null,
      singleUse,
      used: false,
      status: "active",
      promptTemplate,
      createdAt: new Date().toISOString(),
      txHash,
    };

    await updateDb((db) => {
      db.tokens.push(token);
    });

    return NextResponse.json({ token, policyId, txHash });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TOKEN_GENERATION_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
