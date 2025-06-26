"""
Collaboration Router: Intelligent AI collaboration pattern selection.

Routes collaboration requests to optimal AI patterns based on task analysis,
context requirements, cost constraints, and learned preferences.
"""

import asyncio
import logging
from typing import Dict, List, Optional

from .types import (
    CollaborationRequest,
    CollaborationResponse,
    CollaborationStrategy,
    CollaborationFactors,
    TaskType,
    DEFAULT_MODELS,
    ModelConfiguration,
)
logger = logging.getLogger(__name__)


class CollaborationRouter:
    """
    Intelligent router for AI collaboration patterns.
    
    Analyzes collaboration requests and selects optimal strategies based on:
    - Task complexity and type
    - Context size and requirements  
    - Cost constraints and optimization
    - Privacy and security requirements
    - Learned user preferences and patterns
    """
    
    def __init__(self):
        self.available_models = DEFAULT_MODELS.copy()
        self.strategy_patterns = self._initialize_strategy_patterns()
        self.learning_data: Dict[str, List[float]] = {}  # Strategy performance tracking
        
    def _initialize_strategy_patterns(self) -> Dict[CollaborationStrategy, Dict]:
        """Initialize strategy patterns with their characteristics."""
        return {
            CollaborationStrategy.DEEPSEEK_R1_STRATEGY: {
                "optimal_for": [TaskType.KNOWLEDGE_ANALYSIS, TaskType.PATTERN_LEARNING],
                "cost_multiplier": 0.05,  # 95% cost reduction
                "reasoning_strength": 0.9,
                "context_limit": 128000,
                "privacy_rating": 3
            },
            CollaborationStrategy.GEMINI_PRO_STRATEGY: {
                "optimal_for": [TaskType.CONTEXT_SYNTHESIS, TaskType.KNOWLEDGE_ANALYSIS],
                "cost_multiplier": 0.7,
                "context_limit": 1000000,  # 1M token support
                "reasoning_strength": 0.8,
                "privacy_rating": 2
            },
            CollaborationStrategy.CEO_BOARD_STRATEGY: {
                "optimal_for": [TaskType.CEO_BOARD_DECISION, TaskType.MULTI_MODEL_SYNTHESIS],
                "cost_multiplier": 3.0,  # More expensive but higher quality
                "reasoning_strength": 0.95,
                "context_limit": 200000,
                "privacy_rating": 2
            },
            CollaborationStrategy.SUPERVISED_EXCHANGE_STRATEGY: {
                "optimal_for": [TaskType.SUPERVISED_EXCHANGE, TaskType.GEMINI_COLLABORATION],
                "cost_multiplier": 1.0,
                "reasoning_strength": 0.8,
                "context_limit": 1000000,
                "privacy_rating": 3
            },
            CollaborationStrategy.LOCAL_STRATEGY: {
                "optimal_for": [TaskType.PATTERN_LEARNING],
                "cost_multiplier": 0.0,  # Free local processing
                "reasoning_strength": 0.6,
                "context_limit": 32000,
                "privacy_rating": 5
            }
        }    
    async def select_optimal_strategy(
        self, 
        request: CollaborationRequest,
        user_preferences: Optional[Dict] = None
    ) -> CollaborationStrategy:
        """
        Select optimal collaboration strategy based on request analysis.
        
        Args:
            request: The collaboration request to analyze
            user_preferences: User preferences and learned patterns
            
        Returns:
            The optimal collaboration strategy
        """
        factors = CollaborationFactors.analyze_request(request)
        
        # If user specified a preferred strategy, validate and use if appropriate
        if request.preferred_strategy:
            if await self._validate_strategy_compatibility(request.preferred_strategy, factors):
                logger.info(f"Using user-preferred strategy: {request.preferred_strategy}")
                return request.preferred_strategy
        
        # Analyze task type for strategy hints
        if request.task_type:
            strategy_from_task = self._get_strategy_for_task_type(request.task_type)
            if strategy_from_task:
                logger.info(f"Selected strategy based on task type: {strategy_from_task}")
                return strategy_from_task
        
        # Intelligent strategy selection based on collaboration factors
        strategy_scores = await self._score_strategies(factors, user_preferences)
        
        # Select highest scoring strategy
        optimal_strategy = max(strategy_scores.items(), key=lambda x: x[1])[0]
        
        logger.info(
            f"Selected optimal strategy: {optimal_strategy} "
            f"(score: {strategy_scores[optimal_strategy]:.3f})"
        )
        
        return optimal_strategy
    
    async def _score_strategies(
        self, 
        factors: CollaborationFactors,
        user_preferences: Optional[Dict] = None
    ) -> Dict[CollaborationStrategy, float]:
        """Score all available strategies based on collaboration factors."""
        scores = {}
        
        for strategy, pattern in self.strategy_patterns.items():
            score = 0.0
            
            # Base compatibility score
            if factors.requires_reasoning and pattern["reasoning_strength"] > 0.8:
                score += 0.3
            
            if factors.requires_massive_context:
                if pattern["context_limit"] >= factors.estimated_tokens:
                    score += 0.3
                else:
                    score -= 0.5  # Penalize if can't handle context
            
            # Cost optimization
            if factors.cost_sensitive:
                # Lower cost multiplier = higher score
                cost_score = 1.0 / (pattern["cost_multiplier"] + 0.1)
                score += cost_score * 0.2
            
            # Privacy requirements
            if factors.privacy_critical:
                privacy_score = pattern["privacy_rating"] / 5.0
                score += privacy_score * 0.3
            
            # Multi-perspective requirement
            if factors.requires_multi_perspective:
                if strategy == CollaborationStrategy.CEO_BOARD_STRATEGY:
                    score += 0.4
            
            # Time sensitivity (prefer faster strategies)
            if factors.time_sensitive:
                if strategy in [CollaborationStrategy.DEEPSEEK_R1_STRATEGY, 
                              CollaborationStrategy.LOCAL_STRATEGY]:
                    score += 0.2
            
            # Apply user preferences
            if user_preferences:
                pref_multiplier = user_preferences.get(strategy.value, 1.0)
                score *= pref_multiplier
            
            # Apply learning data (historical performance)
            if strategy.value in self.learning_data:
                avg_performance = sum(self.learning_data[strategy.value]) / len(self.learning_data[strategy.value])
                score *= avg_performance
            
            scores[strategy] = max(0.0, score)  # Ensure non-negative scores
        
        return scores    
    def _get_strategy_for_task_type(self, task_type: TaskType) -> Optional[CollaborationStrategy]:
        """Get recommended strategy for specific task types."""
        task_strategy_map = {
            TaskType.CEO_BOARD_DECISION: CollaborationStrategy.CEO_BOARD_STRATEGY,
            TaskType.GEMINI_COLLABORATION: CollaborationStrategy.GEMINI_PRO_STRATEGY,
            TaskType.MULTI_MODEL_SYNTHESIS: CollaborationStrategy.CEO_BOARD_STRATEGY,
            TaskType.SUPERVISED_EXCHANGE: CollaborationStrategy.SUPERVISED_EXCHANGE_STRATEGY,
            TaskType.KNOWLEDGE_ANALYSIS: CollaborationStrategy.DEEPSEEK_R1_STRATEGY,
            TaskType.CONTEXT_SYNTHESIS: CollaborationStrategy.GEMINI_PRO_STRATEGY,
            TaskType.PATTERN_LEARNING: CollaborationStrategy.DEEPSEEK_R1_STRATEGY,
            TaskType.COST_OPTIMIZATION: CollaborationStrategy.DEEPSEEK_R1_STRATEGY,
        }
        return task_strategy_map.get(task_type)
    
    async def _validate_strategy_compatibility(
        self, 
        strategy: CollaborationStrategy, 
        factors: CollaborationFactors
    ) -> bool:
        """Validate if a strategy can handle the request requirements."""
        pattern = self.strategy_patterns.get(strategy)
        if not pattern:
            return False
        
        # Check context limits
        if factors.estimated_tokens > pattern["context_limit"]:
            logger.warning(
                f"Strategy {strategy} cannot handle context size: "
                f"{factors.estimated_tokens} > {pattern['context_limit']}"
            )
            return False
        
        # Check privacy requirements
        if factors.privacy_critical and pattern["privacy_rating"] < 4:
            logger.warning(f"Strategy {strategy} insufficient for privacy requirements")
            return False
        
        return True
    
    async def select_models_for_strategy(
        self, 
        strategy: CollaborationStrategy,
        factors: CollaborationFactors
    ) -> List[str]:
        """Select optimal models for the chosen strategy."""
        
        if strategy == CollaborationStrategy.DEEPSEEK_R1_STRATEGY:
            return ["deepseek:r1.1"]
        
        elif strategy == CollaborationStrategy.GEMINI_PRO_STRATEGY:
            return ["gemini:gemini-2.5-pro"]
        
        elif strategy == CollaborationStrategy.CEO_BOARD_STRATEGY:
            # Multiple models for board + CEO pattern
            board_models = ["deepseek:r1.1", "claude:claude-4-sonnet", "gemini:gemini-2.5-pro"]
            ceo_model = "claude:claude-4-opus"
            return board_models + [ceo_model]
        
        elif strategy == CollaborationStrategy.SUPERVISED_EXCHANGE_STRATEGY:
            return ["gemini:gemini-2.5-pro"]  # Best for large context collaboration
        
        elif strategy == CollaborationStrategy.LOCAL_STRATEGY:
            return ["ollama:llama3.1"]
        
        elif strategy == CollaborationStrategy.HYBRID_STRATEGY:
            # Intelligent combination based on factors
            models = []
            
            if factors.cost_sensitive:
                models.append("deepseek:r1.1")
            
            if factors.requires_massive_context:
                models.append("gemini:gemini-2.5-pro")
            
            if factors.requires_reasoning:
                models.append("claude:claude-4-sonnet")
            
            return models or ["deepseek:r1.1"]  # Fallback
        
        else:
            # Default fallback
            return ["deepseek:r1.1"]    
    async def record_strategy_performance(
        self, 
        strategy: CollaborationStrategy,
        performance_score: float,
        metadata: Optional[Dict] = None
    ) -> None:
        """Record performance data for strategy learning and optimization."""
        if strategy.value not in self.learning_data:
            self.learning_data[strategy.value] = []
        
        # Keep rolling window of recent performance
        self.learning_data[strategy.value].append(performance_score)
        if len(self.learning_data[strategy.value]) > 100:
            self.learning_data[strategy.value] = self.learning_data[strategy.value][-100:]
        
        logger.debug(
            f"Recorded performance for {strategy}: {performance_score:.3f} "
            f"(avg: {sum(self.learning_data[strategy.value]) / len(self.learning_data[strategy.value]):.3f})"
        )
    
    def estimate_cost(
        self, 
        strategy: CollaborationStrategy,
        estimated_tokens: int
    ) -> float:
        """Estimate collaboration cost based on strategy and token usage."""
        pattern = self.strategy_patterns.get(strategy, {})
        base_cost_per_1k = 0.015  # Default cost
        
        if strategy == CollaborationStrategy.DEEPSEEK_R1_STRATEGY:
            base_cost_per_1k = 0.0027  # DeepSeek R1 pricing
        elif strategy == CollaborationStrategy.GEMINI_PRO_STRATEGY:
            base_cost_per_1k = 0.0125  # Gemini Pro pricing
        elif strategy == CollaborationStrategy.CEO_BOARD_STRATEGY:
            base_cost_per_1k = 0.045  # Multiple models premium
        
        cost_multiplier = pattern.get("cost_multiplier", 1.0)
        estimated_cost = (estimated_tokens / 1000) * base_cost_per_1k * cost_multiplier
        
        return estimated_cost
    
    def get_strategy_info(self, strategy: CollaborationStrategy) -> Dict:
        """Get detailed information about a collaboration strategy."""
        pattern = self.strategy_patterns.get(strategy, {})
        performance_data = self.learning_data.get(strategy.value, [])
        
        return {
            "strategy": strategy.value,
            "optimal_for": [task.value for task in pattern.get("optimal_for", [])],
            "cost_multiplier": pattern.get("cost_multiplier", 1.0),
            "reasoning_strength": pattern.get("reasoning_strength", 0.5),
            "context_limit": pattern.get("context_limit", 50000),
            "privacy_rating": pattern.get("privacy_rating", 3),
            "average_performance": (
                sum(performance_data) / len(performance_data) 
                if performance_data else 0.0
            ),
            "usage_count": len(performance_data)
        }
    
    def add_custom_model(self, model_config: ModelConfiguration) -> None:
        """Add a custom model configuration for routing."""
        self.available_models[model_config.full_model_name] = model_config
        logger.info(f"Added custom model: {model_config.full_model_name}")
    
    def update_strategy_pattern(
        self, 
        strategy: CollaborationStrategy,
        updates: Dict
    ) -> None:
        """Update strategy pattern configuration."""
        if strategy in self.strategy_patterns:
            self.strategy_patterns[strategy].update(updates)
            logger.info(f"Updated strategy pattern for {strategy}: {updates}")
        else:
            logger.warning(f"Strategy {strategy} not found for update")