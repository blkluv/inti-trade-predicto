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
from src.agents.orchestrator import AgentOrchestrator

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

_orchestrator: AgentOrchestrator | None = None
_polymarket_provider: PolymarketProvider | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _orchestrator, _polymarket_provider

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    _polymarket_provider = PolymarketProvider()

    _orchestrator = AgentOrchestrator(
        async_session,
        {
            "polymarket": _polymarket_provider,
            "newsapi_key": settings.NEWS_API_KEY,
        },
    )

    try:
        await _orchestrator.start_all()
    except Exception as e:
        logger.warning("Agent startup failed (non-fatal): %s", e)

    try:
        yield
    finally:
        if _orchestrator:
            await _orchestrator.stop_all()
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
