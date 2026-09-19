#!/usr/bin/env python3
"""Live payment check against localhost:3000. Prints no secrets."""
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone

BASE = "http://localhost:3000"


def req(method, path, body=None, timeout=180):
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            raw = resp.read().decode()
            try:
                return resp.status, json.loads(raw)
            except Exception:
                return resp.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def main():
    expiry = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    code, token_res = req(
        "POST",
        "/api/tokens/generate",
        {
            "agentName": "pay-fix",
            "purpose": "PAYMENT_FAILED fix",
            "category": "electronics",
            "webMode": "Allowlist",
            "amountLimitUsd": 5,
            "allowedWebsites": ["trusted-gadgets.example"],
            "expiry": expiry,
            "singleUse": True,
            "promptTemplate": "Use this agent token: {TOKEN}",
        },
        timeout=180,
    )
    print("GENERATE", code, json.dumps({k: token_res.get(k) if isinstance(token_res, dict) else token_res for k in ("error", "policyId", "txHash")} if isinstance(token_res, dict) else {"raw": str(token_res)[:400]}, default=str))
    if code != 200 or not isinstance(token_res, dict) or "token" not in token_res:
        print("FULL", token_res if not isinstance(token_res, dict) else {k: token_res[k] for k in token_res if k != "token"})
        raise SystemExit(1)
    token = token_res["token"]["tokenString"]
    print("TOKEN_PREFIX", token[:12])

    code, order_res = req(
        "POST",
        "/api/orders/create",
        {"productId": "p01", "qty": 1, "deliveryMethod": "online"},
    )
    print("ORDER", code, order_res.get("error") if isinstance(order_res, dict) else order_res)
    if code != 200:
        raise SystemExit(1)
    oid = order_res["order"]["id"]
    print("ORDER_ID", oid, "amount", order_res["order"].get("amountUsd"))

    code, pay_res = req(
        "POST",
        f"/api/orders/{oid}/pay",
        {
            "paymentMethod": "agent_token",
            "tokenString": token,
            "payerName": "pay-fix",
        },
        timeout=180,
    )
    if isinstance(pay_res, dict):
        safe = {
            "error": pay_res.get("error"),
            "status": (pay_res.get("order") or {}).get("status"),
            "invoice": (pay_res.get("invoice") or {}).get("status"),
            "txHash": (pay_res.get("txHash") or (pay_res.get("invoice") or {}).get("txHash")),
        }
        print("PAY", code, json.dumps(safe))
        if code != 200 or not pay_res.get("invoice"):
            print("PAY_DETAIL", pay_res.get("detail", "")[:500])
            raise SystemExit(1)
        tx = safe["txHash"]
        if tx:
            print("EXPLORER", f"https://testnet.monadvision.com/tx/{tx}")
        print("PAYMENT_OK")
    else:
        print("PAY_RAW", code, pay_res)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
