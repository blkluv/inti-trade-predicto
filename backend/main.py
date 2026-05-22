import asyncio
import logging
import os
from contextlib import asynccontextmanager

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper()),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.core.database import engine, async_session, Base
from src.api.markets import router as markets_router
from src.api.signals import router as signals_router
from src.providers.polymarket_provider import PolymarketProvider
from src.agents.data_agent import DataAgent

logger = logging.getLogger(__name__)

_bg_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _bg_task

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    provider = PolymarketProvider()
    agent = DataAgent(async_session, {"polymarket": provider})

    _bg_task = asyncio.create_task(agent.start())
    logger.info("Signal generator started")

    try:
        yield
    finally:
        if _bg_task:
            _bg_task.cancel()
            try:
                await _bg_task
            except asyncio.CancelledError:
                pass
        await provider.close()
        await engine.dispose()


app = FastAPI(
    title="Inti Trade Predicto",
    description="AI-powered prediction market signal engine",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(markets_router, prefix="/api/v1")
app.include_router(signals_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
