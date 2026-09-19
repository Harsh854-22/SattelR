# SattelR

Open-source, self-hostable payment and access-token layer for AI agents on **Monad**.

Users top up with MON, mint restricted purchase tokens, and give those tokens to agents so they can shop within budget, category, and website limits.

> AI agents are fast, but giving them a full wallet is dangerous. SattelR works like a prepaid card with rules: approved items, approved sites, fixed budget, fast settlement on Monad.

Full product spec: [`context.md`](./context.md)

## Quick start

```bash
cd SattelR
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Open dashboard**.

## Simple demo flow

1. **Dashboard** (`/dashboard`) — Top up MON (e.g. 5)
2. Set purpose, category `electronics`, website `trusted-gadgets.example`, limit `$5`, expiry → **Generate token**
3. **Copy prompt** (or token)
4. Paste into **Grok / Hermes**, or run locally:
   ```bash
   npm run bot -- MAP_XXXX-XXXX-XXXX-XXXX
   ```
5. Agent shops at `/merchant` → AGENT pay → paste token → **invoice + Monad tx**

Store: [http://localhost:3000/merchant](http://localhost:3000/merchant)  
Invoices: [http://localhost:3000/invoices](http://localhost:3000/invoices)

Optional Grok tool-calling (needs `GROK_API_KEY` in `.env.local`):
```bash
npm run bot:grok -- MAP_XXXX-XXXX-XXXX-XXXX
```


## Pages

`/` · `/topup` · `/generate-token` · `/tokens` · `/tokens/[id]` · `/merchant` · `/invoices` · `/invoices/[id]`

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

## Contract

`AgentPayVault`: `topUp`, `createPolicy`, `pay`, `getPolicy`. Policy metadata may live off-chain for the hackathon demo; on-chain payment proof is still emitted.

## Environment

Copy `.env.example` → `.env.local`. Use **testnet keys only** — never mainnet private keys.

```env
NEXT_PUBLIC_MONAD_RPC_URL=
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_EXPLORER_URL=
NEXT_PUBLIC_OWNER_ADDRESS=
NEXT_PUBLIC_AGENT_ADDRESS=
OWNER_PRIVATE_KEY=
DEMO_PRIVATE_KEY=
```

## Agent bot

Node script with tool-style steps: verify → search products → score & pick → create order → pay → fetch invoice.

```bash
npm run bot -- MAP_XXXX-XXXX-XXXX-XXXX
```

Requires `npm run dev` running on port 3000.

## License

Open source. Hackathon demo: Monad Testnet only.
