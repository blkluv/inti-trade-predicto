import os
import json
import logging
from decimal import Decimal
from typing import Any

from dotenv import load_dotenv
from web3 import Web3, Account
from web3.exceptions import (
    BlockNotFound,
    ContractLogicError,
    TransactionNotFound,
    Web3Exception,
)
from web3.types import TxParams
from mcp.server.fastmcp import FastMCP

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("arc-mcp")

RPC_URL = os.getenv("ARC_RPC_URL", "https://arc-testnet.canteen-rpc.com")
USDC_CONTRACT_ADDRESS = os.getenv(
    "ARC_USDC_CONTRACT",
    "0x254d06f33bDc5b8e05b2eaC4D7D2678e98B8E0D1",
)

w3 = Web3(Web3.HTTPProvider(RPC_URL))
mcp = FastMCP("arc-blockchain")

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
]


def _serialize(obj: Any) -> Any:
    if isinstance(obj, (bytes, bytearray)):
        return obj.hex()
    if isinstance(obj, dict):
        return {str(k): _serialize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_serialize(item) for item in obj]
    if isinstance(obj, int):
        if obj > 10**18:
            return str(obj)
        return obj
    return obj


def _check_connection() -> str | None:
    if not w3.is_connected():
        return "Unable to connect to Arc RPC"
    return None


@mcp.tool()
def arc_get_balance(address: str) -> dict:
    """Check USDC and ARC native balance on the Arc testnet.

    Args:
        address: A blockchain address to query (0x-prefixed hex string).
    """
    logger.info("arc_get_balance called with address=%s", address)
    try:
        err = _check_connection()
        if err:
            return {"error": err, "rpc_url": RPC_URL}

        if not Web3.is_address(address):
            return {"error": f"Invalid address: {address}"}

        checksum_address = Web3.to_checksum_address(address)

        native_balance_wei = w3.eth.get_balance(checksum_address)
        native_balance = w3.from_wei(native_balance_wei, "ether")

        result: dict[str, Any] = {
            "address": checksum_address,
            "native_balance_arc": str(native_balance),
            "native_balance_raw": str(native_balance_wei),
        }

        try:
            usdc_contract = w3.eth.contract(
                address=Web3.to_checksum_address(USDC_CONTRACT_ADDRESS),
                abi=USDC_ABI,
            )
            usdc_balance_raw = usdc_contract.functions.balanceOf(
                checksum_address
            ).call()
            usdc_decimals = usdc_contract.functions.decimals().call()
            usdc_balance = Decimal(usdc_balance_raw) / Decimal(10**usdc_decimals)
            usdc_symbol = usdc_contract.functions.symbol().call()
            result["usdc_balance"] = str(usdc_balance)
            result["usdc_contract"] = USDC_CONTRACT_ADDRESS
            result["usdc_symbol"] = usdc_symbol
        except Exception as e:
            result["usdc_error"] = str(e)

        return result

    except Exception as e:
        logger.exception("arc_get_balance failed")
        return {"error": str(e)}


@mcp.tool()
def arc_send_transaction(
    to: str,
    value: str,
    data: str = "",
) -> dict:
    """Send a transaction on Arc testnet.

    Requires ARC_PRIVATE_KEY environment variable to be set.

    Args:
        to: Recipient address (0x-prefixed hex string).
        value: Amount of native ARC/USDC to send (in ARC, e.g. "0.01").
        data: Optional hex-encoded calldata (0x-prefixed).
    """
    logger.info("arc_send_transaction called to=%s value=%s", to, value)
    try:
        err = _check_connection()
        if err:
            return {"error": err}

        private_key = os.getenv("ARC_PRIVATE_KEY")
        if not private_key:
            return {
                "error": "ARC_PRIVATE_KEY not set. Cannot sign transactions.",
                "hint": "Set ARC_PRIVATE_KEY in .env to enable transaction sending.",
            }

        if not Web3.is_address(to):
            return {"error": f"Invalid recipient address: {to}"}

        try:
            parsed_value = w3.to_wei(value, "ether")
        except Exception:
            return {"error": f"Invalid value: {value}. Expected a decimal string like '0.01'."}

        account = Account.from_key(private_key)
        from_address = account.address

        tx: TxParams = {
            "from": from_address,
            "to": Web3.to_checksum_address(to),
            "value": parsed_value,
            "nonce": w3.eth.get_transaction_count(from_address),
            "gasPrice": w3.eth.gas_price,
        }

        if data:
            if data.startswith("0x"):
                tx["data"] = data
            else:
                tx["data"] = "0x" + data

        estimated_gas = w3.eth.estimate_gas(tx)
        tx["gas"] = estimated_gas

        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hex = tx_hash.hex()

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        return {
            "tx_hash": tx_hex,
            "from": from_address,
            "to": to,
            "value": value,
            "status": "success" if receipt["status"] == 1 else "failed",
            "block_number": receipt["blockNumber"],
            "gas_used": receipt["gasUsed"],
            "gas_limit": estimated_gas,
        }

    except ContractLogicError as e:
        return {"error": f"Contract logic error: {e}"}
    except Web3Exception as e:
        return {"error": f"Web3 error: {e}"}
    except Exception as e:
        logger.exception("arc_send_transaction failed")
        return {"error": str(e)}


@mcp.tool()
def arc_read_contract(
    contract_address: str,
    abi: list,
    method: str,
    args: list | None = None,
) -> dict:
    """Read data from a smart contract on Arc testnet (read-only call).

    Args:
        contract_address: The deployed contract address (0x-prefixed).
        abi: The contract ABI as a JSON list of interface definitions.
        method: The contract method name to call.
        args: Optional list of arguments to pass to the method.
    """
    logger.info(
        "arc_read_contract called contract=%s method=%s",
        contract_address,
        method,
    )
    try:
        err = _check_connection()
        if err:
            return {"error": err}

        if not Web3.is_address(contract_address):
            return {"error": f"Invalid contract address: {contract_address}"}

        checksum_address = Web3.to_checksum_address(contract_address)
        contract = w3.eth.contract(address=checksum_address, abi=abi)

        contract_fn = getattr(contract.functions, method, None)
        if contract_fn is None:
            return {
                "error": f"Method '{method}' not found in contract ABI",
            }

        resolved_args = args if args is not None else []
        result = contract_fn(*resolved_args).call()

        return {
            "contract_address": checksum_address,
            "method": method,
            "args": resolved_args,
            "result": _serialize(result),
        }

    except ContractLogicError as e:
        return {"error": f"Contract logic error: {e}"}
    except Exception as e:
        logger.exception("arc_read_contract failed")
        return {"error": str(e)}


@mcp.tool()
def arc_get_block(block_id: str = "latest") -> dict:
    """Get information about a block on Arc testnet.

    Args:
        block_id: Block number, block hash, or "latest" (default: "latest").
    """
    logger.info("arc_get_block called block_id=%s", block_id)
    try:
        err = _check_connection()
        if err:
            return {"error": err}

        if block_id == "latest":
            block = w3.eth.get_block("latest")
        elif block_id.isdigit():
            block = w3.eth.get_block(int(block_id))
        elif block_id.startswith("0x"):
            block = w3.eth.get_block(block_id)
        else:
            return {"error": f"Invalid block_id: {block_id}"}

        return {"block": _serialize(dict(block))}

    except BlockNotFound:
        return {"error": f"Block not found: {block_id}"}
    except Exception as e:
        logger.exception("arc_get_block failed")
        return {"error": str(e)}


@mcp.tool()
def arc_get_transaction(tx_hash: str) -> dict:
    """Get details of a transaction on Arc testnet by its hash.

    Args:
        tx_hash: The transaction hash (0x-prefixed hex string).
    """
    logger.info("arc_get_transaction called tx_hash=%s", tx_hash)
    try:
        err = _check_connection()
        if err:
            return {"error": err}

        tx = w3.eth.get_transaction(tx_hash)
        result = _serialize(dict(tx))

        try:
            receipt = w3.eth.get_transaction_receipt(tx_hash)
            result["receipt"] = _serialize(dict(receipt))
        except Exception:
            result["receipt"] = None

        return {"transaction": result}

    except TransactionNotFound:
        return {"error": f"Transaction not found: {tx_hash}"}
    except Exception as e:
        logger.exception("arc_get_transaction failed")
        return {"error": str(e)}


if __name__ == "__main__":
    logger.info("Starting Arc MCP server (RPC: %s)", RPC_URL)
    logger.info("Connected: %s", w3.is_connected())
    mcp.run(transport="stdio")
