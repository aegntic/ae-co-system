"""
Knowledge Engine: Evolving AI knowledge graphs and pattern learning.

Manages persistent knowledge graphs that evolve from AI collaborations,
learns patterns from interactions, and provides intelligent context synthesis.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple
from uuid import uuid4

import networkx as nx
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from .types import (
    CollaborationRequest,
    CollaborationResponse,
    KnowledgeNode,
    KnowledgeGraph,
    ConversationMessage,
    SessionState,
    create_knowledge_node
)

logger = logging.getLogger(__name__)


class KnowledgeEngine:
    """
    Evolving knowledge engine with temporal intelligence.
    
    Manages knowledge graphs that build understanding over time,
    learns from AI collaboration patterns, and provides intelligent
    context synthesis for enhanced collaboration.
    """
    
    def __init__(self, database_url: str = "sqlite+aiosqlite:///claem_knowledge.db"):
        self.database_url = database_url
        self.engine = create_async_engine(database_url, echo=False)
        self.knowledge_graphs: Dict[str, KnowledgeGraph] = {}
        self.global_graph = nx.DiGraph()  # NetworkX for advanced graph operations
        self.pattern_cache: Dict[str, List[Dict]] = {}
        
    async def initialize(self) -> None:
        """Initialize the knowledge engine and database schema."""
        # Create database tables if they don't exist
        await self._create_schema()
        
        # Load existing knowledge graphs
        await self._load_knowledge_graphs()
        
        logger.info("Knowledge engine initialized successfully")
    
    async def _create_schema(self) -> None:
        """Create database schema for knowledge persistence."""
        schema_sql = """
        CREATE TABLE IF NOT EXISTS knowledge_nodes (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            confidence_score REAL DEFAULT 1.0,
            source_sessions TEXT
        );
        
        CREATE TABLE IF NOT EXISTS knowledge_edges (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            relationship TEXT NOT NULL,
            weight REAL DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY (source_id) REFERENCES knowledge_nodes (id),
            FOREIGN KEY (target_id) REFERENCES knowledge_nodes (id)
        );
        
        CREATE TABLE IF NOT EXISTS knowledge_graphs (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            graph_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_nodes_type ON knowledge_nodes(type);
        CREATE INDEX IF NOT EXISTS idx_nodes_session ON knowledge_nodes(source_sessions);
        CREATE INDEX IF NOT EXISTS idx_edges_source ON knowledge_edges(source_id);
        CREATE INDEX IF NOT EXISTS idx_edges_target ON knowledge_edges(target_id);
        """
        
        async with self.engine.begin() as conn:
            for statement in schema_sql.split(';'):
                if statement.strip():
                    await conn.execute(text(statement.strip()))    
    async def process_collaboration(
        self,
        request: CollaborationRequest,
        response: CollaborationResponse,
        session_state: SessionState
    ) -> List[str]:
        """
        Process a collaboration to extract and store knowledge.
        
        Returns list of knowledge node IDs that were created or updated.
        """
        knowledge_node_ids = []
        
        # Extract concepts from request and response
        concepts = await self._extract_concepts(request.content, response.content)
        
        # Create knowledge nodes for new concepts
        for concept in concepts:
            node = await self._create_or_update_concept_node(
                concept, 
                session_state.id,
                request,
                response
            )
            knowledge_node_ids.append(node.id)
        
        # Extract patterns from the collaboration
        patterns = await self._extract_patterns(request, response, session_state)
        
        # Create pattern nodes
        for pattern in patterns:
            node = await self._create_pattern_node(pattern, session_state.id)
            knowledge_node_ids.append(node.id)
        
        # Update relationships between concepts
        await self._update_concept_relationships(concepts, session_state.id)
        
        # Update session knowledge graph
        await self._update_session_knowledge_graph(session_state, knowledge_node_ids)
        
        # Store knowledge persistently
        await self._persist_knowledge_updates(knowledge_node_ids)
        
        logger.info(f"Processed collaboration: created/updated {len(knowledge_node_ids)} knowledge nodes")
        
        return knowledge_node_ids
    
    async def _extract_concepts(self, request_content: str, response_content: str) -> List[Dict]:
        """Extract key concepts from collaboration content."""
        # This is a simplified implementation - in practice, would use NLP/LLM for extraction
        concepts = []
        
        # Extract code-related concepts
        if "function" in request_content.lower() or "class" in request_content.lower():
            concepts.append({
                "name": "Code Implementation",
                "type": "concept",
                "content": f"Request: {request_content[:200]}...",
                "confidence": 0.8
            })
        
        # Extract decision-related concepts
        if any(word in request_content.lower() for word in ["decide", "choose", "select", "recommend"]):
            concepts.append({
                "name": "Decision Making",
                "type": "decision_pattern",
                "content": f"Decision request: {request_content[:200]}...",
                "confidence": 0.9
            })
        
        # Extract analysis concepts
        if any(word in request_content.lower() for word in ["analyze", "review", "evaluate"]):
            concepts.append({
                "name": "Analysis Request",
                "type": "analysis_pattern",
                "content": f"Analysis: {response_content[:200]}...",
                "confidence": 0.85
            })
        
        return concepts    
    async def _extract_patterns(
        self, 
        request: CollaborationRequest,
        response: CollaborationResponse,
        session_state: SessionState
    ) -> List[Dict]:
        """Extract collaboration patterns for learning and optimization."""
        patterns = []
        
        # Strategy effectiveness pattern
        patterns.append({
            "name": f"Strategy Effectiveness: {response.strategy_used.value}",
            "type": "strategy_pattern",
            "content": {
                "strategy": response.strategy_used.value,
                "models_used": response.models_used,
                "confidence_score": response.confidence_score,
                "processing_time": response.processing_time,
                "cost_estimate": response.cost_estimate,
                "request_characteristics": {
                    "content_length": len(request.content),
                    "context_length": len(request.context or ""),
                    "task_type": request.task_type.value if request.task_type else None
                }
            },
            "confidence": response.confidence_score
        })
        
        # User preference pattern
        if request.preferred_strategy:
            patterns.append({
                "name": "User Strategy Preference",
                "type": "user_preference",
                "content": {
                    "preferred_strategy": request.preferred_strategy.value,
                    "task_context": request.content[:100] + "..." if len(request.content) > 100 else request.content,
                    "session_id": session_state.id
                },
                "confidence": 0.7
            })
        
        # Approval pattern
        if response.approval_required:
            patterns.append({
                "name": "Approval Pattern",
                "type": "approval_pattern", 
                "content": {
                    "approval_status": response.approval_status.value,
                    "strategy": response.strategy_used.value,
                    "content_type": self._classify_content_type(request.content),
                    "session_id": session_state.id
                },
                "confidence": 0.8
            })
        
        return patterns
    
    def _classify_content_type(self, content: str) -> str:
        """Classify the type of collaboration content."""
        content_lower = content.lower()
        
        if any(word in content_lower for word in ["code", "function", "class", "programming"]):
            return "code_related"
        elif any(word in content_lower for word in ["decide", "choose", "recommend"]):
            return "decision_making"
        elif any(word in content_lower for word in ["analyze", "review", "evaluate"]):
            return "analysis"
        elif any(word in content_lower for word in ["explain", "describe", "how"]):
            return "explanation"
        else:
            return "general"
    
    async def _create_or_update_concept_node(
        self,
        concept: Dict,
        session_id: str,
        request: CollaborationRequest,
        response: CollaborationResponse
    ) -> KnowledgeNode:
        """Create or update a concept node in the knowledge graph."""
        
        # Check if similar concept already exists
        existing_node = await self._find_similar_concept(concept["name"], concept["type"])
        
        if existing_node:
            # Update existing node
            existing_node.content = f"{existing_node.content}\n\nUpdate: {concept['content']}"
            existing_node.updated_at = datetime.utcnow()
            existing_node.confidence_score = (existing_node.confidence_score + concept["confidence"]) / 2
            
            if session_id not in existing_node.source_sessions:
                existing_node.source_sessions.append(session_id)
            
            return existing_node
        else:
            # Create new node
            node = create_knowledge_node(
                node_type=concept["type"],
                name=concept["name"],
                content=concept["content"],
                session_id=session_id
            )
            node.confidence_score = concept["confidence"]
            node.metadata.update({
                "request_id": request.id,
                "response_id": response.id,
                "strategy_used": response.strategy_used.value,
                "models_used": response.models_used
            })
            
            return node    
    async def search_knowledge(
        self, 
        query: str,
        node_types: Optional[List[str]] = None,
        session_filter: Optional[str] = None,
        limit: int = 10
    ) -> List[KnowledgeNode]:
        """Search knowledge graph for relevant nodes."""
        matching_nodes = []
        
        # Search through all loaded knowledge graphs
        for graph in self.knowledge_graphs.values():
            for node in graph.nodes.values():
                # Type filter
                if node_types and node.type not in node_types:
                    continue
                
                # Session filter
                if session_filter and session_filter not in node.source_sessions:
                    continue
                
                # Content search (simple text matching - could be enhanced with embeddings)
                if (query.lower() in node.name.lower() or 
                    query.lower() in node.content.lower()):
                    matching_nodes.append(node)
        
        # Sort by confidence score and recency
        matching_nodes.sort(
            key=lambda n: (n.confidence_score, n.updated_at),
            reverse=True
        )
        
        return matching_nodes[:limit]
    
    async def get_related_concepts(
        self, 
        node_id: str,
        max_depth: int = 2
    ) -> List[KnowledgeNode]:
        """Get concepts related to a specific knowledge node."""
        related_nodes = []
        
        # Use NetworkX for graph traversal
        if node_id in self.global_graph:
            # Get nodes within max_depth
            subgraph_nodes = nx.single_source_shortest_path_length(
                self.global_graph, 
                node_id, 
                cutoff=max_depth
            )
            
            # Find corresponding knowledge nodes
            for graph in self.knowledge_graphs.values():
                for node in graph.nodes.values():
                    if node.id in subgraph_nodes and node.id != node_id:
                        related_nodes.append(node)
        
        return related_nodes
    
    async def synthesize_context_for_request(
        self, 
        request: CollaborationRequest,
        max_tokens: int = 50000
    ) -> str:
        """Synthesize relevant context from knowledge graph for a collaboration request."""
        # Search for relevant knowledge
        relevant_nodes = await self.search_knowledge(
            request.content,
            limit=20
        )
        
        # Build context synthesis
        context_parts = []
        current_tokens = 0
        
        # Add most relevant concepts first
        for node in relevant_nodes:
            node_context = f"## {node.name} ({node.type})\n{node.content}\n\n"
            node_tokens = len(node_context) // 4  # Rough token estimation
            
            if current_tokens + node_tokens > max_tokens:
                break
            
            context_parts.append(node_context)
            current_tokens += node_tokens
        
        # Add patterns if space allows
        if current_tokens < max_tokens * 0.8:  # Use 80% for concepts, 20% for patterns
            pattern_nodes = await self.search_knowledge(
                request.content,
                node_types=["strategy_pattern", "approval_pattern", "user_preference"],
                limit=5
            )
            
            for node in pattern_nodes:
                pattern_context = f"## Pattern: {node.name}\n{json.dumps(node.content, indent=2)}\n\n"
                pattern_tokens = len(pattern_context) // 4
                
                if current_tokens + pattern_tokens > max_tokens:
                    break
                
                context_parts.append(pattern_context)
                current_tokens += pattern_tokens
        
        if context_parts:
            return f"# Relevant Knowledge Context\n\n{''.join(context_parts)}"
        else:
            return ""    
    async def _find_similar_concept(self, name: str, concept_type: str) -> Optional[KnowledgeNode]:
        """Find similar existing concept to avoid duplication."""
        for graph in self.knowledge_graphs.values():
            for node in graph.nodes.values():
                if (node.type == concept_type and 
                    self._calculate_similarity(node.name, name) > 0.8):
                    return node
        return None
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two text strings."""
        # Simple similarity calculation - could be enhanced with embeddings
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    async def _create_pattern_node(self, pattern: Dict, session_id: str) -> KnowledgeNode:
        """Create a pattern node for learning and optimization."""
        node = create_knowledge_node(
            node_type=pattern["type"],
            name=pattern["name"],
            content=json.dumps(pattern["content"], indent=2),
            session_id=session_id
        )
        node.confidence_score = pattern["confidence"]
        return node
    
    async def _update_concept_relationships(self, concepts: List[Dict], session_id: str) -> None:
        """Update relationships between concepts in the knowledge graph."""
        # Create relationships between concepts that appeared in the same collaboration
        for i, concept1 in enumerate(concepts):
            for concept2 in concepts[i+1:]:
                # Add edge to global graph
                self.global_graph.add_edge(
                    concept1["name"], 
                    concept2["name"],
                    relationship="co_occurred",
                    weight=1.0,
                    session_id=session_id
                )
    
    async def _update_session_knowledge_graph(
        self, 
        session_state: SessionState,
        knowledge_node_ids: List[str]
    ) -> None:
        """Update the session's knowledge graph with new nodes."""
        if session_state.id not in self.knowledge_graphs:
            self.knowledge_graphs[session_state.id] = KnowledgeGraph()
        
        # The actual nodes would be added by the calling methods
        # This is a placeholder for session-specific graph updates
        session_state.knowledge_graph.updated_at = datetime.utcnow()
    
    async def _persist_knowledge_updates(self, knowledge_node_ids: List[str]) -> None:
        """Persist knowledge updates to database."""
        # This would implement actual database persistence
        # For now, it's a placeholder
        logger.debug(f"Persisting {len(knowledge_node_ids)} knowledge updates")
    
    async def _load_knowledge_graphs(self) -> None:
        """Load existing knowledge graphs from database."""
        # This would implement loading from database
        # For now, it's a placeholder
        logger.debug("Loading knowledge graphs from database")
    
    async def get_knowledge_statistics(self) -> Dict[str, int]:
        """Get statistics about the knowledge graph."""
        total_nodes = sum(len(graph.nodes) for graph in self.knowledge_graphs.values())
        total_edges = sum(len(graph.edges) for graph in self.knowledge_graphs.values())
        
        return {
            "total_sessions": len(self.knowledge_graphs),
            "total_nodes": total_nodes,
            "total_edges": total_edges,
            "global_graph_nodes": self.global_graph.number_of_nodes(),
            "global_graph_edges": self.global_graph.number_of_edges()
        }
    
    async def export_knowledge_graph(self, session_id: Optional[str] = None) -> Dict:
        """Export knowledge graph for analysis or backup."""
        if session_id and session_id in self.knowledge_graphs:
            graph = self.knowledge_graphs[session_id]
            return {
                "session_id": session_id,
                "nodes": {nid: node.dict() for nid, node in graph.nodes.items()},
                "edges": graph.edges,
                "metadata": graph.metadata
            }
        else:
            # Export all graphs
            return {
                "graphs": {
                    sid: {
                        "nodes": {nid: node.dict() for nid, node in graph.nodes.items()},
                        "edges": graph.edges,
                        "metadata": graph.metadata
                    }
                    for sid, graph in self.knowledge_graphs.items()
                },
                "global_graph": {
                    "nodes": list(self.global_graph.nodes()),
                    "edges": list(self.global_graph.edges(data=True))
                }
            }