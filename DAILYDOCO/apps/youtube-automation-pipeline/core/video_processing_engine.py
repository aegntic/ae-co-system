"""GPU-accelerated video processing engine for YouTube automation pipeline."""

import asyncio
import subprocess
import tempfile
import os
import json
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
from dataclasses import dataclass
from enum import Enum
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import structlog
import ffmpeg
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import torch
from transformers import pipeline

from ..config.settings import get_settings
from ..models.video_models import VideoProcessingJob, VideoMetadata, ProcessingStatus
from ..services.ai_narration_service import AInarrationService
from ..services.aegnt27_service import Aegnt27Service
from ..utils.gpu_utils import get_gpu_info, select_optimal_gpu
from ..utils.performance_monitor import PerformanceMonitor

logger = structlog.get_logger()
settings = get_settings()


class VideoFormat(Enum):
    """Supported video formats."""
    YOUTUBE_LONG = "youtube_long"  # 16:9, 1080p, optimized for YouTube
    YOUTUBE_SHORT = "youtube_short"  # 9:16, 1080x1920, optimized for YouTube Shorts
    TIKTOK = "tiktok"  # 9:16, 1080x1920, optimized for TikTok
    LINKEDIN = "linkedin"  # 16:9, 1080p, optimized for LinkedIn
    TWITTER = "twitter"  # 16:9, 1080p, optimized for Twitter


class ProcessingStage(Enum):
    """Video processing stages."""
    ANALYSIS = "analysis"
    SCENE_DETECTION = "scene_detection"
    AUDIO_EXTRACTION = "audio_extraction"
    TRANSCRIPT_GENERATION = "transcript_generation"
    NARRATION_GENERATION = "narration_generation"
    VIDEO_EDITING = "video_editing"
    THUMBNAIL_GENERATION = "thumbnail_generation"
    AUTHENTICITY_INJECTION = "authenticity_injection"
    RENDERING = "rendering"
    QUALITY_VALIDATION = "quality_validation"
    COMPRESSION = "compression"
    METADATA_EXTRACTION = "metadata_extraction"


@dataclass
class VideoProcessingConfig:
    """Configuration for video processing."""
    input_path: str
    output_path: str
    format: VideoFormat
    quality_preset: str = "high"  # draft, standard, high, broadcast
    enable_gpu: bool = True
    max_duration_seconds: int = 3600
    target_bitrate: str = "5000k"
    audio_bitrate: str = "192k"
    frame_rate: int = 30
    resolution: str = "1920x1080"
    enable_hdr: bool = False
    enable_scene_detection: bool = True
    enable_ai_narration: bool = True
    enable_authenticity_injection: bool = True
    enable_thumbnail_generation: bool = True
    thumbnail_count: int = 5
    chapters_enabled: bool = True
    

@dataclass
class ProcessingResult:
    """Result of video processing operation."""
    success: bool
    output_path: Optional[str] = None
    metadata: Optional[VideoMetadata] = None
    thumbnails: List[str] = None
    processing_time_seconds: float = 0.0
    error_message: Optional[str] = None
    performance_metrics: Optional[Dict[str, Any]] = None
    authenticity_score: Optional[float] = None
    

class VideoProcessingEngine:
    """GPU-accelerated video processing engine."""
    
    def __init__(self):
        self.settings = get_settings()
        self.performance_monitor = PerformanceMonitor()
        self.ai_narration_service = AInarrationService()
        self.aegnt27_service = Aegnt27Service()
        self.executor = ThreadPoolExecutor(max_workers=settings.video_processing.max_concurrent_processes)
        self.process_executor = ProcessPoolExecutor(max_workers=2)
        
        # Initialize GPU configuration
        self.gpu_info = get_gpu_info()
        self.selected_gpu = select_optimal_gpu(self.gpu_info)
        
        # Initialize AI models for content analysis
        self._initialize_ai_models()
        
        logger.info(
            "Video processing engine initialized",
            gpu_count=len(self.gpu_info),
            selected_gpu=self.selected_gpu,
            max_concurrent=settings.video_processing.max_concurrent_processes
        )
    
    def _initialize_ai_models(self) -> None:
        """Initialize AI models for content analysis."""
        try:
            # Initialize scene detection model
            if torch.cuda.is_available():
                self.scene_detection_model = pipeline(
                    "image-classification",
                    model="microsoft/DinoV2-large",
                    device=0 if self.selected_gpu else -1
                )
            else:
                self.scene_detection_model = None
                logger.warning("CUDA not available, scene detection will use CPU")
        except Exception as e:
            logger.error("Failed to initialize AI models", error=str(e))
            self.scene_detection_model = None
    
    async def process_video(
        self, 
        config: VideoProcessingConfig,
        job_id: str,
        progress_callback: Optional[callable] = None
    ) -> ProcessingResult:
        """Process a video through the complete pipeline."""
        
        start_time = asyncio.get_event_loop().time()
        
        try:
            # Validate input
            if not Path(config.input_path).exists():
                raise FileNotFoundError(f"Input video not found: {config.input_path}")
            
            # Create output directory
            output_dir = Path(config.output_path).parent
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Process through pipeline stages
            stages = list(ProcessingStage)
            total_stages = len(stages)
            
            processing_data = {
                "job_id": job_id,
                "config": config,
                "temp_dir": tempfile.mkdtemp(),
                "metadata": {},
                "thumbnails": [],
                "performance_metrics": {}
            }
            
            for i, stage in enumerate(stages):
                if progress_callback:
                    await progress_callback(stage.value, i / total_stages)
                
                logger.info(f"Processing stage: {stage.value}", job_id=job_id)
                
                # Execute stage
                stage_result = await self._execute_stage(stage, processing_data)
                
                if not stage_result:
                    raise RuntimeError(f"Stage {stage.value} failed")
                
                # Update processing data
                processing_data.update(stage_result)
            
            # Calculate final metrics
            processing_time = asyncio.get_event_loop().time() - start_time
            
            # Cleanup temporary files
            await self._cleanup_temp_files(processing_data["temp_dir"])
            
            return ProcessingResult(
                success=True,
                output_path=config.output_path,
                metadata=processing_data.get("metadata"),
                thumbnails=processing_data.get("thumbnails", []),
                processing_time_seconds=processing_time,
                performance_metrics=processing_data.get("performance_metrics"),
                authenticity_score=processing_data.get("authenticity_score")
            )
            
        except Exception as e:
            logger.error("Video processing failed", job_id=job_id, error=str(e))
            processing_time = asyncio.get_event_loop().time() - start_time
            
            return ProcessingResult(
                success=False,
                error_message=str(e),
                processing_time_seconds=processing_time
            )
    
    async def _execute_stage(self, stage: ProcessingStage, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific processing stage."""
        
        stage_handlers = {
            ProcessingStage.ANALYSIS: self._analyze_video,
            ProcessingStage.SCENE_DETECTION: self._detect_scenes,
            ProcessingStage.AUDIO_EXTRACTION: self._extract_audio,
            ProcessingStage.TRANSCRIPT_GENERATION: self._generate_transcript,
            ProcessingStage.NARRATION_GENERATION: self._generate_narration,
            ProcessingStage.VIDEO_EDITING: self._edit_video,
            ProcessingStage.THUMBNAIL_GENERATION: self._generate_thumbnails,
            ProcessingStage.AUTHENTICITY_INJECTION: self._inject_authenticity,
            ProcessingStage.RENDERING: self._render_video,
            ProcessingStage.QUALITY_VALIDATION: self._validate_quality,
            ProcessingStage.COMPRESSION: self._compress_video,
            ProcessingStage.METADATA_EXTRACTION: self._extract_metadata
        }
        
        handler = stage_handlers.get(stage)
        if not handler:
            raise RuntimeError(f"No handler for stage: {stage.value}")
        
        try:
            return await handler(data)
        except Exception as e:
            logger.error(f"Stage {stage.value} failed", error=str(e))
            raise
    
    async def _analyze_video(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze video content and extract basic metadata."""
        
        config = data["config"]
        
        # Use OpenCV for video analysis
        cap = cv2.VideoCapture(config.input_path)
        
        if not cap.isOpened():
            raise RuntimeError(f"Could not open video: {config.input_path}")
        
        # Extract basic video information
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        cap.release()
        
        # Validate video constraints
        if duration > config.max_duration_seconds:
            raise ValueError(f"Video too long: {duration}s > {config.max_duration_seconds}s")
        
        metadata = {
            "duration_seconds": duration,
            "fps": fps,
            "frame_count": frame_count,
            "resolution": f"{width}x{height}",
            "aspect_ratio": width / height if height > 0 else 0,
            "file_size_bytes": Path(config.input_path).stat().st_size
        }
        
        logger.info("Video analysis complete", metadata=metadata)
        
        return {"metadata": metadata}
    
    async def _detect_scenes(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Detect scene changes in the video."""
        
        config = data["config"]
        
        if not config.enable_scene_detection:
            return {"scenes": []}
        
        # Use FFmpeg for scene detection
        scene_timestamps = []
        
        try:
            # Run scene detection with ffmpeg
            cmd = [
                settings.video_processing.ffmpeg_path,
                "-i", config.input_path,
                "-filter:v", f"select='gt(scene,{settings.video_processing.scene_detection_threshold})',showinfo",
                "-f", "null",
                "-"
            ]
            
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await result.communicate()
            
            # Parse scene timestamps from ffmpeg output
            lines = stderr.decode().split('\n')
            for line in lines:
                if 'pts_time:' in line:
                    try:
                        timestamp = float(line.split('pts_time:')[1].split()[0])
                        scene_timestamps.append(timestamp)
                    except (IndexError, ValueError):
                        continue
        
        except Exception as e:
            logger.warning("Scene detection failed, using fallback", error=str(e))
            # Fallback: create scenes every 30 seconds
            duration = data["metadata"]["duration_seconds"]
            scene_timestamps = [i * 30 for i in range(int(duration // 30) + 1)]
        
        logger.info(f"Detected {len(scene_timestamps)} scenes")
        
        return {"scenes": scene_timestamps}
    
    async def _extract_audio(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract audio from video for transcript generation."""
        
        config = data["config"]
        temp_dir = data["temp_dir"]
        
        audio_path = os.path.join(temp_dir, "audio.wav")
        
        try:
            # Extract audio using ffmpeg
            (
                ffmpeg
                .input(config.input_path)
                .output(audio_path, acodec='pcm_s16le', ac=1, ar='16000')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            
            if not Path(audio_path).exists():
                raise RuntimeError("Audio extraction failed")
            
            logger.info("Audio extracted successfully", audio_path=audio_path)
            
            return {"audio_path": audio_path}
            
        except Exception as e:
            logger.error("Audio extraction failed", error=str(e))
            raise
    
    async def _generate_transcript(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate transcript from audio using AI."""
        
        audio_path = data.get("audio_path")
        if not audio_path or not Path(audio_path).exists():
            logger.warning("No audio available for transcript generation")
            return {"transcript": ""}
        
        try:
            # Use AI service to generate transcript
            transcript = await self.ai_narration_service.transcribe_audio(audio_path)
            
            logger.info("Transcript generated", length=len(transcript))
            
            return {"transcript": transcript}
            
        except Exception as e:
            logger.error("Transcript generation failed", error=str(e))
            return {"transcript": ""}
    
    async def _generate_narration(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI narration for the video."""
        
        config = data["config"]
        
        if not config.enable_ai_narration:
            return {"narration": None}
        
        try:
            # Prepare context for narration
            context = {
                "metadata": data["metadata"],
                "transcript": data.get("transcript", ""),
                "scenes": data.get("scenes", []),
                "video_format": config.format.value
            }
            
            # Generate narration using AI service
            narration = await self.ai_narration_service.generate_narration(
                context=context,
                style="tutorial",  # tutorial, explanation, demo, etc.
                target_audience="developers"
            )
            
            logger.info("AI narration generated", narration_length=len(narration))
            
            return {"narration": narration}
            
        except Exception as e:
            logger.error("Narration generation failed", error=str(e))
            return {"narration": None}
    
    async def _edit_video(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Edit video based on detected scenes and narration."""
        
        config = data["config"]
        temp_dir = data["temp_dir"]
        
        # Create edited version with chapters, transitions, etc.
        edited_path = os.path.join(temp_dir, "edited.mp4")
        
        try:
            # Basic editing: add intro, chapters, transitions
            scenes = data.get("scenes", [])
            narration = data.get("narration")
            
            # For now, copy the original video (real editing would happen here)
            # TODO: Implement intelligent video editing based on scenes and narration
            
            import shutil
            shutil.copy2(config.input_path, edited_path)
            
            logger.info("Video editing complete", edited_path=edited_path)
            
            return {"edited_path": edited_path}
            
        except Exception as e:
            logger.error("Video editing failed", error=str(e))
            raise
    
    async def _generate_thumbnails(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate thumbnails from video."""
        
        config = data["config"]
        temp_dir = data["temp_dir"]
        
        if not config.enable_thumbnail_generation:
            return {"thumbnails": []}
        
        thumbnails = []
        
        try:
            # Extract frames at key points
            duration = data["metadata"]["duration_seconds"]
            scenes = data.get("scenes", [])
            
            # Select thumbnail timestamps
            if scenes:
                # Use scene changes for thumbnails
                timestamps = scenes[:config.thumbnail_count]
            else:
                # Use evenly distributed timestamps
                timestamps = [duration * i / config.thumbnail_count for i in range(config.thumbnail_count)]
            
            for i, timestamp in enumerate(timestamps):
                thumbnail_path = os.path.join(temp_dir, f"thumbnail_{i}.jpg")
                
                # Extract frame using ffmpeg
                (
                    ffmpeg
                    .input(config.input_path, ss=timestamp)
                    .output(thumbnail_path, vframes=1, format='image2', vcodec='mjpeg')
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )
                
                if Path(thumbnail_path).exists():
                    thumbnails.append(thumbnail_path)
            
            logger.info(f"Generated {len(thumbnails)} thumbnails")
            
            return {"thumbnails": thumbnails}
            
        except Exception as e:
            logger.error("Thumbnail generation failed", error=str(e))
            return {"thumbnails": []}
    
    async def _inject_authenticity(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Inject human authenticity using aegnt-27."""
        
        config = data["config"]
        
        if not config.enable_authenticity_injection:
            return {"authenticity_score": 0.0}
        
        try:
            # Use aegnt-27 service to inject human characteristics
            content_data = {
                "video_path": data.get("edited_path", config.input_path),
                "transcript": data.get("transcript", ""),
                "narration": data.get("narration", "")
            }
            
            authenticity_result = await self.aegnt27_service.process_video_authenticity(
                content_data=content_data,
                authenticity_level=settings.ai.authenticity_level
            )
            
            logger.info("Authenticity injection complete", score=authenticity_result.get("score", 0.0))
            
            return {"authenticity_score": authenticity_result.get("score", 0.0)}
            
        except Exception as e:
            logger.error("Authenticity injection failed", error=str(e))
            return {"authenticity_score": 0.0}
    
    async def _render_video(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Render the final video with all enhancements."""
        
        config = data["config"]
        temp_dir = data["temp_dir"]
        
        input_path = data.get("edited_path", config.input_path)
        
        try:
            # Configure FFmpeg for GPU acceleration
            ffmpeg_args = self._get_ffmpeg_args(config)
            
            # Render video with optimal settings
            (
                ffmpeg
                .input(input_path)
                .output(
                    config.output_path,
                    **ffmpeg_args
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            
            if not Path(config.output_path).exists():
                raise RuntimeError("Video rendering failed")
            
            logger.info("Video rendering complete", output_path=config.output_path)
            
            return {"rendered_path": config.output_path}
            
        except Exception as e:
            logger.error("Video rendering failed", error=str(e))
            raise
    
    def _get_ffmpeg_args(self, config: VideoProcessingConfig) -> Dict[str, Any]:
        """Get FFmpeg arguments based on configuration."""
        
        args = {
            "vcodec": "libx264",
            "acodec": "aac",
            "b:v": config.target_bitrate,
            "b:a": config.audio_bitrate,
            "r": config.frame_rate,
            "preset": "medium",
            "crf": 23
        }
        
        # GPU acceleration
        if config.enable_gpu and settings.video_processing.gpu_acceleration:
            encoder = settings.video_processing.hardware_encoder
            
            if encoder == "nvenc" and self.selected_gpu:
                args["vcodec"] = "h264_nvenc"
                args["gpu"] = self.selected_gpu
            elif encoder == "vaapi":
                args["vcodec"] = "h264_vaapi"
            elif encoder == "videotoolbox":
                args["vcodec"] = "h264_videotoolbox"
        
        # Format-specific optimizations
        if config.format == VideoFormat.YOUTUBE_LONG:
            args.update({
                "s": "1920x1080",
                "aspect": "16:9",
                "pix_fmt": "yuv420p"
            })
        elif config.format == VideoFormat.YOUTUBE_SHORT:
            args.update({
                "s": "1080x1920",
                "aspect": "9:16",
                "pix_fmt": "yuv420p"
            })
        elif config.format == VideoFormat.TIKTOK:
            args.update({
                "s": "1080x1920",
                "aspect": "9:16",
                "pix_fmt": "yuv420p",
                "movflags": "+faststart"
            })
        
        return args
    
    async def _validate_quality(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate video quality and compliance."""
        
        config = data["config"]
        
        if not Path(config.output_path).exists():
            raise RuntimeError("Output video not found for quality validation")
        
        try:
            # Basic quality checks
            cap = cv2.VideoCapture(config.output_path)
            
            if not cap.isOpened():
                raise RuntimeError("Cannot open rendered video")
            
            # Check video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            cap.release()
            
            # Validate against requirements
            quality_issues = []
            
            if fps < config.frame_rate * 0.9:  # Allow 10% tolerance
                quality_issues.append(f"Frame rate too low: {fps} < {config.frame_rate}")
            
            if width < 1280 or height < 720:
                quality_issues.append(f"Resolution too low: {width}x{height}")
            
            if quality_issues:
                logger.warning("Quality validation issues detected", issues=quality_issues)
            else:
                logger.info("Quality validation passed")
            
            return {"quality_issues": quality_issues}
            
        except Exception as e:
            logger.error("Quality validation failed", error=str(e))
            return {"quality_issues": [f"Validation error: {str(e)}"]}
    
    async def _compress_video(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Compress video for optimal upload size."""
        
        config = data["config"]
        temp_dir = data["temp_dir"]
        
        # Create compressed version
        compressed_path = os.path.join(temp_dir, "compressed.mp4")
        
        try:
            # Apply additional compression for upload optimization
            (
                ffmpeg
                .input(config.output_path)
                .output(
                    compressed_path,
                    vcodec="libx264",
                    crf=28,  # Higher CRF for more compression
                    preset="slow",  # Better compression
                    acodec="aac",
                    b_a="128k",  # Lower audio bitrate
                    movflags="+faststart"  # Optimize for streaming
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            
            # Check if compression was successful and beneficial
            original_size = Path(config.output_path).stat().st_size
            compressed_size = Path(compressed_path).stat().st_size
            
            if compressed_size < original_size * 0.8:  # At least 20% reduction
                # Replace original with compressed version
                Path(config.output_path).unlink()
                Path(compressed_path).rename(config.output_path)
                
                compression_ratio = compressed_size / original_size
                logger.info("Video compressed successfully", 
                           compression_ratio=compression_ratio,
                           size_reduction_mb=(original_size - compressed_size) / 1024 / 1024)
            else:
                # Keep original
                Path(compressed_path).unlink()
                logger.info("Compression not beneficial, keeping original")
            
            return {"compression_applied": True}
            
        except Exception as e:
            logger.error("Video compression failed", error=str(e))
            return {"compression_applied": False}
    
    async def _extract_metadata(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract final metadata from processed video."""
        
        config = data["config"]
        
        try:
            # Get final video stats
            stat = Path(config.output_path).stat()
            
            final_metadata = {
                "output_file_size_bytes": stat.st_size,
                "output_file_size_mb": stat.st_size / 1024 / 1024,
                "processing_complete": True,
                "thumbnails_count": len(data.get("thumbnails", [])),
                "authenticity_score": data.get("authenticity_score", 0.0),
                "quality_issues": data.get("quality_issues", []),
                "format": config.format.value
            }
            
            # Merge with existing metadata
            data["metadata"].update(final_metadata)
            
            logger.info("Metadata extraction complete", final_metadata=final_metadata)
            
            return {"final_metadata": final_metadata}
            
        except Exception as e:
            logger.error("Metadata extraction failed", error=str(e))
            return {"final_metadata": {}}
    
    async def _cleanup_temp_files(self, temp_dir: str) -> None:
        """Clean up temporary files."""
        try:
            import shutil
            shutil.rmtree(temp_dir)
            logger.info("Temporary files cleaned up", temp_dir=temp_dir)
        except Exception as e:
            logger.warning("Failed to clean up temporary files", temp_dir=temp_dir, error=str(e))
    
    async def get_processing_queue_status(self) -> Dict[str, Any]:
        """Get current processing queue status."""
        return {
            "active_jobs": len(self.executor._threads),
            "max_workers": self.executor._max_workers,
            "gpu_info": self.gpu_info,
            "selected_gpu": self.selected_gpu,
            "processing_capacity": settings.video_processing.max_concurrent_processes
        }
    
    async def shutdown(self) -> None:
        """Shutdown the processing engine."""
        logger.info("Shutting down video processing engine")
        self.executor.shutdown(wait=True)
        self.process_executor.shutdown(wait=True)
        logger.info("Video processing engine shutdown complete")
