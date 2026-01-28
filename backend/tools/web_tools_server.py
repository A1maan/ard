"""
Web Tools MCP Server
Provides web search and page fetching capabilities via FastMCP.
"""

from __future__ import annotations
import json
import re
from typing import Dict, List
import httpx
from bs4 import BeautifulSoup
from fastmcp import FastMCP

# Initialize MCP server
mcp = FastMCP("WebTools")

# User agent for web requests
_UA = {"User-Agent": "Mozilla/5.0 (compatible; MCPWebTools/1.0)"}


#########################################################################
# Web Search Tool
#########################################################################

@mcp.tool()
async def web_search(query: str, max_results: int = 5) -> str:
    """
    Lightweight web search using DuckDuckGo (prototype).
    
    Args:
        query: Search query string
        max_results: Maximum number of results to return (1-10)
    
    Returns:
        JSON string: [{"title": str, "url": str, "snippet": str}, ...]
    """
    max_results = max(1, min(int(max_results), 10))
    url = "https://duckduckgo.com/html/"
    params = {"q": query}

    async with httpx.AsyncClient(
        headers=_UA,
        timeout=20.0,
        follow_redirects=True
    ) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")
    results: List[Dict[str, str]] = []

    # Extract titles and URLs
    for a in soup.select("a.result__a")[:max_results]:
        title = a.get_text(" ", strip=True)
        href = a.get("href") or ""
        
        if href.startswith("//"):
            href = "https:" + href
        
        results.append({
            "title": title,
            "url": href,
            "snippet": ""
        })

    # Attach snippets (best-effort)
    snippet_nodes = soup.select("a.result__a")
    for i, node in enumerate(snippet_nodes[:len(results)]):
        parent = node.find_parent("div", class_="result")
        if parent:
            snip = parent.select_one(".result__snippet")
            if snip:
                results[i]["snippet"] = snip.get_text(" ", strip=True)

    return json.dumps(results, ensure_ascii=False)


#########################################################################
# Web Page Fetching Tool
#########################################################################

@mcp.tool()
async def web_open(url: str, max_chars: int = 20000) -> str:
    """
    Fetch a URL and return cleaned text content.
    
    Args:
        url: URL to fetch
        max_chars: Maximum characters to return (1000-100000)
    
    Returns:
        Cleaned text content from the page
    """
    max_chars = max(1000, min(int(max_chars), 100000))

    async with httpx.AsyncClient(
        headers=_UA,
        timeout=25.0,
        follow_redirects=True
    ) as client:
        r = await client.get(url)
        r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")

    # Remove script, style, and noscript tags
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    # Extract and clean text
    text = soup.get_text("\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text[:max_chars]


#########################################################################
# Server Entry Point
#########################################################################

if __name__ == "__main__":
    mcp.run(transport="stdio")