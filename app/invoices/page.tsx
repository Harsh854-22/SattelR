import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function InvoicesPage() {
  const db = await readDb();
  const invoices = [...db.invoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div
      className="min-h-screen px-6 py-10"
      style={{ background: "var(--bg-60)", color: "var(--text)" }}
    >
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mono mb-8 inline-block text-[0.72rem] uppercase tracking-widest hover:text-[var(--accent)]"
          style={{ color: "var(--muted)", letterSpacing: "0.12em" }}
        >
          ← Home
        </Link>

        <h1 className="mb-2 text-3xl font-extrabold uppercase tracking-tight">
          Invoices
        </h1>
        <p className="mono mb-10 text-[0.78rem]" style={{ color: "var(--muted)" }}>
          {invoices.length} settlement record{invoices.length !== 1 ? "s" : ""}
        </p>

        {invoices.length === 0 ? (
          <p className="mono text-[0.85rem]" style={{ color: "var(--muted)" }}>
            No invoices yet. Complete a purchase via{" "}
            <Link href="/merchant" className="text-[var(--accent)] underline">
              OPEN_MART
            </Link>{" "}
            or the agent bot.
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {invoices.map((inv) => (
              <li key={inv.id}>
                <Link
                  href={`/invoices/${inv.id}`}
                  className="mono flex flex-wrap items-center justify-between gap-4 py-5 transition hover:bg-[var(--surface)]"
                >
                  <div>
                    <div className="font-semibold">{inv.productName}</div>
                    <div className="mt-1 text-[0.72rem]" style={{ color: "var(--muted)" }}>
                      {inv.merchant} · {inv.orderId}
                    </div>
                  </div>
                  <div className="text-right text-[0.75rem]">
                    <div>${inv.amountUsd.toFixed(2)}</div>
                    <div style={{ color: "var(--accent)" }}>{inv.status}</div>
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
