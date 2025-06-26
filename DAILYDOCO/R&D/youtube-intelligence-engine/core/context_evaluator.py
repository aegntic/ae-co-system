"""Context Evaluator - Evaluates content context and relevance for DailyDoco integration."""

import asyncio
from typing import Dict, Any, List, Optional, Tuple
import structlog
from datetime import datetime

logger = structlog.get_logger()


class ContextEvaluator:
    """Evaluates content context and determines optimal integration strategies."""
    
    def __init__(self):
        self.context_weights = {
            "technical_depth": 0.25,
            "practical_value": 0.30,
            "innovation_factor": 0.20,
            "integration_ease": 0.15,
            "audience_match": 0.10
        }
        
        logger.info("Context evaluator initialized", weights=self.context_weights)
    
    async def evaluate_context(
        self,
        content_analysis: Dict[str, Any],
        video_metadata: Dict[str, Any],
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Evaluate content context comprehensively."""
        
        logger.info("Evaluating content context", analysis_id=content_analysis.get("analysis_id"))
        
        # Core context evaluation
        technical_context = await self._evaluate_technical_context(content_analysis)
        practical_context = await self._evaluate_practical_context(content_analysis)
        innovation_context = await self._evaluate_innovation_context(content_analysis)
        integration_context = await self._evaluate_integration_context(content_analysis, video_metadata)
        audience_context = await self._evaluate_audience_context(content_analysis, user_preferences)
        
        # Calculate overall context score
        context_score = self._calculate_context_score({
            "technical_depth": technical_context["score"],
            "practical_value": practical_context["score"],
            "innovation_factor": innovation_context["score"],
            "integration_ease": integration_context["score"],
            "audience_match": audience_context["score"]
        })
        
        # Generate context-based recommendations
        recommendations = await self._generate_context_recommendations(
            technical_context, practical_context, innovation_context, 
            integration_context, audience_context
        )
        
        # Determine optimal capture strategies
        capture_strategies = await self._determine_capture_strategies(content_analysis, context_score)
        
        return {
            "evaluation_id": f"ctx_eval_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "overall_context_score": context_score,
            "context_grade": self._score_to_grade(context_score),
            "context_breakdown": {
                "technical_depth": technical_context,
                "practical_value": practical_context,
                "innovation_factor": innovation_context,
                "integration_ease": integration_context,
                "audience_match": audience_context
            },
            "recommendations": recommendations,
            "capture_strategies": capture_strategies,
            "priority_level": self._determine_priority_level(context_score),
            "evaluation_metadata": {
                "evaluated_at": datetime.utcnow().isoformat(),
                "evaluator_version": "1.0",
                "weights_used": self.context_weights
            }
        }
    
    async def _evaluate_technical_context(self, content_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate technical depth and complexity."""
        
        concepts = content_analysis.get("technical_concepts", [])
        insights = content_analysis.get("actionable_insights", {})
        
        # Count advanced technical concepts
        advanced_concepts = len([
            c for c in concepts 
            if c.get("importance", 0) >= 8 or c.get("difficulty") in ["advanced", "expert"]
        ])
        
        # Evaluate complexity level
        complexity = insights.get("complexity", "medium")
        complexity_scores = {"beginner": 3, "medium": 6, "advanced": 9, "expert": 10}
        complexity_score = complexity_scores.get(complexity, 6)
        
        # Count technical technologies mentioned
        technologies = insights.get("technologies", [])
        tech_diversity = min(len(technologies), 10)  # Cap at 10
        
        # Calculate technical score
        technical_score = (
            (advanced_concepts * 2) +
            complexity_score +
            tech_diversity
        ) / 3
        
        technical_score = min(technical_score, 10)  # Cap at 10
        
        return {
            "score": technical_score,
            "advanced_concepts_count": advanced_concepts,
            "complexity_level": complexity,
            "technology_diversity": tech_diversity,
            "assessment": self._get_technical_assessment(technical_score),
            "strengths": self._identify_technical_strengths(concepts, technologies),
            "gaps": self._identify_technical_gaps(concepts, insights)
        }
    
    async def _evaluate_practical_context(self, content_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate practical applicability and actionable value."""
        
        insights = content_analysis.get("actionable_insights", {})
        integration = content_analysis.get("dailydoco_integration", {})
        
        # Count actionable items
        actionable_items = insights.get("actionable_items", [])
        actionable_count = len(actionable_items)
        
        # Evaluate learning outcomes
        learning_outcomes = insights.get("learning_outcomes", [])
        practical_outcomes = len([
            outcome for outcome in learning_outcomes
            if any(keyword in outcome.lower() for keyword in [
                "implement", "build", "create", "develop", "deploy", "configure", "setup"
            ])
        ])
        
        # Check for workflow integration potential
        workflow_integration = len(integration.get("workflow_integration", []))
        
        # Calculate practical score
        practical_score = (
            min(actionable_count * 1.5, 10) +  # Max 10 from actionable items
            min(practical_outcomes * 2, 10) +  # Max 10 from practical outcomes
            min(workflow_integration * 1.5, 10)  # Max 10 from workflow integration
        ) / 3
        
        return {
            "score": practical_score,
            "actionable_items_count": actionable_count,
            "practical_outcomes_count": practical_outcomes,
            "workflow_integration_potential": workflow_integration,
            "assessment": self._get_practical_assessment(practical_score),
            "immediate_applications": self._identify_immediate_applications(actionable_items),
            "long_term_value": self._assess_long_term_value(learning_outcomes)
        }
    
    async def _evaluate_innovation_context(self, content_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate innovation potential and novel approaches."""
        
        innovations = content_analysis.get("innovation_opportunities", {})
        
        # Count identified innovations
        innovations_found = len(innovations.get("innovations_found", []))
        novel_approaches = len(innovations.get("novel_approaches", []))
        emerging_trends = len(innovations.get("emerging_trends", []))
        
        # Calculate innovation score
        innovation_score = (
            min(innovations_found * 2.5, 10) +
            min(novel_approaches * 2, 10) +
            min(emerging_trends * 1.5, 10)
        ) / 3
        
        return {
            "score": innovation_score,
            "innovations_count": innovations_found,
            "novel_approaches_count": novel_approaches,
            "emerging_trends_count": emerging_trends,
            "assessment": self._get_innovation_assessment(innovation_score),
            "breakthrough_potential": self._assess_breakthrough_potential(innovations),
            "trend_alignment": self._assess_trend_alignment(emerging_trends)
        }
    
    async def _evaluate_integration_context(
        self, 
        content_analysis: Dict[str, Any], 
        video_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Evaluate ease of integration with DailyDoco workflows."""
        
        integration = content_analysis.get("dailydoco_integration", {})
        
        # Get compatibility score
        compatibility_score = integration.get("compatibility_score", 5.0)
        
        # Count recommended actions
        recommended_actions = len(integration.get("recommended_actions", []))
        
        # Evaluate content format suitability
        duration = video_metadata.get("duration", 0)
        format_score = self._evaluate_format_suitability(duration, video_metadata)
        
        # Calculate integration score
        integration_score = (
            compatibility_score +
            min(recommended_actions * 1.5, 10) +
            format_score
        ) / 3
        
        return {
            "score": integration_score,
            "compatibility_score": compatibility_score,
            "recommended_actions_count": recommended_actions,
            "format_suitability": format_score,
            "assessment": self._get_integration_assessment(integration_score),
            "implementation_difficulty": self._assess_implementation_difficulty(integration),
            "automation_potential": self._assess_automation_potential(integration)
        }
    
    async def _evaluate_audience_context(
        self, 
        content_analysis: Dict[str, Any], 
        user_preferences: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Evaluate audience alignment and relevance."""
        
        insights = content_analysis.get("actionable_insights", {})
        target_audience = insights.get("target_audience", "developers")
        
        # Default audience scoring
        audience_scores = {
            "developers": 9,
            "engineers": 8,
            "technical": 7,
            "general": 5,
            "business": 4
        }
        
        audience_score = audience_scores.get(target_audience.lower(), 6)
        
        # Adjust based on user preferences if available
        if user_preferences:
            audience_score = self._adjust_for_user_preferences(audience_score, insights, user_preferences)
        
        return {
            "score": audience_score,
            "target_audience": target_audience,
            "audience_match_quality": self._assess_audience_match(audience_score),
            "assessment": self._get_audience_assessment(audience_score),
            "customization_recommendations": self._get_customization_recommendations(user_preferences)
        }
    
    def _calculate_context_score(self, scores: Dict[str, float]) -> float:
        """Calculate weighted overall context score."""
        
        total_score = sum(
            scores[factor] * weight 
            for factor, weight in self.context_weights.items()
            if factor in scores
        )
        
        return round(total_score, 2)
    
    async def _generate_context_recommendations(self, *contexts) -> List[Dict[str, Any]]:
        """Generate recommendations based on context evaluation."""
        
        recommendations = []
        
        technical_context, practical_context, innovation_context, integration_context, audience_context = contexts
        
        # Technical recommendations
        if technical_context["score"] >= 8:
            recommendations.append({
                "type": "technical_deep_dive",
                "priority": "high",
                "recommendation": "Create detailed technical documentation",
                "reason": "High technical depth detected"
            })
        
        # Practical recommendations
        if practical_context["score"] >= 7:
            recommendations.append({
                "type": "workflow_integration",
                "priority": "high", 
                "recommendation": "Integrate into development workflow",
                "reason": "High practical value identified"
            })
        
        # Innovation recommendations
        if innovation_context["score"] >= 6:
            recommendations.append({
                "type": "innovation_tracking",
                "priority": "medium",
                "recommendation": "Track innovations for future reference",
                "reason": "Notable innovations found"
            })
        
        # Integration recommendations
        if integration_context["score"] >= 7:
            recommendations.append({
                "type": "automated_capture",
                "priority": "high",
                "recommendation": "Set up automated capture workflows",
                "reason": "High integration compatibility"
            })
        
        return recommendations
    
    async def _determine_capture_strategies(
        self, 
        content_analysis: Dict[str, Any], 
        context_score: float
    ) -> List[Dict[str, Any]]:
        """Determine optimal capture strategies based on context."""
        
        strategies = []
        
        if context_score >= 8:
            strategies.append({
                "strategy": "comprehensive_capture",
                "description": "Full workflow capture with detailed annotations",
                "tools": ["screen_recording", "code_tracking", "annotation_system"],
                "priority": "high"
            })
        elif context_score >= 6:
            strategies.append({
                "strategy": "selective_capture", 
                "description": "Capture key moments and concepts",
                "tools": ["smart_capture", "concept_highlighting"],
                "priority": "medium"
            })
        else:
            strategies.append({
                "strategy": "basic_capture",
                "description": "Basic content archival",
                "tools": ["simple_recording"],
                "priority": "low"
            })
        
        return strategies
    
    def _determine_priority_level(self, context_score: float) -> str:
        """Determine priority level based on context score."""
        
        if context_score >= 8.5:
            return "critical"
        elif context_score >= 7:
            return "high"
        elif context_score >= 5:
            return "medium"
        else:
            return "low"
    
    def _score_to_grade(self, score: float) -> str:
        """Convert numeric score to letter grade."""
        
        if score >= 9:
            return "A+"
        elif score >= 8:
            return "A"
        elif score >= 7:
            return "B+"
        elif score >= 6:
            return "B"
        elif score >= 5:
            return "C"
        else:
            return "D"
    
    # Helper methods for assessments
    def _get_technical_assessment(self, score: float) -> str:
        """Get technical assessment text."""
        if score >= 8:
            return "Highly technical content with advanced concepts"
        elif score >= 6:
            return "Moderately technical with good depth"
        else:
            return "Basic technical content"
    
    def _get_practical_assessment(self, score: float) -> str:
        """Get practical assessment text."""
        if score >= 8:
            return "Highly actionable with immediate practical value"
        elif score >= 6:
            return "Good practical applications available"
        else:
            return "Limited practical applicability"
    
    def _get_innovation_assessment(self, score: float) -> str:
        """Get innovation assessment text."""
        if score >= 7:
            return "Contains significant innovations or novel approaches"
        elif score >= 5:
            return "Some innovative elements present"
        else:
            return "Standard approaches, limited innovation"
    
    def _get_integration_assessment(self, score: float) -> str:
        """Get integration assessment text."""
        if score >= 8:
            return "Excellent integration potential with existing workflows"
        elif score >= 6:
            return "Good integration opportunities available"
        else:
            return "Limited integration potential"
    
    def _get_audience_assessment(self, score: float) -> str:
        """Get audience assessment text."""
        if score >= 8:
            return "Perfect audience alignment"
        elif score >= 6:
            return "Good audience match"
        else:
            return "Moderate audience relevance"
    
    # Placeholder methods for more detailed analysis
    def _identify_technical_strengths(self, concepts: List, technologies: List) -> List[str]:
        return ["Technical depth", "Concept clarity", "Technology coverage"]
    
    def _identify_technical_gaps(self, concepts: List, insights: Dict) -> List[str]:
        return ["Missing fundamentals", "Limited examples"]
    
    def _identify_immediate_applications(self, actionable_items: List) -> List[str]:
        return [item[:50] + "..." if len(str(item)) > 50 else str(item) for item in actionable_items[:3]]
    
    def _assess_long_term_value(self, learning_outcomes: List) -> str:
        return "High" if len(learning_outcomes) >= 3 else "Medium"
    
    def _assess_breakthrough_potential(self, innovations: Dict) -> str:
        return "High" if len(innovations.get("innovations_found", [])) >= 2 else "Medium"
    
    def _assess_trend_alignment(self, trends_count: int) -> str:
        return "High" if trends_count >= 2 else "Medium"
    
    def _evaluate_format_suitability(self, duration: int, metadata: Dict) -> float:
        # Optimal duration for documentation: 5-30 minutes
        if 300 <= duration <= 1800:  # 5-30 minutes
            return 9.0
        elif duration <= 300:  # Under 5 minutes
            return 7.0
        elif duration <= 3600:  # Under 1 hour
            return 8.0
        else:
            return 5.0  # Over 1 hour
    
    def _assess_implementation_difficulty(self, integration: Dict) -> str:
        compatibility = integration.get("compatibility_score", 5)
        return "Low" if compatibility >= 8 else "Medium" if compatibility >= 6 else "High"
    
    def _assess_automation_potential(self, integration: Dict) -> str:
        actions = integration.get("recommended_actions", [])
        automation_actions = [a for a in actions if "automat" in str(a).lower()]
        return "High" if len(automation_actions) >= 2 else "Medium"
    
    def _assess_audience_match(self, score: float) -> str:
        return "Excellent" if score >= 8 else "Good" if score >= 6 else "Fair"
    
    def _adjust_for_user_preferences(self, base_score: float, insights: Dict, preferences: Dict) -> float:
        # Simple preference adjustment logic
        preferred_topics = preferences.get("topics", [])
        content_topics = insights.get("main_topics", [])
        
        topic_overlap = len(set(preferred_topics) & set(content_topics))
        adjustment = min(topic_overlap * 0.5, 2.0)  # Max 2 point bonus
        
        return min(base_score + adjustment, 10.0)
    
    def _get_customization_recommendations(self, preferences: Optional[Dict]) -> List[str]:
        if not preferences:
            return ["Set user preferences for better content matching"]
        
        return [
            "Content matches user preferences",
            "Consider saving to personalized collection"
        ]