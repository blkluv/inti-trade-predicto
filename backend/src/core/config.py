from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost:5432/inti")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key")
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
    NVIDIA_API_URL: str = "https://api.build.nvidia.com/v1"
    NVIDIA_MODEL: str = "meta/llama-3.1-70b-instruct"
    ARC_RPC_URL: str = os.getenv("ARC_RPC_URL", "https://arc-testnet.canteen-rpc.com")
    ARX_PRIVATE_KEY: str = os.getenv("ARX_PRIVATE_KEY", "")
    POLYMARKET_API_URL: str = os.getenv("POLYMARKET_API_URL", "https://clob.polymarket.com")
    POLYMARKET_GAMMA_API: str = "https://gamma-api.polymarket.com"
    SIGNAL_FEE_BPS: int = 50
    FREE_SIGNALS_PER_DAY: int = 3
    PRO_PRICE_USDC: float = 9.99
    ENTERPRISE_PRICE_USDC: float = 99.99

    class Config:
        env_file = ".env"


settings = Settings()
