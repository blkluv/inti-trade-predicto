import asyncio
import json
import logging
from datetime import datetime, timezone

from openai import AsyncOpenAI
from sqlalchemy import select, delete

from src.agents.base_agent import BaseAgent
from src.core.config import settings
from src.models.market import Market, MarketPrice
from src.models.signal import Signal

logger = logging.getLogger(__name__)

BATCH_PROMPT = """You are analyzing prediction markets. For each market, estimate the true probability.

Return a JSON array where each element has:
{
  "market_id": "string",
  "predicted_prob": <float 0-1>,
  "confidence": <float 0-1>,
  "reasoning": "brief why",
  "key_factors": ["factor1", "factor2"]
}

Return ALL markets in a single JSON array. No extra text."""


def _build_batch_prompt(markets: list[dict]) -> str:
    parts = ["Analyze these prediction markets:", ""]
    for m in markets:
        q = m.get("question", "?")
        odds = float(m.get("current_odds", 0.5)) * 100
        parts.append(f"ID={m['id']} Odds={odds:.0f}%")
        parts.append(f"Q: {q}")
        parts.append("")
    parts.append("Return a JSON array of analyses, one per market.")
    return "\n".join(parts)


class DataAgent(BaseAgent):
    def __init__(self, db_session_factory, providers):
        super().__init__(db_session_factory, providers)
        self._client = AsyncOpenAI(
            api_key=settings.NVIDIA_API_KEY,
            base_url=settings.NVIDIA_API_URL,
        )
        self._model = settings.NVIDIA_MODEL

    @staticmethod
    def _parse_list(value) -> list:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                return []
        return []

    @staticmethod
    def _coerce_float(value) -> float | None:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _normalize_market_fields(self, item: dict) -> tuple[list, float | None]:
        outcomes_raw = self._parse_list(item.get("outcomes"))
        outcome_prices = self._parse_list(item.get("outcomePrices"))

        if outcomes_raw and isinstance(outcomes_raw[0], dict):
            outcomes = outcomes_raw
        else:
            outcomes = [{"name": str(o)} for o in outcomes_raw]

        current_odds = self._coerce_float(item.get("bestPrice"))
        if current_odds is None:
            current_odds = self._coerce_float(item.get("price"))

        if current_odds is None and outcome_prices:
            prices = [self._coerce_float(p) for p in outcome_prices]
            prices = [p for p in prices if p is not None]
            if prices:
                current_odds = prices[0]

        if current_odds is None and outcomes:
            if isinstance(outcomes[0], dict):
                probabilities = [
                    self._coerce_float(o.get("probability"))
                    for o in outcomes
                    if isinstance(o, dict)
                ]
                probabilities = [p for p in probabilities if p is not None]
                if probabilities:
                    current_odds = max(probabilities)

        return outcomes, current_odds

    @staticmethod
    def calculate_edge(predicted: float, market_odds: float) -> float:
        return predicted - market_odds

    @staticmethod
    def kelly_criterion(predicted: float, market_odds: float, bankroll: float) -> float:
        q = 1 - predicted
        b = (1 / market_odds) - 1 if market_odds > 0 else 0
        if b <= 0:
            return 0.0
        kelly = (predicted * b - q) / b
        return max(0.0, kelly) * bankroll

    @staticmethod
    def calibrate_confidence(raw: float, model_accuracy: float | None) -> float:
        if model_accuracy is None:
            return min(raw * 1.1, 1.0)
        return min(raw * (1 + (model_accuracy - 0.5)), 1.0)

    async def _get_model_accuracy(self) -> float | None:
        from src.models.signal import ModelAccuracy
        try:
            async with self.db_session_factory() as session:
                result = await session.execute(
                    select(ModelAccuracy).order_by(ModelAccuracy.id.desc()).limit(100)
                )
                rows = list(result.scalars().all())
                if rows:
                    scores = [r.brier_score for r in rows if r.brier_score is not None]
                    if scores:
                        return 1.0 - (sum(scores) / len(scores))
        except Exception:
            logger.warning("No model accuracy data available")
        return None

    async def collect_market_data(self) -> list[dict]:
        pm_provider = self.providers.get("polymarket")
        if pm_provider is None:
            logger.error("Polymarket provider not available")
            return []

        raw = await pm_provider.get_all_markets_flat()
        if not raw:
            logger.warning("No market data from any source")
            return []

        markets = []
        async with self.db_session_factory() as session:
            if raw:
                await session.execute(
                    delete(Market).where(Market.id.like("predscope_%"))
                )

            for item in raw:
                market_id = item.get("id") or item.get("conditionId")
                if not market_id:
                    continue

                outcomes, current_odds = self._normalize_market_fields(item)

                market = Market(
                    id=str(market_id),
                    source="polymarket",
                    question=item.get("question", ""),
                    description=item.get("description", ""),
                    category=(
                        item.get("category")
                        or (item.get("categories") or [None])[0]
                        or "prediction"
                    ),
                    outcomes=outcomes,
                    current_odds=current_odds,
                    volume_24h=float(item.get("volume24hr", item.get("volume_24h", 0))),
                    liquidity=float(item.get("liquidity", 0)),
                    end_date=(
                        datetime.fromisoformat(
                            item["endDate"].replace("Z", "+00:00")
                        )
                        if item.get("endDate")
                        else None
                    ),
                )
                await session.merge(market)
                markets.append({
                    "id": market.id,
                    "question": market.question,
                    "current_odds": market.current_odds,
                    "category": market.category,
                })

            await session.flush()

            for item in raw:
                market_id = item.get("id") or item.get("conditionId")
                if not market_id:
                    continue
                outcomes, current_odds = self._normalize_market_fields(item)
                if current_odds is not None:
                    price_entry = MarketPrice(
                        market_id=str(market_id),
                        price=current_odds,
                        volume=float(item.get("volume24hr", item.get("volume_24h", 0))),
                    )
                    session.add(price_entry)

            await session.commit()

        logger.info("Collected %d markets", len(markets))
        return markets

    async def _batch_analyze(self, markets: list[dict]) -> list[dict]:
        prompt = _build_batch_prompt(markets)
        try:
            resp = await self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": BATCH_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=2048,
                response_format={"type": "json_object"},
            )
            raw = resp.choices[0].message.content
            if not raw:
                raise ValueError("Empty LLM response")

            data = json.loads(raw)
            results = data if isinstance(data, list) else data.get("analyses", data.get("markets", [data]))
            if not isinstance(results, list):
                results = [results]

            parsed = []
            market_ids = {m["id"] for m in markets}
            for r in results:
                mid = r.get("market_id")
                if mid not in market_ids:
                    continue
                parsed.append({
                    "market_id": mid,
                    "predicted_prob": max(0.01, min(0.99, float(r.get("predicted_prob", 0.5)))),
                    "confidence": max(0.0, min(1.0, float(r.get("confidence", 0)))),
                    "reasoning_trace": r.get("reasoning", r.get("reasoning_trace", "")),
                    "key_factors": r.get("key_factors", []),
                })

            logger.info("Batch analyzed %d/%d markets", len(parsed), len(markets))
            return parsed

        except Exception as e:
            logger.error("Batch analysis failed: %s", e)
            return []

    async def run(self) -> None:
        logger.info("DataAgent run loop started")
        while self._running:
            try:
                logger.info("Starting DataAgent cycle")
                markets = await self.collect_market_data()
                if not markets:
                    await asyncio.sleep(300)
                    continue

                top_markets = sorted(
                    markets,
                    key=lambda m: m.get("volume_24h", m.get("current_odds", 0)) or 0,
                    reverse=True,
                )[:20]

                logger.info("Analyzing top %d markets with NVIDIA", len(top_markets))
                analyses = await self._batch_analyze(top_markets)
                if not analyses:
                    logger.warning("No analyses produced, skipping signal generation")
                    await asyncio.sleep(300)
                    continue

                model_accuracy = await self._get_model_accuracy()
                market_map = {m["id"]: m for m in top_markets}

                signals_created = 0
                async with self.db_session_factory() as session:
                    for a in analyses:
                        market = market_map.get(a["market_id"])
                        if not market:
                            continue

                        predicted_prob = a["predicted_prob"]
                        market_odds = market.get("current_odds", 0.5) or 0.5
                        raw_confidence = a["confidence"]
                        edge = self.calculate_edge(predicted_prob, market_odds)
                        calibrated_confidence = self.calibrate_confidence(
                            raw_confidence, model_accuracy
                        )
                        raw_kelly = self.kelly_criterion(
                            predicted_prob, market_odds, 10000.0
                        )
                        kelly_fraction = raw_kelly * 0.25

                        if kelly_fraction > 0 and calibrated_confidence > 0.3:
                            action = "buy"
                        elif kelly_fraction <= 0 and abs(edge) > 0.02:
                            action = "sell"
                        else:
                            action = "hold"

                        signal = Signal(
                            market_id=a["market_id"],
                            predicted_prob=predicted_prob,
                            market_odds=market_odds,
                            edge=edge,
                            confidence=calibrated_confidence,
                            kelly_fraction=kelly_fraction,
                            recommended_action=action,
                            reasoning_trace=a.get("reasoning_trace", ""),
                            model_version="minimax-m2.7-v1",
                            source_articles=a.get("key_factors", []),
                            key_factors=a.get("key_factors", []),
                            sentiment_score=None,
                            news_count=0,
                        )
                        session.add(signal)
                        signals_created += 1

                    await session.commit()

                logger.info("Created %d signals", signals_created)

            except Exception:
                logger.exception("DataAgent cycle failed")

            await asyncio.sleep(300)
