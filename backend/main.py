import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from src.core.config import settings
from src.core.database import engine, async_session, Base
from src.api.users import router as users_router
from src.api.markets import router as markets_router
from src.api.signals import router as signals_router
from src.api.analytics import router as analytics_router
from src.api.subscriptions import router as subscriptions_router
from src.api.builder_fees import router as builder_fees_router
from src.providers.polymarket_provider import PolymarketProvider
from src.agents.data_agent import DataAgent

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

_polymarket_provider: PolymarketProvider | None = None
_data_agent: DataAgent | None = None
_agent_task: asyncio.Task | None = None
_seed_task: asyncio.Task | None = None


async def _seed_markets(agent: DataAgent):
    try:
        logger.info("Seeding initial market data from Polymarket…")
        markets = await agent.collect_market_data()
        logger.info("Seeded %d markets on startup", len(markets))
    except Exception as e:
        logger.warning("Initial market seed failed (non-fatal): %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _polymarket_provider, _data_agent, _agent_task, _seed_task

    _polymarket_provider = PolymarketProvider()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    _data_agent = DataAgent(
        async_session,
        {
            "polymarket": _polymarket_provider,
            "newsapi_key": settings.NEWS_API_KEY,
        },
    )

    _seed_task = asyncio.create_task(_seed_markets(_data_agent))

    try:
        _agent_task = asyncio.create_task(_data_agent.start())
        logger.info("DataAgent background polling started")
    except Exception as e:
        logger.warning("DataAgent start failed (non-fatal): %s", e)

    try:
        yield
    finally:
        if _seed_task and not _seed_task.done():
            _seed_task.cancel()
        if _agent_task:
            _agent_task.cancel()
            try:
                await _agent_task
            except asyncio.CancelledError:
                pass
        if _seed_task and not _seed_task.done():
            try:
                await _seed_task
            except (asyncio.CancelledError, Exception):
                pass
        if _polymarket_provider:
            await _polymarket_provider.close()
        await engine.dispose()


app = FastAPI(
    title="Inti Trade Predicto",
    description="AI-powered prediction market signal engine",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router, prefix="/api/v1")
app.include_router(markets_router, prefix="/api/v1")
app.include_router(signals_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(subscriptions_router, prefix="/api/v1")
app.include_router(builder_fees_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
