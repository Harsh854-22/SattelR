# AgentPayVault (native MON)

Per-human smart vault for SattelR / Monad Agent Pay.

- **Deployer = human owner**
- Human tops up **native MON**
- Human grants a **spend permission** to an **AI agent wallet**
- Agent pays merchants in **MON** only within policy rules

## Roles

| Role | Address | Powers |
| --- | --- | --- |
| Human | `owner` (deployer) | `topUp`, `grantPermission`, `revokePermission`, `withdraw` |
| AI agent | policy `agent` | `spend` only under that policy |
| Merchant | checkout wallet | receives MON from `spend` |

## Policy rules enforced on-chain

- Amount ≤ remaining `amountLimit`
- Category exact match
- Website on allowlist
- Not expired
- Single-use not already spent
- Caller must be the granted agent
- Vault must hold enough MON

## Quick start (Foundry)

```bash
cd contracts

# If lib/forge-std is missing:
git clone --depth 1 https://github.com/foundry-rs/forge-std lib/forge-std

forge test
```

### Deploy (human key)

```bash
export MONAD_RPC_URL=...
export HUMAN_PRIVATE_KEY=...   # testnet only

forge script script/Deploy.s.sol:DeployAgentPayVault \
  --rpc-url $MONAD_RPC_URL \
  --broadcast \
  --private-key $HUMAN_PRIVATE_KEY
```

### Human: top up + grant agent

```solidity
vault.topUp{value: 5 ether}();

string[] memory sites = new string[](1);
sites[0] = "trusted-gadgets.example";

bytes32 policyId = vault.grantPermission(
    agentWallet,
    5 ether,                 // max spend
    "electronics",
    sites,
    block.timestamp + 30 minutes,
    true                     // single-use
);
```

### Agent: spend on a website checkout

```solidity
vault.spend(
    policyId,
    merchantWallet,
    3.99 ether,
    "electronics",
    "trusted-gadgets.example",
    "order_123"
);
```

## Assumptions (MVP)

1. One vault contract per human (deployer = owner).
2. Payments are **native MON only** (no ERC-20 / USDC in this contract).
3. Agent is a real wallet address authorized on-chain (not only an off-chain `MAP_TOK` string).
4. Off-chain app can still map `MAP_TOK_…` → `policyId` for UX.
