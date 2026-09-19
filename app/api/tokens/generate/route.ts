import { NextResponse } from "next/server";
import {
  agentAccountAddress,
  ensureAgentHasGas,
  ensureVaultHas,
  mapRevertToCode,
  onChainGrantPermission,
  usdToWei,
} from "@/lib/contract";
import { updateDb } from "@/lib/db";
import { makeTokenId, makeTokenString, normalizeCategory } from "@/lib/tokens";
import type { AgentToken } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const agentName = body?.agentName || "grok-bot";
    const purpose = body?.purpose;
    const category = body?.category;
    const webMode = body?.webMode || "Allowlist";
    const amountLimitUsd = Number(body?.amountLimitUsd ?? body?.limit ?? 5);
    const expiry = body?.expiry ?? null;
    const singleUse = body?.singleUse !== false;
    const promptTemplate = body?.promptTemplate ?? "Use this agent token: {TOKEN}";

    if (!purpose || !category) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", hint: "purpose and category are required" },
        { status: 400 }
      );
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
        ? body.allowedWebsites.map((s: string) => String(s).trim()).filter(Boolean)
        : body?.website
          ? [String(body.website).trim()]
          : ["trusted-gadgets.example"];

    let agentAddress: `0x${string}` | undefined =
      (body?.agentWallet as `0x${string}` | undefined) ||
      (process.env.NEXT_PUBLIC_AGENT_ADDRESS as `0x${string}` | undefined);
    try {
      // Prefer the address that matches DEMO_PRIVATE_KEY so spend() never fails NotAgent
      agentAddress = agentAccountAddress();
    } catch {
      /* keep env/body address */
    }
    if (!agentAddress) {
      return NextResponse.json({ error: "AGENT_ADDRESS_MISSING" }, { status: 400 });
    }

    const ownerWallet = process.env.NEXT_PUBLIC_OWNER_ADDRESS;
    if (!ownerWallet) {
      return NextResponse.json({ error: "OWNER_ADDRESS_MISSING" }, { status: 500 });
    }

    const expiryUnix = expiry ? Math.floor(new Date(expiry).getTime() / 1000) : 0;

    await ensureAgentHasGas();
    await ensureVaultHas(usdToWei(amountLimitUsd));

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
    console.error("token generate failed", err);
    const code = mapRevertToCode(err);
    const message = err instanceof Error ? err.message : "TOKEN_GENERATION_FAILED";
    return NextResponse.json(
      { error: code !== "PAYMENT_FAILED" ? code : message },
      { status: 500 }
    );
  }
}
