"""Core Intelligence Engine - Orchestrates the entire YouTube analysis workflow."""

import asyncio
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
import structlog

from core.content_analyzer import ContentAnalyzer
from core.context_evaluator import ContextEvaluator
from core.rating_engine import RatingEngine
from core.suggestion_generator import SuggestionGenerator
from services.youtube_extractor import YouTubeExtractor
from graph.knowledge_db import KnowledgeDB
from graph.semantic_tagger import SemanticTagger

logger = structlog.get_logger()


class IntelligenceEngine:
    """Revolutionary AI-powered intelligence engine for YouTube content analysis."""
    
    def __init__(self, knowledge_db: KnowledgeDB):
        self.knowledge_db = knowledge_db
        
        # Initialize components with defaults
        self.youtube_extractor = YouTubeExtractor()
        self.content_analyzer = ContentAnalyzer()
        self.context_evaluator = ContextEvaluator()
        self.rating_engine = RatingEngine()
        self.suggestion_generator = SuggestionGenerator()
        self.semantic_tagger = SemanticTagger()
        
        logger.info("Intelligence engine initialized")
    
    async def analyze_youtube_url(self, url: str) -> Dict[str, Any]:
        """Main entry point: Transform YouTube URL into actionable intelligence."""
        
        analysis_id = f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
        logger.info("Starting YouTube intelligence analysis", url=url, analysis_id=analysis_id)
        
        try:
            # Phase 1: Content Extraction
            logger.info("Phase 1: Extracting content from YouTube")
            content_data = await self.youtube_extractor.extract_content(url)
            
            # Phase 2: AI Content Analysis
            logger.info("Phase 2: Performing AI content analysis")
            metadata = content_data.get("metadata", {})
            content_analysis = await self.content_analyzer.analyze_content(
                metadata.get("title", ""),
                metadata.get("description", ""), 
                content_data.get("transcript", ""),
                metadata
            )
            
            # Phase 3: Context Evaluation
            logger.info("Phase 3: Evaluating context and relevance")
            context_evaluation = await self.context_evaluator.evaluate_context(
                content_analysis, content_data
            )
            
            # Phase 4: Rating and Scoring
            logger.info("Phase 4: Generating comprehensive ratings")
            ratings = await self.rating_engine.generate_comprehensive_rating(
                content_analysis, context_evaluation, content_data
            )
            
            # Phase 5: Enhancement Suggestions
            logger.info("Phase 5: Creating enhancement suggestions")
            suggestions = await self.suggestion_generator.generate_comprehensive_suggestions(
                content_analysis, context_evaluation, ratings
            )
            
            # Phase 6: Knowledge Graph Integration
            logger.info("Phase 6: Integrating into knowledge graph")
            graph_integration = await self._integrate_into_knowledge_graph(
                content_analysis, content_data, context_evaluation, ratings
            )
            
            # Phase 7: Final Report Compilation
            analysis_result = await self._compile_final_report(
                analysis_id, url, content_data, content_analysis,
                context_evaluation, ratings, suggestions, graph_integration
            )
            
            logger.info("YouTube intelligence analysis completed successfully", 
                       analysis_id=analysis_id)
            return analysis_result
            
        except Exception as e:
            logger.error("YouTube intelligence analysis failed", 
                        analysis_id=analysis_id, url=url, error=str(e))
            raise
    
    async def _integrate_into_knowledge_graph(
        self,
        content_analysis: Dict[str, Any],
        content_data: Dict[str, Any],
        context_evaluation: Dict[str, Any],
        ratings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Integrate analysis results into the knowledge graph."""
        
        integration_results = {
            "concepts_added": 0,
            "relationships_created": 0,
            "tags_applied": 0,
            "knowledge_nodes_updated": 0
        }
        
        try:
            # Extract and store concepts
            technical_concepts = content_analysis.get("technical_concepts", [])
            for concept in technical_concepts:
                await self.knowledge_db.store_concept(
                    concept_name=concept.get("name", "Unknown"),
                    concept_type=concept.get("category", "general"),
                    properties={
                        "importance": concept.get("importance", 5),
                        "difficulty": concept.get("difficulty", "medium"),
                        "description": concept.get("description", "")
                    },
                    source_url=content_data.get("url", ""),
                    relevance_score=concept.get("importance", 5) / 10
                )
                integration_results["concepts_added"] += 1
            
            # Apply semantic tags
            insights = content_analysis.get("actionable_insights", {})
            main_topics = insights.get("main_topics", [])
            
            metadata = content_data.get("metadata", {})
            tags = await self.semantic_tagger.extract_tags(
                metadata.get("title", ""),
                metadata.get("description", ""),
                main_topics
            )
            
            integration_results["tags_applied"] = len(tags)
            
            # Store overall content analysis
            await self.knowledge_db.store_analysis_result(
                url=content_data.get("url", ""),
                title=metadata.get("title", ""),
                analysis_data={
                    "content_analysis": content_analysis,
                    "context_evaluation": context_evaluation,
                    "ratings": ratings,
                    "tags": tags
                }
            )
            
            integration_results["knowledge_nodes_updated"] = 1
            
            logger.info("Knowledge graph integration completed", **integration_results)
            return integration_results
            
        except Exception as e:
            logger.error("Knowledge graph integration failed", error=str(e))
            return integration_results
    
    async def _compile_final_report(
        self,
        analysis_id: str,
        url: str,
        content_data: Dict[str, Any],
        content_analysis: Dict[str, Any],
        context_evaluation: Dict[str, Any],
        ratings: Dict[str, Any],
        suggestions: Dict[str, Any],
        graph_integration: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compile the final intelligence report."""
        
        # Extract actionable insights for the summary
        actionable_insights = content_analysis.get("actionable_insights", {})
        actionable_items = actionable_insights.get("actionable_items", [])
        
        # Generate selectable action options
        action_options = await self._generate_action_options(
            content_analysis, context_evaluation, ratings
        )
        
        # Compile the final report
        report = {
            "analysis_id": analysis_id,
            "url": url,
            "analyzed_at": datetime.utcnow().isoformat(),
            
            # Core analysis results
            "content_summary": content_analysis.get("content_summary", {}),
            "technical_concepts": content_analysis.get("technical_concepts", []),
            "innovation_opportunities": content_analysis.get("innovation_opportunities", {}),
            
            # Evaluation and ratings
            "context_evaluation": context_evaluation,
            "ratings": ratings,
            
            # Actionable insights
            "actionable_insights": {
                "total_actions": len(actionable_items),
                "priority_actions": actionable_items[:5],  # Top 5 actions
                "learning_outcomes": actionable_insights.get("learning_outcomes", []),
                "implementation_complexity": actionable_insights.get("complexity", "medium")
            },
            
            # Selectable action options with context and ratings
            "selectable_actions": action_options,
            
            # Enhancement suggestions
            "enhancement_suggestions": {
                "quick_wins": suggestions.get("quick_wins", []),
                "long_term_strategies": suggestions.get("long_term_strategies", []),
                "implementation_roadmap": suggestions.get("implementation_roadmap", {}),
                "priority_recommendations": suggestions.get("prioritized_suggestions", [])[:3]
            },
            
            # DailyDoco integration
            "dailydoco_integration": content_analysis.get("dailydoco_integration", {}),
            
            # Knowledge graph updates
            "knowledge_graph_updates": graph_integration,
            
            # Metadata
            "analysis_metadata": {
                "processing_time_seconds": 0,  # Would be calculated in real implementation
                "confidence_score": ratings.get("confidence_level", 0.85),
                "data_quality": "high",
                "analysis_version": "1.0"
            }
        }
        
        return report
    
    async def _generate_action_options(
        self,
        content_analysis: Dict[str, Any],
        context_evaluation: Dict[str, Any],
        ratings: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate selectable action options with context, ratings, and suggestions."""
        
        action_options = []
        
        # Get base data
        overall_rating = ratings.get("overall_rating", {}).get("score", 5)
        dailydoco_integration = content_analysis.get("dailydoco_integration", {})
        recommended_actions = dailydoco_integration.get("recommended_actions", [])
        
        # Create action options based on the analysis
        for i, action in enumerate(recommended_actions[:10]):  # Limit to top 10
            action_option = {
                "action_id": f"action_{i+1}",
                "action_type": action.get("action_type", "general"),
                "title": action.get("description", f"Action {i+1}"),
                "description": action.get("implementation_notes", "Implementation details not specified"),
                "priority": action.get("priority", "medium"),
                
                # Context and rating
                "context": {
                    "complexity": action.get("complexity", "medium"),
                    "estimated_effort": action.get("effort", "medium"),
                    "expected_impact": action.get("impact", "medium"),
                    "prerequisites": action.get("prerequisites", [])
                },
                
                "rating": {
                    "feasibility_score": min(overall_rating + 1, 10),
                    "value_score": overall_rating,
                    "integration_score": dailydoco_integration.get("compatibility_score", 7.5),
                    "overall_recommendation": "recommended" if overall_rating >= 7 else "consider"
                },
                
                # Enhancement suggestions
                "suggestions": {
                    "implementation_tips": [
                        "Start with a small proof of concept",
                        "Gather team feedback before full implementation",
                        "Document the process for future reference"
                    ],
                    "potential_improvements": [
                        "Consider automation opportunities",
                        "Look for integration with existing tools",
                        "Plan for scalability and maintenance"
                    ],
                    "risk_mitigation": [
                        "Test in a controlled environment first",
                        "Have a rollback plan ready",
                        "Monitor performance impact"
                    ]
                },
                
                # Integration with DailyDoco
                "dailydoco_notes": {
                    "workflow_fit": action.get("workflow_fit", "good"),
                    "automation_potential": action.get("automation_potential", "medium"),
                    "documentation_value": action.get("documentation_value", "high"),
                    "team_utility": action.get("team_utility", "medium")
                }
            }
            
            action_options.append(action_option)
        
        # Add some default action options if none were generated
        if not action_options:
            action_options = [
                {
                    "action_id": "action_1",
                    "action_type": "content_review",
                    "title": "Review and Document Key Concepts",
                    "description": "Extract and document the main technical concepts for team reference",
                    "priority": "medium",
                    "context": {
                        "complexity": "low",
                        "estimated_effort": "low",
                        "expected_impact": "medium",
                        "prerequisites": []
                    },
                    "rating": {
                        "feasibility_score": 9,
                        "value_score": overall_rating,
                        "integration_score": 8.0,
                        "overall_recommendation": "recommended"
                    },
                    "suggestions": {
                        "implementation_tips": ["Create a shared document with key takeaways"],
                        "potential_improvements": ["Link to related internal documentation"],
                        "risk_mitigation": ["Ensure concepts are accurately captured"]
                    },
                    "dailydoco_notes": {
                        "workflow_fit": "excellent",
                        "automation_potential": "high",
                        "documentation_value": "high",
                        "team_utility": "high"
                    }
                }
            ]
        
        return action_options