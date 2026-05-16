import logging
import time
from typing import Optional

import httpx

from src.core.config import settings

logger = logging.getLogger(__name__)

BASE_URL = settings.POLYMARKET_API_URL
GAMMA_URL = settings.POLYMARKET_GAMMA_API

CACHE_TTL = 60


class _CacheEntry:
    def __init__(self, data, ttl: int = CACHE_TTL):
        self.data = data
        self.expires = time.time() + ttl

    def is_valid(self) -> bool:
        return time.time() < self.expires


class PolymarketProvider:
    def __init__(self):
        self._cache: dict[str, _CacheEntry] = {}
        self._client = httpx.AsyncClient(timeout=30)

    async def close(self):
        await self._client.aclose()

    async def get_markets(
        self, limit: int = 20, offset: int = 0, tag: str = "", closed: bool = False
    ) -> list[dict]:
        cache_key = f"markets:{limit}:{offset}:{tag}:{closed}"
        cached = self._cache.get(cache_key)
        if cached and cached.is_valid():
            return cached.data

        params: dict = {
            "limit": min(limit, 100),
            "offset": offset,
            "closed": str(closed).lower(),
        }
        if tag:
            params["tag"] = tag

        try:
            resp = await self._client.get(f"{GAMMA_URL}/markets", params=params)
            resp.raise_for_status()
            data = resp.json()
            self._cache[cache_key] = _CacheEntry(data)
            return data
        except httpx.HTTPError as e:
            logger.error("Polymarket gamma API error: %s", e)

        try:
            resp = await self._client.get(f"{BASE_URL}/markets", params=params)
            resp.raise_for_status()
            data = resp.json()
            self._cache[cache_key] = _CacheEntry(data)
            return data
        except httpx.HTTPError as e:
            logger.error("Polymarket clob API error: %s", e)

        return []

    async def get_market(self, market_id: str) -> dict:
        cache_key = f"market:{market_id}"
        cached = self._cache.get(cache_key)
        if cached and cached.is_valid():
            return cached.data

        try:
            resp = await self._client.get(f"{GAMMA_URL}/markets/{market_id}")
            resp.raise_for_status()
            data = resp.json()
            self._cache[cache_key] = _CacheEntry(data)
            return data
        except httpx.HTTPError as e:
            logger.error("Polymarket get_market error: %s", e)

        try:
            resp = await self._client.get(
                f"{BASE_URL}/markets", params={"id": market_id}
            )
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list) and data:
                data = data[0]
            self._cache[cache_key] = _CacheEntry(data)
            return data
        except httpx.HTTPError as e:
            logger.error("Polymarket clob get_market fallback error: %s", e)

        return {}

    async def search_markets(self, query: str, limit: int = 10) -> list[dict]:
        cache_key = f"search:{query}:{limit}"
        cached = self._cache.get(cache_key)
        if cached and cached.is_valid():
            return cached.data

        params = {"title": query, "limit": min(limit, 50)}
        try:
            resp = await self._client.get(f"{GAMMA_URL}/markets", params=params)
            resp.raise_for_status()
            data = resp.json()
            self._cache[cache_key] = _CacheEntry(data)
            return data
        except httpx.HTTPError as e:
            logger.error("Polymarket search error: %s", e)
            return []

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
            logger.error("Polymarket prices error: %s", e)

        mock_cursor = f"market_{market_id}_price_cursor_0"
        try:
            params["cursor"] = mock_cursor
            resp = await self._client.get(
                f"{BASE_URL}/prices-history", params=params
            )
            resp.raise_for_status()
            data = resp.json()
            self._cache[cache_key] = _CacheEntry(data, ttl=120)
            return data
        except httpx.HTTPError as e:
            logger.error("Polymarket prices fallback error: %s", e)
            return []
