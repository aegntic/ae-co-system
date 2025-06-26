"""AI-Powered Content Analyzer - Uses LLMs for deep content understanding."""

import asyncio
from typing import Dict, Any, List, Optional
import structlog
import json

try:
    import openai
except ImportError:
    openai = None

try:
    import anthropic
except ImportError:
    anthropic = None

logger = structlog.get_logger()


class AIAnalyzer:
    """Advanced AI-powered content analysis using multiple LLM providers."""
    
    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        preferred_model: str = "claude"
    ):
        self.openai_client = None
        self.anthropic_client = None
        self.preferred_model = preferred_model
        
        if openai_api_key and openai:
            self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
            logger.info("OpenAI client initialized")
        
        if anthropic_api_key and anthropic:
            self.anthropic_client = anthropic.AsyncAnthropic(api_key=anthropic_api_key)
            logger.info("Anthropic client initialized")
    
    async def analyze_content(
        self, 
        content_analysis: Dict[str, Any], 
        context: str = "DailyDoco Pro documentation platform"
    ) -> Dict[str, Any]:
        """Perform deep AI analysis of extracted content."""
        logger.info("Starting AI content analysis")
        
        try:
            # Prepare content for analysis
            analysis_prompt = self._build_content_analysis_prompt(
                content_analysis, context
            )
            
            # Get AI insights
            ai_response = await self._query_ai_model(analysis_prompt)
            
            # Parse and structure the response
            structured_insights = await self._structure_ai_response(ai_response)
            
            return structured_insights
            
        except Exception as e:
            logger.error("AI content analysis failed", error=str(e))
            return self._fallback_analysis(content_analysis)
    
    def _build_content_analysis_prompt(self, content_analysis: Dict[str, Any], context: str) -> str:
        """Build comprehensive prompt for content analysis."""
        
        metadata = content_analysis.get("metadata", {})
        transcript = content_analysis.get("transcript", "")
        
        prompt = f"""
You are an elite AI analyst specializing in developer tools and documentation platforms. 
Analyze this YouTube content for integration opportunities with {context}.

**VIDEO METADATA:**
Title: {metadata.get('title', 'Unknown')}
Description: {metadata.get('description', 'None')}
Duration: {metadata.get('duration', 0)} seconds
Channel: {metadata.get('channel', 'Unknown')}
Tags: {', '.join(metadata.get('tags', []))}
Categories: {', '.join(metadata.get('categories', []))}

**VIDEO TRANSCRIPT:**
{transcript[:3000]}{'...' if len(transcript) > 3000 else ''}

**ANALYSIS REQUIREMENTS:**
Provide a comprehensive analysis in JSON format with these exact keys:

{{
    "key_topics": ["list of 5-10 main topics discussed"],
    "technical_level": "beginner|intermediate|advanced|expert",
    "relevance_score": 0.0-1.0,
    "primary_domain": "programming|devtools|tutorial|demo|review|other",
    "actionable_concepts": [
        {{
            "concept": "specific concept name",
            "description": "what this concept involves",
            "implementation_complexity": 0.0-1.0,
            "potential_impact": 0.0-1.0,
            "dailydoco_relevance": 0.0-1.0
        }}
    ],
    "innovation_opportunities": [
        {{
            "opportunity": "specific opportunity description",
            "technical_requirements": ["list of technical needs"],
            "user_value": "how this benefits users",
            "competitive_advantage": "how this differentiates from competitors"
        }}
    ],
    "integration_points": [
        {{
            "feature_area": "which DailyDoco feature this relates to",
            "integration_type": "enhancement|new_feature|workflow_improvement",
            "description": "how to integrate this concept",
            "effort_estimate": "low|medium|high|very_high"
        }}
    ],
    "quality_indicators": {{
        "content_depth": 0.0-1.0,
        "practical_value": 0.0-1.0,
        "innovation_level": 0.0-1.0,
        "implementation_clarity": 0.0-1.0
    }},
    "confidence": 0.0-1.0,
    "executive_summary": "2-3 sentence summary of key insights"
}}

**CONTEXT ABOUT DAILYDOCO PRO:**
DailyDoco Pro is an intelligent documentation platform that:
- Records developer workflows automatically
- Uses AI to generate contextual narration
- Filters sensitive content for privacy
- Supports multiple platforms (Windows, macOS, Linux, Web)
- Focuses on developer productivity and documentation automation
- Built with Rust (backend) and TypeScript/React (frontend)
- Emphasizes privacy-first, local-processing architecture

Focus on identifying concepts that could enhance developer productivity, improve documentation quality, or provide competitive advantages in the automated documentation space.
"""
        
        return prompt
    
    async def _query_ai_model(self, prompt: str) -> str:
        """Query the preferred AI model for analysis."""
        
        # Try Claude first (preferred for analysis tasks)
        if self.anthropic_client and self.preferred_model == "claude":
            try:
                response = await self.anthropic_client.messages.create(
                    model="claude-3-7-sonnet-20250219",
                    max_tokens=4000,
                    temperature=0.3,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                return response.content[0].text
            except Exception as e:
                logger.warning("Claude analysis failed, trying OpenAI", error=str(e))
        
        # Fallback to OpenAI
        if self.openai_client:
            try:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert AI analyst specializing in developer tools and documentation platforms. Provide detailed, structured analysis in the exact JSON format requested."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=4000,
                    temperature=0.3
                )
                return response.choices[0].message.content
            except Exception as e:
                logger.warning("OpenAI analysis failed", error=str(e))
        
        # If all AI models fail, return structured fallback
        logger.warning("All AI models failed, using fallback analysis")
        return self._generate_fallback_response()
    
    async def _structure_ai_response(self, ai_response: str) -> Dict[str, Any]:
        """Parse and validate AI response structure."""
        try:
            # Try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                parsed = json.loads(json_str)
                
                # Validate required keys
                required_keys = [
                    "key_topics", "technical_level", "relevance_score",
                    "actionable_concepts", "innovation_opportunities",
                    "integration_points", "quality_indicators", "confidence"
                ]
                
                for key in required_keys:
                    if key not in parsed:
                        logger.warning(f"Missing required key: {key}")
                        parsed[key] = self._get_default_value(key)
                
                return parsed
            else:
                logger.warning("No JSON found in AI response")
                return self._fallback_analysis({})
                
        except json.JSONDecodeError as e:
            logger.error("Failed to parse AI response as JSON", error=str(e))
            return self._fallback_analysis({})
    
    def _get_default_value(self, key: str) -> Any:
        """Get default value for missing keys."""
        defaults = {
            "key_topics": [],
            "technical_level": "intermediate",
            "relevance_score": 0.5,
            "actionable_concepts": [],
            "innovation_opportunities": [],
            "integration_points": [],
            "quality_indicators": {
                "content_depth": 0.5,
                "practical_value": 0.5,
                "innovation_level": 0.5,
                "implementation_clarity": 0.5
            },
            "confidence": 0.5,
            "executive_summary": "Analysis completed with limited data"
        }
        return defaults.get(key, None)
    
    def _fallback_analysis(self, content_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fallback analysis when AI fails."""
        metadata = content_analysis.get("metadata", {})
        
        return {
            "key_topics": self._extract_topics_from_metadata(metadata),
            "technical_level": "intermediate",
            "relevance_score": 0.5,
            "primary_domain": "other",
            "actionable_concepts": [],
            "innovation_opportunities": [],
            "integration_points": [],
            "quality_indicators": {
                "content_depth": 0.5,
                "practical_value": 0.5,
                "innovation_level": 0.5,
                "implementation_clarity": 0.5
            },
            "confidence": 0.3,
            "executive_summary": "Basic analysis completed using metadata only"
        }
    
    def _extract_topics_from_metadata(self, metadata: Dict[str, Any]) -> List[str]:
        """Extract topics from video metadata."""
        topics = []
        
        # Extract from tags
        tags = metadata.get('tags', [])
        topics.extend(tags[:5])  # Take first 5 tags
        
        # Extract from title
        title = metadata.get('title', '').lower()
        tech_keywords = [
            'programming', 'coding', 'development', 'tutorial', 'api',
            'database', 'frontend', 'backend', 'javascript', 'python',
            'react', 'vue', 'angular', 'node', 'docker', 'kubernetes'
        ]
        
        for keyword in tech_keywords:
            if keyword in title:
                topics.append(keyword)
        
        return list(set(topics))[:10]  # Remove duplicates, limit to 10
    
    def _generate_fallback_response(self) -> str:
        """Generate a fallback JSON response when AI models are unavailable."""
        return '''
{
    "key_topics": ["general content"],
    "technical_level": "intermediate",
    "relevance_score": 0.5,
    "primary_domain": "other",
    "actionable_concepts": [],
    "innovation_opportunities": [],
    "integration_points": [],
    "quality_indicators": {
        "content_depth": 0.5,
        "practical_value": 0.5,
        "innovation_level": 0.5,
        "implementation_clarity": 0.5
    },
    "confidence": 0.3,
    "executive_summary": "Analysis unavailable - AI models not accessible"
}
        '''
    
    async def generate_executive_summary(
        self, 
        content_data: Dict[str, Any], 
        top_actions: List[Dict[str, Any]], 
        knowledge_updates: List[Dict[str, Any]]
    ) -> str:
        """Generate executive summary of the analysis."""
        
        try:
            summary_prompt = self._build_summary_prompt(content_data, top_actions, knowledge_updates)
            summary = await self._query_ai_model_for_summary(summary_prompt)
            return summary
        except Exception as e:
            logger.error("Executive summary generation failed", error=str(e))
            return self._generate_fallback_summary(content_data, top_actions)
    
    def _build_summary_prompt(self, content_data: Dict[str, Any], top_actions: List[Dict[str, Any]], knowledge_updates: List[Dict[str, Any]]) -> str:
        """Build prompt for executive summary."""
        
        video_title = content_data.get("video_data", {}).get("metadata", {}).get("title", "Unknown")
        action_count = len(top_actions)
        knowledge_count = len(knowledge_updates)
        
        return f"""
Generate a concise executive summary (2-3 paragraphs) for this YouTube intelligence analysis:

**VIDEO:** {video_title}
**ACTIONS IDENTIFIED:** {action_count} actionable opportunities
**KNOWLEDGE UPDATES:** {knowledge_count} new concepts/relationships

**TOP ACTIONS:**
{self._format_top_actions(top_actions[:3])}

Provide a strategic summary that:
1. Highlights the most valuable opportunities for DailyDoco Pro
2. Explains the potential impact on user experience and competitive positioning
3. Provides clear recommendations for next steps

Keep it executive-level: strategic insights, not technical details.
"""
    
    def _format_top_actions(self, actions: List[Dict[str, Any]]) -> str:
        """Format top actions for summary prompt."""
        formatted = []
        for i, action in enumerate(actions, 1):
            action_data = action.get("action", {})
            title = action_data.get("title", "Unknown Action")
            impact = action.get("ratings", {}).get("impact", 0)
            formatted.append(f"{i}. {title} (Impact: {impact:.1f}/1.0)")
        return "\n".join(formatted)
    
    async def _query_ai_model_for_summary(self, prompt: str) -> str:
        """Query AI model specifically for summary generation."""
        
        if self.anthropic_client:
            try:
                response = await self.anthropic_client.messages.create(
                    model="claude-3-7-sonnet-20250219",
                    max_tokens=1000,
                    temperature=0.4,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text
            except Exception:
                pass
        
        if self.openai_client:
            try:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an executive consultant specializing in product strategy for developer tools. Provide strategic, actionable summaries."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=1000,
                    temperature=0.4
                )
                return response.choices[0].message.content
            except Exception:
                pass
        
        return "Executive summary unavailable - AI models not accessible"
    
    def _generate_fallback_summary(self, content_data: Dict[str, Any], top_actions: List[Dict[str, Any]]) -> str:
        """Generate fallback summary when AI is unavailable."""
        video_title = content_data.get("video_data", {}).get("metadata", {}).get("title", "Unknown")
        action_count = len(top_actions)
        
        return f"""
**YouTube Intelligence Analysis Complete**

Analyzed video: "{video_title}"

Identified {action_count} actionable opportunities for DailyDoco Pro integration. The analysis focused on extracting implementable concepts that could enhance developer productivity and documentation automation.

**Key Recommendations:** Review the top-rated actions for potential integration into the DailyDoco Pro roadmap. Focus on opportunities that align with the platform's privacy-first, developer-centric approach.

Note: Full AI analysis unavailable. Manual review recommended for comprehensive insights.
"""
