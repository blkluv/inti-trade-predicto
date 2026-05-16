import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Float, JSON, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from src.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    wallet_address: Mapped[str] = mapped_column(String(255), nullable=True)
    subscription_tier: Mapped[str] = mapped_column(String(50), default="free")
    subscription_expires: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    signals_used_today: Mapped[int] = mapped_column(default=0)
    last_signal_reset: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    risk_profile: Mapped[dict] = mapped_column(JSONB, default=lambda: {
        "max_bet_pct": 0.05,
        "max_drawdown": 0.20,
        "kelly_fraction": 0.25,
        "risk_tolerance": "moderate"
    })
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
