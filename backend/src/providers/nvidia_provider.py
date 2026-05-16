import json
import logging
from typing import Optional

from openai import OpenAI, APIError

from src.core.config import settings

logger = logging.getLogger(__name__)


class NVIDIAProvider:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.NVIDIA_API_KEY
        self.base_url = settings.NVIDIA_API_URL
        self.model = model or settings.NVIDIA_MODEL
        self.client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
        )

    async def generate_analysis(
        self, system_prompt: str, market_context: str
    ) -> dict:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": market_context},
                ],
                temperature=0.2,
                max_tokens=1024,
            )
            content = response.choices[0].message.content.strip()
            return self._parse_analysis_response(content)
        except APIError as e:
            logger.error("NVIDIA API error: %s", e)
            return {
                "predicted_prob": 0.5,
                "confidence": 0.0,
                "reasoning": f"API error: {e}",
            }
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.error("Parse error in NVIDIA response: %s", e)
            return {
                "predicted_prob": 0.5,
                "confidence": 0.0,
                "reasoning": f"Response parse error: {e}",
            }

    async def generate_embedding(self, text: str) -> list[float]:
        try:
            response = self.client.embeddings.create(
                model="nvidia/nv-embed-qa-4",
                input=text,
            )
            return response.data[0].embedding
        except APIError as e:
            logger.error("NVIDIA embedding error: %s", e)
            return []

    def _parse_analysis_response(self, content: str) -> dict:
        json_start = content.find("{")
        json_end = content.rfind("}")
        if json_start != -1 and json_end != -1:
            json_str = content[json_start : json_end + 1]
            parsed = json.loads(json_str)
        else:
            parsed = {}

        return {
            "predicted_prob": float(
                parsed.get("predicted_prob", parsed.get("probability", 0.5))
            ),
            "confidence": float(
                parsed.get("confidence", parsed.get("certainty", 0.0))
            ),
            "reasoning": parsed.get(
                "reasoning", parsed.get("explanation", content[:500])
            ),
        }
