import logging
import re
from datetime import datetime
from typing import Optional

import feedparser
from textblob import TextBlob

logger = logging.getLogger(__name__)

STOP_WORDS = {
    "a", "an", "the", "is", "it", "of", "to", "and", "or", "in", "for",
    "on", "with", "will", "be", "that", "this", "by", "at", "from", "as",
    "are", "was", "were", "been", "being", "have", "has", "had", "do",
    "does", "did", "but", "if", "which", "who", "what", "when", "where",
    "why", "how", "all", "each", "every", "both", "few", "more", "most",
    "other", "some", "such", "no", "nor", "not", "only", "own", "same",
    "so", "than", "too", "very", "just", "about", "above", "after",
    "again", "against", "below", "between", "during", "before", "behind",
}


class NewsProvider:
    async def search_news(self, query: str, count: int = 5) -> list[dict]:
        encoded_query = query.replace(" ", "%20")
        url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"

        loop = feedparser
        feed = feedparser.parse(url)

        articles = []
        for entry in feed.entries[:count]:
            published = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                try:
                    published = datetime(*entry.published_parsed[:6]).isoformat()
                except (ValueError, TypeError):
                    published = datetime.utcnow().isoformat()

            articles.append(
                {
                    "title": entry.get("title", ""),
                    "url": entry.get("link", ""),
                    "source": self._extract_source(entry.get("source", {})),
                    "published": published,
                    "summary": entry.get("summary", "")[:500],
                }
            )

        return articles

    async def get_market_news(
        self, market_question: str, count: int = 5
    ) -> list[dict]:
        keywords = self._extract_keywords(market_question)
        articles = []
        seen_urls: set[str] = set()

        for keyword in keywords[:3]:
            results = await self.search_news(keyword, count=count)
            for article in results:
                url = article.get("url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    articles.append(article)
                if len(articles) >= count:
                    break
            if len(articles) >= count:
                break

        return articles[:count]

    async def analyze_sentiment(self, texts: list[str]) -> list[dict]:
        results = []
        for text in texts:
            blob = TextBlob(text)
            sentiment = blob.sentiment
            results.append(
                {
                    "text": text[:200],
                    "polarity": sentiment.polarity,
                    "subjectivity": sentiment.subjectivity,
                    "sentiment": self._classify_sentiment(sentiment.polarity),
                }
            )
        return results

    def _extract_keywords(self, question: str) -> list[str]:
        cleaned = re.sub(r"[^\w\s]", " ", question.lower())
        words = cleaned.split()
        filtered = [w for w in words if w not in STOP_WORDS and len(w) > 2]

        bigrams = [
            f"{filtered[i]} {filtered[i + 1]}"
            for i in range(len(filtered) - 1)
        ]

        keywords = filtered + bigrams
        return keywords[:10]

    def _extract_source(self, source) -> str:
        if isinstance(source, dict):
            return source.get("title", "Google News")
        if hasattr(source, "title"):
            return source.title
        return "Google News"

    def _classify_sentiment(self, polarity: float) -> str:
        if polarity > 0.1:
            return "positive"
        elif polarity < -0.1:
            return "negative"
        return "neutral"
