# prompt.md — Build SattelR in Next.js (full hackathon MVP)

> Paste this whole file into a coding agent with an empty Next.js project (or this repo).
> Goal: a working demo on **Monad Testnet** where a user tops up MON, mints a
> restricted agent purchase token, hands it to an AI shopping bot, the bot buys
> from a mock merchant, and the app shows an invoice with a Monad tx hash.

---

## 1. Product in one paragraph

**SattelR** is an open-source, self-hostable payment / access-token layer for AI
agents on Monad. Users top up with MON, create restricted purchase tokens
(amount + category + allowed websites + expiry + single-use), and give those
tokens to agents (e.g. Grok). Agents can shop only within the token policy.
All settlement is fast and cheap on Monad. Demo conversion: **1 MON = 1 USD
credit**. Full spec lives in `context.md` in this repo — treat it as
source of truth and follow its build order (§20), pages (§9), APIs (§14),
schemas (§15), verification rules (§16), and demo script (§22).

## 2. Chain facts (already deployed — reuse, do not redeploy)

- Network: **Monad Testnet** · Chain ID **10143** · RPC
  `https://testnet-rpc.monad.xyz` · Explorer `https://testnet.monadvision.com`
- Contract `AgentPayVault`: `0x3d63a735225e4Ab159039fB9048E7408f7A35bf2`
  (source: `contracts/src/AgentPayVault.sol`, Foundry project in `contracts/`)
- Functions you must call from the app (via viem):
  - `topUp() payable` (owner/human only) — fund vault with MON
  - `grantPermission(agent, amountLimitWei, category, allowedWebsites[], expiry, singleUse) returns (policyId)`
  - `spend(policyId, merchant, amountWei, category, website, orderId)` (agent wallet only)
  - `revokePermission(policyId)`, `withdraw(amount)`, `withdrawAll()` (owner only)
  - Views: `getPolicy(policyId)`, `remainingAllowance(policyId)`, `vaultBalance()`,
    `policyCount()`, `policyIdAt(i)`
- Reverts map to UI errors: `PolicyNotFound` → `TOKEN_NOT_FOUND`,
  `PolicyExpired` → `TOKEN_EXPIRED`, `PolicyAlreadyUsed` → `TOKEN_ALREADY_USED`,
  `AmountLimitExceeded` → `AMOUNT_LIMIT_EXCEEDED`,
  `MerchantNotAllowed` → `MERCHANT_NOT_ALLOWED`,
  `CategoryNotAllowed` → `CATEGORY_NOT_ALLOWED`,
  `InsufficientVaultBalance` → `INSUFFICIENT_BALANCE`.
- Note: `topUp`/`grantPermission`/`withdraw` are `onlyOwner` (human deployer
  `0x1F3305F4d20F49c3505B5175d76A6619E4d00B38`); `spend` must be sent from the
  granted **agent** wallet with the `policyId`.

## 3. Tech stack (do not deviate without asking)

- Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- Wallet/on-chain: `viem` (wagmi optional)
- Data: local JSON file DB or SQLite (hackathon-simple; Prisma optional)
- Token strings: `MAP_TOK_` + random secret; store full policy server-side
- Bot: `bot/agent.ts` (or `.py`) — tool-calling script, no real browser needed

## 4. UI reference (replicate look & flow, don't redesign)

- `index.html` — landing page (dark `#050505`, accent `#CCFF00`, Inter +
  JetBrains Mono). Has a SIGN IN / SIGN UP modal prefilled with test creds
  (`demo@sattelr.xyz`); on submit it redirects to `SattelR.html`. Rebuild this
  as `/` with the same modal → dashboard redirect behaviour.
- `SattelR.html` — token console: left panel `01 / Issue Token` form (agent
  name, purpose, category pills, allowlist/blocklist + website input, limit
  default `$5.00`, expiry date, agent-prompt textarea with `{TOKEN}`
  placeholder, GENERATE button); right panel `02 / Active Tokens` list with
  copy buttons and an issue-success modal showing key + ready-to-paste agent
  prompt. Rebuild this as `/generate-token` + `/tokens`.

## 5. Pages to build

| Route | Purpose |
|---|---|
| `/` | Landing (from `index.html`): pitch, connect wallet, Top Up / Generate Token / Merchant / Invoices buttons, login modal → dashboard |
| `/topup` | Input MON amount, show USD equivalent (1:1), Top Up tx via `topUp()`, show tx hash + vault balance |
| `/generate-token` | Form from `SattelR.html`; on submit: `grantPermission` on-chain + DB row; show `MAP_TOK_…`, copy button, policy summary, ready-made agent prompt |
| `/tokens` | List all tokens: id, amount/spent, category, websites, expiry, status, copy button |
| `/tokens/[id]` | Full policy, usage history, linked invoice |
| `/merchant` | Mock product grid (name, category, price, rating, reviews, condition, merchant, trusted badge) |
| `/merchant/product/[id]` | Product detail + reviews + trust score + Buy |
| `/merchant/checkout/[orderId]` | Order summary, payment selector (Agent Token / COD), token input, Verify + Pay, success/fail + invoice link |
| `/invoices` | Invoice list |
| `/invoices/[id]` | Invoice detail: metadata, product, status, Monad tx hash, token used, buyer/agent |

## 6. API routes

```text
POST /api/wallet/connect      GET /api/balance/:wallet      POST /api/topup
POST /api/tokens/generate     GET /api/tokens               GET /api/tokens/:id
POST /api/tokens/verify
GET  /api/products            GET /api/products/:id
POST /api/orders/create       POST /api/orders/:id/pay      GET /api/orders/:id
GET  /api/invoices            GET /api/invoices/:id
```

## 7. Core data shapes

AgentToken: `{ id, tokenString, ownerWallet, agentWallet, policyId (bytes32),
amountLimitUsd, spentUsd, category, allowedWebsites[], expiry, singleUse, used,
status }`. Order: `{ id, productId, merchant, amountUsd, deliveryMethod,
paymentMethod, tokenId, status: PENDING_PAYMENT | PAID | COD_PENDING | FAILED }`.
Invoice: `{ id, orderId, walletAddress, tokenId, merchant, productName,
amountUsd, status: PAID | COD_PENDING | FAILED, txHash }`.

## 8. Verification rules (`POST /api/tokens/verify` + checkout)

Reject with codes in this order: unknown → `TOKEN_NOT_FOUND`; inactive →
`TOKEN_NOT_FOUND`; expired → `TOKEN_EXPIRED`; single-use spent →
`TOKEN_ALREADY_USED`; website not in allowlist → `MERCHANT_NOT_ALLOWED`;
category mismatch → `CATEGORY_NOT_ALLOWED`; price > remaining →
`AMOUNT_LIMIT_EXCEEDED`; vault shortfall → `INSUFFICIENT_BALANCE`; tx revert →
`PAYMENT_FAILED`. On-chain `spend` is the final authority — mirror these
checks off-chain first for fast UX, then send the tx.

## 9. Mock catalog (seed exactly these 4, prices ≤ $5)

USB-C Cable $3.99 electronics mockshop.example trusted (online+cod);
Phone Stand $4.49 electronics trusted-gadgets.example trusted (online+cod);
Used Earbuds $4.99 electronics random-seller.example untrusted (cod only);
Premium Domain Credit $5.00 domains mock-domains.example trusted (online).
Include rating/reviews/condition per `context.md` §10.

## 10. Payment logic

- Trusted merchant → online: order `PENDING_PAYMENT` → verify token → agent
  wallet sends `spend()` → order/invoice `PAID` with tx hash.
- Untrusted merchant → COD: order `COD_PENDING`, invoice `COD_PENDING`, token
  NOT spent; tell user payment is due on delivery.

## 11. Bot (`bot/`)

Tools: `verify_agent_token, get_token_policy, search_products,
get_product_details, choose_best_product, create_order, pay_with_agent_token,
get_invoice, report_to_user`. Logic: verify → filter by allowed sites +
category + price ≤ limit → rank
`score = rating*20 + log(reviews) + trustedBonus + conditionBonus − price` →
trusted ? pay online : COD → fetch invoice → return invoice + tx hash.
Safety: never exceed limit/category/sites, never reuse single-use, never pay
untrusted online. Log every step for the demo panel.

## 12. Env (`.env.local`, testnet keys only)

```env
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_CONTRACT_ADDRESS=0x3d63a735225e4Ab159039fB9048E7408f7A35bf2
NEXT_PUBLIC_EXPLORER_URL=https://testnet.monadvision.com
DEMO_PRIVATE_KEY=                 # testnet agent wallet
DEMO_MON_TO_USD_RATE=1
DATABASE_URL=file:./dev.db
```

## 13. Build order (in this sequence)

1. Scaffold + landing `/` + wallet + `/topup` wired to `topUp()`
2. Token generate/list/detail wired to `grantPermission`/`getPolicy`
3. Mock merchant + product + checkout UI
4. `/api/tokens/verify` + pay flow wired to `spend()`
5. Invoices with explorer links
6. Bot script end-to-end
7. Failure-case demo buttons (wrong site/category, over budget, expired, reuse)
8. README demo script + `npm run dev` one-command setup

## 14. Done means

Top-up 5 MON → $5 token (electronics, trusted-gadgets.example, 30 min,
single-use) → bot buys best allowed product → `PAID` invoice + tx hash →
second run from disallowed site → `MERCHANT_NOT_ALLOWED`. All 18 acceptance
checks in `context.md` §21 pass.
