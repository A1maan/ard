"""
Ops Tools MCP Server
Provides sandboxed file operations within a workspace directory.
"""

from __future__ import annotations
from pathlib import Path
from typing import List
from fastmcp import FastMCP

# Initialize MCP server
mcp = FastMCP("OpsTools")


#########################################################################
# Workspace Configuration
#########################################################################

# Restrict operations to a safe workspace folder
BASE_DIR = Path(__file__).resolve().parent / "workspace"
BASE_DIR.mkdir(parents=True, exist_ok=True)


def _safe_path(rel_path: str) -> Path:
    """
    Resolve and validate a path within the workspace sandbox.
    
    Args:
        rel_path: Relative path within workspace
    
    Returns:
        Resolved absolute path
    
    Raises:
        ValueError: If path escapes workspace sandbox
    """
    p = (BASE_DIR / rel_path).resolve()
    if BASE_DIR not in p.parents and p != BASE_DIR:
        raise ValueError("Path escapes workspace sandbox.")
    return p


#########################################################################
# File Operation Tools
#########################################################################

@mcp.tool()
def files_list(rel_dir: str = ".") -> List[str]:
    """
    List files in a workspace directory (non-recursive).
    
    Args:
        rel_dir: Relative directory path (default: ".")
    
    Returns:
        List of file/directory names, or empty list if directory doesn't exist
    """
    d = _safe_path(rel_dir)
    if not d.exists() or not d.is_dir():
        return []
    return [p.name for p in d.iterdir()]


@mcp.tool()
def files_read(rel_path: str, max_chars: int = 20000) -> str:
    """
    Read a text file from workspace.
    
    Args:
        rel_path: Relative file path
        max_chars: Maximum characters to read (default: 20000)
    
    Returns:
        File contents (truncated to max_chars) or error message
    """
    p = _safe_path(rel_path)
    if not p.exists() or not p.is_file():
        return "Error: file does not exist."
    
    data = p.read_text(encoding="utf-8", errors="replace")
    return data[:max_chars]


@mcp.tool()
def files_write(rel_path: str, content: str, overwrite: bool = True) -> str:
    """
    Write a text file into workspace.
    This tool requires human-in-the-loop approval when configured.
    
    Args:
        rel_path: Relative file path
        content: Content to write
        overwrite: Whether to overwrite existing files (default: True)
    
    Returns:
        Success message or error
    """
    p = _safe_path(rel_path)
    
    if p.exists() and not overwrite:
        return "Error: file exists and overwrite=False."
    
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    
    return f"OK: wrote {len(content)} chars to {p.relative_to(BASE_DIR)}"


#########################################################################
# Server Entry Point
#########################################################################

if __name__ == "__main__":
    mcp.run(transport="stdio")