import asyncio
import json
import logging
from datetime import datetime, timezone

from openai import AsyncOpenAI

from src.agents.base_agent import BaseAgent
from src.core.config import settings

logger = logging.getLogger(__name__)

BATCH_SYSTEM_PROMPT = """You are analyzing prediction markets. For each market, estimate the true probability.

Return a JSON array where each element has:
{
  "market_id": "string",
  "predicted_prob": <float 0-1>,
  "confidence": <float 0-1>,
  "reasoning": "brief why",
  "key_factors": ["factor1", "factor2"]
}

Return ALL markets in a single JSON array. No extra text."""


def _build_batch_prompt(markets: list[dict], sentiment_map: dict) -> str:
    parts = ["Analyze these prediction markets:", ""]
    for m in markets:
        mid = m["id"]
        q = m.get("question", "?")
        odds = float(m.get("current_odds", 0.5)) * 100
        s = sentiment_map.get(mid, {})
        sent = s.get("mean_sentiment", 0)
        n = s.get("article_count", 0)
        parts.append(
            f"ID={mid} Odds={odds:.0f}% Sentiment={sent:+.2f} Articles={n}"
        )
        parts.append(f"Q: {q}")
        parts.append("")
    parts.append("Return a JSON array of analyses, one per market.")
    return "\n".join(parts)


class AnalysisAgent(BaseAgent):
    def __init__(self, db_session_factory, providers):
        super().__init__(db_session_factory, providers)
        self._client = AsyncOpenAI(
            api_key=settings.NVIDIA_API_KEY,
            base_url=settings.NVIDIA_API_URL,
        )
        self._model = settings.NVIDIA_MODEL

    async def _batch_analyze(
        self, markets: list[dict], sentiment_map: dict
    ) -> list[dict]:
        prompt = _build_batch_prompt(markets, sentiment_map)

        try:
            resp = await self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": BATCH_SYSTEM_PROMPT},
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
                    "sentiment_score": float(r.get("sentiment_score", 0)),
                    "news_count": int(r.get("news_count", 0)),
                })

            logger.info("Batch analyzed %d/%d markets", len(parsed), len(markets))
            return parsed

        except Exception as e:
            logger.error("Batch analysis failed: %s", e)
            return []

    async def run(self) -> None:
        logger.info("AnalysisAgent run loop started")
        queue = await self.listen("analysis_agent")

        while self._running:
            try:
                payload_raw = await queue.get()
                payload = json.loads(payload_raw)
                markets = payload.get("markets", [])
                sentiment_map = payload.get("sentiment", {})

                if not markets:
                    continue

                analyses = await self._batch_analyze(markets, sentiment_map)

                market_map = {m["id"]: m for m in markets}
                for a in analyses:
                    market = market_map.get(a["market_id"])
                    if not market:
                        continue
                    await self.notify("signal_agent", {
                        "market": market,
                        "analysis": a,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })

            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("AnalysisAgent cycle failed")
