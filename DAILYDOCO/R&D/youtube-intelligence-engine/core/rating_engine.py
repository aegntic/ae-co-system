"""Rating Engine - Comprehensive content rating and scoring system."""

import asyncio
from typing import Dict, Any, List, Optional, Tuple
import structlog
from datetime import datetime
import statistics

logger = structlog.get_logger()


class RatingEngine:
    """Comprehensive rating system for YouTube content analysis."""
    
    def __init__(self):
        self.rating_criteria = {
            "content_quality": {
                "weight": 0.25,
                "factors": ["clarity", "depth", "accuracy", "completeness"]
            },
            "technical_value": {
                "weight": 0.25, 
                "factors": ["technical_depth", "innovation", "best_practices", "real_world_applicability"]
            },
            "educational_value": {
                "weight": 0.20,
                "factors": ["learning_outcomes", "progression", "examples", "explanations"]
            },
            "dailydoco_fit": {
                "weight": 0.20,
                "factors": ["workflow_integration", "documentation_value", "automation_potential", "team_utility"]
            },
            "engagement_metrics": {
                "weight": 0.10,
                "factors": ["view_ratio", "engagement_rate", "community_response", "trending_potential"]
            }
        }
        
        logger.info("Rating engine initialized", criteria=list(self.rating_criteria.keys()))
    
    async def generate_comprehensive_rating(
        self,
        content_analysis: Dict[str, Any],
        context_evaluation: Dict[str, Any],
        video_metadata: Dict[str, Any],
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate comprehensive rating for content."""
        
        logger.info("Generating comprehensive rating", 
                   analysis_id=content_analysis.get("analysis_id"))
        
        # Calculate individual criterion ratings
        quality_rating = await self._rate_content_quality(content_analysis, context_evaluation)
        technical_rating = await self._rate_technical_value(content_analysis, context_evaluation)
        educational_rating = await self._rate_educational_value(content_analysis, context_evaluation)
        dailydoco_rating = await self._rate_dailydoco_fit(content_analysis, context_evaluation)
        engagement_rating = await self._rate_engagement_metrics(video_metadata, content_analysis)
        
        # Calculate weighted overall rating
        overall_rating = self._calculate_overall_rating({
            "content_quality": quality_rating["score"],
            "technical_value": technical_rating["score"],
            "educational_value": educational_rating["score"],
            "dailydoco_fit": dailydoco_rating["score"],
            "engagement_metrics": engagement_rating["score"]
        })
        
        # Generate rating insights and recommendations
        insights = await self._generate_rating_insights(
            quality_rating, technical_rating, educational_rating, 
            dailydoco_rating, engagement_rating, overall_rating=overall_rating
        )
        
        # Determine content tier and priority
        content_tier = self._determine_content_tier(overall_rating)
        priority_score = self._calculate_priority_score(overall_rating, dailydoco_rating["score"])
        
        # Generate actionable recommendations
        recommendations = await self._generate_rating_based_recommendations(
            overall_rating, quality_rating, technical_rating, 
            educational_rating, dailydoco_rating
        )
        
        return {
            "rating_id": f"rating_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "overall_rating": {
                "score": overall_rating,
                "grade": self._score_to_grade(overall_rating),
                "tier": content_tier,
                "priority_score": priority_score
            },
            "detailed_ratings": {
                "content_quality": quality_rating,
                "technical_value": technical_rating,
                "educational_value": educational_rating,
                "dailydoco_fit": dailydoco_rating,
                "engagement_metrics": engagement_rating
            },
            "rating_insights": insights,
            "recommendations": recommendations,
            "confidence_level": self._calculate_confidence_level(content_analysis, context_evaluation),
            "rating_metadata": {
                "rated_at": datetime.utcnow().isoformat(),
                "rating_version": "1.0",
                "criteria_weights": self.rating_criteria
            }
        }
    
    async def _rate_content_quality(
        self, 
        content_analysis: Dict[str, Any], 
        context_evaluation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Rate overall content quality."""
        
        insights = content_analysis.get("actionable_insights", {})
        context_breakdown = context_evaluation.get("context_breakdown", {})
        
        # Factor scores (0-10 scale)
        clarity_score = self._assess_clarity(content_analysis)
        depth_score = context_breakdown.get("technical_depth", {}).get("score", 5)
        accuracy_score = self._assess_accuracy(content_analysis, insights)
        completeness_score = self._assess_completeness(content_analysis, insights)
        
        # Calculate weighted quality score
        factor_scores = {
            "clarity": clarity_score,
            "depth": depth_score,
            "accuracy": accuracy_score,
            "completeness": completeness_score
        }
        
        quality_score = statistics.mean(factor_scores.values())
        
        return {
            "score": round(quality_score, 2),
            "grade": self._score_to_grade(quality_score),
            "factor_breakdown": factor_scores,
            "strengths": self._identify_quality_strengths(factor_scores),
            "improvements": self._identify_quality_improvements(factor_scores),
            "assessment": self._get_quality_assessment(quality_score)
        }
    
    async def _rate_technical_value(
        self, 
        content_analysis: Dict[str, Any], 
        context_evaluation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Rate technical value and relevance."""
        
        concepts = content_analysis.get("technical_concepts", [])
        innovations = content_analysis.get("innovation_opportunities", {})
        context_breakdown = context_evaluation.get("context_breakdown", {})
        
        # Factor scores
        technical_depth_score = context_breakdown.get("technical_depth", {}).get("score", 5)
        innovation_score = context_breakdown.get("innovation_factor", {}).get("score", 5)
        best_practices_score = self._assess_best_practices(concepts, content_analysis)
        applicability_score = context_breakdown.get("practical_value", {}).get("score", 5)
        
        factor_scores = {
            "technical_depth": technical_depth_score,
            "innovation": innovation_score,
            "best_practices": best_practices_score,
            "real_world_applicability": applicability_score
        }
        
        technical_score = statistics.mean(factor_scores.values())
        
        return {
            "score": round(technical_score, 2),
            "grade": self._score_to_grade(technical_score),
            "factor_breakdown": factor_scores,
            "technical_highlights": self._identify_technical_highlights(concepts, innovations),
            "modern_relevance": self._assess_modern_relevance(concepts),
            "assessment": self._get_technical_assessment(technical_score)
        }
    
    async def _rate_educational_value(
        self, 
        content_analysis: Dict[str, Any], 
        context_evaluation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Rate educational and learning value."""
        
        insights = content_analysis.get("actionable_insights", {})
        
        # Factor scores
        learning_outcomes_score = self._assess_learning_outcomes(insights)
        progression_score = self._assess_learning_progression(content_analysis)
        examples_score = self._assess_examples_quality(content_analysis)
        explanations_score = self._assess_explanations_quality(content_analysis)
        
        factor_scores = {
            "learning_outcomes": learning_outcomes_score,
            "progression": progression_score,
            "examples": examples_score,
            "explanations": explanations_score
        }
        
        educational_score = statistics.mean(factor_scores.values())
        
        return {
            "score": round(educational_score, 2),
            "grade": self._score_to_grade(educational_score),
            "factor_breakdown": factor_scores,
            "learning_path": self._identify_learning_path(insights),
            "skill_level": insights.get("complexity", "medium"),
            "prerequisites": self._identify_prerequisites(content_analysis),
            "assessment": self._get_educational_assessment(educational_score)
        }
    
    async def _rate_dailydoco_fit(
        self, 
        content_analysis: Dict[str, Any], 
        context_evaluation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Rate fit with DailyDoco workflows and objectives."""
        
        integration = content_analysis.get("dailydoco_integration", {})
        context_breakdown = context_evaluation.get("context_breakdown", {})
        
        # Factor scores
        workflow_integration_score = len(integration.get("workflow_integration", [])) * 2
        workflow_integration_score = min(workflow_integration_score, 10)
        
        documentation_value_score = self._assess_documentation_value(integration)
        automation_potential_score = self._assess_automation_potential(integration)
        team_utility_score = self._assess_team_utility(content_analysis, integration)
        
        factor_scores = {
            "workflow_integration": workflow_integration_score,
            "documentation_value": documentation_value_score,
            "automation_potential": automation_potential_score,
            "team_utility": team_utility_score
        }
        
        dailydoco_score = statistics.mean(factor_scores.values())
        
        return {
            "score": round(dailydoco_score, 2),
            "grade": self._score_to_grade(dailydoco_score),
            "factor_breakdown": factor_scores,
            "integration_opportunities": integration.get("recommended_actions", []),
            "workflow_benefits": self._identify_workflow_benefits(integration),
            "implementation_complexity": self._assess_implementation_complexity(integration),
            "assessment": self._get_dailydoco_assessment(dailydoco_score)
        }
    
    async def _rate_engagement_metrics(
        self, 
        video_metadata: Dict[str, Any], 
        content_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Rate based on engagement and popularity metrics."""
        
        # Extract metadata
        view_count = video_metadata.get("view_count", 0)
        like_count = video_metadata.get("like_count", 0)
        comment_count = video_metadata.get("comment_count", 0)
        duration = video_metadata.get("duration", 0)
        upload_date = video_metadata.get("upload_date", "")
        
        # Calculate engagement metrics
        view_ratio_score = self._calculate_view_ratio_score(view_count, upload_date)
        engagement_rate_score = self._calculate_engagement_rate_score(
            view_count, like_count, comment_count
        )
        community_response_score = self._assess_community_response(like_count, comment_count)
        trending_potential_score = self._assess_trending_potential(
            view_count, like_count, comment_count, upload_date
        )
        
        factor_scores = {
            "view_ratio": view_ratio_score,
            "engagement_rate": engagement_rate_score,
            "community_response": community_response_score,
            "trending_potential": trending_potential_score
        }
        
        engagement_score = statistics.mean(factor_scores.values())
        
        return {
            "score": round(engagement_score, 2),
            "grade": self._score_to_grade(engagement_score),
            "factor_breakdown": factor_scores,
            "metrics_summary": {
                "view_count": view_count,
                "like_count": like_count,
                "comment_count": comment_count,
                "engagement_rate": self._calculate_engagement_rate(view_count, like_count, comment_count)
            },
            "virality_indicators": self._identify_virality_indicators(video_metadata),
            "assessment": self._get_engagement_assessment(engagement_score)
        }
    
    def _calculate_overall_rating(self, criterion_scores: Dict[str, float]) -> float:
        """Calculate weighted overall rating."""
        
        total_score = 0
        total_weight = 0
        
        for criterion, score in criterion_scores.items():
            if criterion in self.rating_criteria:
                weight = self.rating_criteria[criterion]["weight"]
                total_score += score * weight
                total_weight += weight
        
        return round(total_score / total_weight if total_weight > 0 else 0, 2)
    
    async def _generate_rating_insights(self, *ratings, overall_rating) -> Dict[str, Any]:
        """Generate insights from rating analysis."""
        
        quality_rating, technical_rating, educational_rating, dailydoco_rating, engagement_rating = ratings
        
        # Identify strengths and weaknesses
        strengths = []
        weaknesses = []
        
        for name, rating in [
            ("Content Quality", quality_rating),
            ("Technical Value", technical_rating), 
            ("Educational Value", educational_rating),
            ("DailyDoco Fit", dailydoco_rating),
            ("Engagement", engagement_rating)
        ]:
            if rating["score"] >= 8:
                strengths.append(f"{name}: {rating['assessment']}")
            elif rating["score"] <= 5:
                weaknesses.append(f"{name}: {rating['assessment']}")
        
        # Generate key insights
        insights = {
            "overall_assessment": self._get_overall_assessment(overall_rating),
            "primary_strengths": strengths[:3],
            "improvement_areas": weaknesses[:3],
            "standout_features": self._identify_standout_features(
                quality_rating, technical_rating, educational_rating, dailydoco_rating
            ),
            "competitive_advantages": self._identify_competitive_advantages(
                technical_rating, educational_rating, dailydoco_rating
            ),
            "risk_factors": self._identify_risk_factors(
                quality_rating, engagement_rating
            )
        }
        
        return insights
    
    def _determine_content_tier(self, overall_rating: float) -> str:
        """Determine content tier based on overall rating."""
        
        if overall_rating >= 9:
            return "Premium Elite"
        elif overall_rating >= 8:
            return "Premium"
        elif overall_rating >= 7:
            return "Professional"
        elif overall_rating >= 6:
            return "Standard"
        elif overall_rating >= 5:
            return "Basic"
        else:
            return "Below Standard"
    
    def _calculate_priority_score(self, overall_rating: float, dailydoco_score: float) -> float:
        """Calculate priority score for action ranking."""
        
        # Priority weighted more heavily on DailyDoco fit
        priority = (overall_rating * 0.6) + (dailydoco_score * 0.4)
        return round(priority, 2)
    
    async def _generate_rating_based_recommendations(self, *args) -> List[Dict[str, Any]]:
        """Generate recommendations based on rating analysis."""
        
        overall_rating, quality_rating, technical_rating, educational_rating, dailydoco_rating = args
        
        recommendations = []
        
        # High-priority recommendations
        if overall_rating >= 8:
            recommendations.append({
                "type": "immediate_action",
                "priority": "critical",
                "action": "Integrate into core documentation workflow",
                "reason": f"Exceptional overall rating ({overall_rating}/10)",
                "estimated_impact": "high"
            })
        
        # Quality-based recommendations
        if quality_rating["score"] >= 8:
            recommendations.append({
                "type": "content_preservation",
                "priority": "high",
                "action": "Create permanent reference documentation",
                "reason": "High quality content suitable for long-term reference",
                "estimated_impact": "high"
            })
        
        # Technical value recommendations
        if technical_rating["score"] >= 7:
            recommendations.append({
                "type": "knowledge_sharing",
                "priority": "high",
                "action": "Share with technical team for review and implementation",
                "reason": "High technical value for development team",
                "estimated_impact": "medium"
            })
        
        # Educational value recommendations
        if educational_rating["score"] >= 7:
            recommendations.append({
                "type": "training_material",
                "priority": "medium",
                "action": "Incorporate into team training resources",
                "reason": "Strong educational value for skill development",
                "estimated_impact": "medium"
            })
        
        # DailyDoco fit recommendations
        if dailydoco_rating["score"] >= 7:
            recommendations.append({
                "type": "workflow_automation",
                "priority": "high",
                "action": "Set up automated capture for similar content",
                "reason": "Excellent fit with DailyDoco workflows",
                "estimated_impact": "high"
            })
        
        return recommendations
    
    def _calculate_confidence_level(
        self, 
        content_analysis: Dict[str, Any], 
        context_evaluation: Dict[str, Any]
    ) -> float:
        """Calculate confidence level in the rating."""
        
        # Factors affecting confidence
        analysis_completeness = 1.0 if content_analysis.get("technical_concepts") else 0.7
        context_completeness = 1.0 if context_evaluation.get("context_breakdown") else 0.7
        data_quality = 0.9  # Assume good data quality for now
        
        confidence = (analysis_completeness + context_completeness + data_quality) / 3
        return round(confidence, 2)
    
    # Assessment and scoring helper methods
    def _assess_clarity(self, content_analysis: Dict[str, Any]) -> float:
        """Assess content clarity."""
        # Simple heuristic based on content structure
        summary = content_analysis.get("content_summary", {})
        if summary.get("main_topics") and len(summary.get("main_topics", [])) <= 5:
            return 8.0  # Clear, focused content
        return 6.0  # Default moderate clarity
    
    def _assess_accuracy(self, content_analysis: Dict[str, Any], insights: Dict[str, Any]) -> float:
        """Assess content accuracy."""
        # Heuristic based on technical depth and best practices
        concepts = content_analysis.get("technical_concepts", [])
        high_importance_concepts = [c for c in concepts if c.get("importance", 0) >= 8]
        return min(8.0 + len(high_importance_concepts) * 0.5, 10.0)
    
    def _assess_completeness(self, content_analysis: Dict[str, Any], insights: Dict[str, Any]) -> float:
        """Assess content completeness."""
        actionable_items = len(insights.get("actionable_items", []))
        learning_outcomes = len(insights.get("learning_outcomes", []))
        completeness = min((actionable_items + learning_outcomes) * 1.2, 10.0)
        return max(completeness, 5.0)  # Minimum 5.0
    
    def _assess_best_practices(self, concepts: List, content_analysis: Dict[str, Any]) -> float:
        """Assess adherence to best practices."""
        # Look for best practice indicators
        best_practice_keywords = ["best practice", "recommended", "standard", "convention"]
        content_text = str(content_analysis).lower()
        
        matches = sum(1 for keyword in best_practice_keywords if keyword in content_text)
        return min(6.0 + matches * 1.5, 10.0)
    
    def _score_to_grade(self, score: float) -> str:
        """Convert numeric score to letter grade."""
        if score >= 9.5:
            return "A+"
        elif score >= 9:
            return "A"
        elif score >= 8.5:
            return "A-"
        elif score >= 8:
            return "B+"
        elif score >= 7.5:
            return "B"
        elif score >= 7:
            return "B-"
        elif score >= 6.5:
            return "C+"
        elif score >= 6:
            return "C"
        elif score >= 5.5:
            return "C-"
        elif score >= 5:
            return "D"
        else:
            return "F"
    
    # Placeholder methods for detailed assessments
    def _assess_learning_outcomes(self, insights: Dict) -> float:
        outcomes = insights.get("learning_outcomes", [])
        return min(len(outcomes) * 2, 10.0)
    
    def _assess_learning_progression(self, content_analysis: Dict) -> float:
        # Default good progression score
        return 7.0
    
    def _assess_examples_quality(self, content_analysis: Dict) -> float:
        # Look for examples in content
        concepts = content_analysis.get("technical_concepts", [])
        return min(len(concepts) * 1.5, 10.0)
    
    def _assess_explanations_quality(self, content_analysis: Dict) -> float:
        # Default good explanations score
        return 7.5
    
    def _assess_documentation_value(self, integration: Dict) -> float:
        doc_value = integration.get("documentation_value", "medium")
        values = {"low": 4, "medium": 6, "high": 9}
        return values.get(doc_value, 6)
    
    def _assess_automation_potential(self, integration: Dict) -> float:
        actions = integration.get("recommended_actions", [])
        automation_actions = [a for a in actions if "automat" in str(a).lower()]
        return min(len(automation_actions) * 3, 10.0)
    
    def _assess_team_utility(self, content_analysis: Dict, integration: Dict) -> float:
        # High utility for developer-focused content
        insights = content_analysis.get("actionable_insights", {})
        if insights.get("target_audience") == "developers":
            return 8.5
        return 6.0
    
    def _calculate_view_ratio_score(self, view_count: int, upload_date: str) -> float:
        # Simple view ratio calculation
        if view_count >= 100000:
            return 9.0
        elif view_count >= 10000:
            return 7.0
        elif view_count >= 1000:
            return 5.0
        else:
            return 3.0
    
    def _calculate_engagement_rate_score(self, views: int, likes: int, comments: int) -> float:
        if views == 0:
            return 0
        engagement_rate = (likes + comments) / views
        return min(engagement_rate * 1000, 10.0)  # Scale appropriately
    
    def _assess_community_response(self, likes: int, comments: int) -> float:
        total_engagement = likes + comments
        if total_engagement >= 1000:
            return 9.0
        elif total_engagement >= 100:
            return 7.0
        elif total_engagement >= 10:
            return 5.0
        else:
            return 3.0
    
    def _assess_trending_potential(self, views: int, likes: int, comments: int, upload_date: str) -> float:
        # Simple trending assessment
        recent_engagement = likes + comments
        if views > 0:
            ratio = recent_engagement / views
            return min(ratio * 500, 10.0)
        return 5.0
    
    def _calculate_engagement_rate(self, views: int, likes: int, comments: int) -> float:
        if views == 0:
            return 0
        return ((likes + comments) / views) * 100
    
    # Assessment text methods
    def _get_quality_assessment(self, score: float) -> str:
        if score >= 8:
            return "Exceptional content quality"
        elif score >= 6:
            return "Good content quality"
        else:
            return "Needs quality improvement"
    
    def _get_technical_assessment(self, score: float) -> str:
        if score >= 8:
            return "High technical value and depth"
        elif score >= 6:
            return "Solid technical content"
        else:
            return "Limited technical value"
    
    def _get_educational_assessment(self, score: float) -> str:
        if score >= 8:
            return "Excellent learning resource"
        elif score >= 6:
            return "Good educational value"
        else:
            return "Limited educational benefit"
    
    def _get_dailydoco_assessment(self, score: float) -> str:
        if score >= 8:
            return "Perfect fit for DailyDoco workflows"
        elif score >= 6:
            return "Good integration potential"
        else:
            return "Limited workflow integration"
    
    def _get_engagement_assessment(self, score: float) -> str:
        if score >= 8:
            return "High community engagement"
        elif score >= 6:
            return "Moderate engagement"
        else:
            return "Low engagement metrics"
    
    def _get_overall_assessment(self, score: float) -> str:
        if score >= 9:
            return "Outstanding content - immediate priority"
        elif score >= 8:
            return "Excellent content - high value"
        elif score >= 7:
            return "Good content - worth integrating"
        elif score >= 6:
            return "Decent content - consider for specific use cases"
        else:
            return "Below average - limited value"
    
    # Additional placeholder methods
    def _identify_quality_strengths(self, factors: Dict) -> List[str]:
        return [f for f, score in factors.items() if score >= 8]
    
    def _identify_quality_improvements(self, factors: Dict) -> List[str]:
        return [f for f, score in factors.items() if score <= 5]
    
    def _identify_technical_highlights(self, concepts: List, innovations: Dict) -> List[str]:
        highlights = [c.get("name", "Unknown") for c in concepts[:3] if c.get("importance", 0) >= 8]
        return highlights or ["Technical content present"]
    
    def _assess_modern_relevance(self, concepts: List) -> str:
        return "High" if len(concepts) >= 3 else "Medium"
    
    def _identify_learning_path(self, insights: Dict) -> List[str]:
        return insights.get("learning_outcomes", ["General skill development"])[:3]
    
    def _identify_prerequisites(self, content_analysis: Dict) -> List[str]:
        complexity = content_analysis.get("actionable_insights", {}).get("complexity", "medium")
        if complexity == "advanced":
            return ["Intermediate programming", "Framework experience"]
        elif complexity == "expert":
            return ["Advanced programming", "System design", "Production experience"]
        else:
            return ["Basic programming knowledge"]
    
    def _identify_workflow_benefits(self, integration: Dict) -> List[str]:
        return ["Automated documentation", "Knowledge sharing", "Team productivity"]
    
    def _assess_implementation_complexity(self, integration: Dict) -> str:
        return "Low"  # Default to low complexity
    
    def _identify_virality_indicators(self, metadata: Dict) -> List[str]:
        indicators = []
        if metadata.get("view_count", 0) > 50000:
            indicators.append("High view count")
        if metadata.get("like_count", 0) > 1000:
            indicators.append("Strong community approval")
        return indicators or ["Standard engagement"]
    
    def _identify_standout_features(self, *ratings) -> List[str]:
        features = []
        for name, rating in zip(["Quality", "Technical", "Educational", "DailyDoco"], ratings):
            if rating["score"] >= 8.5:
                features.append(f"Exceptional {name.lower()}")
        return features or ["Well-rounded content"]
    
    def _identify_competitive_advantages(self, technical_rating: Dict, educational_rating: Dict, dailydoco_rating: Dict) -> List[str]:
        advantages = []
        if technical_rating["score"] >= 8:
            advantages.append("Technical depth and accuracy")
        if educational_rating["score"] >= 8:
            advantages.append("Strong educational structure")
        if dailydoco_rating["score"] >= 8:
            advantages.append("Perfect workflow integration")
        return advantages or ["Standard content quality"]
    
    def _identify_risk_factors(self, quality_rating: Dict, engagement_rating: Dict) -> List[str]:
        risks = []
        if quality_rating["score"] <= 5:
            risks.append("Content quality concerns")
        if engagement_rating["score"] <= 4:
            risks.append("Low community validation")
        return risks or ["No significant risks identified"]