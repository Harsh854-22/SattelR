/**
 * Shared SattelR shopping tools — used by deterministic bot and Grok agent.
 */

export const BASE =
  process.env.BASE_URL ||
  process.env.SATTELR_API_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export type Product = {
  id: string;
  name: string;
  category: string;
  priceUsd: number;
  rating: number;
  reviews: number;
  condition: string;
  merchant: string;
  trusted: boolean;
  delivery?: string[];
};

export type AgentToken = {
  id: string;
  tokenString: string;
  amountLimitUsd: number;
  spentUsd: number;
  category: string;
  allowedWebsites: string[];
  webMode: "Allowlist" | "Blocklist";
  status: string;
  agentName?: string;
  purpose?: string;
};

export type Invoice = {
  id: string;
  orderId: string;
  productName: string;
  amountUsd: number;
  status: string;
  txHash?: string;
  merchant?: string;
};

export function log(step: string, detail?: unknown) {
  const ts = new Date().toISOString();
  if (detail !== undefined) {
    console.log(
      `[${ts}] ${step}`,
      typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)
    );
  } else {
    console.log(`[${ts}] ${step}`);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  return data as T;
}

export async function verify_agent_token(args: {
  tokenString: string;
  merchant: string;
  category: string;
  amountUsd: number;
}) {
  log("TOOL verify_agent_token", args);
  return api<{ ok: boolean; ownerName?: string; remaining?: number; error?: string }>(
    "/api/tokens/verify",
    { method: "POST", body: JSON.stringify(args) }
  );
}

export async function get_token_policy(tokenString: string) {
  log("TOOL get_token_policy", tokenString);
  const data = await api<{ token: AgentToken }>(
    `/api/tokens/${encodeURIComponent(tokenString)}`
  );
  return data.token;
}

export async function search_products(args: {
  category?: string;
  maxPrice?: number;
  allowedWebsites?: string[];
}) {
  log("TOOL search_products", args);
  const q = args.category ? `?category=${encodeURIComponent(args.category)}` : "";
  const data = await api<{ products?: Product[] }>(`/api/products${q}`);
  let list = data.products || [];
  if (args.maxPrice != null) {
    list = list.filter((p) => p.priceUsd <= args.maxPrice!);
  }
  if (args.allowedWebsites?.length) {
    const sites = args.allowedWebsites.map((s) => s.toLowerCase());
    list = list.filter((p) => sites.includes(p.merchant.toLowerCase()));
  }
  return list;
}

export async function get_product_details(productId: string) {
  log("TOOL get_product_details", productId);
  const data = await api<{ product: Product }>(`/api/products/${productId}`);
  return data.product;
}

export function choose_best_product(products: Product[]): Product | null {
  log("TOOL choose_best_product", { count: products.length });
  if (!products.length) return null;
  const scored = products
    .map((p) => {
      const trustedBonus = p.trusted ? 15 : 0;
      const conditionBonus =
        p.condition === "new" ? 10 : p.condition === "digital" ? 8 : 2;
      const score =
        p.rating * 20 +
        Math.log10(p.reviews + 1) * 5 +
        trustedBonus +
        conditionBonus -
        p.priceUsd;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);
  log("Top pick", {
    name: scored[0].p.name,
    score: scored[0].score.toFixed(2),
    price: scored[0].p.priceUsd,
  });
  return scored[0].p;
}

export async function create_order(args: {
  productId: string;
  deliveryMethod?: "online" | "cod";
}) {
  log("TOOL create_order", args);
  const data = await api<{ order: { id: string; amountUsd: number; status: string } }>(
    "/api/orders/create",
    {
      method: "POST",
      body: JSON.stringify({
        productId: args.productId,
        qty: 1,
        deliveryMethod: args.deliveryMethod || "online",
      }),
    }
  );
  return data.order;
}

export async function pay_with_agent_token(args: {
  orderId: string;
  tokenString: string;
  paymentMethod?: "agent_token" | "cod";
  payerName?: string;
}) {
  log("TOOL pay_with_agent_token", { orderId: args.orderId });
  return api<{ invoice?: Invoice; txHash?: string; error?: string }>(
    `/api/orders/${args.orderId}/pay`,
    {
      method: "POST",
      body: JSON.stringify({
        paymentMethod: args.paymentMethod || "agent_token",
        tokenString: args.tokenString,
        payerName: args.payerName || "GROK-AGENT",
      }),
    }
  );
}

export async function get_invoice(invoiceId: string) {
  log("TOOL get_invoice", invoiceId);
  const data = await api<{ invoice: Invoice }>(`/api/invoices/${invoiceId}`);
  return data.invoice;
}

export function report_to_user(message: string) {
  log("TOOL report_to_user", message);
  return { ok: true, message };
}

/** OpenAI-compatible tool schemas for Grok / xAI */
export const GROK_TOOLS = [
  {
    type: "function",
    function: {
      name: "verify_agent_token",
      description: "Verify a MAP_ agent token against merchant, category, and amount",
      parameters: {
        type: "object",
        properties: {
          tokenString: { type: "string" },
          merchant: { type: "string" },
          category: { type: "string" },
          amountUsd: { type: "number" },
        },
        required: ["tokenString", "merchant", "category", "amountUsd"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_token_policy",
      description: "Load full policy for a MAP_ token string",
      parameters: {
        type: "object",
        properties: { tokenString: { type: "string" } },
        required: ["tokenString"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search OPEN_MART catalog; filter by category, maxPrice, allowedWebsites",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          maxPrice: { type: "number" },
          allowedWebsites: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description: "Get one product by id",
      parameters: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "choose_best_product",
      description:
        "Rank products by score = rating*20 + log(reviews) + trusted + condition - price. Pass candidate product objects.",
      parameters: {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: { type: "object" },
          },
        },
        required: ["products"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Create a PENDING_PAYMENT order for a product",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          deliveryMethod: { type: "string", enum: ["online", "cod"] },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pay_with_agent_token",
      description:
        "Pay an order with agent token (trusted merchant) or COD (untrusted). Settles on Monad when agent_token.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          tokenString: { type: "string" },
          paymentMethod: { type: "string", enum: ["agent_token", "cod"] },
          payerName: { type: "string" },
        },
        required: ["orderId", "tokenString"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_invoice",
      description: "Fetch invoice by id including Monad tx hash",
      parameters: {
        type: "object",
        properties: { invoiceId: { type: "string" } },
        required: ["invoiceId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "report_to_user",
      description: "Final message to the human with invoice summary and tx hash",
      parameters: {
        type: "object",
        properties: { message: { type: "string" } },
        required: ["message"],
      },
    },
  },
] as const;

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "verify_agent_token":
      return verify_agent_token(
        args as {
          tokenString: string;
          merchant: string;
          category: string;
          amountUsd: number;
        }
      );
    case "get_token_policy":
      return get_token_policy(String(args.tokenString));
    case "search_products":
      return search_products(
        args as { category?: string; maxPrice?: number; allowedWebsites?: string[] }
      );
    case "get_product_details":
      return get_product_details(String(args.productId));
    case "choose_best_product":
      return choose_best_product((args.products as Product[]) || []);
    case "create_order":
      return create_order(
        args as { productId: string; deliveryMethod?: "online" | "cod" }
      );
    case "pay_with_agent_token":
      return pay_with_agent_token(
        args as {
          orderId: string;
          tokenString: string;
          paymentMethod?: "agent_token" | "cod";
          payerName?: string;
        }
      );
    case "get_invoice":
      return get_invoice(String(args.invoiceId));
    case "report_to_user":
      return report_to_user(String(args.message));
    default:
      return { error: `UNKNOWN_TOOL:${name}` };
  }
}
