"""Content Analyzer - AI-powered content analysis using OpenRouter models."""

import asyncio
import json
from typing import Dict, Any, List, Optional
import httpx
import structlog
from datetime import datetime

logger = structlog.get_logger()


class ContentAnalyzer:
    """AI-powered content analysis using OpenRouter's best free premium models."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        # Import here to avoid circular imports
        from config import get_config
        
        if config is None:
            config = get_config().get_openrouter_config()
        
        self.api_key = config["api_key"]
        self.base_url = config["base_url"]
        self.models = config["models"]
        self.client = httpx.AsyncClient(timeout=60.0)
        
        logger.info("Content analyzer initialized with OpenRouter", models=self.models)
    
    async def analyze_content(
        self,
        title: str,
        description: str,
        transcript: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze YouTube content comprehensively using AI."""
        
        logger.info("Starting comprehensive content analysis", title=title[:50])
        
        # Prepare content for analysis
        content_text = self._prepare_content_text(title, description, transcript, metadata)
        
        try:
            # Use reasoning model for deep analysis
            analysis_result = await self._analyze_with_model(
                content_text, 
                self.models["reasoning"],
                "comprehensive_analysis"
            )
            
            # Extract structured insights
            insights = await self._extract_insights(analysis_result, content_text)
            
            # Generate actionable concepts
            concepts = await self._generate_concepts(analysis_result, content_text)
            
            # Calculate innovation opportunities
            innovations = await self._identify_innovations(analysis_result, content_text)
            
            # Assess DailyDoco integration potential
            integration_analysis = await self._analyze_dailydoco_integration(
                analysis_result, content_text, metadata
            )
            
            return {
                "analysis_id": f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                "content_summary": {
                    "title": title,
                    "main_topics": insights.get("main_topics", []),
                    "key_technologies": insights.get("technologies", []),
                    "complexity_level": insights.get("complexity", "medium"),
                    "content_type": insights.get("content_type", "tutorial")
                },
                "actionable_insights": insights,
                "technical_concepts": concepts,
                "innovation_opportunities": innovations,
                "dailydoco_integration": integration_analysis,
                "analysis_metadata": {
                    "analyzed_at": datetime.utcnow().isoformat(),
                    "model_used": self.models["reasoning"],
                    "content_length": len(content_text),
                    "analysis_version": "1.0"
                }
            }
            
        except Exception as e:
            logger.error("Content analysis failed", error=str(e))
            return await self._fallback_analysis(title, description, transcript, metadata)
    
    async def _analyze_with_model(
        self, 
        content: str, 
        model: str, 
        analysis_type: str
    ) -> Dict[str, Any]:
        """Analyze content with specified OpenRouter model."""
        
        prompts = {
            "comprehensive_analysis": f"""
Analyze this YouTube content comprehensively for a developer documentation platform called DailyDoco Pro.

Content to analyze:
{content[:4000]}...

Provide a detailed analysis including:
1. Main technical topics and technologies discussed
2. Key learning outcomes and actionable insights
3. Complexity level (beginner/intermediate/advanced)
4. Content type (tutorial, review, demo, discussion, etc.)
5. Notable innovations or unique approaches
6. Potential integration points with documentation workflows
7. Target audience and skill level
8. Most valuable concepts for developers

Focus on actionable intelligence that could help developers improve their workflows, learn new technologies, or solve specific problems.

Respond in JSON format with structured analysis.
""",
            "concept_extraction": f"""
Extract the most important technical concepts, tools, and methodologies from this content:

{content[:3000]}...

For each concept, provide:
- Concept name
- Category (programming language, framework, tool, methodology, etc.)
- Importance level (1-10)
- Brief description
- Potential applications
- Learning difficulty

Return as JSON array of concept objects.
""",
            "innovation_identification": f"""
Identify innovative ideas, unique approaches, or novel solutions in this content:

{content[:3000]}...

Look for:
- New ways of solving problems
- Creative combinations of technologies
- Emerging trends or techniques
- Unique development approaches
- Process improvements
- Novel tools or methodologies

Return JSON with innovation analysis.
"""
        }
        
        prompt = prompts.get(analysis_type, prompts["comprehensive_analysis"])
        
        try:
            response = await self.client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert technical content analyst specializing in developer tools, programming, and software engineering. Provide detailed, actionable insights in valid JSON format."
                        },
                        {
                            "role": "user", 
                            "content": prompt
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 2000
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content_text = result["choices"][0]["message"]["content"]
                
                # Try to parse as JSON, fallback to text analysis
                try:
                    return json.loads(content_text)
                except json.JSONDecodeError:
                    return {"raw_analysis": content_text, "parsed": False}
            else:
                logger.warning(f"OpenRouter API error: {response.status_code}")
                return {"error": f"API error: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Model analysis failed: {e}")
            return {"error": str(e)}
    
    async def _extract_insights(self, analysis: Dict[str, Any], content: str) -> Dict[str, Any]:
        """Extract structured insights from analysis."""
        
        if "error" in analysis:
            return self._default_insights(content)
        
        # If we have structured JSON analysis
        if isinstance(analysis, dict) and "raw_analysis" not in analysis:
            return {
                "main_topics": analysis.get("main_topics", []),
                "technologies": analysis.get("technologies", []),
                "complexity": analysis.get("complexity_level", "medium"),
                "content_type": analysis.get("content_type", "tutorial"),
                "learning_outcomes": analysis.get("learning_outcomes", []),
                "target_audience": analysis.get("target_audience", "developers"),
                "actionable_items": analysis.get("actionable_insights", [])
            }
        
        # Fallback to keyword extraction
        return self._default_insights(content)
    
    async def _generate_concepts(self, analysis: Dict[str, Any], content: str) -> List[Dict[str, Any]]:
        """Generate technical concepts from content."""
        
        try:
            concept_analysis = await self._analyze_with_model(
                content, 
                self.models["general"], 
                "concept_extraction"
            )
            
            if isinstance(concept_analysis, list):
                return concept_analysis
            elif isinstance(concept_analysis, dict) and "concepts" in concept_analysis:
                return concept_analysis["concepts"]
            
        except Exception as e:
            logger.warning(f"Concept generation failed: {e}")
        
        # Fallback concept extraction
        return self._extract_default_concepts(content)
    
    async def _identify_innovations(self, analysis: Dict[str, Any], content: str) -> Dict[str, Any]:
        """Identify innovation opportunities."""
        
        try:
            innovation_analysis = await self._analyze_with_model(
                content, 
                self.models["creative"], 
                "innovation_identification"
            )
            
            if isinstance(innovation_analysis, dict) and "error" not in innovation_analysis:
                return innovation_analysis
                
        except Exception as e:
            logger.warning(f"Innovation analysis failed: {e}")
        
        # Fallback innovation detection
        return {
            "innovations_found": [],
            "potential_improvements": [],
            "emerging_trends": [],
            "novel_approaches": []
        }
    
    async def _analyze_dailydoco_integration(
        self, 
        analysis: Dict[str, Any], 
        content: str, 
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze integration potential with DailyDoco Pro."""
        
        # Extract video metadata for context
        duration = metadata.get("duration", 0)
        view_count = metadata.get("view_count", 0)
        
        integration_potential = {
            "documentation_value": "high" if any(
                keyword in content.lower() 
                for keyword in ["tutorial", "guide", "how to", "documentation", "explain"]
            ) else "medium",
            
            "workflow_integration": [],
            "capture_recommendations": [],
            "automation_opportunities": [],
            
            "compatibility_score": 8.5,  # Default high compatibility
            
            "recommended_actions": [
                {
                    "action_type": "capture_workflow",
                    "priority": "high",
                    "description": "Set up automated capture for similar development content",
                    "implementation_notes": "Use DailyDoco's intelligent capture during coding sessions"
                },
                {
                    "action_type": "knowledge_extraction", 
                    "priority": "medium",
                    "description": "Extract key concepts for team knowledge base",
                    "implementation_notes": "Integrate extracted concepts into project documentation"
                }
            ]
        }
        
        # Enhance based on content analysis
        if isinstance(analysis, dict) and "technologies" in analysis:
            for tech in analysis.get("technologies", []):
                integration_potential["workflow_integration"].append({
                    "technology": tech,
                    "integration_type": "development_workflow",
                    "difficulty": "low"
                })
        
        return integration_potential
    
    def _prepare_content_text(
        self, 
        title: str, 
        description: str, 
        transcript: str, 
        metadata: Dict[str, Any]
    ) -> str:
        """Prepare content text for analysis."""
        
        content_parts = [
            f"Title: {title}",
            f"Description: {description[:500]}..." if len(description) > 500 else f"Description: {description}",
        ]
        
        if transcript:
            # Truncate transcript if too long
            transcript_text = transcript[:3000] + "..." if len(transcript) > 3000 else transcript
            content_parts.append(f"Transcript: {transcript_text}")
        
        # Add relevant metadata
        if metadata.get("tags"):
            content_parts.append(f"Tags: {', '.join(metadata['tags'][:10])}")
        
        return "\n\n".join(content_parts)
    
    def _default_insights(self, content: str) -> Dict[str, Any]:
        """Generate default insights when AI analysis fails."""
        
        # Simple keyword-based analysis
        tech_keywords = {
            "python", "javascript", "react", "node", "docker", "kubernetes", 
            "aws", "git", "api", "database", "sql", "nosql", "machine learning",
            "ai", "frontend", "backend", "devops", "ci/cd", "testing"
        }
        
        found_technologies = [
            tech for tech in tech_keywords 
            if tech in content.lower()
        ]
        
        return {
            "main_topics": found_technologies[:5],
            "technologies": found_technologies,
            "complexity": "medium",
            "content_type": "tutorial",
            "learning_outcomes": ["Technical knowledge", "Practical skills"],
            "target_audience": "developers",
            "actionable_items": ["Learn about mentioned technologies", "Apply concepts to projects"]
        }
    
    def _extract_default_concepts(self, content: str) -> List[Dict[str, Any]]:
        """Extract default concepts when AI analysis fails."""
        
        concepts = []
        
        # Simple pattern matching for common technical concepts
        patterns = {
            "programming languages": ["python", "javascript", "java", "go", "rust", "c++"],
            "frameworks": ["react", "vue", "angular", "django", "flask", "express"],
            "tools": ["docker", "kubernetes", "git", "npm", "webpack", "vite"],
            "platforms": ["aws", "azure", "gcp", "vercel", "netlify"]
        }
        
        for category, items in patterns.items():
            for item in items:
                if item in content.lower():
                    concepts.append({
                        "name": item.title(),
                        "category": category,
                        "importance": 7,
                        "description": f"{item.title()} - mentioned in content",
                        "difficulty": "medium"
                    })
        
        return concepts[:10]  # Limit to top 10
    
    async def _fallback_analysis(
        self, 
        title: str, 
        description: str, 
        transcript: str, 
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Fallback analysis when all AI models fail."""
        
        logger.warning("Using fallback analysis due to AI model failures")
        
        content_text = self._prepare_content_text(title, description, transcript, metadata)
        
        return {
            "analysis_id": f"fallback_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "content_summary": {
                "title": title,
                "main_topics": ["General content"],
                "key_technologies": [],
                "complexity_level": "unknown",
                "content_type": "video"
            },
            "actionable_insights": self._default_insights(content_text),
            "technical_concepts": self._extract_default_concepts(content_text),
            "innovation_opportunities": {
                "innovations_found": [],
                "note": "AI analysis unavailable - manual review recommended"
            },
            "dailydoco_integration": {
                "documentation_value": "medium",
                "compatibility_score": 7.0,
                "recommended_actions": [
                    {
                        "action_type": "manual_review",
                        "priority": "medium", 
                        "description": "Manual content review recommended",
                        "implementation_notes": "AI analysis failed - review content manually"
                    }
                ]
            },
            "analysis_metadata": {
                "analyzed_at": datetime.utcnow().isoformat(),
                "model_used": "fallback",
                "analysis_version": "1.0",
                "note": "Fallback analysis used due to AI model unavailability"
            }
        }
    
    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()
    
    @classmethod
    def update_api_key(cls, new_api_key: str) -> None:
        """Update the API key for future instances."""
        # This would typically update a configuration file or environment variable
        logger.info("API key update requested - implement persistent storage as needed")
        
    @classmethod
    def get_available_models(cls) -> Dict[str, str]:
        """Get list of available models and their purposes."""
        return {
            "reasoning": "deepseek/deepseek-r1-distill-llama-70b - Best for complex analysis and reasoning",
            "general": "meta-llama/llama-3.1-8b-instruct:free - Fast general purpose analysis", 
            "creative": "mistralai/mistral-7b-instruct:free - Good for creative and innovative insights",
            "fallback": "qwen/qwen-2-7b-instruct:free - Reliable fallback option"
        }