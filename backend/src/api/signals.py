import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from uuid import UUID
from typing import Optional

from src.core.database import get_db
from src.core.config import settings
from src.models.signal import Signal
from src.models.position import Position
from src.api.users import get_current_user
from src.models.user import User

router = APIRouter()


class SignalListItem(BaseModel):
    id: str
    market_id: str
    predicted_prob: float
    market_odds: float
    edge: float
    confidence: float
    recommended_action: str
    model_version: str
    executed: bool
    created_at: datetime


class SignalDetail(BaseModel):
    id: str
    market_id: str
    predicted_prob: float
    market_odds: float
    edge: float
    confidence: float
    kelly_fraction: float | None
    recommended_action: str
    reasoning_trace: str | None
    model_version: str
    source_articles: list
    key_factors: list
    sentiment_score: float | None
    news_count: int
    executed: bool
    created_at: datetime


class SignalListResponse(BaseModel):
    items: list[SignalListItem]
    total: int
    page: int
    page_size: int


class SignalExecuteResponse(BaseModel):
    position_id: str
    market_id: str
    side: str
    size: float
    entry_price: float
    tx_hash: str | None
    status: str


class SignalFeedManager:
    def __init__(self):
        self._queues: list[asyncio.Queue] = []
        self._lock = asyncio.Lock()

    async def register(self, queue: asyncio.Queue):
        async with self._lock:
            self._queues.append(queue)

    async def unregister(self, queue: asyncio.Queue):
        async with self._lock:
            self._queues.remove(queue)

    async def broadcast(self, signal_data: dict):
        async with self._lock:
            for q in self._queues:
                await q.put(signal_data)


signal_manager = SignalFeedManager()


def _to_list_item(s: Signal) -> SignalListItem:
    return SignalListItem(
        id=str(s.id),
        market_id=s.market_id,
        predicted_prob=s.predicted_prob,
        market_odds=s.market_odds,
        edge=s.edge,
        confidence=s.confidence,
        recommended_action=s.recommended_action,
        model_version=s.model_version,
        executed=s.executed,
        created_at=s.created_at,
    )


def _to_detail(s: Signal) -> SignalDetail:
    return SignalDetail(
        id=str(s.id),
        market_id=s.market_id,
        predicted_prob=s.predicted_prob,
        market_odds=s.market_odds,
        edge=s.edge,
        confidence=s.confidence,
        kelly_fraction=s.kelly_fraction,
        recommended_action=s.recommended_action,
        reasoning_trace=s.reasoning_trace,
        model_version=s.model_version,
        source_articles=s.source_articles if s.source_articles else [],
        key_factors=s.key_factors if s.key_factors else [],
        sentiment_score=s.sentiment_score,
        news_count=s.news_count,
        executed=s.executed,
        created_at=s.created_at,
    )


@router.get("/signals", response_model=SignalListResponse)
async def list_signals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    min_edge: Optional[float] = None,
    min_confidence: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Signal)

    if min_edge is not None:
        query = query.where(Signal.edge >= min_edge)
    if min_confidence is not None:
        query = query.where(Signal.confidence >= min_confidence)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(Signal.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size)

    result = await db.execute(query)
    signals = result.scalars().all()

    return SignalListResponse(
        items=[_to_list_item(s) for s in signals],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/signals/{signal_id}", response_model=SignalDetail)
async def get_signal(
    signal_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Signal).where(Signal.id == signal_id))
    signal = result.scalar_one_or_none()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    return _to_detail(signal)


@router.get("/signals/feed")
async def signal_feed(request: Request):
    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()
        await signal_manager.register(queue)
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(data, default=str)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            await signal_manager.unregister(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/signals/{signal_id}/execute", response_model=SignalExecuteResponse)
async def execute_signal(
    signal_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Signal).where(Signal.id == signal_id))
    signal = result.scalar_one_or_none()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")

    if signal.executed:
        raise HTTPException(status_code=409, detail="Signal already executed")

    max_bet_pct = user.risk_profile.get("max_bet_pct", 0.05)
    kelly_fraction = user.risk_profile.get("kelly_fraction", 0.25)

    size = max_bet_pct * kelly_fraction * signal.confidence

    position = Position(
        user_id=user.id,
        market_id=signal.market_id,
        signal_id=signal.id,
        side=signal.recommended_action,
        size=size,
        entry_price=signal.market_odds,
        current_value=signal.market_odds * size,
        status="open",
    )
    db.add(position)

    signal.executed = True
    await db.commit()
    await db.refresh(position)

    return SignalExecuteResponse(
        position_id=str(position.id),
        market_id=position.market_id,
        side=position.side,
        size=position.size,
        entry_price=position.entry_price,
        tx_hash=position.tx_hash,
        status=position.status,
    )
