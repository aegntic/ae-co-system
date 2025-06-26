#!/usr/bin/env python3
"""Test the crawl4ai MCP server"""

import json
import subprocess
import sys

def test_mcp_server():
    """Test the MCP server with a simple request"""
    
    # Test input - list tools request
    test_input = {
        "jsonrpc": "2.0",
        "method": "tools/list",
        "id": 1
    }
    
    # Run the MCP server
    cmd = [
        "/home/tabs/.local/share/pipx/venvs/crawl4ai/bin/python",
        "/home/tabs/mcp-servers/crawl4ai-mcp-server.py"
    ]
    
    try:
        # Start the process
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Send test request
        process.stdin.write(json.dumps(test_input) + '\n')
        process.stdin.flush()
        
        # Wait a bit and terminate
        import time
        time.sleep(2)
        process.terminate()
        
        # Get output
        stdout, stderr = process.communicate(timeout=5)
        
        print("STDOUT:")
        print(stdout)
        print("\nSTDERR:")
        print(stderr)
        
        return True
        
    except Exception as e:
        print(f"Error testing MCP server: {e}")
        return False

if __name__ == "__main__":
    print("Testing crawl4ai MCP server...")
    if test_mcp_server():
        print("\nTest completed!")
    else:
        print("\nTest failed!")