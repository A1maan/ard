"""
Helper functions for MCP tool processing and provider compatibility.
"""

import json
import yaml
from pathlib import Path
from typing import Any
from mcp.types import TextContent
from langchain_mcp_adapters.interceptors import MCPToolCallRequest


def load_prompts(path: str | Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


async def force_text_only(request: MCPToolCallRequest, handler):
    """
    Convert MCP tool results into plain text only.
    Required for providers like Mistral that expect tool content as strings.
    """
    result = await handler(request)

    texts = []
    for part in (result.content or []):
        if getattr(part, "type", None) == "text":
            texts.append(getattr(part, "text", ""))

    if getattr(result, "structuredContent", None):
        texts.append(json.dumps(result.structuredContent))

    joined = "\n".join(t for t in texts if t)
    result.content = [TextContent(type="text", text=joined)]
    result.structuredContent = None
    
    return result


def strip_block_id(block: dict) -> dict:
    """
    Remove LangChain content-block 'id' fields without touching tool call IDs.
    Content blocks have structure: {"type":"text", "text":"...", "id":"lc_..."}
    """
    if isinstance(block, dict) and "id" in block and "type" in block:
        if block["type"] in {"text", "image_url", "document_url", "file_url", "audio"}:
            block = dict(block)
            block.pop("id", None)
    return block


def _to_plain_string(x: Any) -> str:
    """Convert various content formats to plain string."""
    if x is None:
        return ""
    if isinstance(x, str):
        return x

    # Handle (content, artifact) tuples
    if isinstance(x, tuple) and len(x) == 2:
        x = x[0]

    # List of strings or blocks
    if isinstance(x, list):
        parts = []
        for item in x:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                if item.get("type") == "text":
                    parts.append(item.get("text", ""))
                else:
                    parts.append(json.dumps(item, ensure_ascii=False))
            else:
                parts.append(str(item))
        return "\n".join(p for p in parts if p).strip()

    # Dict format
    if isinstance(x, dict):
        if "content" in x and len(x) == 1:
            return _to_plain_string(x["content"])
        return json.dumps(x, ensure_ascii=False)

    return str(x)


def patch_tools_text_only_for_mistral(tools: list) -> list:
    """
    Patch MCP tools to return plain text strings for Mistral compatibility.
    Wraps each tool's coroutine to convert outputs to string format.
    """
    for t in tools:
        t.response_format = "content"

        orig_coro = getattr(t, "coroutine", None)
        if orig_coro is None:
            continue

        async def wrapped(*args, __orig=orig_coro, **kwargs):
            out = await __orig(*args, **kwargs)
            return _to_plain_string(out)

        t.coroutine = wrapped
    
    return tools