"""
FastAPI application with LangGraph agent lifecycle management.
Initializes supervisor agent and MCP resources during startup.
"""

from __future__ import annotations
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app import runtime
from main import build_agents
from dotenv import load_dotenv

load_dotenv() 

PROVIDER = os.getenv("LLM_PROVIDER", "google")  # default google


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage agent lifecycle for FastAPI application.
    
    Initializes supervisor agent and MCP resources on startup,
    stores them in runtime module for graph factory access,
    and ensures clean shutdown of all resources.
    """
    # Initialize agents and MCP sessions
    supervisor, stack = await build_agents(provider=PROVIDER)

    # Store globally for graph factory access
    runtime.SUPERVISOR = supervisor
    runtime.STACK = stack

    try:
        yield
    finally:
        # Clean shutdown of all async resources
        if runtime.STACK is not None:
            await runtime.STACK.aclose()
        runtime.SUPERVISOR = None
        runtime.STACK = None


# Initialize FastAPI app with agent lifecycle management
app = FastAPI(lifespan=lifespan)