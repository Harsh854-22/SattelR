import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function TokensPage() {
  const db = await readDb();
  const tokens = db.tokens;

  return (
    <div
      className="min-h-screen px-6 py-10"
      style={{ background: "var(--bg-60)", color: "var(--text)" }}
    >
      <div className="mx-auto max-w-4xl">
        <Link
          href="/generate-token"
          className="mono mb-8 inline-block text-[0.72rem] uppercase tracking-widest hover:text-[var(--accent)]"
          style={{ color: "var(--muted)", letterSpacing: "0.12em" }}
        >
          ← Token Console
        </Link>

        <h1 className="mb-2 text-3xl font-extrabold uppercase tracking-tight">
          All Tokens
        </h1>
        <p className="mono mb-10 text-[0.78rem]" style={{ color: "var(--muted)" }}>
          {tokens.length} token{tokens.length !== 1 ? "s" : ""} issued
        </p>

        {tokens.length === 0 ? (
          <p className="mono text-[0.85rem]" style={{ color: "var(--muted)" }}>
            No tokens yet.{" "}
            <Link href="/generate-token" className="text-[var(--accent)] underline">
              Generate one
            </Link>
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {tokens.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tokens/${t.id}`}
                  className="mono flex flex-wrap items-center justify-between gap-4 py-5 transition hover:bg-[var(--surface)]"
                >
                  <div>
                    <div className="font-medium text-[var(--accent)]">
                      {t.tokenString}
                    </div>
                    <div className="mt-1 text-[0.75rem]" style={{ color: "var(--muted)" }}>
                      {t.agentName} · {t.purpose}
                    </div>
                  </div>
                  <div className="text-right text-[0.75rem]">
                    <div>${t.amountLimitUsd.toFixed(2)}</div>
                    <div style={{ color: "var(--muted)" }}>{t.status.toUpperCase()}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
