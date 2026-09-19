import {
  createPublicClient,
  createWalletClient,
  decodeErrorResult,
  http,
  parseEther,
  formatEther,
  decodeEventLog,
  type Hash,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { agentPayVaultAbi, monadTestnet } from "./abi";

function rpcUrl() {
  return process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
}

function contractAddress(): `0x${string}` {
  const a = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!a) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS missing");
  return a as `0x${string}`;
}

function normalizeKey(key: string): Hex {
  return (key.startsWith("0x") ? key : `0x${key}`) as Hex;
}

/** 1 USD credit = (1 / DEMO_MON_TO_USD_RATE) MON. Default 1:1. */
export function usdToWei(usd: number): bigint {
  const rate = Number(process.env.DEMO_MON_TO_USD_RATE || "1");
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1;
  const mon = usd / safeRate;
  if (!Number.isFinite(mon) || mon <= 0) throw new Error("INVALID_AMOUNT");
  return parseEther(mon.toFixed(8));
}

export function getPublicClient() {
  return createPublicClient({
    chain: monadTestnet,
    transport: http(rpcUrl()),
  });
}

function walletFromKey(key: string) {
  const account = privateKeyToAccount(normalizeKey(key));
  const client = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(rpcUrl()),
  });
  return { account, client };
}

export function agentAccountAddress(): `0x${string}` {
  const key = process.env.DEMO_PRIVATE_KEY;
  if (!key) throw new Error("DEMO_PRIVATE_KEY (agent) missing");
  return privateKeyToAccount(normalizeKey(key)).address;
}

export async function readVaultBalanceWei(): Promise<bigint> {
  const publicClient = getPublicClient();
  return publicClient.readContract({
    address: contractAddress(),
    abi: agentPayVaultAbi,
    functionName: "vaultBalance",
  });
}

export async function readVaultBalance(): Promise<string> {
  return formatEther(await readVaultBalanceWei());
}

async function onChainTopUpWei(value: bigint): Promise<Hash> {
  const key = process.env.OWNER_PRIVATE_KEY;
  if (!key) throw new Error("OWNER_PRIVATE_KEY missing");
  const { client, account } = walletFromKey(key);
  const publicClient = getPublicClient();
  const hash = await client.writeContract({
    address: contractAddress(),
    abi: agentPayVaultAbi,
    functionName: "topUp",
    value,
    account,
    chain: monadTestnet,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`topUp reverted: ${hash}`);
  }
  return hash;
}

export async function onChainTopUp(amountMon: number): Promise<Hash> {
  return onChainTopUpWei(parseEther(String(amountMon)));
}

/** Top up just enough so the vault can cover `needed` wei. */
export async function ensureVaultHas(needed: bigint): Promise<void> {
  const bal = await readVaultBalanceWei();
  if (bal >= needed) return;
  const shortfall = needed - bal;
  const buffer = parseEther("0.05");
  await onChainTopUpWei(shortfall + buffer);
}

/** Agent must hold native MON for gas. Fund from owner if empty. */
export async function ensureAgentHasGas(): Promise<void> {
  const agentKey = process.env.DEMO_PRIVATE_KEY;
  const ownerKey = process.env.OWNER_PRIVATE_KEY;
  if (!agentKey || !ownerKey) return;

  const publicClient = getPublicClient();
  const agent = privateKeyToAccount(normalizeKey(agentKey));
  const min = parseEther("0.008");
  const bal = await publicClient.getBalance({ address: agent.address });
  if (bal >= min) return;

  const { client, account } = walletFromKey(ownerKey);
  const hash = await client.sendTransaction({
    account,
    chain: monadTestnet,
    to: agent.address,
    value: parseEther("0.02"),
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`agent gas top-up reverted: ${hash}`);
  }
}

export async function onChainGrantPermission(args: {
  agent: `0x${string}`;
  amountLimitUsd: number;
  category: string;
  allowedWebsites: string[];
  expiryUnix: number;
  singleUse: boolean;
}): Promise<{ policyId: Hex; txHash: Hash }> {
  const key = process.env.OWNER_PRIVATE_KEY;
  if (!key) throw new Error("OWNER_PRIVATE_KEY missing");
  const { client, account } = walletFromKey(key);
  const publicClient = getPublicClient();

  const hash = await client.writeContract({
    address: contractAddress(),
    abi: agentPayVaultAbi,
    functionName: "grantPermission",
    args: [
      args.agent,
      usdToWei(args.amountLimitUsd),
      args.category,
      args.allowedWebsites,
      BigInt(args.expiryUnix),
      args.singleUse,
    ],
    account,
    chain: monadTestnet,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`grantPermission tx reverted: ${hash}`);
  }
  let policyId: Hex | null = null;
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: agentPayVaultAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "PermissionGranted") {
        policyId = decoded.args.policyId as Hex;
        break;
      }
    } catch {
      /* skip non-matching logs */
    }
  }
  if (!policyId) {
    for (let attempt = 0; attempt < 5 && !policyId; attempt++) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      const events = await publicClient.getContractEvents({
        address: contractAddress(),
        abi: agentPayVaultAbi,
        eventName: "PermissionGranted",
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });
      const match = events.find((e) => e.transactionHash === hash);
      if (match?.args?.policyId) {
        policyId = match.args.policyId as Hex;
      }
    }
  }
  if (!policyId) throw new Error(`PermissionGranted event not found for ${hash}`);
  return { policyId, txHash: hash };
}

export async function onChainSpend(args: {
  policyId: Hex;
  merchant: `0x${string}`;
  amountUsd: number;
  category: string;
  website: string;
  orderId: string;
}): Promise<Hash> {
  const key = process.env.DEMO_PRIVATE_KEY;
  if (!key) throw new Error("DEMO_PRIVATE_KEY (agent) missing");
  const { client, account } = walletFromKey(key);
  const publicClient = getPublicClient();
  const amount = usdToWei(args.amountUsd);

  await ensureAgentHasGas();
  await ensureVaultHas(amount);

  const { request } = await publicClient.simulateContract({
    address: contractAddress(),
    abi: agentPayVaultAbi,
    functionName: "spend",
    args: [
      args.policyId,
      args.merchant,
      amount,
      args.category,
      args.website,
      args.orderId,
    ],
    account,
  });

  const hash = await client.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`spend reverted on-chain: ${hash}`);
  }
  return hash;
}

function extractRevertData(err: unknown): Hex | undefined {
  if (!err || typeof err !== "object") return undefined;
  const rec = err as Record<string, unknown>;
  const candidates = [rec.data, rec.cause];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("0x")) return c as Hex;
    if (c && typeof c === "object") {
      const inner = c as Record<string, unknown>;
      if (typeof inner.data === "string" && inner.data.startsWith("0x")) {
        return inner.data as Hex;
      }
      if (typeof inner.raw === "string" && inner.raw.startsWith("0x")) {
        return inner.raw as Hex;
      }
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  const m = msg.match(/0x[0-9a-fA-F]{8,}/);
  return m ? (m[0] as Hex) : undefined;
}

export function mapRevertToCode(err: unknown): string {
  const data = extractRevertData(err);
  if (data) {
    try {
      const decoded = decodeErrorResult({ abi: agentPayVaultAbi, data });
      switch (decoded.errorName) {
        case "PolicyNotFound":
        case "PolicyInactive":
          return "TOKEN_NOT_FOUND";
        case "PolicyExpired":
          return "TOKEN_EXPIRED";
        case "PolicyAlreadyUsed":
          return "TOKEN_ALREADY_USED";
        case "AmountLimitExceeded":
          return "AMOUNT_LIMIT_EXCEEDED";
        case "MerchantNotAllowed":
          return "MERCHANT_NOT_ALLOWED";
        case "CategoryNotAllowed":
          return "CATEGORY_NOT_ALLOWED";
        case "InsufficientVaultBalance":
          return "INSUFFICIENT_BALANCE";
        case "NotAgent":
          return "NOT_AGENT";
        default:
          break;
      }
    } catch {
      /* fall through to string match */
    }
  }

  const msg = err instanceof Error ? err.message : String(err);
  const details =
    typeof err === "object" && err && "details" in err
      ? String((err as { details?: unknown }).details)
      : "";
  const blob = `${msg}\n${details}`;
  if (blob.includes("PolicyNotFound") || blob.includes("PolicyInactive"))
    return "TOKEN_NOT_FOUND";
  if (blob.includes("PolicyExpired")) return "TOKEN_EXPIRED";
  if (blob.includes("PolicyAlreadyUsed")) return "TOKEN_ALREADY_USED";
  if (blob.includes("AmountLimitExceeded")) return "AMOUNT_LIMIT_EXCEEDED";
  if (blob.includes("MerchantNotAllowed")) return "MERCHANT_NOT_ALLOWED";
  if (blob.includes("CategoryNotAllowed")) return "CATEGORY_NOT_ALLOWED";
  if (blob.includes("InsufficientVaultBalance")) return "INSUFFICIENT_BALANCE";
  if (blob.includes("NotAgent")) return "NOT_AGENT";
  if (
    blob.includes("Signer had insufficient balance") ||
    blob.includes("insufficient funds") ||
    blob.includes("insufficient balance")
  )
    return "AGENT_GAS_INSUFFICIENT";
  return "PAYMENT_FAILED";
}
