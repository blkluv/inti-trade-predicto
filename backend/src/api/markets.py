from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Optional

from src.core.database import get_db
from src.models.market import Market, MarketPrice
from src.models.signal import Signal

router = APIRouter()


class MarketListItem(BaseModel):
    id: str
    source: str
    question: str
    category: str | None
    current_odds: float | None
    volume_24h: float
    liquidity: float
    end_date: datetime | None
    resolved: bool
    created_at: datetime


class MarketDetail(BaseModel):
    id: str
    source: str
    question: str
    description: str | None
    category: str | None
    outcomes: list
    current_odds: float | None
    volume_24h: float
    liquidity: float
    end_date: datetime | None
    resolved: bool
    resolution_outcome: str | None
    resolution_source: str | None
    ai_signal: dict | None
    created_at: datetime
    updated_at: datetime


class MarketPricePoint(BaseModel):
    outcome: str | None
    price: float
    volume: float | None
    fetched_at: datetime


class PriceHistoryResponse(BaseModel):
    market_id: str
    prices: list[MarketPricePoint]


class SignalBrief(BaseModel):
    id: str
    predicted_prob: float
    edge: float
    confidence: float
    recommended_action: str
    model_version: str
    created_at: datetime


class MarketListResponse(BaseModel):
    items: list[MarketListItem]
    total: int
    page: int
    page_size: int


@router.get("/markets", response_model=MarketListResponse)
async def list_markets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    source: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Market)

    if category:
        query = query.where(Market.category == category)
    if source:
        query = query.where(Market.source == source)
    if status == "active":
        query = query.where(Market.resolved == False)
    elif status == "resolved":
        query = query.where(Market.resolved == True)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(Market.volume_24h)).offset(
        (page - 1) * page_size
    ).limit(page_size)

    result = await db.execute(query)
    markets = result.scalars().all()

    return MarketListResponse(
        items=[
            MarketListItem(
                id=m.id,
                source=m.source,
                question=m.question,
                category=m.category,
                current_odds=m.current_odds,
                volume_24h=m.volume_24h,
                liquidity=m.liquidity,
                end_date=m.end_date,
                resolved=m.resolved,
                created_at=m.created_at,
            )
            for m in markets
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/markets/{market_id}", response_model=MarketDetail)
async def get_market(
    market_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Market).where(Market.id == market_id))
    market = result.scalar_one_or_none()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")

    signal_result = await db.execute(
        select(Signal)
        .where(Signal.market_id == market_id)
        .order_by(desc(Signal.created_at))
        .limit(1)
    )
    latest_signal = signal_result.scalar_one_or_none()

    ai_signal = None
    if latest_signal:
        ai_signal = {
            "signal_id": str(latest_signal.id),
            "predicted_prob": latest_signal.predicted_prob,
            "edge": latest_signal.edge,
            "confidence": latest_signal.confidence,
            "recommended_action": latest_signal.recommended_action,
            "model_version": latest_signal.model_version,
            "created_at": latest_signal.created_at.isoformat(),
        }

    return MarketDetail(
        id=market.id,
        source=market.source,
        question=market.question,
        description=market.description,
        category=market.category,
        outcomes=market.outcomes,
        current_odds=market.current_odds,
        volume_24h=market.volume_24h,
        liquidity=market.liquidity,
        end_date=market.end_date,
        resolved=market.resolved,
        resolution_outcome=market.resolution_outcome,
        resolution_source=market.resolution_source,
        ai_signal=ai_signal,
        created_at=market.created_at,
        updated_at=market.updated_at,
    )


@router.get("/markets/{market_id}/prices", response_model=PriceHistoryResponse)
async def get_price_history(
    market_id: str,
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    market_result = await db.execute(
        select(Market.id).where(Market.id == market_id)
    )
    if not market_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Market not found")

    result = await db.execute(
        select(MarketPrice)
        .where(MarketPrice.market_id == market_id)
        .order_by(desc(MarketPrice.fetched_at))
        .limit(limit)
    )
    prices = result.scalars().all()

    return PriceHistoryResponse(
        market_id=market_id,
        prices=[
            MarketPricePoint(
                outcome=p.outcome,
                price=p.price,
                volume=p.volume,
                fetched_at=p.fetched_at,
            )
            for p in reversed(prices)
        ],
    )


@router.get("/markets/{market_id}/signal", response_model=SignalBrief)
async def get_market_signal(
    market_id: str,
    db: AsyncSession = Depends(get_db),
):
    market_result = await db.execute(
        select(Market.id).where(Market.id == market_id)
    )
    if not market_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Market not found")

    result = await db.execute(
        select(Signal)
        .where(Signal.market_id == market_id)
        .order_by(desc(Signal.created_at))
        .limit(1)
    )
    signal = result.scalar_one_or_none()
    if not signal:
        raise HTTPException(
            status_code=404, detail="No signal available for this market"
        )

    return SignalBrief(
        id=str(signal.id),
        predicted_prob=signal.predicted_prob,
        edge=signal.edge,
        confidence=signal.confidence,
        recommended_action=signal.recommended_action,
        model_version=signal.model_version,
        created_at=signal.created_at,
    )
