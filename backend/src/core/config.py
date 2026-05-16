from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost:5432/inti")
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
    SIGNAL_FEE_BPS: int = 50
    FREE_SIGNALS_PER_DAY: int = 3
    PRO_PRICE_USDC: float = 9.99
    ENTERPRISE_PRICE_USDC: float = 99.99

    class Config:
        env_file = ".env"


settings = Settings()
