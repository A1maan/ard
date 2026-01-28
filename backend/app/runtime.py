"""
Runtime globals for agent and resource management.
Stores supervisor agent and MCP resource stack for access across modules.
"""

from __future__ import annotations
from typing import Optional, Any


# Global runtime variables initialized during FastAPI lifespan startup
SUPERVISOR: Optional[Any] = None  # Supervisor agent instance
STACK: Optional[Any] = None       # AsyncExitStack managing MCP sessions