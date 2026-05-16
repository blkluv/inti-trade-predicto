from mcp.server.fastmcp import FastMCP
import httpx
from datetime import datetime, timezone
from typing import Optional
import json

mcp = FastMCP("Polymarket MCP")

CLOB_API = "https://clob.polymarket.com"
GAMMA_API = "https://gamma-api.polymarket.com"


async def _get(path: str, params: dict | None = None, base: str = CLOB_API) -> dict | list:
    async with httpx.AsyncClient(timeout=15) as client:
        url = f"{base}{path}"
        resp = await client.get(url, params=params, headers={
            "User-Agent": "polymarket-mcp/1.0",
            "Accept": "application/json",
        })
        resp.raise_for_status()
        return resp.json()


def _parse_outcome_prices(market: dict) -> list[dict]:
    outcomes_raw = market.get("outcomes", market.get("outcome_prices", []))
    prices_raw = market.get("outcomePrices", market.get("outcome_prices", []))
    if isinstance(outcomes_raw, str):
        outcomes_raw = json.loads(outcomes_raw)
    if isinstance(prices_raw, str):
        prices_raw = json.loads(prices_raw)
    if isinstance(prices_raw, list) and len(prices_raw) > 0 and isinstance(prices_raw[0], str):
        prices_raw = [float(p) for p in prices_raw]
    if not outcomes_raw:
        outcomes_raw = ["Yes", "No"]
    result = []
    for i, outcome in enumerate(outcomes_raw):
        price = float(prices_raw[i]) if i < len(prices_raw) else 0.5
        result.append({"outcome": outcome, "price": price})
    return result


@mcp.tool()
async def polymarket_get_markets(limit: int = 20, offset: int = 0, tag: str = "", closed: bool = False) -> list:
    """Get active markets from Polymarket. Returns id, question, description, outcome_prices, volume, liquidity, end_date, competitive."""
    params = {"limit": min(limit, 100), "offset": offset, "closed": str(closed).lower()}
    if tag:
        params["tag"] = tag
    try:
        data = await _get("/markets", params=params, base=GAMMA_API)
    except Exception:
        try:
            data = await _get("/markets", params={"limit": min(limit, 100)}, base=CLOB_API)
        except Exception as e:
            return [{"error": f"Failed to fetch markets: {e}"}]
    if isinstance(data, dict) and "data" in data:
        markets = data["data"]
    elif isinstance(data, list):
        markets = data
    else:
        markets = []
    result = []
    for m in markets:
        prices = _parse_outcome_prices(m)
        volume = m.get("volume", m.get("volume24hr", 0))
        liquidity = m.get("liquidity", 0)
        try:
            volume = float(volume)
        except (ValueError, TypeError):
            volume = 0
        try:
            liquidity = float(liquidity)
        except (ValueError, TypeError):
            liquidity = 0
        result.append({
            "id": m.get("id") or m.get("conditionId", ""),
            "question": m.get("question", ""),
            "description": m.get("description", m.get("question", "")),
            "outcome_prices": prices,
            "volume": volume,
            "volume_24h": m.get("volume24hr", m.get("volume", 0)),
            "liquidity": liquidity,
            "end_date": m.get("endDate", ""),
            "competitive": m.get("competitive", 0),
            "slug": m.get("slug", ""),
            "condition_id": m.get("conditionId", ""),
            "active": m.get("active", not closed),
            "closed": m.get("closed", closed),
        })
    return result


@mcp.tool()
async def polymarket_get_market(market_id: str) -> dict:
    """Get detailed info on a specific market. Includes full description, rules, resolution source, all outcomes with prices."""
    try:
        data = await _get(f"/markets/{market_id}", base=GAMMA_API)
    except Exception:
        try:
            data = await _get(f"/markets/{market_id}", base=CLOB_API)
        except Exception as e:
            return {"error": f"Failed to fetch market {market_id}: {e}"}
    if isinstance(data, dict) and "data" in data:
        m = data["data"]
    else:
        m = data if isinstance(data, dict) else {}
    prices = _parse_outcome_prices(m)
    volume = m.get("volume", m.get("volume24hr", 0))
    try:
        volume = float(volume)
    except (ValueError, TypeError):
        volume = 0
    liquidity = m.get("liquidity", 0)
    try:
        liquidity = float(liquidity)
    except (ValueError, TypeError):
        liquidity = 0
    condition_id = m.get("conditionId", market_id)
    token_ids = []
    clob_data = None
    if condition_id:
        try:
            clob_data = await _get(f"/clob-markets/{condition_id}", base=CLOB_API)
            if clob_data and "t" in clob_data:
                token_ids = [t["t"] for t in clob_data["t"] if t]
        except Exception:
            pass
    return {
        "id": m.get("id", market_id),
        "condition_id": condition_id,
        "question": m.get("question", ""),
        "description": m.get("description", ""),
        "slug": m.get("slug", ""),
        "category": m.get("category", ""),
        "resolution_source": m.get("resolutionSource", ""),
        "end_date": m.get("endDate", ""),
        "start_date": m.get("startDate", ""),
        "outcome_prices": prices,
        "token_ids": token_ids,
        "volume": volume,
        "volume_24h": m.get("volume24hr", 0),
        "liquidity": liquidity,
        "competitive": m.get("competitive", 0),
        "active": m.get("active", True),
        "closed": m.get("closed", False),
        "neg_risk": m.get("negRisk", clob_data.get("nr", False) if clob_data else False),
        "tick_size": clob_data.get("mts", "0.01") if clob_data else "0.01",
        "fees_enabled": m.get("feesEnabled", False),
        "tags": m.get("tags", []),
        "sponsor": {"name": m.get("sponsorName", ""), "image": m.get("sponsorImage", "")},
    }


@mcp.tool()
async def polymarket_search_markets(query: str, limit: int = 10) -> list:
    """Search markets by keyword/topic. Uses Polymarket's public search endpoint."""
    params = {"limit": min(limit, 50), "offset": 0, "q": query}
    try:
        data = await _get("/public-search", params=params, base=GAMMA_API)
    except Exception:
        try:
            data = await _get("/markets", params={"limit": min(limit, 50), "search": query}, base=CLOB_API)
        except Exception as e:
            return [{"error": f"Search failed: {e}"}]
    if isinstance(data, dict):
        results = data.get("results", data.get("data", []))
    elif isinstance(data, list):
        results = data
    else:
        results = []
    output = []
    for item in results:
        if not isinstance(item, dict):
            continue
        prices = _parse_outcome_prices(item)
        output.append({
            "id": item.get("id") or item.get("conditionId", ""),
            "question": item.get("question", ""),
            "description": item.get("description", ""),
            "slug": item.get("slug", ""),
            "outcome_prices": prices,
            "volume": item.get("volume", item.get("volume24hr", 0)),
            "liquidity": item.get("liquidity", 0),
            "end_date": item.get("endDate", ""),
            "active": item.get("active", True),
        })
    return output


@mcp.tool()
async def polymarket_get_market_prices(market_id: str, interval: Optional[str] = None,
                                        start_ts: Optional[int] = None, end_ts: Optional[int] = None) -> list:
    """Get historical price data for a market's outcomes. Uses CLOB prices-history endpoint.
    If no time range given, returns last 7 days of hourly data."""
    if interval is None and (start_ts is None or end_ts is None):
        end_ts = int(datetime.now(timezone.utc).timestamp())
        start_ts = end_ts - 7 * 86400
        interval = "3600"
    params = {"market": market_id}
    if start_ts:
        params["startTs"] = start_ts
    if end_ts:
        params["endTs"] = end_ts
    if interval:
        params["interval"] = interval
    params.setdefault("fidelity", 60)
    try:
        data = await _get("/prices-history", params=params, base=CLOB_API)
    except Exception as e:
        return [{"error": f"Failed to fetch price history: {e}"}]
    if isinstance(data, dict) and "data" in data:
        return data["data"]
    if isinstance(data, list):
        return data
    return data if isinstance(data, dict) else []


@mcp.tool()
async def polymarket_get_builder_fees(builder_address: str) -> dict:
    """Get Polymarket V2 builder fee structure for a builder address.
    Builder codes let an agent that recommends a bet take a cut of every fill."""
    info = {
        "builder_address": builder_address,
        "protocol": "Polymarket V2 Builder Program",
        "how_it_works": (
            "In Polymarket V2, a builder code is a 32-byte identifier included in the signed order. "
            "When the order is filled, the builder gets a configurable taker fee (in bps) and the "
            "maker fee goes to the protocol. Builder fees are set by the protocol operator per "
            "builder code at match time — not hardcoded in the order."
        ),
        "fee_rate_query_url": f"https://clob.polymarket.com/fees/builder-fees/{builder_address}",
        "typical_maker_fee_bps": 0,
        "typical_taker_fee_bps": "0-200 (varies by builder agreement)",
        "fee_formula": "fee = C * feeRate * p * (1-p)",
        "notes": [
            "Builders earn only on taker fills they refer",
            "Maker rebates are still paid from protocol fees",
            "Builder codes are registered on-chain and queried from the CLOB API",
            "Fees are settled automatically at match time",
        ],
    }
    try:
        fee_data = await _get(f"/fees/builder-fees/{builder_address}", base=CLOB_API)
        info["fee_data"] = fee_data
    except Exception as e:
        info["fee_data"] = f"Could not fetch live: {e}"
    return info


@mcp.tool()
async def polymarket_estimate_bet(market_id: str, outcome: str, amount: float) -> dict:
    """Estimate what a bet would return including potential builder fees.
    Uses current midpoint prices from the order book."""
    try:
        market = await polymarket_get_market(market_id)
        prices = market.get("outcome_prices", [])
    except Exception as e:
        return {"error": f"Could not fetch market info: {e}"}
    outcome_lower = outcome.lower().strip()
    target_price = None
    outcome_label = None
    for p in prices:
        if p["outcome"].lower().strip() == outcome_lower:
            target_price = p["price"]
            outcome_label = p["outcome"]
            break
    if target_price is None and prices:
        idx = 0 if outcome_lower in ("yes", "y", "1") else 1
        if idx < len(prices):
            target_price = prices[idx]["price"]
            outcome_label = prices[idx]["outcome"]
    if target_price is None:
        return {"error": f"Could not find outcome '{outcome}'. Available: {[p['outcome'] for p in prices]}"}
    shares = amount / target_price if target_price > 0 else 0
    payout_if_win = amount
    net_profit = payout_if_win - amount
    taker_fee = amount * 0.04
    maker_fee = 0
    total_fees = taker_fee
    net_shares = (amount - total_fees) / target_price if target_price > 0 else 0
    net_payout = net_shares
    net_payout_if_win = net_shares
    return {
        "market_id": market_id,
        "outcome": outcome_label or outcome,
        "current_price": round(target_price, 4),
        "implied_probability": round(target_price * 100, 2),
        "bet_amount_usdc": round(amount, 2),
        "shares_bought": round(shares, 4),
        "payout_if_win_usdc": round(payout_if_win, 2),
        "net_profit_if_win_usdc": round(net_profit, 2),
        "estimated_fees_usdc": round(total_fees, 4),
        "fee_breakdown": {
            "taker_fee_rate": "4% (typical for politics/finance)",
            "maker_fee_rate": "0% (makers never pay)",
            "taker_fee_usdc": round(taker_fee, 4),
            "maker_fee_usdc": round(maker_fee, 4),
        },
        "with_builder_fees": {
            "description": "If a builder code is attached, the builder takes additional taker fee bps",
            "example_builder_fee_100bps": round(amount * 0.01, 4),
            "example_builder_fee_50bps": round(amount * 0.005, 4),
        },
        "disclaimer": "This is an estimate. Actual fill price and fees depend on order book depth and match-time fee parameters.",
    }


@mcp.tool()
async def polymarket_get_market_orderbook(market_id: str) -> dict:
    """Get the current order book for a market."""
    try:
        market = await polymarket_get_market(market_id)
        token_ids = market.get("token_ids", [])
        if not token_ids:
            return {"error": "No token IDs found for this market"}
        bids_asks = {}
        for tid in token_ids:
            try:
                book = await _get("/book", params={"token_id": tid}, base=CLOB_API)
                bids_asks[tid] = book
            except Exception as e:
                bids_asks[tid] = {"error": str(e)}
        return {
            "market_id": market_id,
            "question": market.get("question", ""),
            "token_ids": token_ids,
            "orderbooks": bids_asks,
        }
    except Exception as e:
        return {"error": f"Failed to fetch orderbook: {e}"}


@mcp.tool()
async def polymarket_get_midpoint(market_id: str) -> dict:
    """Get the current midpoint price for a market's outcomes."""
    try:
        market = await polymarket_get_market(market_id)
        token_ids = market.get("token_ids", [])
        if not token_ids:
            if not market.get("error"):
                return {"error": "No token IDs found"}
            return market
        prices = {}
        for tid in token_ids:
            try:
                mp = await _get("/midpoint", params={"token_id": tid}, base=CLOB_API)
                prices[tid] = mp
            except Exception as e:
                prices[tid] = {"error": str(e)}
        return {
            "market_id": market_id,
            "question": market.get("question", ""),
            "midpoints": prices,
            "outcome_prices": market.get("outcome_prices", []),
        }
    except Exception as e:
        return {"error": f"Failed to fetch midpoint: {e}"}


if __name__ == "__main__":
    mcp.run()
