"""
Video/Slideshow Generator Service
AI-powered video and slideshow generation for GitHub repositories
"""

import asyncio
import logging
import os
import signal
from contextlib import asynccontextmanager
from typing import Any, Dict

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings
from .database import DatabaseManager
from .queue_manager import QueueManager
from .video_generator import VideoGenerator
from .slideshow_generator import SlideshowGenerator
from .worker import VideoWorker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global components
settings = Settings()
db_manager = DatabaseManager(settings.database_url)
queue_manager = QueueManager(settings.redis_url)
video_generator = VideoGenerator(settings)
slideshow_generator = SlideshowGenerator(settings)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Video/Slideshow Generator Service...")
    
    # Initialize database connection
    await db_manager.connect()
    
    # Initialize queue manager
    await queue_manager.connect()
    
    # Start worker tasks
    worker_tasks = []
    for i in range(settings.worker_concurrency):
        worker = VideoWorker(
            worker_id=i,
            queue_manager=queue_manager,
            video_generator=video_generator,
            slideshow_generator=slideshow_generator,
            db_manager=db_manager,
        )
        task = asyncio.create_task(worker.start())
        worker_tasks.append(task)
    
    logger.info(f"Started {len(worker_tasks)} worker tasks")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Video/Slideshow Generator Service...")
    
    # Cancel worker tasks
    for task in worker_tasks:
        task.cancel()
    
    # Wait for workers to finish
    await asyncio.gather(*worker_tasks, return_exceptions=True)
    
    # Close connections
    await queue_manager.disconnect()
    await db_manager.disconnect()


# Create FastAPI app
app = FastAPI(
    title="Video/Slideshow Generator",
    description="AI-powered video and slideshow generation service",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint"""
    return {"message": "Video/Slideshow Generator Service", "status": "healthy"}


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    try:
        # Check database connection
        db_healthy = await db_manager.health_check()
        
        # Check Redis connection
        queue_healthy = await queue_manager.health_check()
        
        return {
            "status": "healthy" if db_healthy and queue_healthy else "unhealthy",
            "database": "healthy" if db_healthy else "unhealthy",
            "queue": "healthy" if queue_healthy else "unhealthy",
            "service": "video-slideshow-generator",
            "version": "1.0.0",
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "service": "video-slideshow-generator",
            "version": "1.0.0",
        }


@app.get("/queue/stats")
async def queue_stats() -> Dict[str, Any]:
    """Get queue statistics"""
    try:
        stats = await queue_manager.get_queue_stats()
        return {"status": "success", "stats": stats}
    except Exception as e:
        logger.error(f"Failed to get queue stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/video")
async def generate_video_endpoint(job_data: Dict[str, Any]) -> Dict[str, str]:
    """Manually trigger video generation (for testing)"""
    try:
        job_id = await queue_manager.add_video_job(job_data)
        return {"status": "success", "job_id": job_id}
    except Exception as e:
        logger.error(f"Failed to queue video job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/slideshow")
async def generate_slideshow_endpoint(job_data: Dict[str, Any]) -> Dict[str, str]:
    """Manually trigger slideshow generation (for testing)"""
    try:
        job_id = await queue_manager.add_slideshow_job(job_data)
        return {"status": "success", "job_id": job_id}
    except Exception as e:
        logger.error(f"Failed to queue slideshow job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def signal_handler(signum: int, frame: Any) -> None:
    """Handle shutdown signals"""
    logger.info(f"Received signal {signum}, initiating graceful shutdown...")
    # FastAPI will handle the shutdown via the lifespan context manager


if __name__ == "__main__":
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Run the server
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.port,
        log_level="info",
        reload=settings.debug,
    )