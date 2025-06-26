"""Video processing worker for distributed GPU-accelerated processing."""

import asyncio
import time
from typing import Dict, Any, Optional
from pathlib import Path
import structlog
from celery import Task
from celery.exceptions import Retry, WorkerLostError

from .celery_app import celery_app
from ..core.video_processing_engine import (
    VideoProcessingEngine, VideoProcessingConfig, VideoFormat, ProcessingResult
)
from ..services.aegnt27_service import Aegnt27Service
from ..utils.performance_monitor import PerformanceMonitor
from ..utils.error_handler import ErrorHandler
from ..models.video_models import VideoProcessingJob, ProcessingStatus

logger = structlog.get_logger()

# Global instances for workers
video_engine: Optional[VideoProcessingEngine] = None
performance_monitor: Optional[PerformanceMonitor] = None
error_handler: Optional[ErrorHandler] = None


def get_video_engine() -> VideoProcessingEngine:
    """Get or create video processing engine instance."""
    global video_engine
    if video_engine is None:
        video_engine = VideoProcessingEngine()
    return video_engine


def get_performance_monitor() -> PerformanceMonitor:
    """Get or create performance monitor instance."""
    global performance_monitor
    if performance_monitor is None:
        performance_monitor = PerformanceMonitor()
    return performance_monitor


def get_error_handler() -> ErrorHandler:
    """Get or create error handler instance."""
    global error_handler
    if error_handler is None:
        error_handler = ErrorHandler()
    return error_handler


class VideoProcessingTask(Task):
    """Base class for video processing tasks."""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure."""
        logger.error(
            "Video processing task failed",
            task_id=task_id,
            exception=str(exc),
            traceback=einfo.traceback
        )
        
        # Update job status in database
        # This would typically update the job status to FAILED
        
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Handle task retry."""
        logger.warning(
            "Video processing task retrying",
            task_id=task_id,
            exception=str(exc),
            retry_count=self.request.retries
        )
    
    def on_success(self, retval, task_id, args, kwargs):
        """Handle task success."""
        logger.info(
            "Video processing task completed successfully",
            task_id=task_id,
            processing_time=retval.get('processing_time_seconds', 0)
        )


@celery_app.task(
    bind=True,
    base=VideoProcessingTask,
    max_retries=3,
    default_retry_delay=300,  # 5 minutes
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True
)
def process_video(
    self,
    job_data: Dict[str, Any],
    priority: str = "normal"
) -> Dict[str, Any]:
    """Process a video through the complete pipeline."""
    
    job_id = job_data.get('job_id', self.request.id)
    input_path = job_data['input_path']
    output_path = job_data['output_path']
    
    logger.info(
        "Starting video processing",
        job_id=job_id,
        input_path=input_path,
        priority=priority
    )
    
    try:
        # Update job status to PROCESSING
        self.update_state(
            state='PROCESSING',
            meta={'progress': 0, 'stage': 'initializing'}
        )
        
        # Get processing engine
        engine = get_video_engine()
        monitor = get_performance_monitor()
        
        # Create processing configuration
        config = VideoProcessingConfig(
            input_path=input_path,
            output_path=output_path,
            format=VideoFormat(job_data.get('format', 'youtube_long')),
            quality_preset=job_data.get('quality_preset', 'high'),
            enable_gpu=job_data.get('enable_gpu', True),
            enable_ai_narration=job_data.get('enable_ai_narration', True),
            enable_authenticity_injection=job_data.get('enable_authenticity_injection', True),
            enable_thumbnail_generation=job_data.get('enable_thumbnail_generation', True)
        )
        
        # Progress callback
        def progress_callback(stage: str, progress: float):
            self.update_state(
                state='PROCESSING',
                meta={
                    'progress': int(progress * 100),
                    'stage': stage,
                    'job_id': job_id
                }
            )
        
        # Start performance monitoring
        monitor.start_monitoring(job_id)
        
        # Process video
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                engine.process_video(
                    config=config,
                    job_id=job_id,
                    progress_callback=progress_callback
                )
            )
        finally:
            loop.close()
        
        # Stop performance monitoring
        performance_metrics = monitor.stop_monitoring(job_id)
        
        if result.success:
            logger.info(
                "Video processing completed successfully",
                job_id=job_id,
                output_path=result.output_path,
                processing_time=result.processing_time_seconds
            )
            
            return {
                'success': True,
                'job_id': job_id,
                'output_path': result.output_path,
                'metadata': result.metadata.__dict__ if result.metadata else {},
                'thumbnails': result.thumbnails or [],
                'processing_time_seconds': result.processing_time_seconds,
                'performance_metrics': performance_metrics,
                'authenticity_score': result.authenticity_score
            }
        else:
            error_msg = result.error_message or "Unknown processing error"
            logger.error(
                "Video processing failed",
                job_id=job_id,
                error=error_msg
            )
            
            # Retry on certain types of errors
            if "GPU" in error_msg or "memory" in error_msg.lower():
                raise self.retry(
                    countdown=60,  # Wait 1 minute before retry
                    max_retries=2
                )
            
            return {
                'success': False,
                'job_id': job_id,
                'error': error_msg,
                'processing_time_seconds': result.processing_time_seconds
            }
            
    except Exception as e:
        logger.error(
            "Video processing task exception",
            job_id=job_id,
            error=str(e),
            exc_info=True
        )
        
        # Handle specific exceptions
        if isinstance(e, FileNotFoundError):
            # Don't retry for missing files
            return {
                'success': False,
                'job_id': job_id,
                'error': f"Input file not found: {input_path}"
            }
        elif isinstance(e, MemoryError):
            # Retry with different GPU settings
            job_data['enable_gpu'] = False
            raise self.retry(
                args=[job_data, priority],
                countdown=120,  # Wait 2 minutes
                max_retries=1
            )
        else:
            # Retry for other exceptions
            raise self.retry(countdown=60 * (self.request.retries + 1))


@celery_app.task(
    bind=True,
    base=VideoProcessingTask,
    max_retries=2,
    queue='high_priority'
)
def process_urgent_video(
    self,
    job_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Process urgent video with high priority."""
    
    # Use optimized settings for urgent processing
    job_data.setdefault('quality_preset', 'standard')  # Faster processing
    job_data.setdefault('enable_ai_narration', False)   # Skip for speed
    job_data.setdefault('enable_thumbnail_generation', True)  # Keep thumbnails
    
    return process_video.apply(
        args=[job_data, "urgent"],
        queue='high_priority',
        priority=9
    ).get()


@celery_app.task(
    bind=True,
    queue='video_processing'
)
def batch_process_videos(
    self,
    job_batch: List[Dict[str, Any]],
    batch_settings: Dict[str, Any] = None
) -> Dict[str, Any]:
    """Process multiple videos in batch with optimization."""
    
    batch_id = batch_settings.get('batch_id', self.request.id)
    
    logger.info(
        "Starting batch video processing",
        batch_id=batch_id,
        video_count=len(job_batch)
    )
    
    try:
        results = []
        total_jobs = len(job_batch)
        
        for i, job_data in enumerate(job_batch):
            try:
                # Update batch progress
                self.update_state(
                    state='PROCESSING',
                    meta={
                        'batch_id': batch_id,
                        'progress': int((i / total_jobs) * 100),
                        'current_job': i + 1,
                        'total_jobs': total_jobs
                    }
                )
                
                # Process individual video
                result = process_video.apply(
                    args=[job_data, "batch"],
                    queue='normal_priority'
                ).get()
                
                results.append(result)
                
            except Exception as e:
                logger.error(
                    "Batch job failed",
                    batch_id=batch_id,
                    job_index=i,
                    error=str(e)
                )
                
                results.append({
                    'success': False,
                    'job_id': job_data.get('job_id', f"{batch_id}_{i}"),
                    'error': str(e)
                })
        
        successful_jobs = sum(1 for r in results if r.get('success', False))
        
        logger.info(
            "Batch processing completed",
            batch_id=batch_id,
            successful_jobs=successful_jobs,
            total_jobs=total_jobs
        )
        
        return {
            'batch_id': batch_id,
            'total_jobs': total_jobs,
            'successful_jobs': successful_jobs,
            'failed_jobs': total_jobs - successful_jobs,
            'results': results
        }
        
    except Exception as e:
        logger.error(
            "Batch processing failed",
            batch_id=batch_id,
            error=str(e)
        )
        raise


@celery_app.task(
    bind=True,
    queue='video_processing'
)
def extract_video_segments(
    self,
    video_path: str,
    segments: List[Dict[str, Any]],
    output_dir: str
) -> Dict[str, Any]:
    """Extract specific segments from a video."""
    
    job_id = self.request.id
    
    logger.info(
        "Starting video segment extraction",
        job_id=job_id,
        video_path=video_path,
        segment_count=len(segments)
    )
    
    try:
        import ffmpeg
        
        output_paths = []
        
        for i, segment in enumerate(segments):
            start_time = segment['start_time']
            end_time = segment['end_time']
            segment_name = segment.get('name', f"segment_{i}")
            
            output_path = Path(output_dir) / f"{segment_name}.mp4"
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            try:
                # Extract segment using ffmpeg
                (
                    ffmpeg
                    .input(video_path, ss=start_time, t=end_time - start_time)
                    .output(
                        str(output_path),
                        vcodec='libx264',
                        acodec='aac',
                        preset='fast'
                    )
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )
                
                if output_path.exists():
                    output_paths.append(str(output_path))
                    
                    logger.info(
                        "Segment extracted",
                        job_id=job_id,
                        segment_name=segment_name,
                        output_path=str(output_path)
                    )
                
            except Exception as e:
                logger.error(
                    "Segment extraction failed",
                    job_id=job_id,
                    segment_name=segment_name,
                    error=str(e)
                )
        
        return {
            'success': True,
            'job_id': job_id,
            'extracted_segments': len(output_paths),
            'total_segments': len(segments),
            'output_paths': output_paths
        }
        
    except Exception as e:
        logger.error(
            "Video segment extraction failed",
            job_id=job_id,
            error=str(e)
        )
        return {
            'success': False,
            'job_id': job_id,
            'error': str(e)
        }


@celery_app.task(
    bind=True,
    queue='video_processing'
)
def generate_video_thumbnails(
    self,
    video_path: str,
    output_dir: str,
    thumbnail_count: int = 5,
    timestamp_list: Optional[List[float]] = None
) -> Dict[str, Any]:
    """Generate thumbnails from video."""
    
    job_id = self.request.id
    
    logger.info(
        "Starting thumbnail generation",
        job_id=job_id,
        video_path=video_path,
        thumbnail_count=thumbnail_count
    )
    
    try:
        import cv2
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise RuntimeError(f"Could not open video: {video_path}")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        
        # Determine timestamps
        if timestamp_list:
            timestamps = timestamp_list[:thumbnail_count]
        else:
            # Evenly distributed timestamps
            timestamps = [duration * i / thumbnail_count for i in range(thumbnail_count)]
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        thumbnail_paths = []
        
        for i, timestamp in enumerate(timestamps):
            # Seek to timestamp
            frame_number = int(timestamp * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            
            ret, frame = cap.read()
            if ret:
                thumbnail_path = output_dir / f"thumbnail_{i}_{int(timestamp)}.jpg"
                
                # Save frame as JPEG
                cv2.imwrite(str(thumbnail_path), frame, [
                    cv2.IMWRITE_JPEG_QUALITY, 90
                ])
                
                thumbnail_paths.append(str(thumbnail_path))
                
                logger.debug(
                    "Thumbnail generated",
                    job_id=job_id,
                    timestamp=timestamp,
                    path=str(thumbnail_path)
                )
        
        cap.release()
        
        logger.info(
            "Thumbnail generation completed",
            job_id=job_id,
            generated_count=len(thumbnail_paths)
        )
        
        return {
            'success': True,
            'job_id': job_id,
            'thumbnail_paths': thumbnail_paths,
            'timestamps': timestamps
        }
        
    except Exception as e:
        logger.error(
            "Thumbnail generation failed",
            job_id=job_id,
            error=str(e)
        )
        return {
            'success': False,
            'job_id': job_id,
            'error': str(e)
        }


@celery_app.task(bind=True)
def health_check_video_processing(self) -> Dict[str, Any]:
    """Health check for video processing workers."""
    
    try:
        # Check GPU availability
        engine = get_video_engine()
        gpu_status = await engine.get_processing_queue_status()
        
        # Check system resources
        import psutil
        
        return {
            'status': 'healthy',
            'worker_id': self.request.hostname,
            'gpu_status': gpu_status,
            'cpu_percent': psutil.cpu_percent(),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'timestamp': time.time()
        }
        
    except Exception as e:
        logger.error("Video processing health check failed", error=str(e))
        return {
            'status': 'unhealthy',
            'worker_id': self.request.hostname,
            'error': str(e),
            'timestamp': time.time()
        }
