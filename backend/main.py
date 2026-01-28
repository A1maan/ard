"""
Multi-agent system with MCP tools integration.
Supports Mistral and Google providers with human-in-the-loop approval for file operations.
Features Firestore-backed persistence and message trimming for context management.
"""

import asyncio
import json
import os
import sys
import re
import base64
from pathlib import Path
from contextlib import AsyncExitStack
from typing import Any, Optional

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.tools import tool
from langchain_core.language_models.chat_models import BaseChatModel
from langchain.agents.middleware import HumanInTheLoopMiddleware, before_model, AgentState
from langchain.messages import AIMessageChunk, AIMessage, ToolMessage, AnyMessage, RemoveMessage
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph_checkpoint_firestore import FirestoreSaver
from langgraph.types import Command, Interrupt
from langgraph.types import interrupt as lg_interrupt
from langgraph.runtime import Runtime
from langgraph.graph.message import REMOVE_ALL_MESSAGES
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_mcp_adapters.tools import load_mcp_tools
import langchain.agents.middleware.human_in_the_loop as hitl_mod

from utils import force_text_only, strip_block_id, patch_tools_text_only_for_mistral, load_prompts

if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

load_dotenv()
PROVIDER = os.getenv("LLM_PROVIDER", "google")  # default google
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
key_b64 = os.environ["LANGGRAPH_AES_KEY"]
key = base64.b64decode(key_b64)

#########################################################################
# Provider-Specific Middleware
#########################################################################

@before_model
def mistral_tool_content_to_string(
    state: AgentState,
    runtime: Runtime
) -> Optional[dict[str, Any]]:
    """
    Convert ToolMessage content from list format to string for Mistral compatibility.
    Preserves tool_call_id to maintain request/response correlation.
    """
    new_messages = []
    changed = False

    for m in state["messages"]:
        if isinstance(m, ToolMessage) and isinstance(m.content, list):
            parts = []
            for block in m.content:
                if isinstance(block, dict):
                    block = strip_block_id(block)
                    if block.get("type") == "text":
                        parts.append(block.get("text", ""))
                    else:
                        parts.append(json.dumps(block, ensure_ascii=False))
                else:
                    parts.append(str(block))

            new_messages.append(
                ToolMessage(
                    content="\n".join(p for p in parts if p).strip(),
                    tool_call_id=m.tool_call_id,
                )
            )
            changed = True
        else:
            new_messages.append(m)

    # Debug logging for tool call ID tracking
    for mm in new_messages:
        if hasattr(mm, "tool_calls") and mm.tool_calls:
            print("ASSISTANT TOOL_CALL IDS:", [tc.get("id") for tc in mm.tool_calls])
        if isinstance(mm, ToolMessage):
            print("TOOL RESULT ID:", mm.tool_call_id)

    return {"messages": new_messages} if changed else None


def provider_middleware(provider: str) -> list:
    """Return middleware list based on LLM provider."""
    if provider == "mistral":
        return [mistral_tool_content_to_string]
    return []


#########################################################################
# LLM Provider Configuration
#########################################################################

def make_llm(provider: str) -> BaseChatModel:
    """Create and configure LLM based on provider."""
    if provider == "mistral":
        from langchain_mistralai import ChatMistralAI
        return ChatMistralAI(
            model="mistral-large-latest",
            temperature=0,
            max_retries=2,
            mistral_api_key=os.getenv("MISTRAL_API_KEY"),
        )

    if provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            temperature=0,
            max_retries=2,
            vertexai=True,
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
        )

    
    raise ValueError(f"Unknown provider: {provider}")


#########################################################################
# Context Management and Interrupt Handling
#########################################################################


def _text_to_decisions(text: str) -> dict:
    t = text.strip().lower()

    if t in {"a", "approve", "yes", "y"}:
        return {"decisions": [{"type": "approve"}]}

    if t in {"r", "reject", "no", "n"}:
        return {"decisions": [{"type": "reject"}]}

    # Simple "edit" syntax examples:
    #   edit: Write 'o' to demo2.txt
    #   e Write 'o' to demo2.txt
    m = re.match(r"^(e|edit)\s*:?\s*(.+)$", text.strip(), flags=re.IGNORECASE)
    if m:
        new_query = m.group(2).strip()
        return {
            "decisions": [
                {
                    "type": "edit",
                    "edited_action": {
                        "name": "ops_files",
                        "args": {"query": new_query},
                    },
                }
            ]
        }

    # Default: treat as reject with explanation (or approve—your choice)
    return {"decisions": [{"type": "reject", "reason": f"Unrecognized input: {text}"}]}


def interrupt_parsed(request):
    value = lg_interrupt(request)

    # Studio sometimes returns JSON as a string
    if isinstance(value, str):
        s = value.strip()

        # try JSON first
        if s.startswith("{") or s.startswith("["):
            try:
                obj = json.loads(s)
                if isinstance(obj, dict):
                    return obj
            except json.JSONDecodeError:
                pass

        # otherwise interpret as text
        return _text_to_decisions(value)

    return value


hitl_mod.interrupt = interrupt_parsed


@before_model
def trim_messages(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    """
    Keep only the last few messages to fit the context window.
    Preserves the first message (system/instructions) and recent tail.
    """
    messages = state["messages"]

    # Keep small threads untouched
    if len(messages) <= 8:
        return None

    # Preserve the first message (typically system prompt)
    first_msg = messages[0]

    # Keep a small tail of recent messages
    # Use even count when possible to preserve human/AI pairs
    tail = messages[-8:] if len(messages) % 2 == 0 else messages[-9:]
    new_messages = [first_msg] + tail

    return {
        "messages": [
            RemoveMessage(id=REMOVE_ALL_MESSAGES),
            *new_messages,
        ]
    }


#########################################################################
# Agent and Tool Setup
#########################################################################

async def build_agents(provider: str = "mistral"):
    """
    Build supervisor agent with web and ops subagents.
    Uses PostgreSQL for persistent checkpointing.
    Returns supervisor agent and async context stack.
    """
    llm = make_llm(provider=provider)
    py = str(Path(sys.executable).resolve())
    prompts = load_prompts(Path(__file__).parent / "system_prompts.yaml")

    # Configure MCP server paths
    here = Path(__file__).resolve().parent
    tools_dir = here / "tools"

    supervisor_server = tools_dir / "supervisor_tools_server.py"
    web_server = tools_dir / "web_tools_server.py"
    ops_server = tools_dir / "ops_tools_server.py"

    # Initialize MCP client with all servers
    client = MultiServerMCPClient(
        {
            "supervisor_tools": {
                "transport": "stdio",
                "command": py,
                "args": [str(supervisor_server)],
            },
            "web_tools": {
                "transport": "stdio",
                "command": py,
                "args": [str(web_server)],
            },
            "ops_tools": {
                "transport": "stdio",
                "command": py,
                "args": [str(ops_server)],
            },
        },
        tool_interceptors=[force_text_only],
    )

    # Create and manage async resources
    stack = AsyncExitStack()

    # Commented out lines are from postgresql database setup
    # Initialize PostgreSQL checkpointer
    # DB_URI = os.getenv("LANGGRAPH_DB_URI")
    # if not DB_URI:
    #     raise RuntimeError("Missing LANGGRAPH_DB_URI env var")

    # checkpointer = await stack.enter_async_context(
    #     AsyncPostgresSaver.from_conn_string(DB_URI)
    # )

    # Initialize Firestore checkpointer
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    if not project_id:
        raise RuntimeError("Missing GOOGLE_CLOUD_PROJECT env var for FirestoreSaver")

    # Optional: allow overriding collection names via env vars
    checkpoints_collection = os.getenv("LANGGRAPH_CHECKPOINTS_COLLECTION", "langgraph_checkpoints")
    writes_collection = os.getenv("LANGGRAPH_WRITES_COLLECTION", "langgraph_writes")

    # FirestoreSaver is a (sync) context manager; register it with the async stack
    checkpointer_cm = FirestoreSaver.from_conn_info(
        project_id=project_id,
        checkpoints_collection=checkpoints_collection,
        writes_collection=writes_collection,
    )
    checkpointer = stack.enter_context(checkpointer_cm)

    # One-time DB bootstrap (safe to call repeatedly; no-ops after initial setup)
    # Commented out lines are from postgresql database setup
    # await checkpointer.setup()

    # Create MCP sessions
    web_session = await stack.enter_async_context(client.session("web_tools"))
    ops_session = await stack.enter_async_context(client.session("ops_tools"))
    sup_session = await stack.enter_async_context(client.session("supervisor_tools"))

    # Load tools from sessions
    web_tools = await load_mcp_tools(web_session)
    ops_tools = await load_mcp_tools(ops_session)
    supervisor_native_tools = await load_mcp_tools(sup_session)

    # Apply provider-specific patches
    if provider == "mistral":
        web_tools = patch_tools_text_only_for_mistral(web_tools)
        ops_tools = patch_tools_text_only_for_mistral(ops_tools)
        supervisor_native_tools = patch_tools_text_only_for_mistral(supervisor_native_tools)

    # Create web research subagent
    web_subagent = create_agent(
        model=llm,
        tools=web_tools,
        system_prompt=prompts["web_subagent"]["system"],
        middleware=provider_middleware(provider),
    )

    # Create ops/files subagent
    ops_subagent = create_agent(
        model=llm,
        tools=ops_tools,
        system_prompt=prompts["ops_subagent"]["system"],
        middleware=provider_middleware(provider),
    )

    # Wrap subagents as tools for supervisor
    @tool(
        "web_research",
        description="Web research specialist. Use for web search and opening pages, then summarize findings."
    )
    async def call_web_subagent(query: str) -> str:
        """Invoke web research subagent and return results."""
        result = await web_subagent.ainvoke(
            {"messages": [{"role": "user", "content": query}]}
        )
        content = result["messages"][-1].content
        return content if isinstance(content, str) else json.dumps(content, ensure_ascii=False)

    @tool(
        "ops_files",
        description="Ops/files specialist. Use for listing/reading/writing local files and simple extraction tasks."
    )
    async def call_ops_subagent(query: str) -> str:
        """Invoke ops subagent and return results."""
        result = await ops_subagent.ainvoke(
            {"messages": [{"role": "user", "content": query}]}
        )
        content = result["messages"][-1].content
        return content if isinstance(content, str) else json.dumps(content, ensure_ascii=False)

    # Create supervisor agent with HITL for ops_files tool
    supervisor = create_agent(
        model=llm,
        tools=[*supervisor_native_tools, call_web_subagent, call_ops_subagent],
        system_prompt=prompts["supervisor"]["system"],
        middleware=[
            *provider_middleware(provider),
            trim_messages,
            HumanInTheLoopMiddleware(interrupt_on={"ops_files": True}),
        ],
        checkpointer=checkpointer,
    )

    return supervisor, stack


#########################################################################
# CLI Interaction and Streaming
#########################################################################
import time

_chunk_count = 0

def _render_message_chunk(token: AIMessageChunk) -> None:
    """Render streaming message chunks to console."""
    if token.text:
        print(token.text, end="", flush=True) # Change end here to observe streaming
    if token.tool_call_chunks:
        print(f"\n{token.tool_call_chunks}")


def _render_completed_message(message: AnyMessage) -> None:
    """Render completed messages to console."""
    if isinstance(message, AIMessage) and message.tool_calls:
        print(f"\nTool calls: {message.tool_calls}")
    if isinstance(message, ToolMessage):
        print(f"\nTool response: {message.content_blocks}")


def _render_interrupt(interrupt: Interrupt) -> None:
    """Render interrupt requests to console."""
    for req in interrupt.value["action_requests"]:
        print("\n--- HUMAN APPROVAL REQUIRED ---")
        print(req["description"])


async def run_supervisor_cli(supervisor, user_text: str) -> None:
    """
    Run supervisor agent with CLI streaming and interrupt handling.
    Continues execution loop until all interrupts are resolved.
    """
    config = {"configurable": {"thread_id": "supervisor_thread_1"}}
    pending_resume: Command | None = None

    while True:
        interrupts: list[Interrupt] = []
        input_payload: Any = pending_resume or {
            "messages": [{"role": "user", "content": user_text}]
        }

        # Stream execution with support for subgraph interrupts
        async for _, stream_mode, data in supervisor.astream(
            input_payload,
            config=config,
            stream_mode=["messages", "updates"],
            subgraphs=True,  # Enable sub-agent interrupt/token support
        ):
            if stream_mode == "messages":
                token, metadata = data
                if isinstance(token, AIMessageChunk):
                    _render_message_chunk(token)

            elif stream_mode == "updates":
                for source, update in data.items():
                    if source in ("model", "tools"):
                        _render_completed_message(update["messages"][-1])
                    elif source == "__interrupt__":
                        interrupts.extend(update)
                        _render_interrupt(update[0])

        # Exit loop if no interrupts remain
        if not interrupts:
            print("\n")
            return

        # Collect decisions for all interrupts
        decisions: dict[str, dict[str, list[dict]]] = {}
        for intr in interrupts:
            d = await get_interrupt_decisions_cli(intr)
            decisions[intr.id] = {"decisions": d}

        pending_resume = Command(resume=decisions)


async def _ask(prompt: str) -> str:
    """Async-friendly CLI input."""
    return (await asyncio.to_thread(input, prompt)).strip()


async def get_interrupt_decisions_cli(interrupt: Interrupt) -> list[dict]:
    """
    Collect human decisions for interrupt requests via CLI.
    Returns list of decision dicts matching the order of action_requests.
    
    Supported decision types:
    - approve: {"type": "approve"}
    - reject: {"type": "reject", "message": "..."}
    - edit: {"type": "edit", "edited_action": {"name": "...", "args": {...}}}
    """
    requests = interrupt.value["action_requests"]
    decisions: list[dict] = []

    for i, req in enumerate(requests, start=1):
        print("\n--- HUMAN APPROVAL REQUIRED ---")
        print(f"Request {i}/{len(requests)}")
        print(req["description"])

        # Present decision menu
        while True:
            choice = (await _ask("Choose: [a]pprove / [r]eject / [e]dit ? ")).lower()

            if choice in ("a", "approve"):
                decisions.append({"type": "approve"})
                break

            if choice in ("r", "reject", "n", "no"):
                msg = await _ask("Rejection message (optional): ")
                decisions.append({
                    "type": "reject",
                    "message": msg or "Rejected by human via CLI.",
                })
                break

            if choice in ("e", "edit"):
                # Edit requires both name and args per LangGraph docs
                edited_name = await _ask("Edited tool name (required, e.g. ops_files): ")
                if not edited_name:
                    print("Tool name is required for edit.")
                    continue

                print("Enter edited args as JSON (required).")
                print('Example: {"query": "Write \'o\' to demo2.txt"}')
                edited_args_raw = await _ask("Edited args JSON: ")
                if not edited_args_raw:
                    print("Args JSON is required for edit.")
                    continue

                try:
                    edited_args = json.loads(edited_args_raw)
                except json.JSONDecodeError as e:
                    print(f"Invalid JSON: {e}. Try again.")
                    continue

                decisions.append({
                    "type": "edit",
                    "edited_action": {
                        "name": edited_name,
                        "args": edited_args,
                    },
                })
                break

            print("Invalid choice. Please enter a/r/e.")

    return decisions


#########################################################################
# Main Execution
#########################################################################

async def test_inmemory_multiple_turns(supervisor):
    """Test supervisor with conversational turns to verify persistent memory."""
    # Turn 1: Query for stored label
    await run_supervisor_cli(
        supervisor,
        "My name is Saad",
    )

    #Additional turns can be uncommented for extended testing
    await run_supervisor_cli(
        supervisor,
        "What was my name?",
    )


async def main():
    """Initialize agents and run test scenario."""
    supervisor, stack = await build_agents(provider=PROVIDER)
    try:
        await test_inmemory_multiple_turns(supervisor)
    finally:
        await stack.aclose()


if __name__ == "__main__":
    asyncio.run(main())