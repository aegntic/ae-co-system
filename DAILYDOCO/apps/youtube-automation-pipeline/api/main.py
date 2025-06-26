"""Main FastAPI application for YouTube Automation Pipeline."""

import asyncio
import time
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager
from fastapi import (
    FastAPI, HTTPException, Depends, BackgroundTasks,
    UploadFile, File, Form, Security, status
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import structlog
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from starlette.responses import Response

from ..config.settings import get_settings
from ..core.video_processing_engine import VideoProcessingEngine, VideoProcessingConfig, VideoFormat
from ..services.youtube_api_service import YouTubeAPIService, UploadMetadata
from ..services.content_generation_service import (
    ContentGenerationService, ContentGenerationConfig, Platform, ContentType
)
from ..utils.security_manager import SecurityManager, SecurityContext, PermissionType
from ..workers.celery_app import celery_app
from ..workers import video_processing_worker, youtube_upload_worker
from ..models.api_models import (
    JobRequest, JobResponse, JobStatus, UploadRequest,
    ContentGenerationRequest, AnalyticsResponse, HealthResponse
)

logger = structlog.get_logger()
settings = get_settings()

# Prometheus metrics
REQUEST_COUNT = Counter(
    'youtube_pipeline_requests_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'youtube_pipeline_request_duration_seconds',
    'Request duration',
    ['method', 'endpoint']
)

ACTIVE_JOBS = Gauge(
    'youtube_pipeline_active_jobs',
    'Active processing jobs',
    ['job_type']
)

QUEUE_SIZE = Gauge(
    'youtube_pipeline_queue_size',
    'Queue size',
    ['queue_name']
)

# Security
security = HTTPBearer()

# Global service instances
video_engine: Optional[VideoProcessingEngine] = None
youtube_service: Optional[YouTubeAPIService] = None
content_service: Optional[ContentGenerationService] = None
security_manager: Optional[SecurityManager] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global video_engine, youtube_service, content_service, security_manager
    
    logger.info("Starting YouTube Automation Pipeline API")
    
    try:
        # Initialize services
        video_engine = VideoProcessingEngine()
        youtube_service = YouTubeAPIService()
        content_service = ContentGenerationService()
        security_manager = SecurityManager()
        
        # Initialize YouTube channels
        await youtube_service.initialize_channels("/app/credentials/youtube")
        
        logger.info("All services initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error("Service initialization failed", error=str(e))
        raise
    finally:
        # Cleanup
        logger.info("Shutting down services")
        
        if video_engine:
            await video_engine.shutdown()
        if youtube_service:
            await youtube_service.shutdown()
        if content_service:
            await content_service.shutdown()
        if security_manager:
            await security_manager.shutdown()
        
        logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="YouTube Automation Pipeline",
    description="Automated video processing and YouTube upload pipeline",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.security.cors_origins if settings.security.cors_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.debug else ["localhost", "127.0.0.1"]
)


# Dependency injection
async def get_security_context(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> SecurityContext:
    """Get and validate security context."""
    
    if not security_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Security manager not initialized"
        )
    
    # Extract IP address (simplified)
    ip_address = "127.0.0.1"  # In production, extract from request headers
    
    security_context = await security_manager.validate_access_token(
        credentials.credentials, ip_address
    )
    
    if not security_context:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return security_context


async def require_permission(
    permission: PermissionType,
    resource_id: Optional[str] = None
):
    """Dependency to require specific permission."""
    
    async def check_permission(
        security_context: SecurityContext = Depends(get_security_context)
    ):
        if not await security_manager.check_permission(
            security_context, permission, resource_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions: {permission.value}"
            )
        return security_context
    
    return check_permission


# Request/Response Models
class ProcessVideoRequest(BaseModel):
    input_path: str = Field(..., description="Path to input video file")
    output_path: str = Field(..., description="Path for output video file")
    format: str = Field(default="youtube_long", description="Target video format")
    quality_preset: str = Field(default="high", description="Quality preset")
    enable_gpu: bool = Field(default=True, description="Enable GPU acceleration")
    enable_ai_narration: bool = Field(default=True, description="Enable AI narration")
    enable_authenticity_injection: bool = Field(default=True, description="Enable authenticity injection")
    priority: str = Field(default="normal", description="Processing priority")


class UploadVideoRequest(BaseModel):
    video_path: str = Field(..., description="Path to video file")
    title: str = Field(..., description="Video title")
    description: str = Field(..., description="Video description")
    tags: List[str] = Field(default=[], description="Video tags")
    category_id: str = Field(default="28", description="YouTube category ID")
    privacy_status: str = Field(default="public", description="Privacy status")
    channel_id: Optional[str] = Field(None, description="Specific channel ID")
    thumbnail_path: Optional[str] = Field(None, description="Custom thumbnail path")
    playlist_id: Optional[str] = Field(None, description="Playlist to add video to")


class GenerateContentRequest(BaseModel):
    input_video_path: str = Field(..., description="Path to input video")
    target_platforms: List[str] = Field(..., description="Target platforms")
    content_types: List[str] = Field(..., description="Content types to generate")
    enable_viral_extraction: bool = Field(default=True, description="Extract viral clips")
    max_clips_per_video: int = Field(default=5, description="Maximum clips to extract")


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    stage: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str


# API Endpoints

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    
    try:
        # Check service health
        services_status = {
            "video_engine": video_engine is not None,
            "youtube_service": youtube_service is not None,
            "content_service": content_service is not None,
            "security_manager": security_manager is not None,
            "celery": celery_app.control.ping() is not None
        }
        
        # Check queue status
        queue_status = {}
        if youtube_service:
            queue_status["upload_queue"] = await youtube_service.get_upload_queue_status()
        if video_engine:
            queue_status["processing_queue"] = await video_engine.get_processing_queue_status()
        
        all_healthy = all(services_status.values())
        
        return HealthResponse(
            status="healthy" if all_healthy else "degraded",
            services=services_status,
            queues=queue_status,
            timestamp=time.time()
        )
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return HealthResponse(
            status="unhealthy",
            error=str(e),
            timestamp=time.time()
        )


@app.post("/api/jobs/process-video", response_model=JobResponse)
async def process_video(
    request: ProcessVideoRequest,
    background_tasks: BackgroundTasks,
    security_context: SecurityContext = Depends(require_permission(PermissionType.WRITE))
):
    """Submit video for processing."""
    
    try:
        # Validate input file exists
        from pathlib import Path
        if not Path(request.input_path).exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Input file not found: {request.input_path}"
            )
        
        # Create job data
        job_data = {
            "input_path": request.input_path,
            "output_path": request.output_path,
            "format": request.format,
            "quality_preset": request.quality_preset,
            "enable_gpu": request.enable_gpu,
            "enable_ai_narration": request.enable_ai_narration,
            "enable_authenticity_injection": request.enable_authenticity_injection,
            "user_id": security_context.user_id
        }
        
        # Submit job based on priority
        if request.priority == "urgent":
            task = video_processing_worker.process_urgent_video.delay(job_data)
        else:
            task = video_processing_worker.process_video.delay(job_data, request.priority)
        
        logger.info(
            "Video processing job submitted",
            job_id=task.id,
            user_id=security_context.user_id,
            priority=request.priority
        )
        
        return JobResponse(
            job_id=task.id,
            status="submitted",
            message="Video processing job submitted successfully"
        )
        
    except Exception as e:
        logger.error("Video processing submission failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.post("/api/jobs/upload-video", response_model=JobResponse)
async def upload_video(
    request: UploadVideoRequest,
    background_tasks: BackgroundTasks,
    security_context: SecurityContext = Depends(require_permission(PermissionType.UPLOAD))
):
    """Upload video to YouTube."""
    
    try:
        # Check channel access if specific channel requested
        if request.channel_id:
            if not await security_manager.check_channel_access(
                security_context, request.channel_id, PermissionType.UPLOAD
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No access to specified channel"
                )
        
        # Create upload metadata
        metadata = UploadMetadata(
            title=request.title,
            description=request.description,
            tags=request.tags,
            category_id=request.category_id,
            privacy_status=request.privacy_status,
            thumbnail_path=request.thumbnail_path,
            playlist_id=request.playlist_id
        )
        
        # Submit upload job
        task = youtube_upload_worker.upload_video.delay(
            video_path=request.video_path,
            metadata=metadata.__dict__,
            channel_id=request.channel_id,
            user_id=security_context.user_id
        )
        
        logger.info(
            "Video upload job submitted",
            job_id=task.id,
            user_id=security_context.user_id,
            channel_id=request.channel_id
        )
        
        return JobResponse(
            job_id=task.id,
            status="submitted",
            message="Video upload job submitted successfully"
        )
        
    except Exception as e:
        logger.error("Video upload submission failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.post("/api/jobs/generate-content", response_model=JobResponse)
async def generate_content(
    request: GenerateContentRequest,
    background_tasks: BackgroundTasks,
    security_context: SecurityContext = Depends(require_permission(PermissionType.WRITE))
):
    """Generate optimized content for multiple platforms."""
    
    try:
        # Validate platforms and content types
        valid_platforms = [p.value for p in Platform]
        valid_content_types = [c.value for c in ContentType]
        
        invalid_platforms = [p for p in request.target_platforms if p not in valid_platforms]
        invalid_content_types = [c for c in request.content_types if c not in valid_content_types]
        
        if invalid_platforms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid platforms: {invalid_platforms}"
            )
        
        if invalid_content_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content types: {invalid_content_types}"
            )
        
        # Create content generation config
        config = ContentGenerationConfig(
            input_video_path=request.input_video_path,
            target_platforms=[Platform(p) for p in request.target_platforms],
            content_types=[ContentType(c) for c in request.content_types],
            enable_viral_extraction=request.enable_viral_extraction,
            max_clips_per_video=request.max_clips_per_video
        )
        
        # Submit content generation job
        task = content_generation_worker.generate_content.delay(
            config=config.__dict__,
            user_id=security_context.user_id
        )
        
        logger.info(
            "Content generation job submitted",
            job_id=task.id,
            user_id=security_context.user_id,
            platforms=request.target_platforms
        )
        
        return JobResponse(
            job_id=task.id,
            status="submitted",
            message="Content generation job submitted successfully"
        )
        
    except Exception as e:
        logger.error("Content generation submission failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/api/jobs/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    security_context: SecurityContext = Depends(get_security_context)
):
    """Get job status and progress."""
    
    try:
        # Get task result
        task_result = celery_app.AsyncResult(job_id)
        
        # Check if user has access to this job
        # (In production, you'd check job ownership in database)
        
        if task_result.state == 'PENDING':
            status_response = JobStatusResponse(
                job_id=job_id,
                status="pending",
                progress=0,
                created_at="",  # Would come from database
                updated_at=""
            )
        elif task_result.state == 'PROCESSING':
            meta = task_result.info or {}
            status_response = JobStatusResponse(
                job_id=job_id,
                status="processing",
                progress=meta.get('progress', 0),
                stage=meta.get('stage'),
                created_at="",
                updated_at=""
            )
        elif task_result.state == 'SUCCESS':
            status_response = JobStatusResponse(
                job_id=job_id,
                status="completed",
                progress=100,
                result=task_result.result,
                created_at="",
                updated_at=""
            )
        elif task_result.state == 'FAILURE':
            status_response = JobStatusResponse(
                job_id=job_id,
                status="failed",
                progress=0,
                error=str(task_result.info),
                created_at="",
                updated_at=""
            )
        else:
            status_response = JobStatusResponse(
                job_id=job_id,
                status=task_result.state.lower(),
                progress=0,
                created_at="",
                updated_at=""
            )
        
        return status_response
        
    except Exception as e:
        logger.error("Job status retrieval failed", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/api/analytics/channels")
async def get_channel_analytics(
    channel_id: Optional[str] = None,
    security_context: SecurityContext = Depends(require_permission(PermissionType.VIEW_ANALYTICS))
):
    """Get YouTube channel analytics."""
    
    try:
        if not youtube_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="YouTube service not available"
            )
        
        # Get analytics for accessible channels
        if channel_id:
            if not await security_manager.check_channel_access(
                security_context, channel_id, PermissionType.VIEW_ANALYTICS
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No access to channel analytics"
                )
            
            # Get specific channel analytics
            from datetime import datetime, timedelta
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            
            analytics = await youtube_service.get_channel_analytics(
                channel_id, (start_date, end_date)
            )
            
            return {"channel_analytics": analytics}
        else:
            # Get analytics for all accessible channels
            accessible_channels = security_context.channel_ids
            
            analytics_data = []
            for ch_id in accessible_channels:
                try:
                    from datetime import datetime, timedelta
                    end_date = datetime.now()
                    start_date = end_date - timedelta(days=30)
                    
                    analytics = await youtube_service.get_channel_analytics(
                        ch_id, (start_date, end_date)
                    )
                    analytics_data.append(analytics)
                except Exception as e:
                    logger.warning(f"Failed to get analytics for channel {ch_id}", error=str(e))
            
            return {"channels_analytics": analytics_data}
        
    except Exception as e:
        logger.error("Analytics retrieval failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/api/system/metrics")
async def get_system_metrics(
    security_context: SecurityContext = Depends(require_permission(PermissionType.ADMIN_ACCESS))
):
    """Get system performance metrics."""
    
    try:
        metrics = {}
        
        # Get queue metrics
        if youtube_service:
            metrics["youtube_service"] = await youtube_service.get_upload_queue_status()
        
        if video_engine:
            metrics["video_engine"] = await video_engine.get_processing_queue_status()
        
        if content_service:
            metrics["content_service"] = await content_service.get_generation_queue_status()
        
        # Get security metrics
        if security_manager:
            metrics["security"] = await security_manager.get_security_metrics()
        
        # Get Celery metrics
        inspect = celery_app.control.inspect()
        celery_stats = {
            "active_tasks": inspect.active(),
            "scheduled_tasks": inspect.scheduled(),
            "reserved_tasks": inspect.reserved()
        }
        metrics["celery"] = celery_stats
        
        return metrics
        
    except Exception as e:
        logger.error("System metrics retrieval failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/metrics")
async def prometheus_metrics():
    """Prometheus metrics endpoint."""
    
    try:
        # Update Prometheus metrics
        if youtube_service:
            upload_status = await youtube_service.get_upload_queue_status()
            ACTIVE_JOBS.labels(job_type="upload").set(upload_status.get("active_uploads", 0))
        
        if video_engine:
            processing_status = await video_engine.get_processing_queue_status()
            ACTIVE_JOBS.labels(job_type="processing").set(processing_status.get("active_jobs", 0))
        
        # Generate metrics
        metrics_data = generate_latest()
        
        return Response(
            content=metrics_data,
            media_type="text/plain; version=0.0.4; charset=utf-8"
        )
        
    except Exception as e:
        logger.error("Metrics generation failed", error=str(e))
        return Response(
            content="# Error generating metrics\n",
            media_type="text/plain"
        )


# Middleware for metrics collection
@app.middleware("http")
async def metrics_middleware(request, call_next):
    """Collect request metrics."""
    
    start_time = time.time()
    
    response = await call_next(request)
    
    # Record metrics
    duration = time.time() - start_time
    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    return response


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions."""
    
    logger.warning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": time.time()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    
    logger.error(
        "Unhandled exception",
        error=str(exc),
        path=request.url.path,
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "timestamp": time.time()
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )
