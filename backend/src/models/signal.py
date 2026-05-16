import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Float, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, NUMERIC, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from src.core.database import Base


class Signal(Base):
    __tablename__ = "signals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    market_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    predicted_prob: Mapped[float] = mapped_column(Float, nullable=False)
    market_odds: Mapped[float] = mapped_column(Float, nullable=False)
    edge: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    kelly_fraction: Mapped[float] = mapped_column(Float, nullable=True)
    recommended_action: Mapped[str] = mapped_column(String(20), nullable=False)
    reasoning_trace: Mapped[str] = mapped_column(Text, nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    source_articles: Mapped[dict] = mapped_column(JSONB, default=list)
    key_factors: Mapped[dict] = mapped_column(JSONB, default=list)
    sentiment_score: Mapped[float] = mapped_column(Float, nullable=True)
    news_count: Mapped[int] = mapped_column(Integer, default=0)
    executed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class ModelAccuracy(Base):
    __tablename__ = "model_accuracy"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    market_id: Mapped[str] = mapped_column(String(255), nullable=False)
    predicted_prob: Mapped[float] = mapped_column(Float, nullable=False)
    actual_outcome: Mapped[bool] = mapped_column(nullable=True)
    brier_score: Mapped[float] = mapped_column(Float, nullable=True)
    edge: Mapped[float] = mapped_column(Float, nullable=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
