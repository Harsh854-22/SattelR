export type TokenStatus = "active" | "used" | "revoked" | "expired";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "COD_PENDING"
  | "FAILED";

export type InvoiceStatus = "PAID" | "COD_PENDING" | "FAILED";

export interface AgentToken {
  id: string;
  tokenString: string;
  ownerWallet: string;
  agentWallet: string;
  agentName: string;
  purpose: string;
  policyId: string;
  amountLimitUsd: number;
  spentUsd: number;
  category: string;
  allowedWebsites: string[];
  webMode: "Allowlist" | "Blocklist";
  expiry: string | null;
  singleUse: boolean;
  used: boolean;
  status: TokenStatus;
  promptTemplate: string;
  createdAt: string;
  txHash?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  priceUsd: number;
  rating: number;
  reviews: number;
  condition: string;
  merchant: string;
  trusted: boolean;
  delivery: ("online" | "cod")[];
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  merchant: string;
  amountUsd: number;
  category: string;
  deliveryMethod: "online" | "cod";
  paymentMethod: "agent_token" | "cod" | "human_card";
  tokenId?: string;
  status: OrderStatus;
  createdAt: string;
  qty: number;
}

export interface Invoice {
  id: string;
  orderId: string;
  walletAddress: string;
  tokenId?: string;
  merchant: string;
  productName: string;
  amountUsd: number;
  status: InvoiceStatus;
  txHash?: string;
  payerName?: string;
  method?: string;
  createdAt: string;
}

export interface DbShape {
  tokens: AgentToken[];
  orders: Order[];
  invoices: Invoice[];
  topups: { id: string; amountMon: number; txHash: string; createdAt: string }[];
}
