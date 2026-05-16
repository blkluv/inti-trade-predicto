import json
import os
from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings

load_dotenv()

DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]


def _normalize_database_url(url: str) -> str:
    if not url:
        return url
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _parse_cors_origins(raw: str | None) -> list[str]:
    if raw is None:
        return DEFAULT_CORS_ORIGINS
    raw = raw.strip()
    if not raw:
        return DEFAULT_CORS_ORIGINS
    origins: list[str] = []
    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                origins = [str(o).strip() for o in parsed if str(o).strip()]
        except json.JSONDecodeError:
            origins = []
    if not origins:
        origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    if "*" in origins:
        return ["*"]
    return origins or DEFAULT_CORS_ORIGINS


class Settings(BaseSettings):
    DATABASE_URL: str = _normalize_database_url(
        os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost:5432/inti")
    )
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key")
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
    NVIDIA_API_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_MODEL: str = "minimaxai/minimax-m2.7"
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
    POLYMARKET_API_URL: str = os.getenv("POLYMARKET_API_URL", "https://clob.polymarket.com")
    POLYMARKET_GAMMA_API: str = "https://gamma-api.polymarket.com"
    HTTP_PROXY: str = os.getenv("HTTP_PROXY", "")
    POLL_INTERVAL_SECONDS: int = int(os.getenv("POLL_INTERVAL_SECONDS", "300"))
    SIGNAL_FEE_BPS: int = 50
    FREE_SIGNALS_PER_DAY: int = 3
    PRO_PRICE_USDC: float = 9.99
    ENTERPRISE_PRICE_USDC: float = 99.99

    class Config:
        env_file = ".env"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _normalize_db_url(cls, value: str | None):
        if isinstance(value, str):
            return _normalize_database_url(value)
        return value

    @property
    def cors_origins(self) -> list[str]:
        return _parse_cors_origins(self.CORS_ORIGINS)


settings = Settings()
