"""Intelligence API - FastAPI endpoints for YouTube Intelligence Engine."""

import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import structlog
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl, Field

from core.intelligence_engine import IntelligenceEngine
from graph.knowledge_db import KnowledgeDB

logger = structlog.get_logger()

# Pydantic models
class YouTubeAnalysisRequest(BaseModel):
    url: HttpUrl = Field(..., description="YouTube URL to analyze")
    priority: str = Field("normal", description="Analysis priority: low, normal, high")
    context: Optional[str] = Field(None, description="Additional context for analysis")

class YouTubeAnalysisResponse(BaseModel):
    analysis_id: str
    url: str
    status: str
    actionable_insights: Dict[str, Any]
    selectable_actions: list
    ratings: Dict[str, Any]
    enhancement_suggestions: Dict[str, Any]
    metadata: Dict[str, Any]

# API Router
router = APIRouter(
    prefix="",
    tags=["YouTube Intelligence"]
)

# Global instances (set by main.py)
intelligence_engine_instance = None
knowledge_db_instance = None

def set_intelligence_engine(engine: IntelligenceEngine):
    """Set the global intelligence engine instance."""
    global intelligence_engine_instance
    intelligence_engine_instance = engine

def set_knowledge_db(db: KnowledgeDB):
    """Set the global knowledge database instance."""
    global knowledge_db_instance
    knowledge_db_instance = db

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "components": {
            "intelligence_engine": intelligence_engine_instance is not None,
            "knowledge_db": knowledge_db_instance is not None
        }
    }

@router.post("/analyze", response_model=YouTubeAnalysisResponse)
async def analyze_youtube_url(
    request: YouTubeAnalysisRequest,
    background_tasks: BackgroundTasks
) -> YouTubeAnalysisResponse:
    """Analyze YouTube URL and generate actionable intelligence."""
    logger.info("Received YouTube analysis request", url=str(request.url))
    
    if not intelligence_engine_instance:
        raise HTTPException(status_code=503, detail="Intelligence engine not available")
    
    try:
        # Perform the analysis
        analysis_result = await intelligence_engine_instance.analyze_youtube_url(str(request.url))
        
        # Transform result to match response model
        response_data = {
            "analysis_id": analysis_result["analysis_id"],
            "url": str(request.url),
            "status": "completed",
            "actionable_insights": analysis_result.get("actionable_insights", {}),
            "selectable_actions": analysis_result.get("selectable_actions", []),
            "ratings": analysis_result.get("ratings", {}),
            "enhancement_suggestions": analysis_result.get("enhancement_suggestions", {}),
            "metadata": analysis_result.get("analysis_metadata", {})
        }
        
        logger.info("YouTube analysis completed successfully", 
                   analysis_id=analysis_result["analysis_id"])
        
        return YouTubeAnalysisResponse(**response_data)
        
    except Exception as e:
        logger.error("YouTube analysis failed", url=str(request.url), error=str(e))
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/knowledge/analytics")
async def get_knowledge_analytics():
    """Get knowledge graph analytics."""
    if not knowledge_db_instance:
        raise HTTPException(status_code=503, detail="Knowledge database not available")
    
    try:
        analytics = await knowledge_db_instance.get_knowledge_analytics()
        return analytics
    except Exception as e:
        logger.error("Failed to get knowledge analytics", error=str(e))
        raise HTTPException(status_code=500, detail=f"Analytics failed: {str(e)}")

@router.get("/models/status")
async def get_model_status():
    """Get AI model status and configuration."""
    from config import get_config
    
    config = get_config()
    openrouter_config = config.get_openrouter_config()
    
    return {
        "ai_provider": "OpenRouter",
        "models": openrouter_config["models"],
        "status": "operational",
        "features": {
            "content_analysis": True,
            "context_evaluation": True,
            "rating_generation": True,
            "suggestion_generation": True
        }
    }

@router.get("/intelligence/history")
async def get_analysis_history(
    limit: int = 5,
    offset: int = 0
):
    """Get recent YouTube analysis history."""
    if not knowledge_db_instance:
        raise HTTPException(status_code=503, detail="Knowledge database not available")
    
    try:
        async with knowledge_db_instance.pg_pool.acquire() as conn:
            # Get recent analysis records from database
            analyses = await conn.fetch(
                """
                SELECT id, url, metadata, created_at
                FROM analyses 
                ORDER BY created_at DESC 
                LIMIT $1 OFFSET $2
                """,
                limit, offset
            )
            
            return {
                "analyses": [
                    {
                        "id": str(analysis["id"]),
                        "url": analysis["url"],
                        "title": analysis["metadata"].get("title", "Unknown"),
                        "created_at": analysis["created_at"].isoformat(),
                        "status": "completed"
                    }
                    for analysis in analyses
                ],
                "total_count": len(analyses)
            }
    except Exception as e:
        logger.warning("Failed to get analysis history", error=str(e))
        # Return mock data if database query fails
        return {
            "analyses": [],
            "total_count": 0
        }

@router.get("/graph/stats")
async def get_graph_stats():
    """Get knowledge graph statistics."""
    if not knowledge_db_instance:
        raise HTTPException(status_code=503, detail="Knowledge database not available")
    
    try:
        analytics = await knowledge_db_instance.get_knowledge_analytics()
        return {
            "concepts": analytics.get("total_concepts", 0),
            "relationships": analytics.get("total_relationships", 0),
            "actions": analytics.get("total_actions", 0),
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.warning("Failed to get graph stats", error=str(e))
        # Return mock data if database query fails
        return {
            "concepts": 0,
            "relationships": 0,
            "actions": 0,
            "last_updated": datetime.utcnow().isoformat()
        }

@router.get("/config")
async def get_config():
    """Get current configuration."""
    from config import get_config
    
    config = get_config()
    openrouter_config = config.get_openrouter_config()
    
    return {
        "openrouter": {
            "models": openrouter_config["models"],
            "has_api_key": bool(openrouter_config.get("api_key"))
        },
        "features": {
            "graphitti_enabled": config.is_feature_enabled("enable_graphitti"),
            "scheduler_enabled": config.is_feature_enabled("enable_scheduler")
        }
    }

@router.post("/config/openrouter-key")
async def update_openrouter_key_endpoint(request: dict):
    """Update OpenRouter API key."""
    from config import update_openrouter_key
    
    try:
        new_key = request.get("key")
        if not new_key:
            raise HTTPException(status_code=400, detail="API key is required")
            
        update_openrouter_key(new_key)
        return {
            "status": "success",
            "message": "OpenRouter API key updated successfully",
            "key_preview": f"{new_key[:8]}...{new_key[-4:]}" if len(new_key) > 12 else "***"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to update API key: {str(e)}"
        }