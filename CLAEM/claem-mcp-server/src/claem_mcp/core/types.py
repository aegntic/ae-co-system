"""
Core type definitions for CLAEM MCP server.

Defines the fundamental data structures for revolutionary AI collaboration
with human oversight, knowledge evolution, and intelligent orchestration.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, validator

# === Enums ===

class TaskType(str, Enum):
    """Types of collaboration tasks that determine optimal AI pattern selection."""
    
    CEO_BOARD_DECISION = "ceo_board_decision"
    GEMINI_COLLABORATION = "gemini_collaboration" 
    MULTI_MODEL_SYNTHESIS = "multi_model_synthesis"
    SUPERVISED_EXCHANGE = "supervised_exchange"
    KNOWLEDGE_ANALYSIS = "knowledge_analysis"
    CONTEXT_SYNTHESIS = "context_synthesis"
    PATTERN_LEARNING = "pattern_learning"
    COST_OPTIMIZATION = "cost_optimization"


class CollaborationStrategy(str, Enum):
    """AI collaboration strategies with different orchestration patterns."""
    
    DEEPSEEK_R1_STRATEGY = "deepseek_r1"          # 95% cost reduction
    GEMINI_PRO_STRATEGY = "gemini_pro"            # 1M token context
    CEO_BOARD_STRATEGY = "ceo_board"              # Multi-model synthesis  
    SUPERVISED_EXCHANGE_STRATEGY = "supervised"    # Human approval gates
    HYBRID_STRATEGY = "hybrid"                    # Intelligent combination
    LOCAL_STRATEGY = "local"                      # Privacy-first local models


class MessageSource(str, Enum):
    """Sources of messages in collaboration sessions."""
    
    HUMAN = "human"
    CLAUDE = "claude"
    GEMINI = "gemini"
    DEEPSEEK = "deepseek"
    GPT = "gpt"
    LLAMA = "llama"
    SYSTEM = "system"


class ApprovalStatus(str, Enum):
    """Human approval states for AI interactions."""
    
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    DELEGATED = "delegated"
    TIMEOUT = "timeout"


class SessionStatus(str, Enum):
    """States of collaboration sessions."""
    
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    TERMINATED = "terminated"
    ERROR = "error"
# === Core Data Models ===

class ConversationMessage(BaseModel):
    """Individual message in AI collaboration conversations."""
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: MessageSource
    content: str
    context: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    approved: bool = False
    approval_metadata: Optional[Dict[str, Any]] = None
    
    @validator('content')
    def content_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Message content cannot be empty')
        return v


class KnowledgeNode(BaseModel):
    """Node in the evolving knowledge graph."""
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    type: str  # concept, pattern, decision, artifact, etc.
    name: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    connections: List[str] = Field(default_factory=list)  # Connected node IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)
    source_sessions: List[str] = Field(default_factory=list)


class KnowledgeGraph(BaseModel):
    """Evolving knowledge graph with temporal intelligence."""
    
    nodes: Dict[str, KnowledgeNode] = Field(default_factory=dict)
    edges: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def add_node(self, node: KnowledgeNode) -> None:
        """Add a node to the knowledge graph."""
        self.nodes[node.id] = node
        self.updated_at = datetime.utcnow()
    
    def add_edge(self, source_id: str, target_id: str, 
                 relationship: str, weight: float = 1.0) -> None:
        """Add an edge between knowledge nodes."""
        edge = {
            "source": source_id,
            "target": target_id,
            "relationship": relationship,
            "weight": weight,
            "created_at": datetime.utcnow().isoformat()
        }
        self.edges.append(edge)
        self.updated_at = datetime.utcnow()
class CollaborationRequest(BaseModel):
    """Request for AI collaboration with intelligent pattern selection."""
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    session_id: Optional[str] = None
    content: str
    context: Optional[str] = None
    task_type: Optional[TaskType] = None
    preferred_strategy: Optional[CollaborationStrategy] = None
    max_tokens: Optional[int] = None
    require_approval: bool = True
    models: Optional[List[str]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('content')
    def content_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Collaboration content cannot be empty')
        return v


class CollaborationResponse(BaseModel):
    """Response from AI collaboration with complete metadata."""
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    request_id: str
    session_id: str
    strategy_used: CollaborationStrategy
    models_used: List[str]
    content: str
    reasoning: Optional[str] = None
    confidence_score: float = Field(ge=0.0, le=1.0)
    cost_estimate: Optional[float] = None
    processing_time: Optional[float] = None
    approval_required: bool
    approval_status: ApprovalStatus = ApprovalStatus.PENDING
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    knowledge_updates: List[str] = Field(default_factory=list)  # Knowledge node IDs


class HumanApprovalRequest(BaseModel):
    """Request for human approval of AI interactions."""
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    collaboration_response_id: str
    session_id: str
    content: str
    ai_models_involved: List[str]
    risk_assessment: Dict[str, Any] = Field(default_factory=dict)
    recommendation: str
    timeout_seconds: int = 300  # 5 minutes default
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def is_expired(self) -> bool:
        """Check if approval request has expired."""
        elapsed = (datetime.utcnow() - self.created_at).total_seconds()
        return elapsed > self.timeout_seconds


class ApprovalResult(BaseModel):
    """Result of human approval decision."""
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    approval_request_id: str
    status: ApprovalStatus
    human_feedback: Optional[str] = None
    modifications: Optional[str] = None  # Human modifications to AI response
    reasoning: Optional[str] = None
    approved_by: Optional[str] = None
    decided_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SessionLimits(BaseModel):
    """Limits and constraints for collaboration sessions."""
    
    max_exchanges: int = 50
    max_tokens_per_request: int = 1000000  # 1M token support
    max_session_duration_hours: int = 24
    require_approval_threshold: float = 0.5  # Risk threshold requiring approval
    cost_limit_usd: Optional[float] = None
    models_allowed: Optional[List[str]] = None


class SessionState(BaseModel):
    """Complete state of a collaboration session."""
    
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: SessionStatus = SessionStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    messages: List[ConversationMessage] = Field(default_factory=list)
    knowledge_graph: KnowledgeGraph = Field(default_factory=KnowledgeGraph)
    limits: SessionLimits = Field(default_factory=SessionLimits)
    
    # Session statistics
    total_exchanges: int = 0
    total_cost: float = 0.0
    total_tokens_used: int = 0
    approval_requests: List[str] = Field(default_factory=list)  # Approval IDs
    
    # Learning and patterns
    learned_patterns: List[Dict[str, Any]] = Field(default_factory=list)
    user_preferences: Dict[str, Any] = Field(default_factory=dict)
    
    def add_message(self, message: ConversationMessage) -> None:
        """Add a message to the session."""
        self.messages.append(message)
        self.total_exchanges += 1
        self.updated_at = datetime.utcnow()
    
    def is_expired(self) -> bool:
        """Check if session has exceeded time limits."""
        elapsed_hours = (datetime.utcnow() - self.created_at).total_seconds() / 3600
        return elapsed_hours > self.limits.max_session_duration_hours
    
    def can_continue(self) -> bool:
        """Check if session can accept more exchanges."""
        return (
            self.status == SessionStatus.ACTIVE and
            not self.is_expired() and
            self.total_exchanges < self.limits.max_exchanges
        )


class ModelConfiguration(BaseModel):
    """Configuration for AI model providers and capabilities."""
    
    provider: str  # openai, anthropic, google, groq, deepseek, ollama
    model_name: str
    max_tokens: int
    context_window: int
    cost_per_1k_tokens: float
    reasoning_capable: bool = False
    thinking_tokens_support: bool = False
    local_deployment: bool = False
    privacy_rating: int = Field(ge=1, le=5)  # 1=cloud only, 5=fully local
    
    @property
    def full_model_name(self) -> str:
        """Get provider:model format for routing."""
        return f"{self.provider}:{self.model_name}"


class CollaborationFactors(BaseModel):
    """Analysis factors for intelligent collaboration routing."""
    
    requires_reasoning: bool = False
    requires_massive_context: bool = False
    requires_multi_perspective: bool = False
    requires_supervision: bool = True
    cost_sensitive: bool = True
    privacy_critical: bool = False
    time_sensitive: bool = False
    complexity_score: float = Field(ge=0.0, le=1.0)
    estimated_tokens: int = 0
    
    @classmethod
    def analyze_request(cls, request: CollaborationRequest) -> "CollaborationFactors":
        """Analyze a collaboration request to determine optimal routing."""
        content_length = len(request.content)
        context_length = len(request.context or "")
        total_length = content_length + context_length
        
        return cls(
            requires_reasoning=any(keyword in request.content.lower() 
                                 for keyword in ["analyze", "decide", "compare", "evaluate"]),
            requires_massive_context=total_length > 50000,
            requires_multi_perspective=any(keyword in request.content.lower()
                                         for keyword in ["perspectives", "opinions", "alternatives"]),
            requires_supervision=request.require_approval,
            cost_sensitive=request.metadata.get("cost_sensitive", True),
            privacy_critical=request.metadata.get("privacy_critical", False),
            time_sensitive=request.metadata.get("time_sensitive", False),
            complexity_score=min(1.0, total_length / 100000),
            estimated_tokens=total_length // 4  # Rough token estimation
        )


# === Factory Functions ===

def create_session() -> SessionState:
    """Create a new collaboration session with default settings."""
    return SessionState()


def create_knowledge_node(
    node_type: str,
    name: str, 
    content: str,
    session_id: Optional[str] = None
) -> KnowledgeNode:
    """Create a new knowledge graph node."""
    node = KnowledgeNode(
        type=node_type,
        name=name,
        content=content
    )
    if session_id:
        node.source_sessions = [session_id]
    return node


# === Default Model Configurations ===

DEFAULT_MODELS = {
    "deepseek:r1.1": ModelConfiguration(
        provider="deepseek",
        model_name="r1.1", 
        max_tokens=8192,
        context_window=128000,
        cost_per_1k_tokens=0.0027,  # 95% cost reduction
        reasoning_capable=True,
        privacy_rating=3
    ),
    "claude:claude-4-sonnet": ModelConfiguration(
        provider="anthropic",
        model_name="claude-4-sonnet",
        max_tokens=8192,
        context_window=200000,
        cost_per_1k_tokens=0.015,
        thinking_tokens_support=True,
        privacy_rating=3
    ),
    "gemini:gemini-2.5-pro": ModelConfiguration(
        provider="google",
        model_name="gemini-2.5-pro",
        max_tokens=8192,
        context_window=1000000,  # 1M token context
        cost_per_1k_tokens=0.0125,
        privacy_rating=2
    ),
    "openai:o3": ModelConfiguration(
        provider="openai",
        model_name="o3",
        max_tokens=8192,
        context_window=128000,
        cost_per_1k_tokens=0.06,
        reasoning_capable=True,
        privacy_rating=2
    )
}