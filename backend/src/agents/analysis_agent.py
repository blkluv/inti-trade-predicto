import asyncio
import json
import logging
from datetime import datetime, timezone

from openai import AsyncOpenAI

from src.agents.base_agent import BaseAgent
from src.core.config import settings

logger = logging.getLogger(__name__)

ANALYSIS_SYSTEM_PROMPT = """You are an expert prediction market analyst. Given a market question, current odds, news articles, and sentiment scores, estimate the true probability of the outcome.

Think step by step:
1. Identify the key question and what would need to be true for the outcome to occur.
2. Evaluate each piece of news — does it increase or decrease the likelihood?
3. Consider the sentiment signal — is the market overly optimistic or pessimistic?
4. Weigh the market odds against your own assessment — is there mispricing?
5. Synthesize into a final probability estimate.

Return a JSON object with exactly these fields:
{
  "predicted_prob": <float 0-1>,
  "confidence": <float 0-1>,
  "reasoning_trace": "<step-by-step reasoning>",
  "key_factors": ["<factor 1>", "<factor 2>", ...]
}"""


def _build_prompt(market: dict, articles: list[dict], sentiment: dict | None) -> str:
    parts = [f"## Market Question\n{market.get('question', 'Unknown')}"]

    odds = market.get("current_odds")
    if odds:
        parts.append(f"\n## Current Market Odds\n{float(odds) * 100:.1f}%")

    if articles:
        parts.append("\n## News Articles")
        for i, a in enumerate(articles[:8], 1):
            parts.append(f"{i}. **{a.get('title', '')}** — {a.get('description', '')}")

    if sentiment:
        s = sentiment
        parts.append(
            f"\n## Sentiment Analysis\n"
            f"Mean: {s.get('mean_sentiment', 0):+.3f}, "
            f"Articles: {s.get('article_count', 0)}"
        )

    parts.append(
        "\n## Task\nPredict the true probability of the described outcome. "
        "Return ONLY valid JSON with the four fields specified."
    )
    return "\n".join(parts)


class AnalysisAgent(BaseAgent):
    def __init__(self, db_session_factory, providers):
        super().__init__(db_session_factory, providers)
        self._client = AsyncOpenAI(
            api_key=settings.NVIDIA_API_KEY,
            base_url=settings.NVIDIA_API_URL,
        )
        self._model = settings.NVIDIA_MODEL

    async def analyze_market(
        self, market: dict, articles: list[dict], sentiment: dict | None
    ) -> dict:
        prompt = _build_prompt(market, articles, sentiment)

        try:
            resp = await self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=1024,
                response_format={"type": "json_object"},
            )

            raw = resp.choices[0].message.content
            if not raw:
                raise ValueError("Empty LLM response")

            parsed = json.loads(raw)

            result = {
                "predicted_prob": float(parsed.get("predicted_prob", 0.5)),
                "confidence": float(parsed.get("confidence", 0.0)),
                "reasoning_trace": parsed.get("reasoning_trace", ""),
                "key_factors": parsed.get("key_factors", []),
            }

            result["predicted_prob"] = max(0.01, min(0.99, result["predicted_prob"]))
            result["confidence"] = max(0.0, min(1.0, result["confidence"]))

            logger.info(
                "Analysis for market %s: prob=%.3f conf=%.3f",
                market.get("id", "?"),
                result["predicted_prob"],
                result["confidence"],
            )
            return result

        except Exception as e:
            logger.error("LLM analysis failed for %s: %s", market.get("id"), e)
            return {
                "predicted_prob": 0.5,
                "confidence": 0.0,
                "reasoning_trace": f"Analysis error: {e}",
                "key_factors": [],
            }

    async def run(self) -> None:
        conn = await self.listen("analysis_agent")

        while self._running:
            try:
                notification = await conn.notifies.get()
                payload = json.loads(notification.payload)
                markets = payload.get("markets", [])
                articles = payload.get("articles", [])
                sentiment_map = payload.get("sentiment", {})

                for market in markets:
                    mid = market["id"]
                    market_articles = [
                        a for a in articles if a.get("market_id") == mid
                    ]
                    market_sentiment = sentiment_map.get(mid)
                    analysis = await self.analyze_market(
                        market, market_articles, market_sentiment
                    )

                    await self.notify(
                        "signal_agent",
                        {
                            "market": market,
                            "analysis": analysis,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        },
                    )

            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("AnalysisAgent cycle failed")
