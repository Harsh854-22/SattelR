import type { Hex } from "viem";
import { readOnChainPolicy } from "./contract";
import type { AgentToken } from "./types";

export function makeTokenId(): string {
  return `tok_${Math.random().toString(36).slice(2, 10)}`;
}

/** Short durable token: MAP_ + on-chain policyId (64 hex chars). */
export function tokenStringFromPolicyId(policyId: string): string {
  const hex = policyId.startsWith("0x") ? policyId.slice(2) : policyId;
  return `MAP_${hex.toLowerCase()}`;
}

export function policyIdFromTokenString(tokenString: string): Hex | null {
  const raw = String(tokenString || "").trim();
  const m = raw.match(/^MAP_(0x)?([0-9a-fA-F]{64})$/);
  if (!m) return null;
  return `0x${m[2].toLowerCase()}` as Hex;
}

/** Legacy self-describing tokens from earlier deploy (base64 JSON). */
export function decodeTokenString(tokenString: string): AgentToken | null {
  const raw = String(tokenString || "").trim();
  if (!raw.startsWith("MAP_")) return null;
  if (policyIdFromTokenString(raw)) return null;
  try {
    const json = Buffer.from(raw.slice(4), "base64url").toString("utf8");
    if (!json.startsWith("{")) return null;
    const data = JSON.parse(json) as Omit<AgentToken, "tokenString">;
    if (!data?.id || !data?.policyId) return null;
    return { ...data, tokenString: raw };
  } catch {
    return null;
  }
}

function statusFromPolicy(p: {
  active: boolean;
  used: boolean;
  expiry: string | null;
}): AgentToken["status"] {
  if (!p.active) return "revoked";
  if (p.used) return "used";
  if (p.expiry && new Date(p.expiry).getTime() < Date.now()) return "expired";
  return "active";
}

/** Resolve token from local db, legacy payload, or live on-chain policy. */
export async function resolveAgentToken(
  tokenString: string,
  tokens: AgentToken[] = []
): Promise<AgentToken | null> {
  const raw = String(tokenString || "").trim();
  if (!raw) return null;

  const fromDb = tokens.find((t) => t.tokenString === raw);
  const policyId =
    policyIdFromTokenString(raw) ||
    (fromDb?.policyId as Hex | undefined) ||
    (decodeTokenString(raw)?.policyId as Hex | undefined);

  if (policyId) {
    const onChain = await readOnChainPolicy(policyId);
    if (onChain) {
      const base = fromDb || decodeTokenString(raw);
      return {
        id: base?.id || `tok_${policyId.slice(2, 10)}`,
        tokenString: tokenStringFromPolicyId(policyId),
        ownerWallet:
          base?.ownerWallet ||
          process.env.NEXT_PUBLIC_OWNER_ADDRESS ||
          "",
        agentWallet: onChain.agent,
        agentName: base?.agentName || "grok-bot",
        purpose: base?.purpose || "agent purchase",
        policyId,
        amountLimitUsd: onChain.amountLimitUsd,
        spentUsd: onChain.spentUsd,
        category: onChain.category,
        allowedWebsites: onChain.allowedWebsites,
        webMode: base?.webMode || "Allowlist",
        expiry: onChain.expiry,
        singleUse: onChain.singleUse,
        used: onChain.used,
        status: statusFromPolicy(onChain),
        promptTemplate: base?.promptTemplate || "Use this agent token: {TOKEN}",
        createdAt: base?.createdAt || new Date().toISOString(),
        txHash: base?.txHash,
      };
    }
  }

  return fromDb || decodeTokenString(raw);
}

/** Sync helper for paths that already loaded the token. */
export function resolveTokenFromDb(
  tokenString: string,
  tokens: AgentToken[]
): AgentToken | null {
  const raw = String(tokenString || "").trim();
  return tokens.find((t) => t.tokenString === raw) || decodeTokenString(raw);
}

export type VerifyInput = {
  token: AgentToken;
  merchant: string;
  category: string;
  amountUsd: number;
};

export function verifyTokenPolicy(
  input: VerifyInput
): { ok: true } | { ok: false; error: string } {
  const { token, merchant, category, amountUsd } = input;
  const now = Date.now();

  if (!token || token.status === "revoked") {
    return { ok: false, error: "TOKEN_NOT_FOUND" };
  }
  if (token.singleUse && (token.used || token.status === "used")) {
    return { ok: false, error: "TOKEN_ALREADY_USED" };
  }
  if (token.status === "used") {
    return { ok: false, error: "TOKEN_ALREADY_USED" };
  }
  if (token.status === "expired") {
    return { ok: false, error: "TOKEN_EXPIRED" };
  }
  if (token.status !== "active") {
    return { ok: false, error: "TOKEN_NOT_FOUND" };
  }
  if (token.expiry && new Date(token.expiry).getTime() < now) {
    return { ok: false, error: "TOKEN_EXPIRED" };
  }

  const sites = token.allowedWebsites.map((s) => s.toLowerCase());
  const m = merchant.toLowerCase();
  if (token.webMode === "Allowlist") {
    if (!sites.includes(m) && !sites.includes("*")) {
      return { ok: false, error: "MERCHANT_NOT_ALLOWED" };
    }
  } else if (sites.includes(m)) {
    return { ok: false, error: "MERCHANT_NOT_ALLOWED" };
  }

  if (token.category.toLowerCase() !== category.toLowerCase()) {
    return { ok: false, error: "CATEGORY_NOT_ALLOWED" };
  }

  const remaining = token.amountLimitUsd - token.spentUsd;
  if (amountUsd > remaining + 1e-9) {
    return { ok: false, error: "AMOUNT_LIMIT_EXCEEDED" };
  }

  return { ok: true };
}

/** Map UI category pills to on-chain / product categories */
export function normalizeCategory(raw: string): string {
  const map: Record<string, string> = {
    "cloud compute": "electronics",
    clothes: "apparel",
    domains: "domains",
    hardware: "electronics",
    subscriptions: "electronics",
    electronics: "electronics",
    home: "home",
    apparel: "apparel",
    accessories: "accessories",
  };
  const key = raw.trim().toLowerCase();
  return map[key] || key;
}
