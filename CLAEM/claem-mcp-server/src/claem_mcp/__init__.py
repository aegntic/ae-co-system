"""
CLAEM: Claude-AI Enhanced MCP

Revolutionary unified AI collaboration server with human oversight.
Combines supervised AI-to-AI communication, multi-model orchestration,
knowledge preservation, and intelligent collaboration pattern routing.

Created by Mattae Cooper & '{ae}'aegntic.ai
Built for the future of AI-enhanced development
"""

__version__ = "1.0.0"
__author__ = "Mattae Cooper & '{ae}'aegntic.ai"
__email__ = "contact@aegntic.ai"
__description__ = "Revolutionary unified AI collaboration server with human oversight"

# Core exports
from .core.types import (
    CollaborationRequest,
    CollaborationResponse,
    CollaborationStrategy,
    TaskType,
    SessionState,
    KnowledgeGraph,
    HumanApprovalRequest,
    ApprovalResult,
)

from .core.collaboration_router import CollaborationRouter
from .core.knowledge_engine import KnowledgeEngine
from .core.context_engine import ContextEngine
from .core.approval_engine import ApprovalEngine

# Tool exports
from .tools.intelligent_collaborate import IntelligentCollaborateTool
from .tools.knowledge_evolve import KnowledgeEvolveTool
from .tools.context_synthesize import ContextSynthesizeTool
from .tools.human_review import HumanReviewTool
from .tools.export_insights import ExportInsightsTool

# Server exports
from .server import CLAEMServer
from .cli import main as cli_main

__all__ = [
    # Version info
    "__version__",
    "__author__",
    "__email__",
    "__description__",
    
    # Core types
    "CollaborationRequest",
    "CollaborationResponse", 
    "CollaborationStrategy",
    "TaskType",
    "SessionState",
    "KnowledgeGraph",
    "HumanApprovalRequest",
    "ApprovalResult",
    
    # Core engines
    "CollaborationRouter",
    "KnowledgeEngine",
    "ContextEngine",
    "ApprovalEngine",
    
    # Revolutionary MCP tools
    "IntelligentCollaborateTool",
    "KnowledgeEvolveTool",
    "ContextSynthesizeTool", 
    "HumanReviewTool",
    "ExportInsightsTool",
    
    # Server components
    "CLAEMServer",
    "cli_main",
]