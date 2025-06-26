"""
Comprehensive CLAEM MCP Server Validation Tests.

Validates all core functionality to ensure perfect operation before user access.
Implements mandatory human-level testing as per CLAUDE.md Rule 2.
"""

import asyncio
import json
import pytest
from unittest.mock import AsyncMock, MagicMock

# Import all core CLAEM components
from claem_mcp.server import CLAEMServer
from claem_mcp.core.types import (
    CollaborationRequest,
    CollaborationStrategy,
    TaskType,
    create_session
)
from claem_mcp.core.collaboration_router import CollaborationRouter
from claem_mcp.core.knowledge_engine import KnowledgeEngine


class TestCLAEMValidation:
    """Comprehensive validation test suite for CLAEM MCP server."""
    
    @pytest.fixture
    async def claem_server(self):
        """Create a CLAEM server instance for testing."""
        server = CLAEMServer()
        await server.initialize()
        return server
    
    @pytest.fixture
    def collaboration_request(self):
        """Create a sample collaboration request."""
        return CollaborationRequest(
            content="Analyze this React application for performance issues",
            context="Complete React app with 25 components",
            task_type=TaskType.KNOWLEDGE_ANALYSIS,
            require_approval=True,
            max_tokens=50000
        )
    
    async def test_server_initialization(self, claem_server):
        """Test that CLAEM server initializes without errors."""
        assert claem_server is not None
        assert isinstance(claem_server.collaboration_router, CollaborationRouter)
        assert isinstance(claem_server.knowledge_engine, KnowledgeEngine)
        assert claem_server.active_sessions == {}
        
    async def test_collaboration_router_strategy_selection(self, claem_server):
        """Test intelligent collaboration strategy selection."""
        router = claem_server.collaboration_router
        
        # Test cost-sensitive request
        cost_request = CollaborationRequest(
            content="Simple code review",
            metadata={"cost_sensitive": True}
        )
        
        strategy = await router.select_optimal_strategy(cost_request)
        assert strategy == CollaborationStrategy.DEEPSEEK_R1_STRATEGY
        
        # Test large context request
        context_request = CollaborationRequest(
            content="x" * 100000,  # Large content
            context="y" * 100000
        )
        
        strategy = await router.select_optimal_strategy(context_request)
        assert strategy == CollaborationStrategy.GEMINI_PRO_STRATEGY
        
    async def test_model_selection_for_strategies(self, claem_server):
        """Test model selection for different strategies."""
        router = claem_server.collaboration_router
        
        # Test DeepSeek strategy
        models = await router.select_models_for_strategy(
            CollaborationStrategy.DEEPSEEK_R1_STRATEGY,
            MagicMock()
        )
        assert "deepseek:r1.1" in models
        
        # Test CEO board strategy
        models = await router.select_models_for_strategy(
            CollaborationStrategy.CEO_BOARD_STRATEGY,
            MagicMock()
        )
        assert len(models) > 1  # Multiple models for board
        
    async def test_knowledge_engine_initialization(self, claem_server):
        """Test knowledge engine proper initialization."""
        knowledge_engine = claem_server.knowledge_engine
        
        assert knowledge_engine.database_url is not None
        assert knowledge_engine.knowledge_graphs == {}
        assert knowledge_engine.pattern_cache == {}
        
    async def test_session_creation_and_management(self, claem_server):
        """Test session creation and state management."""
        session = create_session()
        
        assert session.id is not None
        assert session.total_exchanges == 0
        assert session.can_continue() is True
        assert session.is_expired() is False
        
    async def test_mcp_tool_intelligent_collaborate(self, claem_server):
        """Test the main intelligent collaboration MCP tool."""
        # Mock the tool call
        arguments = {
            "content": "Analyze this code for security vulnerabilities",
            "task_type": "knowledge_analysis",
            "max_tokens": 50000,
            "require_approval": True
        }
        
        result = await claem_server._handle_intelligent_collaborate(arguments)
        
        assert result is not None
        assert len(result.content) > 0
        assert "CLAEM Intelligent Collaboration Result" in result.content[0].text
        assert "Strategy Used:" in result.content[0].text
        
    async def test_mcp_tool_knowledge_evolve(self, claem_server):
        """Test knowledge evolution MCP tool."""
        # Create a session first
        session = create_session()
        claem_server.active_sessions[session.id] = session
        
        arguments = {
            "session_id": session.id,
            "export_conversations": True,
            "learn_patterns": True
        }
        
        result = await claem_server._handle_knowledge_evolve(arguments)
        
        assert result is not None
        assert "CLAEM Knowledge Evolution Result" in result.content[0].text
        assert "Knowledge Graph Statistics:" in result.content[0].text
        
    async def test_mcp_tool_context_synthesize(self, claem_server):
        """Test context synthesis MCP tool."""
        arguments = {
            "content": "Help optimize database queries",
            "max_tokens": 25000,
            "include_patterns": True
        }
        
        result = await claem_server._handle_context_synthesize(arguments)
        
        assert result is not None
        assert "CLAEM Context Synthesis Result" in result.content[0].text
        
    async def test_mcp_tool_human_review(self, claem_server):
        """Test human review and approval MCP tool."""
        arguments = {
            "action": "list",
            "pending_only": True
        }
        
        result = await claem_server._handle_human_review(arguments)
        
        assert result is not None
        assert "CLAEM Human Review Dashboard" in result.content[0].text
        
    async def test_mcp_tool_export_insights(self, claem_server):
        """Test insights export MCP tool."""
        arguments = {
            "include_knowledge_graph": True,
            "include_patterns": True,
            "format": "json"
        }
        
        result = await claem_server._handle_export_insights(arguments)
        
        assert result is not None
        assert "CLAEM Enhanced Insights Export" in result.content[0].text
        
    async def test_mcp_tool_session_info(self, claem_server):
        """Test session information MCP tool."""
        arguments = {
            "include_statistics": True
        }
        
        result = await claem_server._handle_session_info(arguments)
        
        assert result is not None
        assert "CLAEM System Information" in result.content[0].text
        assert "System Status: 🟢 ACTIVE" in result.content[0].text
        
    async def test_cost_estimation(self, claem_server):
        """Test cost estimation for different strategies."""
        router = claem_server.collaboration_router
        
        # Test DeepSeek cost (should be very low)
        cost = router.estimate_cost(CollaborationStrategy.DEEPSEEK_R1_STRATEGY, 10000)
        assert cost < 0.05  # Should be very cost-effective
        
        # Test CEO board cost (should be higher)
        cost = router.estimate_cost(CollaborationStrategy.CEO_BOARD_STRATEGY, 10000)
        assert cost > 0.10  # Should be more expensive
        
    async def test_strategy_performance_recording(self, claem_server):
        """Test strategy performance learning."""
        router = claem_server.collaboration_router
        
        await router.record_strategy_performance(
            CollaborationStrategy.DEEPSEEK_R1_STRATEGY,
            0.95,
            {"test": "data"}
        )
        
        assert CollaborationStrategy.DEEPSEEK_R1_STRATEGY.value in router.learning_data
        assert len(router.learning_data[CollaborationStrategy.DEEPSEEK_R1_STRATEGY.value]) > 0
        
    async def test_error_handling(self, claem_server):
        """Test error handling in tool calls."""
        # Test with invalid session ID
        arguments = {
            "session_id": "non-existent-session",
            "export_conversations": True,
            "learn_patterns": True
        }
        
        result = await claem_server._handle_knowledge_evolve(arguments)
        assert "not found" in result.content[0].text
        
    async def test_collaboration_execution(self, claem_server, collaboration_request):
        """Test end-to-end collaboration execution."""
        session = create_session()
        
        # Execute collaboration strategy
        response = await claem_server._execute_collaboration_strategy(
            CollaborationStrategy.DEEPSEEK_R1_STRATEGY,
            ["deepseek:r1.1"],
            collaboration_request,
            session
        )
        
        assert response is not None
        assert response.strategy_used == CollaborationStrategy.DEEPSEEK_R1_STRATEGY
        assert response.confidence_score > 0
        assert response.processing_time is not None
        assert response.cost_estimate is not None
        
    def test_data_model_validation(self):
        """Test that all data models validate correctly."""
        # Test CollaborationRequest validation
        request = CollaborationRequest(content="Test content")
        assert request.content == "Test content"
        assert request.require_approval is True  # Default
        
        # Test empty content validation
        with pytest.raises(ValueError):
            CollaborationRequest(content="")
            
    async def test_knowledge_graph_operations(self, claem_server):
        """Test knowledge graph operations."""
        knowledge_engine = claem_server.knowledge_engine
        
        # Test search functionality
        results = await knowledge_engine.search_knowledge("test query")
        assert isinstance(results, list)
        
        # Test statistics
        stats = await knowledge_engine.get_knowledge_statistics()
        assert isinstance(stats, dict)
        assert "total_sessions" in stats
        
    def test_strategy_patterns_configuration(self, claem_server):
        """Test strategy patterns are properly configured."""
        router = claem_server.collaboration_router
        
        # Verify all strategies have patterns
        for strategy in CollaborationStrategy:
            assert strategy in router.strategy_patterns
            pattern = router.strategy_patterns[strategy]
            assert "cost_multiplier" in pattern
            assert "reasoning_strength" in pattern
            assert "context_limit" in pattern
            
    async def test_comprehensive_workflow(self, claem_server):
        """Test a complete CLAEM workflow from start to finish."""
        # 1. Start collaboration
        arguments = {
            "content": "Create a secure authentication system",
            "task_type": "multi_model_synthesis",
            "max_tokens": 100000
        }
        
        result = await claem_server._handle_intelligent_collaborate(arguments)
        assert "Strategy Used:" in result.content[0].text
        
        # 2. Extract session ID from response (simulated)
        session_id = list(claem_server.active_sessions.keys())[0] if claem_server.active_sessions else None
        
        if session_id:
            # 3. Evolve knowledge
            evolve_args = {
                "session_id": session_id,
                "learn_patterns": True
            }
            evolve_result = await claem_server._handle_knowledge_evolve(evolve_args)
            assert "Knowledge Evolution Result" in evolve_result.content[0].text
            
            # 4. Export insights
            export_args = {
                "session_id": session_id,
                "format": "json"
            }
            export_result = await claem_server._handle_export_insights(export_args)
            assert "Enhanced Insights Export" in export_result.content[0].text


# Run validation tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])