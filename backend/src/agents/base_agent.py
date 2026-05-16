import asyncio
import json
import logging
import asyncpg
from typing import Any
from sqlalchemy.ext.asyncio import async_sessionmaker

logger = logging.getLogger(__name__)


class BaseAgent:
    def __init__(self, db_session_factory: async_sessionmaker, providers: dict[str, Any]):
        self.db_session_factory = db_session_factory
        self.providers = providers
        self._pg_pool: asyncpg.Pool | None = None
        self._listener_conn: asyncpg.Connection | None = None
        self._running = False

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pg_pool is None:
            from src.core.config import settings

            dsn = settings.DATABASE_URL.replace("+asyncpg", "")
            self._pg_pool = await asyncpg.create_pool(dsn, min_size=1, max_size=2)
        return self._pg_pool

    async def notify(self, channel: str, payload: dict) -> None:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            await conn.execute("SELECT pg_notify($1, $2)", channel, json.dumps(payload))
        logger.debug("Notified %s: %s", channel, payload)

    async def listen(self, channel: str) -> asyncpg.Connection:
        from src.core.config import settings

        dsn = settings.DATABASE_URL.replace("+asyncpg", "")
        conn = await asyncpg.connect(dsn)
        await conn.execute(f"LISTEN {channel}")
        self._listener_conn = conn
        return conn

    async def run(self) -> None:
        raise NotImplementedError

    async def start(self) -> None:
        self._running = True
        try:
            await self.run()
        except asyncio.CancelledError:
            logger.info("%s cancelled", self.__class__.__name__)
        except Exception:
            logger.exception("Fatal error in %s", self.__class__.__name__)
        finally:
            self._running = False
            if self._listener_conn and not self._listener_conn.is_closed():
                await self._listener_conn.close()
            if self._pg_pool:
                await self._pg_pool.close()

    async def stop(self) -> None:
        self._running = False
