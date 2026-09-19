import type { AgentToken } from "./types";

export function makeTokenString(): string {
  const hex = () => Math.random().toString(16).slice(2, 6).toUpperCase();
  return `MAP_${hex()}-${hex()}-${hex()}-${hex()}`;
}

export function makeTokenId(): string {
  return `tok_${Math.random().toString(36).slice(2, 10)}`;
}

export type VerifyInput = {
  token: AgentToken;
  merchant: string;
  category: string;
  amountUsd: number;
};

export function verifyTokenPolicy(input: VerifyInput): { ok: true } | { ok: false; error: string } {
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
  } else {
    if (sites.includes(m)) {
      return { ok: false, error: "MERCHANT_NOT_ALLOWED" };
    }
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
