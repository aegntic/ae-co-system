#!/usr/bin/env python3
"""
Simple Crawl4AI MCP Server
Direct wrapper for crawl4ai without requiring external API
"""

import asyncio
import json
import sys
from typing import Any, Dict, List

from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio
import mcp.types as types

# Import crawl4ai from pipx installation
sys.path.insert(0, '/home/tabs/.local/share/pipx/venvs/crawl4ai/lib/python3.12/site-packages')
try:
    from crawl4ai import AsyncWebCrawler
except ImportError:
    print("Error: crawl4ai not found. Please install it with: pipx install crawl4ai", file=sys.stderr)
    sys.exit(1)

# Server instance
server = Server("crawl4ai-direct")

@server.list_tools()
async def list_tools() -> List[types.Tool]:
    """List available crawl4ai tools"""
    return [
        types.Tool(
            name="crawl_url",
            description="Crawl a single URL and return markdown content",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "URL to crawl"},
                    "extract_media": {"type": "boolean", "description": "Extract images and media", "default": True},
                    "javascript": {"type": "boolean", "description": "Execute JavaScript", "default": True},
                    "wait_time": {"type": "number", "description": "Wait time in seconds after page load", "default": 2}
                },
                "required": ["url"]
            }
        ),
        types.Tool(
            name="crawl_multiple",
            description="Crawl multiple URLs and return markdown content",
            inputSchema={
                "type": "object",
                "properties": {
                    "urls": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of URLs to crawl"
                    },
                    "extract_media": {"type": "boolean", "description": "Extract images and media", "default": True},
                    "javascript": {"type": "boolean", "description": "Execute JavaScript", "default": True}
                },
                "required": ["urls"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
    """Handle tool calls"""
    
    if name == "crawl_url":
        url = arguments["url"]
        extract_media = arguments.get("extract_media", True)
        javascript = arguments.get("javascript", True)
        wait_time = arguments.get("wait_time", 2)
        
        try:
            async with AsyncWebCrawler(verbose=False) as crawler:
                result = await crawler.arun(
                    url=url,
                    bypass_cache=True,
                    js_code="" if javascript else None,
                    wait_for=wait_time if javascript else 0,
                    remove_overlay=True
                )
                
                if result.success:
                    content = f"# Crawled: {url}\n\n"
                    content += result.markdown or "No content extracted"
                    
                    if extract_media and result.media:
                        content += "\n\n## Media Found:\n"
                        for media in result.media.get('images', []):
                            content += f"- Image: {media['src']}\n"
                            
                    return [types.TextContent(type="text", text=content)]
                else:
                    return [types.TextContent(type="text", text=f"Failed to crawl {url}: {result.error}")]
                    
        except Exception as e:
            return [types.TextContent(type="text", text=f"Error crawling {url}: {str(e)}")]
    
    elif name == "crawl_multiple":
        urls = arguments["urls"]
        extract_media = arguments.get("extract_media", True)
        javascript = arguments.get("javascript", True)
        
        results = []
        async with AsyncWebCrawler(verbose=False) as crawler:
            for url in urls:
                try:
                    result = await crawler.arun(
                        url=url,
                        bypass_cache=True,
                        js_code="" if javascript else None,
                        wait_for=2 if javascript else 0,
                        remove_overlay=True
                    )
                    
                    if result.success:
                        content = f"# {url}\n\n"
                        content += result.markdown or "No content extracted"
                        
                        if extract_media and result.media:
                            content += "\n\n## Media:\n"
                            for media in result.media.get('images', []):
                                content += f"- {media['src']}\n"
                                
                        results.append(content)
                    else:
                        results.append(f"# {url}\n\nFailed: {result.error}")
                        
                except Exception as e:
                    results.append(f"# {url}\n\nError: {str(e)}")
        
        combined = "\n\n---\n\n".join(results)
        return [types.TextContent(type="text", text=combined)]
    
    else:
        return [types.TextContent(type="text", text=f"Unknown tool: {name}")]

async def main():
    """Main entry point"""
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="crawl4ai-direct",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())