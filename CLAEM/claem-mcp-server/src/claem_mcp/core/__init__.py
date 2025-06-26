"""
CLAEM Core: Revolutionary AI collaboration engine components.

Provides the foundational engines for intelligent collaboration routing,
knowledge evolution, and human oversight systems.
"""

from .types import (
    CollaborationRequest,
    CollaborationResponse,
    CollaborationStrategy,
    TaskType,
    SessionState,
    KnowledgeGraph,
    HumanApprovalRequest,
    ApprovalResult,
    MessageSource,
    ApprovalStatus,
    SessionStatus,
    create_session,
    create_knowledge_node,
)

from .collaboration_router import CollaborationRouter
from .knowledge_engine import KnowledgeEngine

__all__ = [
    # Core types
    "CollaborationRequest",
    "CollaborationResponse", 
    "CollaborationStrategy",
    "TaskType",
    "SessionState",
    "KnowledgeGraph",
    "HumanApprovalRequest",
    "ApprovalResult",
    "MessageSource",
    "ApprovalStatus", 
    "SessionStatus",
    
    # Factory functions
    "create_session",
    "create_knowledge_node",
    
    # Core engines
    "CollaborationRouter",
    "KnowledgeEngine",
]