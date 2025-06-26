#!/usr/bin/env python3
"""YouTube Intelligence Engine - Main Application Entry Point."""

import asyncio
import os
from datetime import datetime
from contextlib import asynccontextmanager
import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from core.intelligence_engine import IntelligenceEngine
from api.intelligence_api import router as intelligence_router, set_intelligence_engine, set_knowledge_db
from api.graphitti_api import router as graphitti_router, set_graphitti
from graph.knowledge_db import KnowledgeDB
from graph.graphitti import Graphitti
from services.graphitti_scheduler import GraphittiScheduler
from config import get_config

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Global instances
knowledge_db = None
graphitti = None
scheduler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global knowledge_db, graphitti, scheduler
    
    logger.info("Starting YouTube Intelligence Engine")
    
    try:
        # Get configuration
        config = get_config()
        db_config = config.get_database_config()
        
        # Initialize database connection
        postgres_url = db_config["postgres_url"]
        neo4j_url = db_config["neo4j_url"]
        neo4j_user = db_config["neo4j_user"]
        neo4j_password = db_config["neo4j_password"]
        
        knowledge_db = KnowledgeDB(
            postgres_url=postgres_url,
            neo4j_url=neo4j_url,
            neo4j_auth=(neo4j_user, neo4j_password)
        )
        await knowledge_db.initialize()
        logger.info("Database initialized successfully")
        
        # Initialize Intelligence Engine
        intelligence_engine = IntelligenceEngine(knowledge_db)
        set_intelligence_engine(intelligence_engine)  # Set global instance for API
        set_knowledge_db(knowledge_db)  # Set global instance for API
        logger.info("Intelligence engine initialized")
        
        # Initialize Graphitti versioning system
        graphitti = Graphitti(knowledge_db)
        await graphitti.initialize_schema()
        set_graphitti(graphitti)  # Set global instance for API
        logger.info("Graphitti versioning system initialized")
        
        # Initialize and start scheduler if enabled
        if config.is_feature_enabled("enable_scheduler"):
            scheduler = GraphittiScheduler(graphitti)
            await scheduler.start()
            logger.info("Graphitti scheduler started")
        else:
            logger.info("Graphitti scheduler disabled by configuration")
        
        yield
        
    except Exception as e:
        logger.error("Failed to initialize services", error=str(e))
        raise
    finally:
        # Cleanup
        logger.info("Shutting down YouTube Intelligence Engine")
        
        if scheduler:
            await scheduler.stop()
            logger.info("Scheduler stopped")
            
        if knowledge_db:
            await knowledge_db.close()
            logger.info("Database connections closed")

# Create FastAPI application
app = FastAPI(
    title="YouTube Intelligence Engine",
    description="AI-powered YouTube content analysis with knowledge graph versioning",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(intelligence_router, prefix="/api")
app.include_router(graphitti_router, prefix="/api")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "YouTube Intelligence Engine with Graphitti Versioning",
        "version": "1.0.0",
        "status": "operational",
        "features": [
            "YouTube content analysis",
            "AI-powered action generation", 
            "Knowledge graph construction",
            "Advanced graph versioning (Graphitti)",
            "Evolution tracking and analytics",
            "Automated snapshots and backups"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": "connected" if knowledge_db else "disconnected",
            "graphitti": "active" if graphitti else "inactive",
            "scheduler": "running" if scheduler and scheduler.is_running else "stopped"
        }
    }

@app.get("/config/openrouter/models")
async def get_available_models():
    """Get available OpenRouter models."""
    from config import get_openrouter_models
    return {
        "available_models": get_openrouter_models(),
        "current_config": get_config().get_openrouter_config()
    }

@app.post("/config/openrouter/key")
async def update_openrouter_key(new_key: str):
    """Update OpenRouter API key."""
    from config import update_openrouter_key
    
    try:
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

@app.get("/config/template")
async def get_env_template():
    """Get environment variable template."""
    from config import get_env_template
    return {
        "template": get_env_template(),
        "note": "Copy these environment variables to your .env file and customize as needed"
    }

def main():
    """Main entry point."""
    config = get_config()
    server_config = config.get_server_config()
    
    host = server_config["host"]
    port = server_config["port"]
    debug = server_config["debug"]
    log_level = server_config["log_level"]
    
    logger.info(
        "Starting server",
        host=host,
        port=port,
        debug=debug,
        log_level=log_level
    )
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level=log_level,
        access_log=True
    )

if __name__ == "__main__":
    main()
