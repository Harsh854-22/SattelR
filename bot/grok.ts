/**
 * Grok (xAI) shopping agent for SattelR / OPEN_MART
 *
 * Usage:
 *   GROK_API_KEY=xai-... npm run bot:grok -- MAP_XXXX-XXXX-XXXX-XXXX
 *
 * Requires Next.js app running (npm run dev) and GROK_API_KEY in env/.env.local
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  BASE,
  GROK_TOOLS,
  executeTool,
  log,
} from "./tools";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    const v = m[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const MODEL = process.env.GROK_MODEL || "grok-2-latest";

type Msg = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
};

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

async function chat(messages: Msg[], apiKey: string) {
  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: GROK_TOOLS,
      tool_choice: "auto",
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Grok API ${res.status}: ${text.slice(0, 400)}`);
  }
  return res.json() as Promise<{
    choices: { message: Msg; finish_reason: string }[];
  }>;
}

const SYSTEM = `You are the SattelR shopping agent (Grok) on Monad Testnet.
You buy from OPEN_MART using a restricted MAP_ agent token — never a full wallet.

Safety rules (never violate):
- Only shop websites on the token allowlist
- Only buy the token category
- Never exceed remaining budget
- Never reuse a spent single-use token
- Trusted merchant → pay with agent_token (online)
- Untrusted merchant → COD only (do not spend token online)
- If blocked, stop and report the error code
- Tokens stay valid until their expiry (and until single-use spend if singleUse)
- NEVER call GET /api/tokens without ?token= — the vault list is often empty on serverless. Always use get_token_policy / verify with the pasted MAP_ token.

Workflow:
1. get_token_policy with the exact MAP_ token from the user
2. search_products filtered by category + allowlist + maxPrice
3. choose_best_product
4. verify_agent_token
5. create_order
6. pay_with_agent_token
7. get_invoice if paid
8. report_to_user with product, amount, status, Monad tx hash / explorer link

API base: ${BASE}
Explorer: https://testnet.monadvision.com/tx/{hash}`;

async function main() {
  const tokenString = process.argv[2];
  if (!tokenString) {
    console.error("Usage: npm run bot:grok -- MAP_XXXX-XXXX-XXXX-XXXX");
    process.exit(1);
  }

  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing GROK_API_KEY (or XAI_API_KEY). Add it to .env.local"
    );
    process.exit(1);
  }

  log("=== SattelR Grok Agent ===");
  log("API base", BASE);
  log("Model", MODEL);
  log("Token", tokenString);

  const userPrompt = `Use this agent token: ${tokenString}

Buy the best allowed product under the token limit from allowed websites only.
Prefer lowest price, highest rating/reviews, trusted merchant, new condition.
Pay online with the agent token if trusted; otherwise COD.
Return the invoice and Monad transaction hash.`;

  const messages: Msg[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: userPrompt },
  ];

  const maxRounds = 20;
  for (let round = 0; round < maxRounds; round++) {
    log(`Grok round ${round + 1}`);
    const data = await chat(messages, apiKey);
    const msg = data.choices[0]?.message;
    if (!msg) throw new Error("Empty Grok response");

    messages.push(msg);

    const calls = msg.tool_calls || [];
    if (!calls.length) {
      log("=== GROK FINAL ===", msg.content || "(no content)");
      break;
    }

    for (const call of calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      // Always bind token from CLI if model omits it
      if (
        ["verify_agent_token", "get_token_policy", "pay_with_agent_token"].includes(
          call.function.name
        ) &&
        !args.tokenString
      ) {
        args.tokenString = tokenString;
      }

      let result: unknown;
      try {
        result = await executeTool(call.function.name, args);
      } catch (err) {
        result = {
          error: err instanceof Error ? err.message : String(err),
        };
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content: JSON.stringify(result),
      });
    }
  }

  log("=== DONE ===");
}

main().catch((err) => {
  console.error("[ERROR]", err instanceof Error ? err.message : err);
  process.exit(1);
});
