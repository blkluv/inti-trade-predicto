from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, desc, case, cast, Float
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from typing import Optional

from src.core.database import get_db
from src.models.signal import ModelAccuracy, Signal

router = APIRouter()


class AccuracyStats(BaseModel):
    total_predictions: int
    resolved_predictions: int
    brier_score: float | None
    win_rate: float | None
    calibration: list[dict]


class ModelVersionPerformance(BaseModel):
    model_version: str
    total_predictions: int
    resolved_predictions: int
    avg_brier_score: float | None
    win_rate: float | None
    avg_edge: float | None


class ModelsResponse(BaseModel):
    models: list[ModelVersionPerformance]


class BacktestResult(BaseModel):
    strategy: str
    total_trades: int
    winning_trades: int
    win_rate: float
    total_return_pct: float
    max_drawdown_pct: float
    sharpe_ratio: float | None


@router.get("/analytics/accuracy", response_model=AccuracyStats)
async def get_accuracy_stats(
    days: Optional[int] = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=days)

    total_result = await db.execute(
        select(func.count()).select_from(ModelAccuracy)
        .where(ModelAccuracy.created_at >= cutoff)
    )
    total_predictions = total_result.scalar() or 0

    resolved_result = await db.execute(
        select(func.count()).select_from(ModelAccuracy)
        .where(ModelAccuracy.created_at >= cutoff)
        .where(ModelAccuracy.actual_outcome.isnot(None))
    )
    resolved_predictions = resolved_result.scalar() or 0

    brier_result = await db.execute(
        select(func.avg(ModelAccuracy.brier_score))
        .where(ModelAccuracy.created_at >= cutoff)
        .where(ModelAccuracy.actual_outcome.isnot(None))
    )
    avg_brier = brier_result.scalar()

    correct_result = await db.execute(
        select(func.count()).select_from(ModelAccuracy)
        .where(ModelAccuracy.created_at >= cutoff)
        .where(ModelAccuracy.actual_outcome.isnot(None))
        .where(
            case(
                (ModelAccuracy.actual_outcome == True, ModelAccuracy.predicted_prob >= 0.5),
                (ModelAccuracy.actual_outcome == False, ModelAccuracy.predicted_prob < 0.5),
                else_=False,
            ) == True
        )
    )
    correct_count = correct_result.scalar() or 0
    win_rate = round(correct_count / resolved_predictions, 4) if resolved_predictions > 0 else None

    calibration_buckets = []
    for decile in range(0, 10):
        lo = decile * 0.1
        hi = (decile + 1) * 0.1
        bucket_result = await db.execute(
            select(
                func.avg(ModelAccuracy.predicted_prob),
                func.avg(cast(ModelAccuracy.actual_outcome, Float)),
                func.count(),
            )
            .where(ModelAccuracy.created_at >= cutoff)
            .where(ModelAccuracy.actual_outcome.isnot(None))
            .where(ModelAccuracy.predicted_prob >= lo)
            .where(ModelAccuracy.predicted_prob < hi)
        )
        row = bucket_result.one_or_none()
        if row and row[2] > 0:
            calibration_buckets.append({
                "bin": f"{lo:.0%}-{hi:.0%}",
                "avg_predicted": round(row[0], 4) if row[0] else None,
                "avg_actual": round(row[1], 4) if row[1] else None,
                "count": row[2],
            })

    return AccuracyStats(
        total_predictions=total_predictions,
        resolved_predictions=resolved_predictions,
        brier_score=round(avg_brier, 4) if avg_brier else None,
        win_rate=win_rate,
        calibration=calibration_buckets,
    )


@router.get("/analytics/models", response_model=ModelsResponse)
async def get_model_performance(
    days: Optional[int] = Query(90, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            ModelAccuracy.model_version,
            func.count().label("total"),
            func.sum(
                case(
                    (ModelAccuracy.actual_outcome.isnot(None), 1),
                    else_=0,
                )
            ).label("resolved"),
            func.avg(ModelAccuracy.brier_score).label("avg_brier"),
            func.avg(ModelAccuracy.edge).label("avg_edge"),
        )
        .where(ModelAccuracy.created_at >= cutoff)
        .group_by(ModelAccuracy.model_version)
    )
    rows = result.all()

    models = []
    for row in rows:
        resolved_count = row.resolved or 0
        correct_result = await db.execute(
            select(func.count()).select_from(ModelAccuracy)
            .where(ModelAccuracy.model_version == row.model_version)
            .where(ModelAccuracy.created_at >= cutoff)
            .where(ModelAccuracy.actual_outcome.isnot(None))
            .where(
                case(
                    (ModelAccuracy.actual_outcome == True, ModelAccuracy.predicted_prob >= 0.5),
                    (ModelAccuracy.actual_outcome == False, ModelAccuracy.predicted_prob < 0.5),
                    else_=False,
                ) == True
            )
        )
        correct_count = correct_result.scalar() or 0
        win_rate = round(correct_count / resolved_count, 4) if resolved_count > 0 else None

        models.append(ModelVersionPerformance(
            model_version=row.model_version,
            total_predictions=row.total,
            resolved_predictions=resolved_count,
            avg_brier_score=round(row.avg_brier, 4) if row.avg_brier else None,
            win_rate=win_rate,
            avg_edge=round(row.avg_edge, 4) if row.avg_edge else None,
        ))

    return ModelsResponse(models=models)


@router.get("/analytics/backtest", response_model=BacktestResult)
async def run_backtest(
    strategy: str = Query("kelly", description="kelly | fixed | conservative"),
    min_edge: float = Query(0.02, ge=0.0),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Signal)
        .where(Signal.edge >= min_edge)
        .order_by(Signal.created_at)
    )
    signals = result.scalars().all()

    if not signals:
        raise HTTPException(status_code=404, detail="No signals found for backtest")

    capital = 10000.0
    peak = capital
    max_drawdown = 0.0
    total_trades = 0
    winning_trades = 0
    returns = []

    for signal in signals:
        if strategy == "kelly":
            fraction = (signal.kelly_fraction or 0.25) * signal.confidence
        elif strategy == "fixed":
            fraction = 0.1
        else:
            fraction = 0.05

        bet = capital * fraction
        if bet <= 0:
            continue

        total_trades += 1
        simulated_outcome = signal.predicted_prob > signal.market_odds

        if simulated_outcome:
            profit = bet * (1 - signal.market_odds) / signal.market_odds
            capital += profit
            winning_trades += 1
            returns.append(profit / capital)
        else:
            capital -= bet
            returns.append(-bet / (capital + bet) if (capital + bet) > 0 else -1)

        peak = max(peak, capital)
        drawdown = (peak - capital) / peak
        max_drawdown = max(max_drawdown, drawdown)

    total_return_pct = round((capital - 10000.0) / 10000.0 * 100, 2)
    win_rate = round(winning_trades / total_trades, 4) if total_trades > 0 else 0.0

    avg_return = sum(returns) / len(returns) if returns else 0
    std_return = (
        (sum((r - avg_return) ** 2 for r in returns) / len(returns)) ** 0.5
        if len(returns) > 1
        else 1
    )
    sharpe = round(avg_return / std_return * (252 ** 0.5), 4) if std_return > 0 else None

    return BacktestResult(
        strategy=strategy,
        total_trades=total_trades,
        winning_trades=winning_trades,
        win_rate=win_rate,
        total_return_pct=total_return_pct,
        max_drawdown_pct=round(max_drawdown * 100, 2),
        sharpe_ratio=sharpe,
    )
