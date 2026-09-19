import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function TokenDetailPage({ params }: Props) {
  const { id } = await params;
  const db = await readDb();
  const token = db.tokens.find((t) => t.id === id || t.tokenString === id);

  if (!token) notFound();

  const invoices = db.invoices.filter((inv) => inv.tokenId === token.id);

  return (
    <div
      className="min-h-screen px-6 py-10"
      style={{ background: "var(--bg-60)", color: "var(--text)" }}
    >
      <div className="mx-auto max-w-3xl">
        <Link
          href="/tokens"
          className="mono mb-8 inline-block text-[0.72rem] uppercase tracking-widest hover:text-[var(--accent)]"
          style={{ color: "var(--muted)", letterSpacing: "0.12em" }}
        >
          ← All Tokens
        </Link>

        <div
          className="mono mb-2 text-[0.72rem] uppercase"
          style={{ color: "var(--accent)", letterSpacing: "0.15em" }}
        >
          Token Policy
        </div>
        <h1 className="mb-6 break-all text-2xl font-extrabold text-[var(--accent)]">
          {token.tokenString}
        </h1>

        <div
          className="mb-8 grid gap-4 rounded-sm border p-6 sm:grid-cols-2"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {[
            ["Agent", token.agentName],
            ["Purpose", token.purpose],
            ["Category", token.category],
            ["Limit", `$${token.amountLimitUsd.toFixed(2)} USD`],
            ["Spent", `$${token.spentUsd.toFixed(2)} USD`],
            ["Status", token.status.toUpperCase()],
            ["Web Mode", token.webMode],
            ["Websites", token.allowedWebsites.join(", ") || "default"],
            ["Single Use", token.singleUse ? "Yes" : "No"],
            ["Expiry", token.expiry ? new Date(token.expiry).toLocaleString() : "None"],
            ["Policy ID", token.policyId],
          ].map(([label, value]) => (
            <div key={label}>
              <div
                className="mono mb-1 text-[0.62rem] uppercase"
                style={{ color: "var(--muted)", letterSpacing: "0.12em" }}
              >
                {label}
              </div>
              <div className="break-all text-[0.9rem]">{value}</div>
            </div>
          ))}
        </div>

        {token.txHash && (
          <div className="mono mb-8 text-[0.75rem]">
            <span style={{ color: "var(--muted)" }}>On-chain grant: </span>
            <a
              href={`https://testnet.monadvision.com/tx/${token.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] underline"
            >
              {token.txHash.slice(0, 18)}…
            </a>
          </div>
        )}

        <h2 className="mb-4 text-lg font-extrabold uppercase">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="mono text-[0.78rem]" style={{ color: "var(--muted)" }}>
            No invoices linked to this token yet.
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {invoices.map((inv) => (
              <li key={inv.id}>
                <Link
                  href={`/invoices/${inv.id}`}
                  className="mono flex flex-wrap items-center justify-between gap-4 py-4 hover:text-[var(--accent)]"
                >
                  <span>{inv.productName}</span>
                  <span>
                    ${inv.amountUsd.toFixed(2)} · {inv.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
