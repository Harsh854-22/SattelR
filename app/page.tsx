"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--bg-60)", color: "var(--text)" }}
    >
      <header className="flex items-center justify-between px-8 py-5">
        <div className="mono font-bold">SattelR</div>
        <Link
          href="/merchant"
          className="mono text-[0.7rem] uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          OPEN_MART store
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-8 pb-24">
        <p
          className="mono mb-6 text-[0.75rem] uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          Monad testnet · agent payments
        </p>
        <h1
          className="mb-6 font-black uppercase leading-[0.9]"
          style={{
            fontSize: "clamp(3rem,10vw,6rem)",
            letterSpacing: "-0.05em",
          }}
        >
          Prepaid cards
          <br />
          for AI agents
        </h1>
        <p className="mb-10 max-w-xl text-base leading-relaxed" style={{ color: "var(--muted)" }}>
          Top up MON → mint a restricted token → paste into Grok / Hermes →
          agent shops at OPEN_MART within your rules. You get an invoice and a
          Monad tx hash.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mono rounded px-8 py-4 text-sm font-bold uppercase"
            style={{ background: "var(--accent)", color: "var(--bg-60)" }}
          >
            Open dashboard
          </button>
          <Link
            href="/merchant"
            className="mono rounded border px-8 py-4 text-sm font-bold uppercase"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Open store
          </Link>
        </div>

        <ol
          className="mt-16 space-y-3 border-t pt-8 font-mono text-sm"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <li>1. Dashboard → top up MON</li>
          <li>2. Set purpose, website, category, expiry → generate token</li>
          <li>3. Copy prompt → paste in Grok / Hermes</li>
          <li>4. Agent buys on /merchant with AGENT pay + your token</li>
          <li>5. Invoice + Monad transaction</li>
        </ol>
      </main>
    </div>
  );
}
