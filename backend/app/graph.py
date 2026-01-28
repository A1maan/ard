"""
LangGraph API graph factory.
Provides the graph instance required by langgraph.json configuration.
"""

from __future__ import annotations
from langchain_core.runnables import RunnableConfig
from app import runtime


def make_graph(config: RunnableConfig):
    """
    Factory function for LangGraph API deployment.
    
    This function is referenced in langgraph.json and must accept exactly
    one argument: config (RunnableConfig).
    
    Args:
        config: Runtime configuration from LangGraph API
        
    Returns:
        The supervisor agent runnable (from create_agent())
        
    Raises:
        RuntimeError: If supervisor not initialized during FastAPI lifespan
    """
    if runtime.SUPERVISOR is None:
        raise RuntimeError(
            "Supervisor not initialized. "
            "Did your FastAPI lifespan run? Check app.webapp:app wiring."
        )

    return runtime.SUPERVISOR