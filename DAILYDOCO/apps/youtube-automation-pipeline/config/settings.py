"""Configuration management for YouTube Automation Pipeline."""

import os
from typing import Dict, List, Any, Optional
from pydantic import BaseSettings, Field, validator
from pydantic_settings import BaseSettings as PydanticBaseSettings
import structlog

logger = structlog.get_logger()


class DatabaseSettings(BaseSettings):
    """Database configuration settings."""
    
    postgres_url: str = Field(
        default="postgresql://youtube_user:youtube_pass@localhost:5432/youtube_automation",
        env="POSTGRES_URL"
    )
    redis_url: str = Field(
        default="redis://localhost:6379/1", 
        env="REDIS_URL"
    )
    neo4j_url: str = Field(
        default="bolt://localhost:7687",
        env="NEO4J_URL"
    )
    neo4j_user: str = Field(default="neo4j", env="NEO4J_USER")
    neo4j_password: str = Field(default="youtube_neo4j", env="NEO4J_PASSWORD")
    
    # Connection pooling
    postgres_pool_size: int = Field(default=20, env="POSTGRES_POOL_SIZE")
    redis_pool_size: int = Field(default=50, env="REDIS_POOL_SIZE")
    

class YouTubeAPISettings(BaseSettings):
    """YouTube API configuration settings."""
    
    # YouTube Data API v3
    api_key: str = Field(default="", env="YOUTUBE_API_KEY")
    client_id: str = Field(default="", env="YOUTUBE_CLIENT_ID")
    client_secret: str = Field(default="", env="YOUTUBE_CLIENT_SECRET")
    
    # Channel management
    max_channels_per_account: int = Field(default=100, env="MAX_CHANNELS_PER_ACCOUNT")
    channel_rotation_enabled: bool = Field(default=True, env="CHANNEL_ROTATION_ENABLED")
    
    # Upload settings
    max_upload_retries: int = Field(default=3, env="MAX_UPLOAD_RETRIES")
    upload_timeout_seconds: int = Field(default=3600, env="UPLOAD_TIMEOUT_SECONDS")
    
    # Rate limiting
    quota_per_day: int = Field(default=10000, env="YOUTUBE_QUOTA_PER_DAY")
    uploads_per_day_per_channel: int = Field(default=50, env="UPLOADS_PER_DAY_PER_CHANNEL")
    min_upload_interval_minutes: int = Field(default=30, env="MIN_UPLOAD_INTERVAL_MINUTES")
    

class AISettings(BaseSettings):
    """AI model configuration settings."""
    
    # Primary AI providers
    openrouter_api_key: str = Field(default="", env="OPENROUTER_API_KEY")
    anthropic_api_key: str = Field(default="", env="ANTHROPIC_API_KEY")
    openai_api_key: str = Field(default="", env="OPENAI_API_KEY")
    
    # Model selection for different tasks
    reasoning_model: str = Field(default="deepseek/deepseek-r1.1", env="REASONING_MODEL")
    narration_model: str = Field(default="gemma-3", env="NARRATION_MODEL")
    creative_model: str = Field(default="claude-4-sonnet", env="CREATIVE_MODEL")
    fallback_model: str = Field(default="meta-llama/llama-3.1-8b-instruct:free", env="FALLBACK_MODEL")
    
    # aegnt-27 authenticity settings
    authenticity_level: str = Field(default="advanced", env="AUTHENTICITY_LEVEL")
    human_fingerprint_enabled: bool = Field(default=True, env="HUMAN_FINGERPRINT_ENABLED")
    ai_detection_resistance: float = Field(default=0.98, env="AI_DETECTION_RESISTANCE")
    
    # Cost optimization
    use_deepseek_for_reasoning: bool = Field(default=True, env="USE_DEEPSEEK_FOR_REASONING")
    use_gemma_for_privacy: bool = Field(default=True, env="USE_GEMMA_FOR_PRIVACY")
    max_tokens_per_request: int = Field(default=4096, env="MAX_TOKENS_PER_REQUEST")
    

class VideoProcessingSettings(BaseSettings):
    """Video processing configuration settings."""
    
    # FFmpeg settings
    ffmpeg_path: str = Field(default="ffmpeg", env="FFMPEG_PATH")
    gpu_acceleration: bool = Field(default=True, env="GPU_ACCELERATION")
    hardware_encoder: str = Field(default="nvenc", env="HARDWARE_ENCODER")  # nvenc, vaapi, videotoolbox
    
    # Video quality settings
    output_resolution: str = Field(default="1920x1080", env="OUTPUT_RESOLUTION")
    target_bitrate: str = Field(default="5000k", env="TARGET_BITRATE")
    frame_rate: int = Field(default=30, env="FRAME_RATE")
    
    # Processing limits
    max_video_duration_seconds: int = Field(default=3600, env="MAX_VIDEO_DURATION_SECONDS")
    max_concurrent_processes: int = Field(default=4, env="MAX_CONCURRENT_PROCESSES")
    temp_storage_gb: int = Field(default=100, env="TEMP_STORAGE_GB")
    
    # Content analysis
    scene_detection_threshold: float = Field(default=0.3, env="SCENE_DETECTION_THRESHOLD")
    silence_detection_threshold: float = Field(default=-30.0, env="SILENCE_DETECTION_THRESHOLD")
    

class ContentGenerationSettings(BaseSettings):
    """Content generation configuration settings."""
    
    # Tutorial structure
    intro_duration_seconds: int = Field(default=15, env="INTRO_DURATION_SECONDS")
    conclusion_duration_seconds: int = Field(default=10, env="CONCLUSION_DURATION_SECONDS")
    chapter_min_duration_seconds: int = Field(default=30, env="CHAPTER_MIN_DURATION_SECONDS")
    
    # Viral content extraction
    viral_clip_min_duration: int = Field(default=15, env="VIRAL_CLIP_MIN_DURATION")
    viral_clip_max_duration: int = Field(default=60, env="VIRAL_CLIP_MAX_DURATION")
    engagement_score_threshold: float = Field(default=0.8, env="ENGAGEMENT_SCORE_THRESHOLD")
    
    # Multi-format generation
    generate_shorts: bool = Field(default=True, env="GENERATE_SHORTS")
    generate_tutorials: bool = Field(default=True, env="GENERATE_TUTORIALS")
    generate_deep_dives: bool = Field(default=True, env="GENERATE_DEEP_DIVES")
    
    # Cross-platform optimization
    youtube_optimization: bool = Field(default=True, env="YOUTUBE_OPTIMIZATION")
    tiktok_optimization: bool = Field(default=True, env="TIKTOK_OPTIMIZATION")
    linkedin_optimization: bool = Field(default=True, env="LINKEDIN_OPTIMIZATION")
    

class ScalingSettings(BaseSettings):
    """Scaling and performance configuration settings."""
    
    # Processing targets
    daily_video_target: int = Field(default=1000, env="DAILY_VIDEO_TARGET")
    videos_per_hour_target: int = Field(default=42, env="VIDEOS_PER_HOUR_TARGET")
    
    # Worker configuration
    celery_workers: int = Field(default=8, env="CELERY_WORKERS")
    video_processing_workers: int = Field(default=4, env="VIDEO_PROCESSING_WORKERS")
    upload_workers: int = Field(default=6, env="UPLOAD_WORKERS")
    
    # Queue settings
    high_priority_queue: str = Field(default="high_priority", env="HIGH_PRIORITY_QUEUE")
    normal_priority_queue: str = Field(default="normal_priority", env="NORMAL_PRIORITY_QUEUE")
    low_priority_queue: str = Field(default="low_priority", env="LOW_PRIORITY_QUEUE")
    
    # Load balancing
    enable_load_balancing: bool = Field(default=True, env="ENABLE_LOAD_BALANCING")
    max_queue_size: int = Field(default=10000, env="MAX_QUEUE_SIZE")
    
    # Failover and recovery
    enable_failover: bool = Field(default=True, env="ENABLE_FAILOVER")
    max_retry_attempts: int = Field(default=3, env="MAX_RETRY_ATTEMPTS")
    retry_backoff_seconds: int = Field(default=60, env="RETRY_BACKOFF_SECONDS")
    

class SecuritySettings(BaseSettings):
    """Security and authentication configuration settings."""
    
    # API security
    api_key_header: str = Field(default="X-API-Key", env="API_KEY_HEADER")
    jwt_secret_key: str = Field(default="your-secret-key-change-this", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    
    # Channel isolation
    enable_channel_isolation: bool = Field(default=True, env="ENABLE_CHANNEL_ISOLATION")
    channel_permission_model: str = Field(default="strict", env="CHANNEL_PERMISSION_MODEL")
    
    # Rate limiting
    rate_limit_enabled: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    requests_per_minute: int = Field(default=100, env="REQUESTS_PER_MINUTE")
    
    # Content compliance
    enable_content_scanning: bool = Field(default=True, env="ENABLE_CONTENT_SCANNING")
    banned_keywords: List[str] = Field(default_factory=list, env="BANNED_KEYWORDS")
    content_review_required: bool = Field(default=False, env="CONTENT_REVIEW_REQUIRED")
    

class MonitoringSettings(BaseSettings):
    """Monitoring and alerting configuration settings."""
    
    # Prometheus metrics
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    metrics_port: int = Field(default=9090, env="METRICS_PORT")
    
    # Sentry error tracking
    sentry_dsn: str = Field(default="", env="SENTRY_DSN")
    sentry_environment: str = Field(default="production", env="SENTRY_ENVIRONMENT")
    
    # Alerting
    alert_webhook_url: str = Field(default="", env="ALERT_WEBHOOK_URL")
    alert_on_queue_overflow: bool = Field(default=True, env="ALERT_ON_QUEUE_OVERFLOW")
    alert_on_processing_failure: bool = Field(default=True, env="ALERT_ON_PROCESSING_FAILURE")
    
    # Health checks
    health_check_interval_seconds: int = Field(default=30, env="HEALTH_CHECK_INTERVAL_SECONDS")
    

class Settings(PydanticBaseSettings):
    """Main application settings."""
    
    # Application info
    app_name: str = Field(default="YouTube Automation Pipeline", env="APP_NAME")
    version: str = Field(default="1.0.0", env="VERSION")
    debug: bool = Field(default=False, env="DEBUG")
    
    # Server settings
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8001, env="PORT")
    
    # Component settings
    database: DatabaseSettings = DatabaseSettings()
    youtube_api: YouTubeAPISettings = YouTubeAPISettings()
    ai: AISettings = AISettings()
    video_processing: VideoProcessingSettings = VideoProcessingSettings()
    content_generation: ContentGenerationSettings = ContentGenerationSettings()
    scaling: ScalingSettings = ScalingSettings()
    security: SecuritySettings = SecuritySettings()
    monitoring: MonitoringSettings = MonitoringSettings()
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        
    @validator("youtube_api")
    def validate_youtube_api(cls, v):
        """Validate YouTube API configuration."""
        if not v.api_key and not v.client_id:
            logger.warning("YouTube API credentials not configured")
        return v
    
    @validator("ai")
    def validate_ai_settings(cls, v):
        """Validate AI model configuration."""
        if not any([v.openrouter_api_key, v.anthropic_api_key, v.openai_api_key]):
            logger.warning("No AI API keys configured")
        return v


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the global settings instance."""
    return settings


def get_celery_config() -> Dict[str, Any]:
    """Get Celery worker configuration."""
    return {
        "broker_url": settings.database.redis_url,
        "result_backend": settings.database.redis_url,
        "task_serializer": "json",
        "accept_content": ["json"],
        "result_serializer": "json",
        "timezone": "UTC",
        "enable_utc": True,
        "worker_prefetch_multiplier": 1,
        "task_acks_late": True,
        "worker_max_tasks_per_child": 1000,
        "task_routes": {
            "youtube_automation_pipeline.workers.video_processing.*": {"queue": "video_processing"},
            "youtube_automation_pipeline.workers.youtube_upload.*": {"queue": "youtube_upload"},
            "youtube_automation_pipeline.workers.content_generation.*": {"queue": "content_generation"},
        },
        "task_default_queue": "default",
        "task_default_exchange": "default",
        "task_default_routing_key": "default",
    }


def get_database_config() -> Dict[str, Any]:
    """Get database configuration for SQLAlchemy."""
    return {
        "url": settings.database.postgres_url,
        "pool_size": settings.database.postgres_pool_size,
        "max_overflow": settings.database.postgres_pool_size * 2,
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "echo": settings.debug,
    }


def get_redis_config() -> Dict[str, Any]:
    """Get Redis configuration."""
    return {
        "url": settings.database.redis_url,
        "max_connections": settings.database.redis_pool_size,
        "retry_on_timeout": True,
        "health_check_interval": 30,
    }


def get_logging_config() -> Dict[str, Any]:
    """Get structured logging configuration."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": "structlog.stdlib.ProcessorFormatter",
                "processor": "structlog.dev.ConsoleRenderer",
            },
        },
        "handlers": {
            "console": {
                "level": "INFO",
                "class": "logging.StreamHandler",
                "formatter": "json",
            },
        },
        "loggers": {
            "youtube_automation_pipeline": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }
