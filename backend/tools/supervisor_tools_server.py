from __future__ import annotations
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from fastmcp import FastMCP

mcp = FastMCP("SupervisorTools")

@mcp.tool()
def calc_evaluate(expression: str) -> str:
    """
    Evaluate a basic arithmetic expression safely.
    Supports numbers and + - * / ( ) . and spaces.
    """
    allowed = set("0123456789+-*/(). ")
    if any(ch not in allowed for ch in expression):
        return "Error: expression contains disallowed characters."

    try:
        # Very small sandbox: no builtins, no names
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
    except Exception as e:
        return f"Error evaluating expression: {e}"


@mcp.tool()
def time_now() -> str:
    """Return the current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat()


@mcp.tool()
def time_now_riyadh() -> str:
    riyadh_tz = timezone(timedelta(hours=3))
    return datetime.now(riyadh_tz).isoformat()


if __name__ == "__main__":
    mcp.run(transport="stdio")
