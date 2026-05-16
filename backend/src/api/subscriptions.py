from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional

from src.core.database import get_db
from src.core.config import settings
from src.models.position import Subscription
from src.models.user import User
from src.api.users import get_current_user

router = APIRouter()


class PricingTier(BaseModel):
    tier: str
    price_usdc: float
    signals_per_day: int
    features: list[str]


class PricingResponse(BaseModel):
    tiers: list[PricingTier]


class CreateSubscriptionRequest(BaseModel):
    tier: str
    tx_hash: Optional[str] = None


class SubscriptionStatus(BaseModel):
    id: UUID
    tier: str
    amount: float
    status: str
    period_start: datetime
    period_end: datetime
    created_at: datetime


class SubscriptionCreated(BaseModel):
    id: UUID
    tier: str
    amount: float
    status: str
    period_start: datetime
    period_end: datetime
    tx_hash: str | None


@router.get("/pricing", response_model=PricingResponse)
async def get_pricing():
    return PricingResponse(
        tiers=[
            PricingTier(
                tier="free",
                price_usdc=0.0,
                signals_per_day=settings.FREE_SIGNALS_PER_DAY,
                features=["3 signals per day", "Basic market data", "Email alerts"],
            ),
            PricingTier(
                tier="pro",
                price_usdc=settings.PRO_PRICE_USDC,
                signals_per_day=50,
                features=[
                    "50 signals per day",
                    "Full reasoning traces",
                    "Real-time SSE feed",
                    "Portfolio tracking",
                    "Priority support",
                ],
            ),
            PricingTier(
                tier="enterprise",
                price_usdc=settings.ENTERPRISE_PRICE_USDC,
                signals_per_day=500,
                features=[
                    "500 signals per day",
                    "All Pro features",
                    "Custom model fine-tuning",
                    "API access (no rate limit)",
                    "Dedicated support",
                    "Builder fee sharing",
                ],
            ),
        ]
    )


@router.post("/subscriptions/create", response_model=SubscriptionCreated)
async def create_subscription(
    body: CreateSubscriptionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.tier not in ("pro", "enterprise"):
        raise HTTPException(
            status_code=400,
            detail="Invalid tier. Must be 'pro' or 'enterprise'",
        )

    amount = (
        settings.PRO_PRICE_USDC
        if body.tier == "pro"
        else settings.ENTERPRISE_PRICE_USDC
    )

    now = datetime.utcnow()
    sub = Subscription(
        user_id=user.id,
        tier=body.tier,
        amount=amount,
        tx_hash=body.tx_hash,
        status="active",
        period_start=now,
        period_end=now + timedelta(days=30),
    )
    db.add(sub)

    user.subscription_tier = body.tier

    await db.commit()
    await db.refresh(sub)

    return SubscriptionCreated(
        id=sub.id,
        tier=sub.tier,
        amount=sub.amount,
        status=sub.status,
        period_start=sub.period_start,
        period_end=sub.period_end,
        tx_hash=sub.tx_hash,
    )


@router.get("/subscriptions/status", response_model=SubscriptionStatus)
async def get_subscription_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .where(Subscription.status == "active")
        .order_by(desc(Subscription.created_at))
        .limit(1)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found")

    return SubscriptionStatus(
        id=sub.id,
        tier=sub.tier,
        amount=sub.amount,
        status=sub.status,
        period_start=sub.period_start,
        period_end=sub.period_end,
        created_at=sub.created_at,
    )


@router.post("/subscriptions/cancel", response_model=dict)
async def cancel_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .where(Subscription.status == "active")
        .order_by(desc(Subscription.created_at))
        .limit(1)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found")

    sub.status = "cancelled"
    user.subscription_tier = "free"

    await db.commit()

    return {"status": "cancelled", "tier": sub.tier, "effective_end": sub.period_end}
