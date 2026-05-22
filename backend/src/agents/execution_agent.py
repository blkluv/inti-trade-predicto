import asyncio
import json
import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import select

from src.agents.base_agent import BaseAgent
from src.models.position import Position
from src.models.signal import Signal
from src.models.user import User
from src.core.config import settings

logger = logging.getLogger(__name__)


class ExecutionAgent(BaseAgent):
    def __init__(self, db_session_factory, providers):
        super().__init__(db_session_factory, providers)
        self._active_positions: dict[str, asyncio.Task] = {}

    async def execute_signal(self, signal: Signal, user: User) -> dict:
        market_id = signal.market_id
        action = signal.recommended_action

        if action == "hold":
            return {"status": "skipped", "reason": "hold signal"}

        side = "yes" if signal.predicted_prob > signal.market_odds else "no"
        size = signal.kelly_fraction or 0.0

        if size <= 0:
            return {"status": "skipped", "reason": "zero size"}

        try:
            polymarket_url = self.providers.get(
                "polymarket_api", settings.POLYMARKET_API_URL
            )
            async with httpx.AsyncClient(timeout=30) as client:
                order_resp = await client.post(
                    f"{polymarket_url}/orders",
                    json={
                        "market": market_id,
                        "side": side,
                        "size": str(size),
                        "price": str(signal.market_odds),
                        "token": str(user.id),
                    },
                )
                order_data = order_resp.json()

            tx_hash = order_data.get("transactionHash") or order_data.get("txHash")

            logger.info(
                "Executed %s %.4f on %s — tx=%s",
                side,
                size,
                market_id,
                tx_hash or "pending",
            )

            return {
                "status": "executed",
                "market_id": market_id,
                "side": side,
                "size": size,
                "price": signal.market_odds,
                "tx_hash": tx_hash,
                "order_data": order_data,
            }

        except httpx.HTTPError as e:
            logger.error("Execution failed for %s: %s", market_id, e)
            return {"status": "failed", "error": str(e)}

    async def check_position(self, position_id: str) -> dict:
        async with self.db_session_factory() as session:
            result = await session.execute(
                select(Position).where(Position.id == position_id)
            )
            position = result.scalar_one_or_none()
            if not position:
                return {"status": "not_found"}

            try:
                polymarket_url = self.providers.get(
                    "polymarket_api", settings.POLYMARKET_API_URL
                )
                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.get(
                        f"{polymarket_url}/positions/{position.market_id}",
                    )
                    data = resp.json()

                current_price = float(data.get("price", position.entry_price))
                position.current_value = position.size * current_price
                position.pnl = position.current_value - (
                    position.size * position.entry_price
                )
                position.pnl_pct = (
                    (current_price - position.entry_price) / position.entry_price
                    if position.entry_price > 0
                    else 0.0
                )

                session.add(position)
                await session.commit()

                return {
                    "position_id": position_id,
                    "current_value": position.current_value,
                    "pnl": position.pnl,
                    "pnl_pct": position.pnl_pct,
                    "current_price": current_price,
                }

            except httpx.HTTPError as e:
                logger.error("Position check failed for %s: %s", position_id, e)
                return {"status": "check_failed", "error": str(e)}

    async def run(self) -> None:
        queue = await self.listen("execution_agent")

        while self._running:
            try:
                payload_raw = await queue.get()
                payload = json.loads(payload_raw)
                signal_id = payload.get("signal_id")

                if not signal_id:
                    continue

                async with self.db_session_factory() as session:
                    result = await session.execute(
                        select(Signal).where(Signal.id == signal_id)
                    )
                    signal = result.scalar_one_or_none()
                    if not signal:
                        logger.warning("Signal %s not found", signal_id)
                        continue

                    user_result = await session.execute(
                        select(User).where(
                            User.id == payload.get("user_id")
                        )
                    )
                    user = user_result.scalar_one_or_none()
                    if not user:
                        logger.warning("User %s not found", payload.get("user_id"))
                        continue

                result = await self.execute_signal(signal, user)

                if result.get("status") == "executed":
                    async with self.db_session_factory() as session:
                        position = Position(
                            user_id=user.id,
                            market_id=signal.market_id,
                            signal_id=signal.id,
                            side=result["side"],
                            size=result["size"],
                            entry_price=result["price"],
                            current_value=result["size"] * result["price"],
                            tx_hash=result.get("tx_hash"),
                            status="open",
                        )
                        session.add(position)
                        signal.executed = True
                        await session.commit()

                        logger.info(
                            "Position %s created for signal %s",
                            position.id,
                            signal_id,
                        )

            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("ExecutionAgent cycle failed")
