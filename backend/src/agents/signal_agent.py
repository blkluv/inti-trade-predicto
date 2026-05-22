import asyncio
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select, func

from src.agents.base_agent import BaseAgent
from src.models.signal import Signal, ModelAccuracy
from src.models.user import User

logger = logging.getLogger(__name__)


class SignalAgent(BaseAgent):
    MODEL_VERSION = "nvidia-llama-3.1-70b-v1"

    @staticmethod
    def kelly_criterion(prob: float, market_odds: float, bankroll: float) -> float:
        b = (1 / market_odds) - 1 if market_odds > 0 else 1.0
        q = 1 - prob
        if b <= 0:
            return 0.0
        f_star = (b * prob - q) / b
        return max(0.0, min(f_star, bankroll))

    @staticmethod
    def calculate_edge(predicted_prob: float, market_odds: float) -> float:
        if market_odds <= 0:
            return 0.0
        market_implied = market_odds
        return predicted_prob - market_implied

    @staticmethod
    def calibrate_confidence(raw_confidence: float, model_accuracy: float) -> float:
        if model_accuracy <= 0:
            return raw_confidence * 0.5
        calibrated = raw_confidence * (model_accuracy / 0.6)
        return max(0.0, min(1.0, calibrated))

    async def _get_model_accuracy(self) -> float:
        async with self.db_session_factory() as session:
            result = await session.execute(
                select(func.avg(ModelAccuracy.brier_score)).where(
                    ModelAccuracy.model_version == self.MODEL_VERSION
                )
            )
            avg_brier = result.scalar()
            if avg_brier is not None:
                return max(0.0, 1.0 - float(avg_brier))
            return 0.0

    async def _get_users(self) -> list[User]:
        async with self.db_session_factory() as session:
            result = await session.execute(
                select(User).where(User.is_active == True)
            )
            return list(result.scalars().all())

    async def run(self) -> None:
        queue = await self.listen("signal_agent")

        while self._running:
            try:
                payload_raw = await queue.get()
                payload = json.loads(payload_raw)
                market = payload.get("market", {})
                analysis = payload.get("analysis", {})

                if not market.get("id") or not analysis:
                    continue

                predicted_prob = analysis.get("predicted_prob", 0.5)
                market_odds = market.get("current_odds", 0.5)
                raw_confidence = analysis.get("confidence", 0.0)

                edge = self.calculate_edge(predicted_prob, market_odds)
                model_accuracy = await self._get_model_accuracy()
                calibrated_confidence = self.calibrate_confidence(
                    raw_confidence, model_accuracy
                )

                users = await self._get_users()
                for user in users:
                    risk = user.risk_profile or {}
                    max_bet_pct = risk.get("max_bet_pct", 0.05)
                    kelly_frac = risk.get("kelly_fraction", 0.25)
                    bankroll = 10000.0

                    raw_kelly = self.kelly_criterion(
                        predicted_prob, market_odds, bankroll
                    )
                    kelly_fraction = raw_kelly * kelly_frac

                    if kelly_fraction > 0 and calibrated_confidence > 0.3:
                        action = "buy"
                        size = min(kelly_fraction, bankroll * max_bet_pct)
                    elif kelly_fraction <= 0 and abs(edge) > 0.02:
                        action = "sell"
                        size = 0.0
                    else:
                        action = "hold"
                        size = 0.0

                    signal = Signal(
                        market_id=market["id"],
                        predicted_prob=predicted_prob,
                        market_odds=market_odds,
                        edge=edge,
                        confidence=calibrated_confidence,
                        kelly_fraction=kelly_fraction,
                        recommended_action=action,
                        reasoning_trace=analysis.get("reasoning_trace", ""),
                        model_version=self.MODEL_VERSION,
                        source_articles=analysis.get("key_factors", []),
                        key_factors=analysis.get("key_factors", []),
                        sentiment_score=analysis.get("sentiment_score"),
                        news_count=analysis.get("news_count", 0),
                    )

                    async with self.db_session_factory() as session:
                        session.add(signal)
                        await session.commit()
                        signal_id = signal.id

                    logger.info(
                        "Signal %s for market %s: action=%s edge=%.4f kelly=%.4f",
                        signal_id,
                        market["id"],
                        action,
                        edge,
                        kelly_fraction,
                    )

                    await self.notify(
                        "execution_agent",
                        {
                            "signal_id": str(signal_id),
                            "market_id": market["id"],
                            "action": action,
                            "size": size,
                            "edge": edge,
                            "confidence": calibrated_confidence,
                            "user_id": str(user.id),
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        },
                    )

            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("SignalAgent cycle failed")
