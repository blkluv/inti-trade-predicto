import asyncio
import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select, delete

from src.agents.base_agent import BaseAgent
from src.models.market import Market, MarketPrice

logger = logging.getLogger(__name__)


class DataAgent(BaseAgent):
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
                markets.append(
                    {
                        "id": market.id,
                        "question": market.question,
                        "current_odds": market.current_odds,
                        "category": market.category,
                    }
                )

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

    async def collect_news(self, markets: list[dict]) -> list[dict]:
        results = []
        api_key = self.providers.get("newsapi_key", "")
        if not api_key:
            logger.warning("News API key missing; skipping news collection")
            return results

                import httpx

                async with httpx.AsyncClient(timeout=30) as client:
                    for market in markets:
                        query = market["question"]
                        try:
                            resp = await client.get(
                                "https://newsapi.org/v2/everything",
                                params={
                                    "q": query,
                                    "language": "en",
                                    "pageSize": 3,
                                    "sortBy": "publishedAt",
                                },
                                headers={"X-Api-Key": api_key},
                            )
                            if resp.status_code in (426, 429):
                                logger.warning("NewsAPI rate limited, skipping remaining")
                                break
                            if resp.status_code == 200:
                                articles = resp.json().get("articles", [])
                                for a in articles:
                                    results.append(
                                        {
                                            "market_id": market["id"],
                                            "title": a.get("title", ""),
                                            "description": a.get("description", ""),
                                            "url": a.get("url", ""),
                                            "published_at": a.get("publishedAt", ""),
                                            "source": a.get("source", {}).get(
                                                "name", "unknown"
                                            ),
                                        }
                                    )
                        except httpx.HTTPError as e:
                            logger.warning(
                                "News fetch failed for %s: %s", market["id"], e
                            )

                        await asyncio.sleep(0.3)

        logger.info("Collected %d news articles for %d markets", len(results), len(markets))
        return results

    async def analyze_sentiment(self, articles: list[dict]) -> dict[str, dict]:
        from textblob import TextBlob

        market_sentiments: dict[str, dict] = {}
        for article in articles:
            mid = article["market_id"]
            text_content = f"{article['title']} {article['description']}"
            blob = TextBlob(text_content)
            polarity = blob.sentiment.polarity

            if mid not in market_sentiments:
                market_sentiments[mid] = {
                    "scores": [],
                    "articles": [],
                }
            market_sentiments[mid]["scores"].append(polarity)
            market_sentiments[mid]["articles"].append(
                {
                    "title": article["title"],
                    "url": article["url"],
                    "source": article["source"],
                    "published_at": article["published_at"],
                }
            )

        aggregated = {}
        for mid, data in market_sentiments.items():
            scores = data["scores"]
            aggregated[mid] = {
                "mean_sentiment": sum(scores) / len(scores) if scores else 0.0,
                "max_sentiment": max(scores) if scores else 0.0,
                "min_sentiment": min(scores) if scores else 0.0,
                "article_count": len(scores),
                "articles": data["articles"],
            }

        logger.info("Sentiment analysis done for %d markets", len(aggregated))
        return aggregated

    async def run(self) -> None:
        logger.info("DataAgent run loop started")
        while self._running:
            try:
                logger.info("Starting DataAgent cycle")
                markets = await self.collect_market_data()
                if markets:
                    top_markets = sorted(
                        markets,
                        key=lambda m: m.get("volume_24h", m.get("current_odds", 0)) or 0,
                        reverse=True,
                    )[:20]

                    articles = await self.collect_news(top_markets)
                    sentiment = await self.analyze_sentiment(articles)

                    await self.notify(
                        "analysis_agent",
                        {
                            "markets": top_markets,
                            "articles": articles,
                            "sentiment": {
                                k: {
                                    "mean_sentiment": v["mean_sentiment"],
                                    "article_count": v["article_count"],
                                }
                                for k, v in sentiment.items()
                            },
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        },
                    )
            except Exception:
                logger.exception("DataAgent cycle failed")

            await asyncio.sleep(300)
