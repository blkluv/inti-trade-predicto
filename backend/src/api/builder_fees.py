from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from typing import Optional

from src.core.database import get_db
from src.core.config import settings
from src.models.position import Position
from src.models.user import User
from src.api.users import get_current_user

router = APIRouter()


class BuilderFeeStats(BaseModel):
    total_volume: float
    total_fees_earned: float
    active_referrals: int
    fee_rate_bps: int
    period: str


class BuilderRegisterRequest(BaseModel):
    polymarket_address: str
    referral_code: Optional[str] = None


class BuilderRegisterResponse(BaseModel):
    status: str
    builder_address: str
    fee_rate_bps: int
    message: str


@router.get("/builder/fees", response_model=BuilderFeeStats)
async def get_builder_fee_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    days: int = 30,
):
    if user.subscription_tier not in ("pro", "enterprise"):
        raise HTTPException(
            status_code=403,
            detail="Builder fee stats require a Pro or Enterprise subscription",
        )

    cutoff = datetime.utcnow() - timedelta(days=days)

    volume_result = await db.execute(
        select(func.coalesce(func.sum(Position.size * Position.entry_price), 0))
        .where(Position.user_id == user.id)
        .where(Position.opened_at >= cutoff)
    )
    total_volume = float(volume_result.scalar() or 0)

    fee_rate = settings.SIGNAL_FEE_BPS
    total_fees = round(total_volume * fee_rate / 10000, 2)

    referrer_check = await db.execute(
        select(func.count())
        .select_from(User)
        .where(User.risk_profile["referred_by"].as_string() == str(user.id))
    )
    active_referrals = referrer_check.scalar() or 0

    return BuilderFeeStats(
        total_volume=round(total_volume, 2),
        total_fees_earned=total_fees,
        active_referrals=active_referrals,
        fee_rate_bps=fee_rate,
        period=f"last_{days}_days",
    )


@router.post("/builder/register", response_model=BuilderRegisterResponse)
async def register_builder(
    body: BuilderRegisterRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.subscription_tier not in ("pro", "enterprise"):
        raise HTTPException(
            status_code=403,
            detail="Builder registration requires a Pro or Enterprise subscription",
        )

    user.wallet_address = body.polymarket_address
    user.risk_profile["builder_registered"] = True
    user.risk_profile["builder_address"] = body.polymarket_address
    if body.referral_code:
        user.risk_profile["referral_code"] = body.referral_code

    await db.commit()

    return BuilderRegisterResponse(
        status="registered",
        builder_address=body.polymarket_address,
        fee_rate_bps=settings.SIGNAL_FEE_BPS,
        message=f"Registered as Polymarket builder at {body.polymarket_address}. Fee rate: {settings.SIGNAL_FEE_BPS} bps.",
    )
