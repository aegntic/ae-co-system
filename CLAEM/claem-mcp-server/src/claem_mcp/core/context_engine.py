"""
Context Engine: Intelligent context synthesis and management.

Manages context aggregation from knowledge graphs, session history,
and external sources to provide optimal AI collaboration contexts.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

from .types import (
    CollaborationRequest,
    CollaborationResponse,
    SessionState,
    ConversationMessage,
    KnowledgeNode,
    CollaborationFactors,
    ModelConfiguration
)

logger = logging.getLogger(__name__)


class ContextEngine:
    """
    Intelligent context synthesis engine for enhanced AI collaboration.
    
    Aggregates and optimizes context from multiple sources including
    knowledge graphs, session history, and external context sources
    to maximize collaboration effectiveness.
    """
    
    def __init__(self, max_context_tokens: int = 50000):
        self.max_context_tokens = max_context_tokens
        self.context_cache: Dict[str, Dict] = {}
        self.context_templates: Dict[str, str] = self._load_context_templates()
        
    def _load_context_templates(self) -> Dict[str, str]:
        """Load context templates for different collaboration types."""
        return {
            "code_analysis": """# Code Analysis Context

## Relevant Code Patterns
{code_patterns}

## Previous Analysis Results
{previous_analysis}

## Best Practices
{best_practices}
""",
            "decision_making": """# Decision Making Context

## Previous Decisions
{previous_decisions}

## Decision Factors
{decision_factors}

## Success Patterns
{success_patterns}
""",
            "general_collaboration": """# Collaboration Context

## Session History
{session_history}

## Relevant Knowledge
{relevant_knowledge}

## User Preferences
{user_preferences}
"""
        }
    
    async def synthesize_context_for_request(
        self,
        request: CollaborationRequest,
        session_state: SessionState,
        knowledge_nodes: Optional[List[KnowledgeNode]] = None,
        model_config: Optional[ModelConfiguration] = None
    ) -> str:
        """
        Synthesize optimal context for a collaboration request.
        
        Combines session history, knowledge graph data, and request-specific
        context to create the most effective collaboration environment.
        """
        # Determine collaboration type
        collab_type = self._classify_collaboration_type(request)
        
        # Get relevant context components
        context_components = await self._gather_context_components(
            request, session_state, knowledge_nodes, collab_type
        )
        
        # Apply token limits based on model configuration
        if model_config:
            effective_limit = min(
                self.max_context_tokens,
                int(model_config.context_window * 0.6)  # Reserve space for response
            )
        else:
            effective_limit = self.max_context_tokens
        
        # Synthesize context using appropriate template
        synthesized_context = await self._synthesize_with_template(
            collab_type, context_components, effective_limit
        )
        
        # Cache context for future optimization
        await self._cache_context_result(request, synthesized_context)
        
        logger.info(f"Synthesized {len(synthesized_context)} char context for {collab_type}")
        
        return synthesized_context
    
    def _classify_collaboration_type(self, request: CollaborationRequest) -> str:
        """Classify the type of collaboration to select appropriate context."""
        content_lower = request.content.lower()
        
        if any(keyword in content_lower for keyword in [
            "analyze", "review", "code", "function", "class", "bug", "optimize"
        ]):
            return "code_analysis"
        elif any(keyword in content_lower for keyword in [
            "decide", "choose", "recommend", "compare", "evaluate", "should"
        ]):
            return "decision_making"
        else:
            return "general_collaboration"
    
    async def _gather_context_components(
        self,
        request: CollaborationRequest,
        session_state: SessionState,
        knowledge_nodes: Optional[List[KnowledgeNode]],
        collab_type: str
    ) -> Dict[str, str]:
        """Gather all relevant context components."""
        components = {}
        
        # Session history context
        components["session_history"] = self._format_session_history(
            session_state.messages[-5:]  # Last 5 messages
        )
        
        # Knowledge graph context
        if knowledge_nodes:
            components["relevant_knowledge"] = self._format_knowledge_nodes(knowledge_nodes)
        else:
            components["relevant_knowledge"] = "No specific knowledge available."
        
        # User preferences
        components["user_preferences"] = self._format_user_preferences(
            session_state.user_preferences
        )
        
        # Type-specific contexts
        if collab_type == "code_analysis":
            components.update(await self._gather_code_context(request, session_state))
        elif collab_type == "decision_making":
            components.update(await self._gather_decision_context(request, session_state))
        
        # External context if provided
        if request.context:
            components["external_context"] = request.context[:10000]  # Limit external context
        
        return components
    
    def _format_session_history(self, messages: List[ConversationMessage]) -> str:
        """Format recent session messages for context."""
        if not messages:
            return "No previous messages in this session."
        
        formatted_messages = []
        for msg in messages:
            timestamp = msg.timestamp.strftime("%H:%M:%S")
            formatted_messages.append(f"[{timestamp}] {msg.source.value}: {msg.content[:200]}...")
        
        return "\n".join(formatted_messages)
    
    def _format_knowledge_nodes(self, nodes: List[KnowledgeNode]) -> str:
        """Format knowledge nodes for context inclusion."""
        if not nodes:
            return "No relevant knowledge found."
        
        formatted_nodes = []
        for node in nodes[:5]:  # Limit to top 5 most relevant
            confidence = f" (confidence: {node.confidence_score:.2f})"
            formatted_nodes.append(f"- {node.name}: {node.content[:300]}...{confidence}")
        
        return "\n".join(formatted_nodes)
    
    def _format_user_preferences(self, preferences: Dict) -> str:
        """Format user preferences for context."""
        if not preferences:
            return "No specific user preferences noted."
        
        formatted_prefs = []
        for key, value in preferences.items():
            formatted_prefs.append(f"- {key}: {value}")
        
        return "\n".join(formatted_prefs)
    
    async def _gather_code_context(
        self, 
        request: CollaborationRequest, 
        session_state: SessionState
    ) -> Dict[str, str]:
        """Gather code-specific context components."""
        # This would be enhanced with actual code analysis
        return {
            "code_patterns": "Standard patterns will be analyzed based on request.",
            "previous_analysis": "Previous code analysis results would appear here.",
            "best_practices": "Relevant coding best practices would be included."
        }
    
    async def _gather_decision_context(
        self, 
        request: CollaborationRequest, 
        session_state: SessionState
    ) -> Dict[str, str]:
        """Gather decision-making specific context components."""
        # Extract decision patterns from session
        return {
            "previous_decisions": "Previous decisions from this session would appear here.",
            "decision_factors": "Key factors for this type of decision.",
            "success_patterns": "Patterns of successful decisions in similar contexts."
        }
    
    async def _synthesize_with_template(
        self,
        collab_type: str,
        components: Dict[str, str],
        token_limit: int
    ) -> str:
        """Synthesize context using the appropriate template."""
        template = self.context_templates.get(collab_type, self.context_templates["general_collaboration"])
        
        # Fill template with components
        try:
            context = template.format(**components)
        except KeyError as e:
            logger.warning(f"Missing template component: {e}")
            # Fallback to general template
            context = self.context_templates["general_collaboration"].format(**components)
        
        # Trim to token limit
        if len(context) > token_limit * 4:  # Rough char to token conversion
            context = context[:token_limit * 4] + "\n\n[Context truncated due to size limits]"
        
        return context
    
    async def _cache_context_result(self, request: CollaborationRequest, context: str) -> None:
        """Cache context for performance optimization."""
        cache_key = f"{request.id}_{hash(request.content)}"
        self.context_cache[cache_key] = {
            "context": context,
            "timestamp": datetime.utcnow(),
            "request_hash": hash(request.content)
        }
        
        # Clean old cache entries (keep last 100)
        if len(self.context_cache) > 100:
            oldest_key = min(self.context_cache.keys(), 
                           key=lambda k: self.context_cache[k]["timestamp"])
            del self.context_cache[oldest_key]
    
    async def enhance_context_with_external_sources(
        self,
        base_context: str,
        external_sources: List[str]
    ) -> str:
        """Enhance context with external information sources."""
        # This would integrate with external APIs, documentation, etc.
        # For now, it's a placeholder for future enhancement
        enhanced_context = base_context
        
        if external_sources:
            enhanced_context += "\n\n# External References\n"
            for source in external_sources[:3]:  # Limit external sources
                enhanced_context += f"- {source}\n"
        
        return enhanced_context
    
    async def optimize_context_for_model(
        self,
        context: str,
        model_config: ModelConfiguration,
        collaboration_factors: CollaborationFactors
    ) -> str:
        """Optimize context specifically for the target AI model."""
        # Model-specific optimizations
        if model_config.provider == "google":  # Gemini
            # Gemini handles large contexts well
            return context
        elif model_config.provider == "anthropic":  # Claude
            # Claude prefers structured, clear contexts
            return self._structure_context_for_claude(context)
        elif model_config.provider == "deepseek":  # DeepSeek
            # DeepSeek optimized for cost-efficiency
            return self._compress_context_for_efficiency(context)
        else:
            return context
    
    def _structure_context_for_claude(self, context: str) -> str:
        """Structure context optimally for Claude models."""
        # Add clear section headers and organization
        structured = f"""# Collaboration Context

## Primary Context
{context}

## Instructions
Please use this context to provide the most helpful and accurate response possible.
"""
        return structured
    
    def _compress_context_for_efficiency(self, context: str) -> str:
        """Compress context for cost-efficient models."""
        # Remove redundant information and compress for token efficiency
        lines = context.split('\n')
        compressed_lines = []
        
        for line in lines:
            if line.strip() and not line.startswith('#'):
                # Keep essential information, remove verbose descriptions
                if len(line) > 200:
                    compressed_lines.append(line[:200] + "...")
                else:
                    compressed_lines.append(line)
            elif line.startswith('#'):
                # Keep headers for structure
                compressed_lines.append(line)
        
        return '\n'.join(compressed_lines)
    
    async def get_context_statistics(self) -> Dict[str, int]:
        """Get context engine performance statistics."""
        return {
            "cache_entries": len(self.context_cache),
            "max_context_tokens": self.max_context_tokens,
            "template_types": len(self.context_templates)
        }
    
    async def clear_context_cache(self) -> None:
        """Clear the context cache."""
        self.context_cache.clear()
        logger.info("Context cache cleared")