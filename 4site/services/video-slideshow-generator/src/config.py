"""Configuration settings for the video/slideshow generator service"""

import os
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Server configuration
    port: int = Field(default=8003, description="Server port")
    debug: bool = Field(default=False, description="Debug mode")
    
    # Database configuration
    database_url: str = Field(
        description="PostgreSQL database URL",
        default="postgresql://postgres:postgres@localhost:5432/project4site"
    )
    
    # Redis configuration
    redis_url: str = Field(
        description="Redis URL for queue management",
        default="redis://localhost:6379"
    )
    
    # Worker configuration
    worker_concurrency: int = Field(
        default=2,
        description="Number of concurrent worker processes"
    )
    
    # AI/TTS configuration
    openai_api_key: Optional[str] = Field(
        default=None,
        description="OpenAI API key for advanced TTS"
    )
    elevenlabs_api_key: Optional[str] = Field(
        default=None,
        description="ElevenLabs API key for high-quality TTS"
    )
    use_local_tts: bool = Field(
        default=True,
        description="Use local TTS (gTTS) instead of premium services"
    )
    
    # Video generation settings
    video_resolution: str = Field(default="1920x1080", description="Video resolution")
    video_fps: int = Field(default=30, description="Video frame rate")
    video_duration_per_section: int = Field(
        default=10,
        description="Default duration per section in seconds"
    )
    max_video_duration: int = Field(
        default=300,
        description="Maximum video duration in seconds"
    )
    
    # Audio settings
    audio_speed: float = Field(default=1.0, description="Audio playback speed")
    audio_voice: str = Field(default="alloy", description="Default voice for TTS")
    background_music_enabled: bool = Field(
        default=True,
        description="Enable background music"
    )
    
    # Output settings
    output_directory: str = Field(
        default="./generated_media",
        description="Directory for generated videos and slideshows"
    )
    temp_directory: str = Field(
        default="./temp",
        description="Temporary files directory"
    )
    
    # Asset settings
    default_font_path: str = Field(
        default="./assets/fonts/Inter-Regular.ttf",
        description="Default font for text rendering"
    )
    logo_path: str = Field(
        default="./assets/logos/project4site-logo.png",
        description="Project4Site logo path"
    )
    
    # Performance settings
    max_concurrent_generations: int = Field(
        default=2,
        description="Maximum concurrent video generations"
    )
    cleanup_temp_files: bool = Field(
        default=True,
        description="Clean up temporary files after processing"
    )
    
    # Quality settings
    video_quality: str = Field(
        default="high",
        description="Video quality: low, medium, high, ultra"
    )
    image_quality: int = Field(
        default=85,
        description="JPEG quality for generated images (1-100)"
    )
    
    # Content settings
    max_text_length_per_slide: int = Field(
        default=200,
        description="Maximum text length per slide"
    )
    slide_transition_duration: float = Field(
        default=0.5,
        description="Slide transition duration in seconds"
    )
    
    class Config:
        env_file = ".env"
        env_prefix = "VIDEO_GEN_"