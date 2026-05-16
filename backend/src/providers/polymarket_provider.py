import hashlib
import logging
import time
from typing import Optional

import httpx

from src.core.config import settings

logger = logging.getLogger(__name__)

BASE_URL = settings.POLYMARKET_API_URL
GAMMA_URL = settings.POLYMARKET_GAMMA_API
PREDSCOPE_URL = settings.PREDSCOPE_API_URL

CACHE_TTL = 60


class _CacheEntry:
    def __init__(self, data, ttl: int = CACHE_TTL):
        self.data = data
        self.expires = time.time() + ttl

    def is_valid(self) -> bool:
        return time.time() < self.expires


def _predscope_slug_to_id(slug: str) -> str:
    return f"predscope_{hashlib.sha256(slug.encode()).hexdigest()[:16]}"


def _transform_predscope_market(item: dict) -> dict:
    outcomes = item.get("outcomes", [])
    best_prob = max((o.get("probability", 0) for o in outcomes), default=None)

    slug = item.get("slug", "")
    market_id = _predscope_slug_to_id(slug)

    return {
        "id": market_id,
        "slug": slug,
        "question": item.get("title", ""),
        "description": "",
        "category": (item.get("categories") or [None])[0] or "prediction",
        "outcomes": outcomes,
        "bestPrice": best_prob,
        "price": best_prob,
        "volume24hr": item.get("volume_24h", item.get("volume", 0)),
        "volume": item.get("volume", 0),
        "liquidity": item.get("liquidity", 0),
        "endDate": None,
        "closed": False,
    }


class PolymarketProvider:
    def __init__(self):
        self._cache: dict[str, _CacheEntry] = {}
        client_kwargs = {"timeout": 5}
        if settings.HTTP_PROXY:
            client_kwargs["proxies"] = settings.HTTP_PROXY
        self._client = httpx.AsyncClient(**client_kwargs)

    async def close(self):
        await self._client.aclose()

    async def _fetch_predscope_markets(
        self, limit: int = 20, offset: int = 0, closed: bool = False
    ) -> list[dict]:
        try:
            resp = await self._client.get(
                f"{PREDSCOPE_URL}/markets.json", timeout=10
            )
            resp.raise_for_status()
            data = resp.json()
            raw = data.get("markets", [])
            total = len(raw)
            sliced = raw[offset : offset + limit]
            logger.info(
                "PredScope: got %d/%d markets (offset=%d, limit=%d)",
                len(sliced),
                total,
                offset,
                limit,
            )
            return [_transform_predscope_market(m) for m in sliced]
        except httpx.HTTPError as e:
            logger.warning("PredScope API error: %s", e)
            return []

    async def get_markets(
        self, limit: int = 20, offset: int = 0, tag: str = "", closed: bool = False
    ) -> list[dict]:
        cache_key = f"markets:{limit}:{offset}:{tag}:{closed}"
        cached = self._cache.get(cache_key)
        if cached and cached.is_valid():
            return cached.data

        fallback = None

        try:
            resp = await self._client.get(f"{GAMMA_URL}/markets", params={
                "limit": min(limit, 100),
                "offset": offset,
                "closed": str(closed).lower(),
            }, timeout=5)
            resp.raise_for_status()
            data = resp.json()
            self._cache[cache_key] = _CacheEntry(data)
            return data
        except httpx.HTTPError as e:
            logger.warning("Gamma API error (%s)", e)

        try:
            resp = await self._client.get(f"{BASE_URL}/markets", params={
                "limit": min(limit, 100),
                "offset": offset,
            }, timeout=5)
            resp.raise_for_status()
            data = resp.json()
            self._cache[cache_key] = _CacheEntry(data)
            return data
        except httpx.HTTPError as e:
            logger.warning("CLOB API error (%s)", e)

        fallback = await self._fetch_predscope_markets(limit, offset, closed)
        if fallback:
            self._cache[cache_key] = _CacheEntry(fallback)
        return fallback or []

    async def get_market(self, market_id: str) -> dict:
        cache_key = f"market:{market_id}"
        cached = self._cache.get(cache_key)
        if cached and cached.is_valid():
            return cached.data

        try:
            resp = await self._client.get(f"{GAMMA_URL}/markets/{market_id}", timeout=5)
            resp.raise_for_status()
            data = resp.json()
            self._cache[cache_key] = _CacheEntry(data)
            return data
        except httpx.HTTPError as e:
            logger.warning("Gamma get_market error (%s)", e)

        try:
            resp = await self._client.get(f"{BASE_URL}/markets", params={"id": market_id}, timeout=5)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list) and data:
                data = data[0]
            self._cache[cache_key] = _CacheEntry(data)
            return data
        except httpx.HTTPError as e:
            logger.warning("CLOB get_market error (%s)", e)

        all_markets = await self._fetch_predscope_markets(limit=100)
        for m in all_markets:
            if m.get("id") == market_id or m.get("slug") == market_id:
                self._cache[cache_key] = _CacheEntry(m)
                return m

        return {}

    async def search_markets(self, query: str, limit: int = 10) -> list[dict]:
        cache_key = f"search:{query}:{limit}"
        cached = self._cache.get(cache_key)
        if cached and cached.is_valid():
            return cached.data

        try:
            resp = await self._client.get(
                f"{GAMMA_URL}/markets",
                params={"title": query, "limit": min(limit, 50)},
                timeout=5,
            )
            resp.raise_for_status()
            data = resp.json()
            self._cache[cache_key] = _CacheEntry(data)
            return data
        except httpx.HTTPError as e:
            logger.warning("Gamma search error (%s)", e)

        all_markets = await self._fetch_predscope_markets(limit=100)
        q = query.lower()
        matched = [
            m for m in all_markets if q in m.get("question", "").lower()
        ][:limit]
        if matched:
            self._cache[cache_key] = _CacheEntry(matched)
        return matched

    async def get_market_prices(
        self, market_id: str, interval: Optional[str] = None
    ) -> list[dict]:
        cache_key = f"prices:{market_id}:{interval}"
        cached = self._cache.get(cache_key)
        if cached and cached.is_valid():
            return cached.data

        params: dict = {"market": market_id}
        if interval:
            params["interval"] = interval

        try:
            resp = await self._client.get(
                f"{BASE_URL}/prices-history", params=params
            )
            resp.raise_for_status()
            data = resp.json()
            self._cache[cache_key] = _CacheEntry(data, ttl=120)
            return data
        except httpx.HTTPError as e:
            logger.warning("Polymarket prices error (%s)", e)

        try:
            params["cursor"] = f"market_{market_id}_price_cursor_0"
            resp = await self._client.get(
                f"{BASE_URL}/prices-history", params=params
            )
            resp.raise_for_status()
            data = resp.json()
            self._cache[cache_key] = _CacheEntry(data, ttl=120)
            return data
        except httpx.HTTPError as e:
            logger.warning("Polymarket prices fallback error (%s)", e)
            return []

    async def get_all_markets_flat(self) -> list[dict]:
        return await self._fetch_predscope_markets(limit=500)
