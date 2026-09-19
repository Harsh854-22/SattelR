# Monad Agent Pay

Open-source, self-hostable payment and access-token layer for AI agents on **Monad**.

Users top up with MON, mint restricted purchase tokens, and give those tokens to agents like Grok so they can shop within budget, category, and website limits.

> AI agents are fast, but giving them a full wallet is dangerous. Monad Agent Pay works like a prepaid card with rules: approved items, approved sites, fixed budget, fast settlement on Monad.

Full product spec: [`context.md`](./context.md)

## Current status

Hackathon MVP is specified. This repo currently holds the source-of-truth spec and this README. App scaffold (Next.js, mock merchant, `AgentPayVault`, Grok bot) comes next.

## Demo goal

1. Connect a wallet and top up with Monad testnet MON (`1 MON = 1 USD` credit for the demo).
2. Generate a **$5** agent token with category, allowed websites, expiry, and single-use.
3. Hand the token (`MAP_TOK_…`) to a Grok / tool-calling bot.
4. The bot buys the best allowed product from a **mock** merchant.
5. Checkout verifies the token policy and pays on Monad.
6. The bot returns an invoice with a Monad transaction hash.
7. A second run shows a blocked payment (`MERCHANT_NOT_ALLOWED`).

## What ships in the MVP

- Monad Testnet top-up
- Restricted agent purchase tokens
- Mock merchant catalog + checkout
- Token verification at pay time
- Invoice with tx hash
- Policy-violation failure demo

**Not in scope:** real cards, Amazon/eBay scraping, KYC, mainnet, multi-chain, production audits, real COD logistics.

## Token policy

An agent token is a permission, not a private key.

```json
{
  "tokenId": "tok_abc123",
  "amountLimitUsd": 5,
  "category": "electronics",
  "allowedWebsites": ["trusted-gadgets.example"],
  "expiry": "2026-01-01T00:15:00Z",
  "singleUse": true,
  "status": "active"
}
```

Verification rejects:

| Error | When |
| --- | --- |
| `TOKEN_NOT_FOUND` | Unknown token |
| `TOKEN_EXPIRED` | Past expiry |
| `TOKEN_ALREADY_USED` | Single-use already spent |
| `INSUFFICIENT_BALANCE` | Vault/credits too low |
| `MERCHANT_NOT_ALLOWED` | Website not on the allowlist |
| `CATEGORY_NOT_ALLOWED` | Product category mismatch |
| `AMOUNT_LIMIT_EXCEEDED` | Price above remaining limit |
| `PAYMENT_FAILED` | Settlement failed |

Trusted merchants pay online with the agent token. Untrusted merchants use COD (`COD_PENDING`) and do not spend the token.

## Planned stack

| Layer | Choice |
| --- | --- |
| App | Next.js + Tailwind |
| Wallet | viem / ethers (wagmi optional) |
| Data | SQLite or JSON for hackathon |
| Chain | Solidity `AgentPayVault` on Monad Testnet |
| Bot | Node or Python tool-calling agent |

### Pages

`/` · `/topup` · `/generate-token` · `/tokens` · `/tokens/[id]` · `/merchant` · `/merchant/product/[id]` · `/merchant/checkout/[orderId]` · `/invoices` · `/invoices/[id]`

### Contract

`AgentPayVault`: `topUp`, `createPolicy`, `pay`, `getPolicy`. If contract time is tight, keep policy metadata off-chain and still emit on-chain payment proof.

## Judge demo script

1. Open the app and show a connected wallet.
2. Top up **5 MON** on testnet.
3. Generate token: `$5` · electronics · `trusted-gadgets.example` · 30 minutes · single-use.
4. Copy the token into the bot:

```text
Use this agent token: MAP_TOK_abc123secret

Buy the best electronics product under $5 from allowed websites.
Prefer best price, highest rating, and trusted merchant.
Pay online if merchant is trusted.
Return the invoice.
```

5. Show invoice + Monad tx hash.
6. Retry from a disallowed website → `MERCHANT_NOT_ALLOWED`.

## Local setup

App commands will land with the Next.js scaffold. Until then:

```bash
git clone https://github.com/Harsh854-22/SattelR.git
cd SattelR
```

Create `.env.local` (testnet wallet only — never a mainnet key):

```env
NEXT_PUBLIC_MONAD_RPC_URL=
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_EXPLORER_URL=
DEMO_PRIVATE_KEY=
DEMO_MON_TO_USD_RATE=1
GROK_API_KEY=
DATABASE_URL=
```

## Build order

1. Scaffold app + landing + wallet + top-up UI
2. Token generate / list / detail
3. Mock merchant + checkout
4. `/api/tokens/verify`
5. Monad `AgentPayVault`
6. Invoices
7. Grok bot tools
8. Demo polish + failure case

## License

Open source. Hackathon demo: Monad Testnet only.
