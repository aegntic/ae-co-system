"""
Approval Engine: Human oversight and approval workflows for AI interactions.

Manages human approval gates, risk assessment, and supervised AI-to-AI
communication to ensure safe and controlled AI collaboration.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any
from enum import Enum

from .types import (
    HumanApprovalRequest,
    ApprovalResult,
    ApprovalStatus,
    CollaborationRequest,
    CollaborationResponse,
    SessionState,
    CollaborationStrategy
)

logger = logging.getLogger(__name__)


class RiskLevel(str, Enum):
    """Risk levels for AI collaboration requests."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ApprovalEngine:
    """
    Human oversight engine for supervised AI collaboration.
    
    Provides risk assessment, approval workflows, and human decision
    gates to ensure safe and controlled AI-to-AI interactions.
    """
    
    def __init__(self):
        self.pending_approvals: Dict[str, HumanApprovalRequest] = {}
        self.approval_history: List[ApprovalResult] = []
        self.risk_patterns: Dict[str, float] = self._load_risk_patterns()
        self.approval_callbacks: Dict[str, Callable] = {}
        
    def _load_risk_patterns(self) -> Dict[str, float]:
        """Load risk assessment patterns and thresholds."""
        return {
            # Content-based risk patterns
            "code_execution": 0.8,
            "system_commands": 0.9,
            "file_operations": 0.7,
            "network_requests": 0.6,
            "data_modification": 0.7,
            "api_calls": 0.5,
            
            # Model interaction risks
            "multi_model_synthesis": 0.4,
            "unsupervised_exchange": 0.8,
            "large_context": 0.3,
            "cost_intensive": 0.5,
            
            # Session-based risks
            "long_conversation": 0.4,
            "repeated_requests": 0.3,
            "escalating_complexity": 0.6
        }
    
    async def assess_collaboration_risk(
        self,
        request: CollaborationRequest,
        response: CollaborationResponse,
        session_state: SessionState
    ) -> Dict[str, Any]:
        """
        Assess the risk level of a collaboration request/response pair.
        
        Returns comprehensive risk assessment with scores and recommendations.
        """
        risk_factors = []
        total_risk_score = 0.0
        
        # Content-based risk assessment
        content_risks = self._assess_content_risks(request.content, response.content)
        risk_factors.extend(content_risks)
        
        # Strategy-based risk assessment
        strategy_risks = self._assess_strategy_risks(response.strategy_used, response.models_used)
        risk_factors.extend(strategy_risks)
        
        # Session-based risk assessment
        session_risks = self._assess_session_risks(session_state)
        risk_factors.extend(session_risks)
        
        # Calculate total risk score
        total_risk_score = sum(factor["score"] for factor in risk_factors)
        total_risk_score = min(1.0, total_risk_score)  # Cap at 1.0
        
        # Determine risk level
        risk_level = self._calculate_risk_level(total_risk_score)
        
        return {
            "risk_score": total_risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "requires_approval": self._requires_approval(risk_level, request.require_approval),
            "recommendation": self._generate_risk_recommendation(risk_level, risk_factors),
            "auto_approval_eligible": self._is_auto_approval_eligible(risk_level, risk_factors)
        }
    
    def _assess_content_risks(self, request_content: str, response_content: str) -> List[Dict]:
        """Assess risks based on content analysis."""
        risks = []
        combined_content = f"{request_content} {response_content}".lower()
        
        # Check for high-risk content patterns
        risk_keywords = {
            "code_execution": ["execute", "run", "eval", "exec", "subprocess"],
            "system_commands": ["rm ", "del ", "format", "sudo", "admin"],
            "file_operations": ["delete", "modify", "overwrite", "chmod"],
            "network_requests": ["curl", "wget", "request", "download", "upload"],
            "data_modification": ["database", "sql", "update", "insert", "drop"]
        }
        
        for risk_type, keywords in risk_keywords.items():
            if any(keyword in combined_content for keyword in keywords):
                score = self.risk_patterns.get(risk_type, 0.5)
                risks.append({
                    "type": risk_type,
                    "score": score,
                    "description": f"Content contains {risk_type.replace('_', ' ')} patterns",
                    "keywords_found": [kw for kw in keywords if kw in combined_content]
                })
        
        return risks
    
    def _assess_strategy_risks(self, strategy: CollaborationStrategy, models: List[str]) -> List[Dict]:
        """Assess risks based on collaboration strategy and models."""
        risks = []
        
        # Strategy-specific risks
        strategy_risk_map = {
            CollaborationStrategy.SUPERVISED_EXCHANGE_STRATEGY: 0.2,  # Lower risk due to supervision
            CollaborationStrategy.CEO_BOARD_STRATEGY: 0.4,  # Medium risk for multi-model
            CollaborationStrategy.GEMINI_PRO_STRATEGY: 0.3,  # Medium risk for large context
            CollaborationStrategy.DEEPSEEK_R1_STRATEGY: 0.2,  # Lower risk, cost-efficient
            CollaborationStrategy.HYBRID_STRATEGY: 0.5,  # Higher risk due to complexity
            CollaborationStrategy.LOCAL_STRATEGY: 0.1   # Lowest risk, local processing
        }
        
        strategy_risk = strategy_risk_map.get(strategy, 0.4)
        risks.append({
            "type": "strategy_risk",
            "score": strategy_risk,
            "description": f"Strategy {strategy.value} has inherent risk level",
            "strategy": strategy.value
        })
        
        # Multi-model risks
        if len(models) > 1:
            risks.append({
                "type": "multi_model_risk",
                "score": 0.3,
                "description": f"Using {len(models)} models increases complexity",
                "models": models
            })
        
        return risks
    
    def _assess_session_risks(self, session_state: SessionState) -> List[Dict]:
        """Assess risks based on session characteristics."""
        risks = []
        
        # Long conversation risk
        if len(session_state.messages) > 20:
            risks.append({
                "type": "long_conversation",
                "score": min(0.6, len(session_state.messages) / 50),
                "description": f"Long conversation ({len(session_state.messages)} messages)",
                "message_count": len(session_state.messages)
            })
        
        # High cost risk
        if session_state.total_cost > 1.0:  # $1 threshold
            risks.append({
                "type": "high_cost",
                "score": min(0.5, session_state.total_cost / 10),
                "description": f"High session cost (${session_state.total_cost:.2f})",
                "total_cost": session_state.total_cost
            })
        
        # Rapid exchanges risk
        if len(session_state.messages) > 5:
            recent_messages = session_state.messages[-5:]
            time_span = (recent_messages[-1].timestamp - recent_messages[0].timestamp).total_seconds()
            if time_span < 300:  # 5 minutes
                risks.append({
                    "type": "rapid_exchanges",
                    "score": 0.4,
                    "description": "Rapid succession of exchanges detected",
                    "time_span_seconds": time_span
                })
        
        return risks
    
    def _calculate_risk_level(self, risk_score: float) -> RiskLevel:
        """Calculate risk level from total risk score."""
        if risk_score >= 0.8:
            return RiskLevel.CRITICAL
        elif risk_score >= 0.6:
            return RiskLevel.HIGH
        elif risk_score >= 0.3:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _requires_approval(self, risk_level: RiskLevel, user_requested: bool) -> bool:
        """Determine if approval is required based on risk and user settings."""
        if user_requested:
            return True
        
        # Auto-require approval for high-risk interactions
        return risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    
    def _generate_risk_recommendation(self, risk_level: RiskLevel, risk_factors: List[Dict]) -> str:
        """Generate human-readable risk recommendation."""
        if risk_level == RiskLevel.CRITICAL:
            return "🚨 CRITICAL: This interaction requires immediate human review before proceeding."
        elif risk_level == RiskLevel.HIGH:
            return "⚠️ HIGH RISK: Recommend human approval before allowing this interaction."
        elif risk_level == RiskLevel.MEDIUM:
            return "⚡ MEDIUM RISK: Consider human oversight for this interaction."
        else:
            return "✅ LOW RISK: Safe to proceed with standard monitoring."
    
    def _is_auto_approval_eligible(self, risk_level: RiskLevel, risk_factors: List[Dict]) -> bool:
        """Determine if interaction is eligible for automatic approval."""
        if risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            return False
        
        # Check for specific disqualifying factors
        disqualifying_types = ["code_execution", "system_commands", "data_modification"]
        for factor in risk_factors:
            if factor["type"] in disqualifying_types:
                return False
        
        return True
    
    async def request_human_approval(
        self,
        collaboration_response: CollaborationResponse,
        session_state: SessionState,
        risk_assessment: Dict[str, Any],
        timeout_seconds: int = 300
    ) -> HumanApprovalRequest:
        """
        Create a human approval request for AI collaboration.
        
        Returns approval request that can be presented to human operators.
        """
        approval_request = HumanApprovalRequest(
            collaboration_response_id=collaboration_response.id,
            session_id=session_state.id,
            content=collaboration_response.content,
            ai_models_involved=collaboration_response.models_used,
            risk_assessment=risk_assessment,
            recommendation=risk_assessment["recommendation"],
            timeout_seconds=timeout_seconds
        )
        
        # Store pending approval
        self.pending_approvals[approval_request.id] = approval_request
        
        logger.info(f"Human approval requested for {collaboration_response.id}")
        
        return approval_request
    
    async def process_approval_decision(
        self,
        approval_request_id: str,
        status: ApprovalStatus,
        human_feedback: Optional[str] = None,
        modifications: Optional[str] = None,
        approved_by: Optional[str] = None
    ) -> ApprovalResult:
        """
        Process a human approval decision.
        
        Records the decision and updates the collaboration flow accordingly.
        """
        approval_request = self.pending_approvals.get(approval_request_id)
        if not approval_request:
            raise ValueError(f"Approval request {approval_request_id} not found")
        
        # Create approval result
        result = ApprovalResult(
            approval_request_id=approval_request_id,
            status=status,
            human_feedback=human_feedback,
            modifications=modifications,
            approved_by=approved_by
        )
        
        # Store in history
        self.approval_history.append(result)
        
        # Remove from pending
        del self.pending_approvals[approval_request_id]
        
        # Log decision
        logger.info(f"Approval decision: {status.value} for request {approval_request_id}")
        
        return result
    
    async def check_approval_timeouts(self) -> List[str]:
        """
        Check for expired approval requests and mark them as timeout.
        
        Returns list of timed-out approval request IDs.
        """
        timed_out = []
        current_time = datetime.utcnow()
        
        for request_id, approval_request in list(self.pending_approvals.items()):
            if approval_request.is_expired():
                # Process timeout
                await self.process_approval_decision(
                    request_id,
                    ApprovalStatus.TIMEOUT,
                    human_feedback="Approval request timed out"
                )
                timed_out.append(request_id)
        
        return timed_out
    
    async def get_pending_approvals(self) -> List[HumanApprovalRequest]:
        """Get all pending approval requests."""
        return list(self.pending_approvals.values())
    
    async def auto_approve_if_eligible(
        self,
        collaboration_response: CollaborationResponse,
        risk_assessment: Dict[str, Any]
    ) -> Optional[ApprovalResult]:
        """
        Automatically approve low-risk interactions if eligible.
        
        Returns approval result if auto-approved, None otherwise.
        """
        if not risk_assessment["auto_approval_eligible"]:
            return None
        
        # Create auto-approval result
        result = ApprovalResult(
            approval_request_id="auto_approval",
            status=ApprovalStatus.APPROVED,
            human_feedback="Automatically approved based on low risk assessment",
            approved_by="system_auto_approval"
        )
        
        self.approval_history.append(result)
        
        logger.info(f"Auto-approved collaboration {collaboration_response.id}")
        
        return result
    
    def register_approval_callback(self, callback_id: str, callback: Callable) -> None:
        """Register a callback for approval events."""
        self.approval_callbacks[callback_id] = callback
    
    async def _notify_approval_callbacks(self, event: str, data: Dict[str, Any]) -> None:
        """Notify registered callbacks of approval events."""
        for callback_id, callback in self.approval_callbacks.items():
            try:
                await callback(event, data)
            except Exception as e:
                logger.error(f"Approval callback {callback_id} failed: {e}")
    
    async def get_approval_statistics(self) -> Dict[str, Any]:
        """Get approval engine statistics and performance metrics."""
        total_approvals = len(self.approval_history)
        if total_approvals == 0:
            return {
                "total_approvals": 0,
                "pending_approvals": len(self.pending_approvals),
                "approval_rate": 0.0,
                "auto_approval_rate": 0.0,
                "average_decision_time": 0.0
            }
        
        approved_count = sum(1 for result in self.approval_history 
                           if result.status == ApprovalStatus.APPROVED)
        auto_approved_count = sum(1 for result in self.approval_history 
                                if result.approved_by == "system_auto_approval")
        
        return {
            "total_approvals": total_approvals,
            "pending_approvals": len(self.pending_approvals),
            "approval_rate": approved_count / total_approvals,
            "auto_approval_rate": auto_approved_count / total_approvals,
            "denied_count": sum(1 for result in self.approval_history 
                              if result.status == ApprovalStatus.DENIED),
            "timeout_count": sum(1 for result in self.approval_history 
                               if result.status == ApprovalStatus.TIMEOUT)
        }
    
    async def clear_approval_history(self, older_than_days: int = 30) -> int:
        """Clear old approval history entries."""
        cutoff_date = datetime.utcnow() - timedelta(days=older_than_days)
        
        initial_count = len(self.approval_history)
        self.approval_history = [
            result for result in self.approval_history
            if result.decided_at > cutoff_date
        ]
        
        cleared_count = initial_count - len(self.approval_history)
        logger.info(f"Cleared {cleared_count} old approval records")
        
        return cleared_count