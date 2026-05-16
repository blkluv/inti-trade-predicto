import logging
from decimal import Decimal
from typing import Any, Optional

from web3 import AsyncWeb3
from web3.types import TxParams, Wei

from src.core.config import settings

logger = logging.getLogger(__name__)

USDC_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function",
    },
]

DEFAULT_USDC_ADDRESS = "0xaf6F5550cb17b87CbE0F50F8B5D48d4bB1A00a0b"


class ArcProvider:
    def __init__(
        self,
        rpc_url: Optional[str] = None,
        usdc_address: Optional[str] = None,
        private_key: Optional[str] = None,
    ):
        self.rpc_url = rpc_url or settings.ARC_RPC_URL
        self.usdc_address = (
            usdc_address or DEFAULT_USDC_ADDRESS
        )
        self.private_key = private_key or settings.ARX_PRIVATE_KEY
        self.w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(self.rpc_url))
        self.usdc_contract = self.w3.eth.contract(
            address=AsyncWeb3.to_checksum_address(self.usdc_address),
            abi=USDC_ABI,
        )

    async def get_balance(self, address: str) -> dict:
        checksummed = AsyncWeb3.to_checksum_address(address)
        try:
            arc_balance_wei = await self.w3.eth.get_balance(checksummed)
            arc_balance = self.w3.from_wei(arc_balance_wei, "ether")

            usdc_balance_raw = await self.usdc_contract.functions.balanceOf(
                checksummed
            ).call()
            usdc_decimals = await self.usdc_contract.functions.decimals().call()
            usdc_balance = float(
                Decimal(usdc_balance_raw) / Decimal(10**usdc_decimals)
            )

            return {
                "address": address,
                "arc_balance": float(arc_balance),
                "usdc_balance": usdc_balance,
                "usdc_decimals": usdc_decimals,
            }
        except Exception as e:
            logger.error("Arc get_balance error: %s", e)
            return {
                "address": address,
                "arc_balance": 0.0,
                "usdc_balance": 0.0,
                "error": str(e),
            }

    async def send_transaction(
        self, to: str, value: int, data: str = ""
    ) -> dict:
        try:
            account = self.w3.eth.account.from_key(self.private_key)
            sender = account.address

            nonce = await self.w3.eth.get_transaction_count(sender)
            gas_price = await self.w3.eth.gas_price
            chain_id = await self.w3.eth.chain_id

            tx: TxParams = {
                "from": sender,
                "to": AsyncWeb3.to_checksum_address(to),
                "value": Wei(value),
                "nonce": nonce,
                "chainId": chain_id,
                "gas": 21000,
            }

            if data:
                tx["data"] = data
                estimated = await self.w3.eth.estimate_gas(tx)
                tx["gas"] = estimated

            tx["gasPrice"] = gas_price

            signed = account.sign_transaction(tx)
            tx_hash = await self.w3.eth.send_raw_transaction(
                signed.raw_transaction
            )
            receipt = await self.w3.eth.wait_for_transaction_receipt(tx_hash)

            return {
                "tx_hash": tx_hash.hex(),
                "status": receipt.get("status"),
                "block_number": receipt.get("blockNumber"),
                "gas_used": receipt.get("gasUsed"),
                "from": sender,
                "to": to,
                "value": value,
            }
        except Exception as e:
            logger.error("Arc send_transaction error: %s", e)
            return {
                "tx_hash": "",
                "status": 0,
                "error": str(e),
            }

    async def read_contract(
        self,
        contract_address: str,
        abi: list,
        method: str,
        args: Optional[list] = None,
    ) -> dict:
        try:
            checksummed = AsyncWeb3.to_checksum_address(contract_address)
            contract = self.w3.eth.contract(address=checksummed, abi=abi)
            fn = getattr(contract.functions, method)
            result = await fn(*args).call()
            return {
                "contract_address": contract_address,
                "method": method,
                "result": self._serialize(result),
            }
        except Exception as e:
            logger.error("Arc read_contract error: %s", e)
            return {
                "contract_address": contract_address,
                "method": method,
                "error": str(e),
            }

    def _serialize(self, value: Any) -> Any:
        if isinstance(value, bytes):
            return value.hex()
        if isinstance(value, (int, float)):
            return value
        if isinstance(value, (list, tuple)):
            return [self._serialize(v) for v in value]
        if isinstance(value, dict):
            return {k: self._serialize(v) for k, v in value.items()}
        return str(value)
