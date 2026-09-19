# CONTEXT.md — SattelR

## 1. Project Name

**SattelR**  
Open-source, self-hostable payment/access-token layer for AI agents on Monad.

## 2. One-Line Pitch

Users top up with MON, create restricted purchase tokens, and give those tokens to AI agents like Grok so they can shop within budget, category, and website limits.

## 3. Core Hackathon Demo Goal

Build a working demo where:

1. User visits the web app.
2. User connects wallet and tops up using Monad crypto, ideally testnet MON.
3. User goes to a **Token Generation Page**.
4. User creates a purchase token with:
   - Amount limit: `$5`
   - Category: example: electronics, domains, digital goods, accessories
   - Allowed websites: one or more approved websites
   - Optional expiry
5. The app generates an agent access token.
6. User gives that token to a Grok bot / AI agent.
7. User tells the Grok bot:
   - Purchase a product from an allowed website.
   - Choose the best option based on price, reviews, and condition.
   - Prefer trusted merchants.
   - Use online payment with agent token if merchant is trusted.
   - Use cash on delivery if merchant is not trusted or if user requested COD.
8. The bot visits the allowed website.
9. The bot selects a product.
10. At checkout, the bot selects payment method: **Agent Token**.
11. The bot pastes the generated token.
12. The system verifies:
   - Token is valid.
   - Token has enough balance.
   - Merchant is allowed.
   - Category is allowed.
   - Amount is within limit.
   - Token has not expired.
   - Token has not already been used.
13. If valid, payment succeeds on Monad.
14. The system creates an invoice.
15. The bot returns the invoice to the user.
16. Demo ends with proof of purchase: invoice + Monad transaction hash.

## 4. Important Hackathon Constraints

This is a hackathon MVP. Prioritize a clean, working demo over production perfection.

### Must Have

- Works on **Monad Testnet**.
- Uses MON or testnet MON for top-up.
- Has a token generation page.
- Creates restricted agent purchase tokens.
- Has a mock merchant checkout flow.
- Accepts agent token at payment.
- Validates token permissions.
- Produces invoice after success.
- Has a simple UI that judges can understand quickly.
- Shows failed transaction if agent tries to violate policy.

### Do Not Build For Hackathon

Do not waste time on:

- Real credit card rails.
- Real Amazon/eBay scraping.
- Real KYC/AML.
- Production security audits.
- Complex hardware key flow with spare phone.
- Full enterprise dashboard.
- Multi-chain support.
- Mainnet payments.
- Real-world cash on delivery logistics.

For the demo, external websites should be mocked or represented by a local merchant app.

## 5. Product Concept

SattelR is a wallet + policy engine for AI agents.

A human user deposits MON into a smart contract or app-controlled vault. The app gives the user internal USD-equivalent credits for demo purposes. The user then creates a limited access token.

The access token is not a full wallet private key. It is a restricted payment permission.

Example token policy:

```json
{
  "tokenId": "tok_abc123",
  "owner": "0xUserWallet",
  "agent": "grok-bot",
  "amountLimitUsd": 5,
  "spentUsd": 0,
  "category": "electronics",
  "allowedWebsites": [
    "mockshop.example",
    "trusted-gadgets.example"
  ],
  "expiry": "2026-01-01T00:15:00Z",
  "singleUse": true,
  "status": "active"
}
```

The AI agent can only use this token to make purchases that match the policy.

## 6. Demo Narrative

The demo should show:

> “AI agents are fast, but giving them full wallet access is dangerous. SattelR gives agents a limited, programmable payment token. It works like a prepaid card with rules. The agent can buy only approved items, from approved websites, up to a fixed budget. All payments settle quickly on Monad.”

## 7. Target Users

### Primary Hackathon User

- Crypto/AI developer or demo judge.
- Wants to see an AI agent safely spend funds.
- Wants to see Monad transaction speed.

### Future Real Users

- Consumers who want AI shopping assistants.
- Enterprises deploying autonomous procurement agents.
- Private networks that want self-hosted agent payment infrastructure.
- Developers building AI agents that need payment rails.

## 8. Main User Flow

### 8.1 Top-Up Flow

1. User connects wallet.
2. User enters top-up amount.
3. For demo, use fixed conversion:
   - `1 MON = 1 USD credit`
   - Or show approximate USD value but keep logic simple.
4. User sends MON to smart contract or app vault.
5. App credits user account with internal USD balance.
6. Show top-up success and Monad transaction hash.

### 8.2 Token Generation Flow

1. User opens `/generate-token`.
2. User selects:
   - Amount: default `$5`
   - Category
   - Allowed websites
   - Expiry time
   - Single-use toggle
3. User clicks **Generate Token**.
4. App creates token record.
5. App displays token string.
6. User copies token and gives it to Grok bot.

Example token string:

```text
MAP_TOK_abc123secret
```

For hackathon, the token can be a random UUID or signed JWT. Store the policy in database or on-chain.

### 8.3 AI Agent Shopping Flow

User gives prompt to Grok bot:

```text
Use this agent token: MAP_TOK_abc123secret

Go to the allowed website and buy the best product under $5.
Prefer the lowest price, highest reviews, and trusted merchant.
If merchant is trusted, pay online using the agent token.
If merchant is not trusted, select cash on delivery if available.
Return the invoice after purchase.
```

The bot should:

1. Verify token.
2. Get token policy.
3. Search allowed websites only.
4. Filter by category.
5. Filter by price <= token limit.
6. Rank products by:
   - price low to high
   - rating high to low
   - review count high to low
   - merchant trusted
   - condition new/refurbished/used
7. Choose best product.
8. Create order.
9. At checkout, select payment method:
   - `agent_token` if trusted merchant and online payment allowed
   - `cod` if merchant not trusted and COD allowed
10. Paste token.
11. Submit payment.
12. Wait for verification.
13. If success, fetch invoice.
14. Return invoice to user.

### 8.4 Checkout Flow

The mock merchant checkout page should have:

- Product summary
- Price
- Merchant trust badge
- Delivery option
- Payment method selector:
  - Agent Token
  - Cash on Delivery
- Token input field
- Verify Token button
- Pay button
- Success/failure status

If Agent Token is selected:

1. User or bot pastes token.
2. Merchant backend calls verification API.
3. If valid, show:
   - Allowed amount
   - Remaining balance
   - Allowed category
   - Allowed merchant
   - Expiry
4. User/bot confirms payment.
5. Smart contract or backend settles payment.
6. Invoice is generated.

### 8.5 Invoice Flow

After successful payment, create invoice with:

- Invoice ID
- Date
- Buyer wallet
- Agent name
- Token ID
- Merchant name
- Product name
- Category
- Amount
- Payment method
- Status
- Monad transaction hash
- Order ID
- QR code optional

Invoice statuses:

- `PAID`
- `COD_PENDING`
- `FAILED`
- `REFUNDED` optional

## 9. MVP Pages

Build the following pages:

### `/`

Landing page.

Should include:

- Project name
- One-line pitch
- Connect wallet button
- Buttons:
  - Top Up
  - Generate Token
  - Merchant Checkout
  - Invoices

### `/topup`

Top-up page.

Features:

- Connect wallet
- Input MON amount
- Show USD credit equivalent
- Button: Top Up with MON
- Show transaction hash after success
- Show current balance

### `/generate-token`

Token generation page.

Fields:

- Amount in USD, default `5`
- Category dropdown
- Allowed websites multiselect
- Expiry dropdown:
  - 10 minutes
  - 30 minutes
  - 1 hour
- Single-use checkbox
- Button: Generate Token

After generation:

- Show token string
- Copy button
- Show policy summary
- Show token status

### `/tokens`

List all generated tokens.

Show:

- Token ID
- Amount
- Spent
- Category
- Allowed websites
- Expiry
- Status
- Copy token button

### `/tokens/[id]`

Token detail page.

Show:

- Full policy
- Status
- Usage history
- Related invoice if paid

### `/merchant`

Mock merchant product listing.

Show products with:

- Name
- Category
- Price
- Rating
- Reviews
- Condition
- Merchant
- Trusted badge

### `/merchant/product/[id]`

Product detail page.

Show:

- Product details
- Reviews
- Merchant trust score
- Delivery options
- Buy button

### `/merchant/checkout/[orderId]`

Checkout page.

Features:

- Order summary
- Payment method selector
- Agent token input
- Verify token button
- Pay button
- Success/failure result
- Link to invoice

### `/invoices`

List invoices.

### `/invoices/[id]`

Invoice detail page.

Show:

- Invoice metadata
- Product
- Payment status
- Monad tx hash
- Token used
- Buyer/agent info

## 10. Mock Merchant Data

Use a local mock merchant dataset.

Example products:

```json
[
  {
    "id": "prod_1",
    "name": "USB-C Cable",
    "category": "electronics",
    "priceUsd": 3.99,
    "rating": 4.6,
    "reviews": 1200,
    "condition": "new",
    "merchant": "mockshop.example",
    "trusted": true,
    "delivery": ["online", "cod"]
  },
  {
    "id": "prod_2",
    "name": "Phone Stand",
    "category": "electronics",
    "priceUsd": 4.49,
    "rating": 4.8,
    "reviews": 860,
    "condition": "new",
    "merchant": "trusted-gadgets.example",
    "trusted": true,
    "delivery": ["online", "cod"]
  },
  {
    "id": "prod_3",
    "name": "Used Earbuds",
    "category": "electronics",
    "priceUsd": 4.99,
    "rating": 4.1,
    "reviews": 95,
    "condition": "used",
    "merchant": "random-seller.example",
    "trusted": false,
    "delivery": ["cod"]
  },
  {
    "id": "prod_4",
    "name": "Premium Domain Credit",
    "category": "domains",
    "priceUsd": 5.00,
    "rating": 4.9,
    "reviews": 300,
    "condition": "digital",
    "merchant": "mock-domains.example",
    "trusted": true,
    "delivery": ["online"]
  }
]
```

## 11. Agent Bot Requirements

The Grok bot can be implemented as:

- Python script
- Node.js script
- Chat UI
- Terminal bot
- Discord bot
- Or simple LLM tool-calling agent

For hackathon, simplest is a Python or Node script with tool functions.

### Bot Tools

The agent should have these tools:

```text
verify_agent_token(token)
get_token_policy(token)
search_products(query, category, maxPrice, allowedWebsites)
get_product_details(productId)
choose_best_product(products)
create_order(productId, deliveryMethod)
pay_with_agent_token(orderId, token)
get_invoice(orderId)
report_to_user(message)
```

### Bot Decision Logic

```text
1. Verify token.
2. If token invalid, stop.
3. Get allowed websites and category.
4. Search only allowed websites.
5. Filter products where price <= token amount.
6. Filter products by token category.
7. Rank products using score:
   score = rating * 20 + log(reviewCount) + trustedBonus + conditionBonus - price
8. Choose highest score.
9. If merchant.trusted == true:
      use online payment with agent token.
   Else:
      use COD if available.
10. Create order.
11. Pay or reserve token.
12. If payment succeeds, fetch invoice.
13. Return invoice to user.
```

### Bot Safety Rules

The bot must never:

- Spend more than token limit.
- Buy from disallowed websites.
- Buy disallowed categories.
- Use expired token.
- Reuse single-use token.
- Pay untrusted merchant online unless explicitly allowed.
- Leak token in logs unless demo mode.

## 12. Payment Logic

For hackathon, keep payment logic simple.

### Online Payment With Agent Token

If merchant is trusted:

1. Bot selects product.
2. Bot creates order with status `PENDING_PAYMENT`.
3. Bot submits agent token.
4. Backend verifies token.
5. Backend or smart contract moves funds.
6. Order becomes `PAID`.
7. Invoice becomes `PAID`.
8. Return invoice + tx hash.

### Cash on Delivery

If merchant is not trusted:

1. Bot selects product.
2. Bot creates order with status `COD_PENDING`.
3. No actual token spend occurs.
4. Invoice status is `COD_PENDING`.
5. Bot tells user:
   - Order created.
   - Payment due on delivery.
   - Token was not spent.

Optional advanced version:

- Token locks funds in escrow.
- Funds release on delivery confirmation.
- Do not build this unless time permits.

## 13. Smart Contract Requirements

Use Solidity. Deploy to Monad Testnet.

For hackathon, a simple contract is enough.

### Contract Name

`AgentPayVault`

### Core State

```solidity
mapping(address => uint256) public credits;
mapping(bytes32 => Policy) public policies;
```

### Policy Struct

```solidity
struct Policy {
    address owner;
    uint256 amountUsd;
    uint256 spentUsd;
    string category;
    string[] allowedMerchants;
    uint256 expiry;
    bool singleUse;
    bool used;
    bool active;
}
```

### Core Functions

```solidity
function topUp() external payable
function createPolicy(
    uint256 amountUsd,
    string calldata category,
    string[] calldata allowedMerchants,
    uint256 expiry,
    bool singleUse
) external returns (bytes32 policyId)
function pay(
    bytes32 policyId,
    string calldata merchant,
    string calldata category,
    uint256 amountUsd,
    string calldata orderId
) external returns (bool)
function getPolicy(bytes32 policyId) external view returns (Policy memory)
```

### Top-Up Logic

```text
Accept MON.
Add credits[msg.sender] += msg.value.
For demo, 1 wei MON = 1 credit unit or use simplified decimals.
Emit TopUp event.
```

### Create Policy Logic

```text
Check user has enough credit.
Lock or reserve amount.
Generate policyId.
Store policy.
Emit PolicyCreated.
```

### Pay Logic

```text
Check policy exists.
Check policy active.
Check not expired.
Check not used if singleUse.
Check merchant is allowed.
Check category matches.
Check amountUsd <= remaining policy amount.
Deduct amount.
Mark used if singleUse.
Transfer MON to merchant or escrow.
Emit PaymentAuthorized.
```

### Events

```solidity
event TopUp(address indexed user, uint256 amountMon, uint256 creditUsd);
event PolicyCreated(bytes32 indexed policyId, address indexed owner, uint256 amountUsd, string category);
event PaymentAuthorized(
    bytes32 indexed policyId,
    address indexed merchant,
    string orderId,
    uint256 amountUsd
);
event PaymentFailed(bytes32 indexed policyId, string reason);
```

### Hackathon Simplification

If smart contract time is tight:

- Use smart contract only for top-up and payment proof.
- Store token policies in backend database.
- Store a hash of the policy on-chain.
- Or generate token on-chain as an ID and keep detailed metadata off-chain.

Judges care most that the payment proof is visible on Monad.

## 14. Backend API Requirements

Use Next.js API routes or Express.

### Wallet/User Endpoints

```text
POST /api/wallet/connect
GET  /api/balance/:wallet
POST /api/topup
```

### Token Endpoints

```text
POST /api/tokens/generate
GET  /api/tokens
GET  /api/tokens/:id
POST /api/tokens/verify
```

### Merchant Endpoints

```text
GET  /api/products
GET  /api/products/:id
POST /api/orders/create
POST /api/orders/:id/pay
GET  /api/orders/:id
```

### Invoice Endpoints

```text
GET  /api/invoices
GET  /api/invoices/:id
```

## 15. Database Schema

Use SQLite, Prisma, or simple in-memory JSON for hackathon.

### UserWallet

```json
{
  "walletAddress": "0x...",
  "monBalance": 0,
  "usdCreditBalance": 0,
  "createdAt": "timestamp"
}
```

### TopUp

```json
{
  "id": "topup_1",
  "walletAddress": "0x...",
  "monAmount": 5,
  "usdCredit": 5,
  "txHash": "0x...",
  "status": "success",
  "createdAt": "timestamp"
}
```

### AgentToken

```json
{
  "id": "tok_abc123",
  "tokenString": "MAP_TOK_abc123secret",
  "ownerWallet": "0x...",
  "amountLimitUsd": 5,
  "spentUsd": 0,
  "category": "electronics",
  "allowedWebsites": ["mockshop.example"],
  "expiry": "timestamp",
  "singleUse": true,
  "used": false,
  "status": "active",
  "createdAt": "timestamp"
}
```

### Product

```json
{
  "id": "prod_1",
  "name": "USB-C Cable",
  "category": "electronics",
  "priceUsd": 3.99,
  "rating": 4.6,
  "reviews": 1200,
  "condition": "new",
  "merchant": "mockshop.example",
  "trusted": true
}
```

### Order

```json
{
  "id": "order_1",
  "productId": "prod_1",
  "merchant": "mockshop.example",
  "amountUsd": 3.99,
  "deliveryMethod": "online",
  "paymentMethod": "agent_token",
  "tokenId": "tok_abc123",
  "status": "PENDING_PAYMENT",
  "createdAt": "timestamp"
}
```

### Invoice

```json
{
  "id": "inv_1",
  "orderId": "order_1",
  "walletAddress": "0x...",
  "tokenId": "tok_abc123",
  "merchant": "mockshop.example",
  "productName": "USB-C Cable",
  "amountUsd": 3.99,
  "status": "PAID",
  "txHash": "0x...",
  "createdAt": "timestamp"
}
```

## 16. Token Verification Rules

When bot or user submits token, verify all of these:

```text
1. Token exists.
2. Token status is active.
3. Token is not expired.
4. Token is not used if single-use.
5. Merchant is in allowedWebsites.
6. Product category matches token category.
7. Product price <= token remaining amount.
8. User wallet has enough top-up balance.
9. Payment amount is positive.
10. Token has not been replayed.
```

Return clear errors:

```text
TOKEN_NOT_FOUND
TOKEN_EXPIRED
TOKEN_ALREADY_USED
INSUFFICIENT_BALANCE
MERCHANT_NOT_ALLOWED
CATEGORY_NOT_ALLOWED
AMOUNT_LIMIT_EXCEEDED
PAYMENT_FAILED
```

## 17. Recommended Tech Stack

### Frontend

- Next.js
- Tailwind CSS
- ethers.js or viem
- wagmi optional

### Backend

- Next.js API routes
- SQLite or in-memory JSON for hackathon
- Prisma optional

### Smart Contracts

- Solidity
- Foundry or Hardhat
- Monad Testnet RPC

### Bot

- Node.js or Python
- Grok / LLM API
- Tool-calling structure
- Optional: Playwright for fake browser demo

### Demo Presentation

- Terminal or UI showing agent logs
- Monad Testnet block explorer link
- Invoice page with tx hash

## 18. Repository Structure

```text
monad-agent-pay/
├── app/
│   ├── page.tsx
│   ├── topup/
│   ├── generate-token/
│   ├── tokens/
│   ├── merchant/
│   ├── invoices/
│   └── api/
├── components/
│   ├── ConnectWallet.tsx
│   ├── TopUpForm.tsx
│   ├── TokenGenerator.tsx
│   ├── ProductCard.tsx
│   ├── CheckoutForm.tsx
│   └── InvoiceView.tsx
├── lib/
│   ├── contract.ts
│   ├── db.ts
│   ├── tokens.ts
│   ├── products.ts
│   └── utils.ts
├── contracts/
│   └── AgentPayVault.sol
├── scripts/
│   ├── deploy.ts
│   └── seed-products.ts
├── bot/
│   ├── agent.py
│   └── tools.py
├── context.md
├── README.md
└── package.json
```

## 19. Environment Variables

Create `.env.local`:

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

Security note:

For hackathon, use a fresh testnet wallet. Never use a mainnet private key.

## 20. Build Order

The coding agent should implement in this order:

### Phase 1: Basic App

1. Scaffold Next.js app.
2. Add landing page.
3. Add wallet connect mock or real connect.
4. Add top-up page UI.

### Phase 2: Token Generation

1. Create token generation form.
2. Store token in local database or JSON.
3. Show generated token.
4. Add token list page.
5. Add token detail page.

### Phase 3: Mock Merchant

1. Create product dataset.
2. Build product listing page.
3. Build product detail page.
4. Build checkout page.
5. Add payment method selector.
6. Add agent token input.

### Phase 4: Payment Verification

1. Add `/api/tokens/verify`.
2. Validate token rules.
3. Return clear success/error messages.

### Phase 5: Monad Integration

1. Deploy `AgentPayVault` to Monad Testnet.
2. Integrate top-up transaction.
3. Integrate payment transaction.
4. Save transaction hash to invoice.

### Phase 6: Invoice

1. Create invoice after payment.
2. Show invoice page.
3. Show Monad tx hash.
4. Show token used.

### Phase 7: Grok Bot

1. Create bot script.
2. Add tools.
3. Connect to token verification API.
4. Let bot choose product.
5. Let bot create order.
6. Let bot pay with token.
7. Let bot fetch invoice.
8. Output invoice link and tx hash.

### Phase 8: Demo Polish

1. Add agent activity log panel.
2. Add success animations.
3. Add failed transaction demo.
4. Add README.
5. Add demo script.

## 21. Acceptance Criteria

The project is complete when:

- [ ] User can top up with MON on Monad Testnet.
- [ ] User can generate a $5 agent token.
- [ ] Token has category restriction.
- [ ] Token has website restriction.
- [ ] Token has expiry.
- [ ] Token can be copied.
- [ ] Grok bot can receive token.
- [ ] Grok bot can choose a product from allowed website.
- [ ] Grok bot compares price, reviews, and condition.
- [ ] Grok bot selects trusted merchant if possible.
- [ ] Checkout accepts agent token.
- [ ] Token verification blocks invalid use.
- [ ] Payment succeeds on Monad Testnet.
- [ ] Invoice is generated.
- [ ] Invoice shows Monad tx hash.
- [ ] Bot returns invoice to user.
- [ ] Demo can show a failed payment when policy is violated.
- [ ] App runs locally with simple commands.

## 22. Demo Script For Judges

Use this exact demo flow:

1. Open app.
2. Show connected wallet.
3. Top up with 5 MON testnet.
4. Generate agent token:
   - Amount: $5
   - Category: electronics
   - Website: trusted-gadgets.example
   - Expiry: 30 minutes
   - Single-use: yes
5. Copy token.
6. Open Grok bot.
7. Paste prompt:

```text
Use this agent token: MAP_TOK_abc123secret

Buy the best electronics product under $5 from allowed websites.
Prefer best price, highest rating, and trusted merchant.
Pay online if merchant is trusted.
Return the invoice.
```

8. Bot logs actions:
   - Verifying token
   - Searching products
   - Comparing products
   - Selecting product
   - Creating order
   - Paying with agent token
   - Fetching invoice
9. Show invoice page.
10. Show Monad transaction hash.
11. Then show failure case:
   - Bot tries to buy from disallowed website.
   - Payment rejected with `MERCHANT_NOT_ALLOWED`.
12. End demo.

## 23. Failure Cases To Demo

Show at least one failure:

### Case 1: Wrong Category

Token category: `electronics`  
Agent tries to buy: `domain`  
Result:

```text
CATEGORY_NOT_ALLOWED
```

### Case 2: Over Budget

Token limit: `$5`  
Product price: `$6`  
Result:

```text
AMOUNT_LIMIT_EXCEEDED
```

### Case 3: Wrong Website

Token allowed website: `trusted-gadgets.example`  
Agent tries: `random-seller.example`  
Result:

```text
MERCHANT_NOT_ALLOWED
```

### Case 4: Expired Token

Token expired.  
Result:

```text
TOKEN_EXPIRED
```

### Case 5: Reused Token

Single-use token already spent.  
Result:

```text
TOKEN_ALREADY_USED
```

## 24. Security Notes For Demo

- Use only Monad Testnet.
- Use a fresh demo wallet.
- Do not expose real private keys.
- Do not process real fiat payments.
- Do not automate real merchant websites unless absolutely necessary.
- Keep token permissions narrow.
- Make single-use tokens default.
- Log every agent action.

## 25. Production Vision After Hackathon

After hackathon, this can grow into:

- Virtual credit card issuing for agents.
- Enterprise self-hosted private network deployment.
- Customer-managed encryption keys.
- Hardware key approval using phone/passkey.
- Multi-agent marketplace.
- Agent-to-agent payments.
- On-chain policy NFTs or access tokens.
- Refund and dispute flow.
- Merchant SDK.
- Open-source agent payment standard.

## 26. Judge Pitch Points

Use these points in the pitch:

1. AI agents are becoming shoppers, buyers, and procurement operators.
2. Giving an agent a full wallet or credit card is unsafe.
3. SattelR creates restricted, programmable payment tokens.
4. Users keep control by setting amount, category, website, and expiry.
5. Agents can act autonomously without risking full funds.
6. Monad is ideal because agents need instant, low-cost settlement.
7. The system is open-source and can run in private networks.
8. This enables safe machine-to-machine commerce.

## 27. Final Instruction To Coding Agent

Build the simplest version that makes the live demo work.

Prefer:

- Working demo over perfect architecture.
- Mock merchant over real websites.
- Testnet MON over mainnet.
- Clear UI over hidden backend complexity.
- Visible Monad transaction proof.
- Clear token permission enforcement.
- Fast local setup.

If any requirement is ambiguous, choose the implementation that best supports a clean hackathon demo on Monad Testnet.
