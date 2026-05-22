import asyncio
import logging
from typing import Any
from sqlalchemy.ext.asyncio import async_sessionmaker

logger = logging.getLogger(__name__)


class BaseAgent:
    def __init__(self, db_session_factory: async_sessionmaker, providers: dict[str, Any]):
        self.db_session_factory = db_session_factory
        self.providers = providers
        self._running = False

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

    async def stop(self) -> None:
        self._running = False
