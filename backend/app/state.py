"""
Application state container.
Provides a dataclass-based approach for managing global application state.
"""

from __future__ import annotations
from dataclasses import dataclass

@dataclass
class AppState:
    """
    Global application state holder.
    
    Attributes:
        supervisor: The supervisor agent instance (created during startup)
        stack: AsyncExitStack managing MCP resources (created during startup)
    """
    supervisor: object | None = None
    stack: object | None = None


# Global state instance
STATE = AppState()