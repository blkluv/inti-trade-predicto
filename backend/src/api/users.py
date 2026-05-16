from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from uuid import UUID
import uuid

from src.core.database import get_db
from src.core.config import settings
from src.models.user import User
from src.models.position import Position

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserRegister(BaseModel):
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class SocialLogin(BaseModel):
    provider: str
    provider_id: str
    email: str
    name: str | None = None
    avatar_url: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfile(BaseModel):
    id: UUID
    email: str
    name: str | None
    avatar_url: str | None
    subscription_tier: str
    signals_used_today: int
    risk_profile: dict
    created_at: datetime


class RiskProfileUpdate(BaseModel):
    max_bet_pct: float | None = None
    max_drawdown: float | None = None
    kelly_fraction: float | None = None
    risk_tolerance: str | None = None


class PositionSummary(BaseModel):
    id: UUID
    market_id: str
    side: str
    size: float
    entry_price: float
    current_value: float | None
    pnl: float | None
    pnl_pct: float | None
    status: str
    opened_at: datetime


class PortfolioResponse(BaseModel):
    total_pnl: float
    total_pnl_pct: float
    open_positions: list[PositionSummary]
    closed_positions: list[PositionSummary]


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def _user_to_profile(user: User) -> UserProfile:
    return UserProfile(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        subscription_tier=user.subscription_tier,
        signals_used_today=user.signals_used_today,
        risk_profile=user.risk_profile,
        created_at=user.created_at,
    )


def _to_position_summary(p: Position) -> PositionSummary:
    return PositionSummary(
        id=p.id,
        market_id=p.market_id,
        side=p.side,
        size=p.size,
        entry_price=p.entry_price,
        current_value=p.current_value,
        pnl=p.pnl,
        pnl_pct=p.pnl_pct,
        status=p.status,
        opened_at=p.opened_at,
    )


@router.post("/auth/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=pwd_context.hash(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post("/auth/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post("/auth/social-login", response_model=TokenResponse)
async def social_login(body: SocialLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(
            User.oauth_provider == body.provider,
            User.oauth_provider_id == body.provider_id,
        )
    )
    user = result.scalar_one_or_none()

    if user:
        token = create_access_token(str(user.id))
        return TokenResponse(access_token=token)

    existing_email = await db.execute(select(User).where(User.email == body.email))
    email_user = existing_email.scalar_one_or_none()
    if email_user:
        email_user.oauth_provider = body.provider
        email_user.oauth_provider_id = body.provider_id
        if body.name:
            email_user.name = body.name
        if body.avatar_url:
            email_user.avatar_url = body.avatar_url
        await db.commit()
        await db.refresh(email_user)
        token = create_access_token(str(email_user.id))
        return TokenResponse(access_token=token)

    user = User(
        email=body.email,
        name=body.name,
        avatar_url=body.avatar_url,
        oauth_provider=body.provider,
        oauth_provider_id=body.provider_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.get("/users/me", response_model=UserProfile)
async def get_me(user: User = Depends(get_current_user)):
    return _user_to_profile(user)


@router.patch("/users/me/risk-profile", response_model=UserProfile)
async def update_risk_profile(
    body: RiskProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_data.items():
        user.risk_profile[key] = value

    await db.commit()
    await db.refresh(user)
    return _user_to_profile(user)


@router.get("/users/me/portfolio", response_model=PortfolioResponse)
async def get_portfolio(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Position).where(Position.user_id == user.id)
    )
    positions = result.scalars().all()

    open_positions = [p for p in positions if p.status == "open"]
    closed_positions = [p for p in positions if p.status == "closed"]

    total_pnl = sum(p.pnl or 0 for p in positions)
    total_cost = sum(p.size * p.entry_price for p in open_positions)
    total_pnl_pct = round((total_pnl / total_cost * 100), 2) if total_cost > 0 else 0.0

    return PortfolioResponse(
        total_pnl=total_pnl,
        total_pnl_pct=total_pnl_pct,
        open_positions=[_to_position_summary(p) for p in open_positions],
        closed_positions=[_to_position_summary(p) for p in closed_positions],
    )
