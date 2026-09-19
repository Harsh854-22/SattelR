import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const db = await readDb();
  const invoice = db.invoices.find((inv) => inv.id === id);

  if (!invoice) notFound();

  return (
    <div
      className="min-h-screen px-6 py-10"
      style={{ background: "var(--bg-60)", color: "var(--text)" }}
    >
      <div className="mx-auto max-w-2xl">
        <Link
          href="/invoices"
          className="mono mb-8 inline-block text-[0.72rem] uppercase tracking-widest hover:text-[var(--accent)]"
          style={{ color: "var(--muted)", letterSpacing: "0.12em" }}
        >
          ← All Invoices
        </Link>

        <div
          className="mono mb-2 text-[0.72rem] uppercase"
          style={{ color: "var(--accent)", letterSpacing: "0.15em" }}
        >
          Invoice Detail
        </div>
        <h1 className="mb-6 text-2xl font-extrabold uppercase">{invoice.id}</h1>

        <div
          className="grid gap-4 rounded-sm border p-6 sm:grid-cols-2"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {[
            ["Product", invoice.productName],
            ["Merchant", invoice.merchant],
            ["Amount", `$${invoice.amountUsd.toFixed(2)} USD`],
            ["Status", invoice.status],
            ["Order", invoice.orderId],
            ["Method", invoice.method || "—"],
            ["Payer", invoice.payerName || "—"],
            ["Created", new Date(invoice.createdAt).toLocaleString()],
          ].map(([label, value]) => (
            <div key={label}>
              <div
                className="mono mb-1 text-[0.62rem] uppercase"
                style={{ color: "var(--muted)", letterSpacing: "0.12em" }}
              >
                {label}
              </div>
              <div className="break-all">{value}</div>
            </div>
          ))}
        </div>

        {invoice.txHash && (
          <div
            className="mono mt-6 rounded-sm border p-5"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="mb-2 text-[0.65rem] uppercase"
              style={{ color: "var(--muted)", letterSpacing: "0.12em" }}
            >
              Monad Transaction
            </div>
            <a
              href={`https://testnet.monadvision.com/tx/${invoice.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="break-all text-[var(--accent)] underline"
            >
              {invoice.txHash}
            </a>
          </div>
        )}

        {invoice.tokenId && (
          <div className="mono mt-6 text-[0.75rem]">
            <span style={{ color: "var(--muted)" }}>Token: </span>
            <Link href={`/tokens/${invoice.tokenId}`} className="text-[var(--accent)] underline">
              {invoice.tokenId}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
