# AgentPayVault Deployment

## Network
- **Network:** Monad Testnet
- **Chain ID:** 10143
- **RPC:** https://testnet-rpc.monad.xyz

## Contract
- **Name:** AgentPayVault
- **Address:** 0x3d63a735225e4Ab159039fB9048E7408f7A35bf2
- **Deployer (owner/human):** 0x1F3305F4d20F49c3505B5175d76A6619E4d00B38
- **Deploy tx:** 0xbb49b333fdb2d5a57e41bfddabbf7a3b168481eafdad926258614e180534283f

## Explorer
- Contract: https://testnet.monadvision.com/address/0x3d63a735225e4Ab159039fB9048E7408f7A35bf2
- Deploy tx: https://testnet.monadvision.com/tx/0xbb49b333fdb2d5a57e41bfddabbf7a3b168481eafdad926258614e180534283f

## Verification
- **Status:** success (exact_match)
- **Verifier:** Sourcify (https://sourcify-api-monad.blockvision.org/)
- **Job ID:** a9253e6f-8ab3-40ae-b892-224e9c4552dc

## Brief usage
1. **topUp** — Fund the vault with native MON (payable).
2. **grantPermission** — Owner grants an agent spend rights (limits / allowances as defined by the contract).
3. **spend** — Authorized agent spends from the vault within granted permissions.

Broadcast artifact: broadcast/Deploy.s.sol/10143/run-latest.json

## Test status

### Local (Foundry)
- **12/12 passed** — happy path + wrong website/category, stranger, over limit, revoke, insufficient balance, expired, single-use reuse, onlyOwner, remainingAllowance

### Live Monad Testnet smoke (2026-09-19)
| Step | Result |
| --- | --- |
| topUp 0.05 MON | [tx](https://testnet.monadvision.com/tx/0x2aadb26278b5dd90ab3adcc5cfaca45bf5b511826657e160b2da790c4882c2f9) |
| grantPermission | [tx](https://testnet.monadvision.com/tx/0x0d99a0ba5c099a96b8f413504d201e474b4192cc408cfa463b79fa28198bc7ce) |
| policyId | `0x2c00e5875ec93eeee70ad625b3c45b164078056708981cbb1d7d2cb0cbfdb9d2` |
| spend 0.01 MON | [tx](https://testnet.monadvision.com/tx/0x4765ef417ff93ebb225fab8b74dfd17687549fb17e6a113aad43b6a5c62c0ed4) |
| wrong website | Reverted `MerchantNotAllowed` (expected) |
| Vault balance after | 0.04 MON |
