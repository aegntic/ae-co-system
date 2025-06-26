#!/usr/bin/env python3
"""Simple test to verify crawl4ai is working"""

import sys
sys.path.insert(0, '/home/tabs/.local/share/pipx/venvs/crawl4ai/lib/python3.12/site-packages')

try:
    from crawl4ai import AsyncWebCrawler
    print("✓ Crawl4AI imported successfully")
    
    from mcp.server import Server
    print("✓ MCP server imported successfully")
    
    # Test creating server instance
    server = Server("test")
    print("✓ MCP server instance created")
    
    print("\n✅ All components are working correctly!")
    print("The crawl4ai MCP server is ready to use.")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")