import asyncio
import logging
from typing import Any

from sqlalchemy.ext.asyncio import async_sessionmaker

from src.agents.base_agent import BaseAgent
from src.agents.data_agent import DataAgent
from src.agents.analysis_agent import AnalysisAgent
from src.agents.signal_agent import SignalAgent
from src.agents.execution_agent import ExecutionAgent

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    def __init__(self, db_session_factory: async_sessionmaker, providers: dict[str, Any]):
        self.db_session_factory = db_session_factory
        self.providers = providers
        self._tasks: dict[str, asyncio.Task] = {}
        self._agents: dict[str, BaseAgent] = {}

    async def start_all(self) -> None:
        agent_types = {
            "data": DataAgent,
            "analysis": AnalysisAgent,
            "signal": SignalAgent,
            "execution": ExecutionAgent,
        }

        for name, cls in agent_types.items():
            agent = cls(self.db_session_factory, self.providers)
            self._agents[name] = agent
            self._tasks[name] = asyncio.create_task(
                agent.start(), name=f"agent-{name}"
            )
            logger.info("Started %s agent", name)

        logger.info("All %d agents running", len(self._tasks))

    async def stop_all(self) -> None:
        logger.info("Shutting down all agents...")

        for name, agent in self._agents.items():
            await agent.stop()

        for name, task in self._tasks.items():
            task.cancel()

        results = await asyncio.gather(
            *self._tasks.values(), return_exceptions=True
        )

        for name, result in zip(self._tasks.keys(), results):
            if isinstance(result, asyncio.CancelledError):
                logger.debug("%s agent cancelled cleanly", name)
            elif isinstance(result, Exception):
                logger.error("%s agent exited with error: %s", name, result)
            else:
                logger.info("%s agent stopped", name)

        self._tasks.clear()
        self._agents.clear()
        logger.info("All agents stopped")
