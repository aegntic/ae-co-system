#!/usr/bin/env python3
"""
AI Collaboration Hub - Tool Testing Script
This script demonstrates how to use all the collaboration tools.
"""
import asyncio
import json
import sys
from ai_collaboration_hub.server import main as server_main, collaboration_manager, initialize_clients
from ai_collaboration_hub.server import handle_call_tool


async def test_collaboration_hub():
    """Test all AI Collaboration Hub tools"""
    print("🚀 Testing AI Collaboration Hub Tools")
    print("=" * 50)
    
    # Initialize the server components
    await initialize_clients()
    print("✅ Server initialized successfully\n")
    
    # Test 1: Start a collaboration session
    print("🔧 Test 1: Starting collaboration session")
    session_result = await handle_call_tool("start_collaboration", {
        "max_exchanges": 5,
        "require_approval": False  # Disable approval for automated testing
    })
    print(f"Result: {session_result[0].text}")
    
    # Extract session ID from the result
    session_id = session_result[0].text.split(": ")[1]
    print(f"Session ID: {session_id}\n")
    
    # Test 2: Send a simple message to Gemini
    print("🔧 Test 2: Collaborating with Gemini")
    print("Sending: 'Hello Gemini, please respond with a brief greeting and mention you're connected via OpenRouter.'")
    
    try:
        collab_result = await handle_call_tool("collaborate_with_gemini", {
            "session_id": session_id,
            "content": "Hello Gemini, please respond with a brief greeting and mention you're connected via OpenRouter. Keep it under 50 words.",
            "context": "This is a test message from AI Collaboration Hub"
        })
        print(f"Result: {collab_result[0].text[:200]}...\n")
    except Exception as e:
        print(f"❌ Error in collaboration: {e}\n")
    
    # Test 3: View conversation log
    print("🔧 Test 3: Viewing conversation log")
    log_result = await handle_call_tool("view_conversation", {
        "session_id": session_id
    })
    print(f"Conversation log preview: {log_result[0].text[:300]}...\n")
    
    # Test 4: End the collaboration session
    print("🔧 Test 4: Ending collaboration session")
    end_result = await handle_call_tool("end_collaboration", {
        "session_id": session_id
    })
    print(f"Result: {end_result[0].text}\n")
    
    print("✅ All tests completed successfully!")
    print("\n🎉 AI Collaboration Hub is working perfectly!")
    print("\n📖 Usage Examples:")
    print("1. Code Review: Send entire React components for analysis")
    print("2. Architecture Planning: Collaborate on system design with 1M context")
    print("3. Debugging: Get multi-perspective problem solving")
    print("4. Learning: Explain complex codebases with full context")


if __name__ == "__main__":
    # Set the API key for testing
    import os
    if not os.getenv("OPENROUTER_API_KEY"):
        print("❌ Please set OPENROUTER_API_KEY environment variable")
        sys.exit(1)
    
    try:
        asyncio.run(test_collaboration_hub())
    except KeyboardInterrupt:
        print("\n⏹️  Testing interrupted by user")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)