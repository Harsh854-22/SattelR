import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SattelR // Payment Rails for Agents",
  description:
    "Restricted purchase tokens for AI agents on Monad Testnet. Top up MON, mint policy tokens, shop safely.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{ background: "var(--bg-60)", color: "var(--text)" }}
      >
        <div className="noise" aria-hidden />
        {children}
      </body>
    </html>
  );
}
