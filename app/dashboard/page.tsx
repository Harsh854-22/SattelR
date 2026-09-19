"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgentToken } from "@/lib/types";

const CATEGORIES = ["electronics", "home", "apparel", "accessories", "domains"] as const;

function shopUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/merchant`;
  }
  return "http://localhost:3000/merchant";
}

function buildPrompt(token: string, site: string, category: string, limit: number) {
  const store = shopUrl();
  return `Use this agent token: ${token}

Go to this store and buy one product for me:
${store}

Rules:
- Category must be: ${category}
- Only buy from: ${site}
- Max spend: $${limit.toFixed(2)}
- Prefer lowest price, highest rating, trusted merchant

At checkout:
1. Choose AGENT (token payment)
2. Paste the token exactly
3. Authorize payment

Return the invoice id and Monad transaction hash when done.
Never exceed the limit, category, or website rules.`;
}

function formatExp(iso: string | null) {
  if (!iso) return "NO EXPIRY";
  const d = new Date(iso);
  return d.toLocaleDateString();
}

function endOfDayIso(dateStr: string) {
  return new Date(dateStr + "T23:59:59.999").toISOString();
}

export default function DashboardPage() {
  const [purpose, setPurpose] = useState("Buy USB-C cable");
  const [category, setCategory] = useState("electronics");
  const [website, setWebsite] = useState("trusted-gadgets.example");
  const [limit, setLimit] = useState("5");
  const [expiryDate, setExpiryDate] = useState("");
  const [topupAmount, setTopupAmount] = useState("5");
  const [balance, setBalance] = useState<string>("—");
  const [tokens, setTokens] = useState<AgentToken[]>([]);
  const [busy, setBusy] = useState<"topup" | "gen" | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState<{
    token: string;
    prompt: string;
  } | null>(null);

  const owner =
    process.env.NEXT_PUBLIC_OWNER_ADDRESS ||
    "0x1F3305F4d20F49c3505B5175d76A6619E4d00B38";

  const load = useCallback(async () => {
    try {
      const [b, t] = await Promise.all([
        fetch(`/api/balance/${owner}`).then((r) => r.json()),
        fetch("/api/tokens").then((r) => r.json()),
      ]);
      setBalance(b.vaultBalance ?? "0");
      setTokens(t.tokens || []);
    } catch {
      /* ignore */
    }
  }, [owner]);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setExpiryDate(d.toISOString().slice(0, 10));
    load();
  }, [load]);

  const active = useMemo(
    () => tokens.filter((t) => t.status === "active"),
    [tokens]
  );

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setStatus("Copied ✓");
    setTimeout(() => setStatus(""), 1500);
  };

  const doTopUp = async () => {
    setError("");
    setBusy("topup");
    try {
      const amountMon = parseFloat(topupAmount);
      if (!amountMon || amountMon <= 0) throw new Error("Enter a MON amount");
      const res = await fetch("/api/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Top-up failed");
      setStatus(`Top-up ok · ${data.txHash?.slice(0, 10)}…`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Top-up failed");
    } finally {
      setBusy(null);
    }
  };

  const doGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy("gen");
    try {
      const amountLimitUsd = parseFloat(limit) || 5;
      const site = website.trim() || "trusted-gadgets.example";
      const res = await fetch("/api/tokens/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: "grok-bot",
          purpose: purpose.trim() || "Shopping",
          category,
          webMode: "Allowlist",
          allowedWebsites: [site],
          amountLimitUsd,
          singleUse: true,
          expiry: expiryDate ? endOfDayIso(expiryDate) : null,
          promptTemplate: "Use this agent token: {TOKEN}",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || data.hint || `Generate failed (${res.status})`
        );
      }
      const tokenString = data.token.tokenString as string;
      const prompt = buildPrompt(tokenString, site, category, amountLimitUsd);
      setModal({ token: tokenString, prompt });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-60)", color: "var(--text)" }}
    >
      <header
        className="flex items-center justify-between border-b px-8 py-4 max-md:px-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mono font-bold">SattelR</div>
        <div className="flex items-center gap-4 mono text-[0.7rem] uppercase tracking-widest">
          <span style={{ color: "var(--muted)" }}>
            Vault:{" "}
            <span style={{ color: "var(--accent)" }}>{balance} MON</span>
          </span>
          <Link href="/merchant" style={{ color: "var(--accent)" }}>
            Open store →
          </Link>
          <Link href="/invoices" style={{ color: "var(--muted)" }}>
            Invoices
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 p-8 max-md:p-4 md:grid-cols-2">
        {/* LEFT: Top up + issue */}
        <section className="flex flex-col gap-6">
          <div
            className="rounded border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <div className="mono mb-3 text-[0.7rem] uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              01 · Top up MON
            </div>
            <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
              Deposit Monad testnet MON into your vault (1 MON = $1 demo credit).
            </p>
            <div className="flex gap-3">
              <input
                className="mono flex-1 rounded border bg-black px-3 py-3 text-sm outline-none"
                style={{ borderColor: "var(--border)" }}
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="5"
              />
              <button
                type="button"
                disabled={busy === "topup"}
                onClick={doTopUp}
                className="mono rounded px-5 py-3 text-sm font-bold uppercase disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--bg-60)" }}
              >
                {busy === "topup" ? "…" : "Top up"}
              </button>
            </div>
          </div>

          <form
            onSubmit={doGenerate}
            className="rounded border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <div className="mono mb-3 text-[0.7rem] uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              02 · Issue agent token
            </div>

            <label className="mono mb-1 block text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Purpose
            </label>
            <input
              className="mb-4 w-full rounded border bg-black px-3 py-3 outline-none"
              style={{ borderColor: "var(--border)" }}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
            />

            <label className="mono mb-2 block text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Category
            </label>
            <div className="mb-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className="mono rounded border px-3 py-2 text-[0.7rem] uppercase"
                  style={{
                    borderColor: category === c ? "var(--accent)" : "var(--border)",
                    background: category === c ? "var(--accent)" : "transparent",
                    color: category === c ? "var(--bg-60)" : "var(--muted)",
                    fontWeight: category === c ? 700 : 400,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <label className="mono mb-1 block text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              Allowed website
            </label>
            <input
              className="mb-4 w-full rounded border bg-black px-3 py-3 font-mono text-sm outline-none"
              style={{ borderColor: "var(--border)" }}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="trusted-gadgets.example"
              required
            />
            <p className="mb-4 text-xs" style={{ color: "var(--muted)" }}>
              Demo store sells as <code>trusted-gadgets.example</code> — keep this for OPEN_MART electronics.
            </p>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mono mb-1 block text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  Limit (USD)
                </label>
                <input
                  className="w-full rounded border bg-black px-3 py-3 outline-none"
                  style={{ borderColor: "var(--border)" }}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </div>
              <div>
                <label className="mono mb-1 block text-[0.65rem] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  Expiry
                </label>
                <input
                  type="date"
                  className="w-full rounded border bg-black px-3 py-3 outline-none"
                  style={{ borderColor: "var(--border)" }}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="mb-3 font-mono text-sm text-red-500">{error}</p>
            )}
            {status && (
              <p className="mb-3 font-mono text-sm" style={{ color: "var(--accent)" }}>
                {status}
              </p>
            )}

            <button
              type="submit"
              disabled={busy === "gen"}
              className="mono w-full rounded py-4 text-sm font-bold uppercase disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--bg-60)" }}
            >
              {busy === "gen" ? "Generating on Monad…" : "Generate token"}
            </button>
          </form>
        </section>

        {/* RIGHT: tokens + how to */}
        <section className="flex flex-col gap-6">
          <div
            className="rounded border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <div className="mono mb-3 text-[0.7rem] uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              How it works
            </div>
            <ol className="space-y-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              <li>1. Top up MON into the vault</li>
              <li>2. Generate a token (copy token or full prompt)</li>
              <li>3. Paste into Grok / Hermes / any agent</li>
              <li>
                4. Tell it to shop at{" "}
                <Link href="/merchant" style={{ color: "var(--accent)" }}>
                  /merchant
                </Link>
              </li>
              <li>5. Agent picks AGENT pay → pastes token → you get invoice + tx</li>
            </ol>
          </div>

          <div
            className="flex-1 rounded border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="mono text-[0.7rem] uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                Active tokens
              </div>
              <span className="mono text-[0.65rem]" style={{ color: "var(--muted)" }}>
                {active.length} active
              </span>
            </div>
            <div className="max-h-[420px] space-y-3 overflow-y-auto">
              {!active.length && (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  No active tokens yet.
                </p>
              )}
              {active.map((t) => (
                <div
                  key={t.id}
                  className="rounded border p-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="mono text-sm font-medium" style={{ color: "var(--accent)" }}>
                    {t.tokenString}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    {t.purpose} · {t.category} · ${t.amountLimitUsd} · {formatExp(t.expiry)}
                    <br />
                    {t.allowedWebsites.join(", ")}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="mono rounded border px-3 py-1 text-[0.65rem] uppercase"
                      style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                      onClick={() => copy(t.tokenString)}
                    >
                      Copy token
                    </button>
                    <button
                      type="button"
                      className="mono rounded border px-3 py-1 text-[0.65rem] uppercase"
                      style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                      onClick={() =>
                        copy(
                          buildPrompt(
                            t.tokenString,
                            t.allowedWebsites[0] || "trusted-gadgets.example",
                            t.category,
                            t.amountLimitUsd
                          )
                        )
                      }
                    >
                      Copy prompt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.8)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            className="w-full max-w-lg rounded border p-6"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="mono mb-2 text-[0.75rem] font-bold uppercase" style={{ color: "var(--accent)" }}>
              Token ready — paste into Grok
            </div>
            <div
              className="mb-3 break-all rounded border p-3 font-mono text-sm"
              style={{ borderColor: "var(--border)", background: "#000", color: "var(--accent)" }}
            >
              {modal.token}
            </div>
            <pre
              className="mb-4 max-h-48 overflow-auto rounded border p-3 font-mono text-xs leading-relaxed"
              style={{ borderColor: "var(--border)", background: "#000", color: "#bbb" }}
            >
              {modal.prompt}
            </pre>
            <div className="flex gap-2">
              <button
                type="button"
                className="mono flex-1 rounded py-3 text-xs font-bold uppercase"
                style={{ background: "var(--accent)", color: "var(--bg-60)" }}
                onClick={() => copy(modal.token)}
              >
                Copy token
              </button>
              <button
                type="button"
                className="mono flex-1 rounded border py-3 text-xs font-bold uppercase"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                onClick={() => copy(modal.prompt)}
              >
                Copy prompt
              </button>
            </div>
            <button
              type="button"
              className="mono mt-3 w-full py-2 text-xs uppercase"
              style={{ color: "var(--muted)" }}
              onClick={() => setModal(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
