/**
 * Simple deterministic shopper — no LLM required.
 * Usage: npm run bot -- MAP_XXXX
 */

import {
  BASE,
  get_token_policy,
  search_products,
  choose_best_product,
  verify_agent_token,
  create_order,
  pay_with_agent_token,
  get_invoice,
  log,
} from "./tools";

async function main() {
  const tokenString = process.argv[2];
  if (!tokenString) {
    console.error("Usage: npm run bot -- MAP_XXXX-XXXX-XXXX-XXXX");
    process.exit(1);
  }

  log("=== SattelR simple bot ===");
  log("Store API", BASE);

  const token = await get_token_policy(tokenString);
  if (token.status !== "active") throw new Error(`Token ${token.status}`);

  const products = await search_products({
    category: token.category,
    maxPrice: token.amountLimitUsd - token.spentUsd,
    allowedWebsites: token.allowedWebsites,
  });

  const best = choose_best_product(products);
  if (!best) throw new Error("No product matches your token rules");

  const v = await verify_agent_token({
    tokenString,
    merchant: best.merchant,
    category: best.category,
    amountUsd: best.priceUsd,
  });
  if (!v.ok) throw new Error(v.error || "VERIFY_FAILED");

  const order = await create_order({
    productId: best.id,
    deliveryMethod: best.trusted ? "online" : "cod",
  });

  const pay = await pay_with_agent_token({
    orderId: order.id,
    tokenString,
    paymentMethod: best.trusted ? "agent_token" : "cod",
    payerName: v.ownerName || "AGENT",
  });

  if (!pay.invoice) throw new Error(pay.error || "PAYMENT_FAILED");

  const inv = await get_invoice(pay.invoice.id);
  log("=== INVOICE ===", {
    id: inv.id,
    product: inv.productName,
    amount: inv.amountUsd,
    status: inv.status,
    txHash: inv.txHash || pay.txHash,
  });
  if (inv.txHash || pay.txHash) {
    log(
      "Explorer",
      `https://testnet.monadvision.com/tx/${inv.txHash || pay.txHash}`
    );
  }
  log("=== DONE ===");
}

main().catch((e) => {
  console.error("[ERROR]", e instanceof Error ? e.message : e);
  process.exit(1);
});
