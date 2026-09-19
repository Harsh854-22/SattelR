# SattelR

**Prepaid cards for AI agents**, settled on [Monad](https://www.monad.xyz).

Agents can already shop. Giving them a full wallet is unsafe. Keeping a human in every checkout kills autonomy. SattelR is the middle layer: you top up **MON**, mint a **restricted purchase token**, and hand that token to Grok / Hermes — not your private key.

Each token is a spend permission, not a wallet. You set budget, category, allowed websites, and expiry. The agent can buy only inside those rules. Valid payments settle on-chain. Violations revert.

> AI agents are fast. Full wallet access is dangerous. SattelR works like a prepaid card with rules: approved items, approved sites, fixed budget, fast settlement on Monad.

[![live demo](https://img.shields.io/badge/demo-sattel--r.vercel.app-000000)](https://sattel-r.vercel.app)
[![Monad Mainnet](https://img.shields.io/badge/Monad-Mainnet%20143-836EF9)](https://monadvision.com/address/0x3d63a735225e4Ab159039fB9048E7408f7A35bf2)
[![Monad Testnet](https://img.shields.io/badge/Monad-Testnet%2010143-836EF9)](https://testnet.monadvision.com)
[![contract](https://img.shields.io/badge/AgentPayVault-0x3d63…3bf2-success)](https://monadvision.com/address/0x3d63a735225e4Ab159039fB9048E7408f7A35bf2)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Harsh854-22/SattelR)

---

## For judges — 30 seconds

**What to click**

| What | Link |
| --- | --- |
| **Live demo** | [https://sattel-r.vercel.app](https://sattel-r.vercel.app) |
| **Dashboard** (top up + mint token) | [https://sattel-r.vercel.app/dashboard](https://sattel-r.vercel.app/dashboard) |
| **OPEN_MART store** (agent checkout) | [https://sattel-r.vercel.app/merchant](https://sattel-r.vercel.app/merchant) |
| **Invoices** | [https://sattel-r.vercel.app/invoices](https://sattel-r.vercel.app/invoices) |
| **GitHub** | [https://github.com/Harsh854-22/SattelR](https://github.com/Harsh854-22/SattelR) |

**What is deployed**

Same `AgentPayVault` address on both chains (CREATE at nonce 0).

| | **Monad Mainnet** | **Monad Testnet** |
| --- | --- | --- |
| Chain ID | **143** | **10143** |
| RPC | `https://rpc.monad.xyz` | `https://testnet-rpc.monad.xyz` |
| Contract | **AgentPayVault** | **AgentPayVault** |
| Address | [`0x3d63a735225e4Ab159039fB9048E7408f7A35bf2`](https://monadvision.com/address/0x3d63a735225e4Ab159039fB9048E7408f7A35bf2) | [`0x3d63a735225e4Ab159039fB9048E7408f7A35bf2`](https://testnet.monadvision.com/address/0x3d63a735225e4Ab159039fB9048E7408f7A35bf2) |
| Owner (human) | [`0x1F3305F4d20F49c3505B5175d76A6619E4d00B38`](https://monadvision.com/address/0x1F3305F4d20F49c3505B5175d76A6619E4d00B38) | [`0x1F3305F4d20F49c3505B5175d76A6619E4d00B38`](https://testnet.monadvision.com/address/0x1F3305F4d20F49c3505B5175d76A6619E4d00B38) |
| Agent wallet | [`0xF9fC21289921cAD9Cf546fF51800c3848dE64F45`](https://monadvision.com/address/0xF9fC21289921cAD9Cf546fF51800c3848dE64F45) | [`0xF9fC21289921cAD9Cf546fF51800c3848dE64F45`](https://testnet.monadvision.com/address/0xF9fC21289921cAD9Cf546fF51800c3848dE64F45) |
| Deploy tx | [`0x359f3029…5d71`](https://monadvision.com/tx/0x359f3029a763ef3ea3f25ef7ba15db46d4295117cb34bf1a101d7aece1565d71) | [`0xbb49b333…283f`](https://testnet.monadvision.com/tx/0xbb49b333fdb2d5a57e41bfddabbf7a3b168481eafdad926258614e180534283f) |
| Explorer | [monadvision.com](https://monadvision.com) · [monadscan.com](https://monadscan.com) | [testnet.monadvision.com](https://testnet.monadvision.com) |
| Verified | Sourcify `exact_match` | Sourcify `exact_match` |

The hosted demo still uses **testnet**. Mainnet is live for on-chain proof.

### Mainnet deploy transaction

| Field | Value |
| --- | --- |
| Network | Monad Mainnet · Chain ID **143** |
| Status | Success |
| Contract | `AgentPayVault` |
| Address | [`0x3d63a735225e4Ab159039fB9048E7408f7A35bf2`](https://monadvision.com/address/0x3d63a735225e4Ab159039fB9048E7408f7A35bf2) |
| Deployer / owner | [`0x1F3305F4d20F49c3505B5175d76A6619E4d00B38`](https://monadvision.com/address/0x1F3305F4d20F49c3505B5175d76A6619E4d00B38) |
| Tx hash | [`0x359f3029a763ef3ea3f25ef7ba15db46d4295117cb34bf1a101d7aece1565d71`](https://monadvision.com/tx/0x359f3029a763ef3ea3f25ef7ba15db46d4295117cb34bf1a101d7aece1565d71) |
| Monadscan | [same tx](https://monadscan.com/tx/0x359f3029a763ef3ea3f25ef7ba15db46d4295117cb34bf1a101d7aece1565d71) |
| Block | `106177810` (`0x6542512`) |
| Type | CREATE (nonce `0`) |
| Value | `0 MON` |
| Gas used | `1,331,874` |
| Verification | Sourcify **exact_match** · job [`d7c82245-87cb-403f-b72a-4c12a35736a4`](https://sourcify-api-monad.blockvision.org/v2/verify/d7c82245-87cb-403f-b72a-4c12a35736a4) |

**How to demo in 5 steps**

1. Open the [dashboard](https://sattel-r.vercel.app/dashboard).
2. Top up a few testnet MON into the vault.
3. Generate a token: category `electronics`, website `trusted-gadgets.example`, limit `$5`.
4. Copy the token (or the full prompt) into Grok / Hermes, or run `npm run bot -- MAP_…`.
5. Agent shops at [OPEN_MART](https://sattel-r.vercel.app/merchant) → **AGENT** pay → paste token → invoice + Monad tx hash.

---

## How it works

```
Human                      Agent                         Monad Testnet
─────────────────────────────────────────────────────────────────────────
  Dashboard                  Token MAP_XXXX…               AgentPayVault
  ─────────                  ──────────────               ─────────────
  1. topUp MON     ──►       4. verify policy    ──►      topUp()
  2. mint token    ──►       5. search OPEN_MART          grantPermission()
  3. copy prompt   ──►       6. AGENT checkout   ──►      spend()  ──► merchant
                             7. invoice + tx hash         PaymentAuthorized
```

The token is **not** a private key. It maps to an on-chain policy. `spend()` only succeeds if:

- caller is the granted agent wallet
- merchant website is on the allowlist
- category matches
- amount ≤ remaining limit
- token is not expired / not already used (if single-use)
- vault holds enough MON

Wrong website, wrong category, or over-budget **reverts on-chain** (e.g. `MerchantNotAllowed`).

---

## Quick start — hosted demo

```text
https://sattel-r.vercel.app            landing
https://sattel-r.vercel.app/dashboard  top up + generate token
https://sattel-r.vercel.app/merchant   OPEN_MART store
https://sattel-r.vercel.app/invoices   receipts + tx hashes
```

Need testnet MON? Use the [Monad faucet](https://faucet.monad.xyz), then top up from the dashboard.

---

## Quick start — run locally

```bash
git clone https://github.com/Harsh854-22/SattelR.git
cd SattelR
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Open dashboard**.

Copy `.env.example` → `.env.local`. Use **testnet keys only** — never mainnet private keys.

```env
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_CONTRACT_ADDRESS=0x3d63a735225e4Ab159039fB9048E7408f7A35bf2
NEXT_PUBLIC_EXPLORER_URL=https://testnet.monadvision.com
NEXT_PUBLIC_OWNER_ADDRESS=0x1F3305F4d20F49c3505B5175d76A6619E4d00B38
NEXT_PUBLIC_AGENT_ADDRESS=0xF9fC21289921cAD9Cf546fF51800c3848dE64F45
```

---

## Quick start — agent bot

Deterministic shopper (no LLM):

```bash
npm run bot -- MAP_XXXX-XXXX-XXXX-XXXX
```

Grok tool-calling (needs `GROK_API_KEY` in `.env.local`):

```bash
npm run bot:grok -- MAP_XXXX-XXXX-XXXX-XXXX
```

The bot: verify token → search products → score & pick → create order → pay → fetch invoice.

Point it at the hosted app with:

```bash
SATTELR_API_URL=https://sattel-r.vercel.app npm run bot -- MAP_XXXX
```

---

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
| `INSUFFICIENT_BALANCE` | Vault too low |
| `MERCHANT_NOT_ALLOWED` | Website not on the allowlist |
| `CATEGORY_NOT_ALLOWED` | Product category mismatch |
| `AMOUNT_LIMIT_EXCEEDED` | Price above remaining limit |
| `PAYMENT_FAILED` | On-chain settlement failed |

---

## Smart contract — AgentPayVault

Per-human vault. The deployer is the human owner. The agent never owns the vault.

| Role | Who | Can call |
| --- | --- | --- |
| Human | `owner` (deployer) | `topUp`, `grantPermission`, `revokePermission`, `withdraw` |
| AI agent | policy `agent` | `spend` only under that policy |
| Merchant | checkout wallet | receives native MON from `spend` |

```solidity
vault.topUp{value: 5 ether}();

bytes32 policyId = vault.grantPermission(
    agentWallet,
    5 ether,                         // max spend
    "electronics",
    allowedWebsites,
    block.timestamp + 30 minutes,
    true                             // single-use
);

vault.spend(
    policyId,
    merchantWallet,
    3.99 ether,
    "electronics",
    "trusted-gadgets.example",
    "order_123"
);
```

### Live smoke tests (Monad Testnet)

| Step | Result |
| --- | --- |
| `topUp` 0.05 MON | [tx](https://testnet.monadvision.com/tx/0x2aadb26278b5dd90ab3adcc5cfaca45bf5b511826657e160b2da790c4882c2f9) |
| `grantPermission` | [tx](https://testnet.monadvision.com/tx/0x0d99a0ba5c099a96b8f413504d201e474b4192cc408cfa463b79fa28198bc7ce) |
| `spend` 0.01 MON | [tx](https://testnet.monadvision.com/tx/0x4765ef417ff93ebb225fab8b74dfd17687549fb17e6a113aad43b6a5c62c0ed4) |
| Wrong website | Reverted `MerchantNotAllowed` (expected) |

Foundry tests: **12/12 passed** (happy path + wrong website/category, stranger, over limit, revoke, insufficient balance, expired, single-use reuse, onlyOwner).

```bash
cd contracts
forge test
```

Source: [`contracts/src/AgentPayVault.sol`](./contracts/src/AgentPayVault.sol) · Deploy notes: [`contracts/DEPLOYMENT.md`](./contracts/DEPLOYMENT.md)

---

## Pages

| Route | What |
| --- | --- |
| `/` | Landing — prepaid cards for AI agents |
| `/dashboard` | Top up MON + issue token + copy prompt |
| `/topup` | Vault top-up |
| `/generate-token` | Token console |
| `/tokens` · `/tokens/[id]` | Token list and policy detail |
| `/merchant` | OPEN_MART store + AGENT / HUMAN checkout |
| `/invoices` · `/invoices/[id]` | Receipts with Monad tx hash |

---

## API overview

| Endpoint | Purpose |
| --- | --- |
| `POST /api/topup` | Deposit MON into the vault |
| `GET /api/balance/:wallet` | Vault balance |
| `POST /api/tokens/generate` | Mint a restricted agent token (`grantPermission`) |
| `GET /api/tokens` | List tokens |
| `POST /api/tokens/verify` | Check merchant / category / limit / expiry |
| `GET /api/products` | OPEN_MART catalog |
| `POST /api/orders/create` | Create an order |
| `POST /api/orders/:id/pay` | Settle with agent token (`spend`) |
| `GET /api/invoices` · `GET /api/invoices/:id` | Receipts |

---

## Repository

```text
SattelR/
├── app/                 Next.js pages + API routes
├── bot/                 Deterministic + Grok shopping agents
├── contracts/           AgentPayVault (Foundry, Monad Testnet)
├── lib/                 viem contract helpers, types, store
├── context.md           Full product spec
└── README.md
```

---

## Why Monad

Agents operate at machine speed. They need cheap, fast settlement — not a 12-second block that times out the workflow. Monad Testnet gives EVM compatibility with high throughput and sub-second finality, so an agent can pay, get a receipt, and continue in one loop.

---

## Documentation

- [Live demo](https://sattel-r.vercel.app)
- [GitHub repository](https://github.com/Harsh854-22/SattelR)
- [AgentPayVault on Monad Mainnet](https://monadvision.com/address/0x3d63a735225e4Ab159039fB9048E7408f7A35bf2)
- [Mainnet deploy tx](https://monadvision.com/tx/0x359f3029a763ef3ea3f25ef7ba15db46d4295117cb34bf1a101d7aece1565d71)
- [AgentPayVault on Monad Testnet](https://testnet.monadvision.com/address/0x3d63a735225e4Ab159039fB9048E7408f7A35bf2)
- [Product spec](./context.md)
- [Contract README](./contracts/README.md)
- [Deployment](./contracts/DEPLOYMENT.md)

## Credits

Built for Monad Blitz by:

- [Anurag](https://github.com/anurag-p6)
- [Harsh Singh](https://github.com/Harsh854-22)

## License

MIT · Demo app on Monad Testnet. Contract also live on **Monad Mainnet**.
