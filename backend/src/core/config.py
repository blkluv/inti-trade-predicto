from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

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
    if not raw:
        return DEFAULT_CORS_ORIGINS
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or DEFAULT_CORS_ORIGINS


class Settings(BaseSettings):
    DATABASE_URL: str = _normalize_database_url(
        os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost:5432/inti")
    )
    CORS_ORIGINS: list[str] = _parse_cors_origins(os.getenv("CORS_ORIGINS"))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key")
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
    NVIDIA_API_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_MODEL: str = "minimaxai/minimax-m2.7"
    ARC_RPC_URL: str = os.getenv("ARC_RPC_URL", "https://rpc.testnet.arc.network")
    ARX_PRIVATE_KEY: str = os.getenv("ARX_PRIVATE_KEY", "")
    SUBSCRIPTION_MANAGER_ADDRESS: str = os.getenv("SUBSCRIPTION_MANAGER_ADDRESS", "0xFf902bF42e2F1B2cB40a33F64758949Ddb7a6584")
    SIGNAL_ATTESTATION_ADDRESS: str = os.getenv("SIGNAL_ATTESTATION_ADDRESS", "0xa342cEABFc9f3eB4ce35de08cd954b8b97886A29")
    USDC_ADDRESS: str = os.getenv("USDC_ADDRESS", "0x3600000000000000000000000000000000000000")
    POLYMARKET_API_URL: str = os.getenv("POLYMARKET_API_URL", "https://clob.polymarket.com")
    POLYMARKET_GAMMA_API: str = "https://gamma-api.polymarket.com"
    PREDSCOPE_API_URL: str = os.getenv("PREDSCOPE_API_URL", "https://predscope.com/api")
    HTTP_PROXY: str = os.getenv("HTTP_PROXY", "")
    POLL_INTERVAL_SECONDS: int = int(os.getenv("POLL_INTERVAL_SECONDS", "300"))
    SIGNAL_FEE_BPS: int = 50
    FREE_SIGNALS_PER_DAY: int = 3
    PRO_PRICE_USDC: float = 9.99
    ENTERPRISE_PRICE_USDC: float = 99.99

    class Config:
        env_file = ".env"


settings = Settings()
