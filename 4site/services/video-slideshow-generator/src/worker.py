"""Background worker for processing video/slideshow generation jobs"""

import asyncio
import logging
import uuid
from typing import Any, Dict

from .queue_manager import QueueManager
from .video_generator import VideoGenerator
from .slideshow_generator import SlideshowGenerator
from .database import DatabaseManager

logger = logging.getLogger(__name__)


class VideoWorker:
    """Background worker for video/slideshow generation"""
    
    def __init__(
        self,
        worker_id: int,
        queue_manager: QueueManager,
        video_generator: VideoGenerator,
        slideshow_generator: SlideshowGenerator,
        db_manager: DatabaseManager,
    ):
        self.worker_id = worker_id
        self.queue_manager = queue_manager
        self.video_generator = video_generator
        self.slideshow_generator = slideshow_generator
        self.db_manager = db_manager
        self.is_running = False
    
    async def start(self) -> None:
        """Start the worker loop"""
        self.is_running = True
        logger.info(f"Video worker {self.worker_id} started")
        
        while self.is_running:
            try:
                # Check for video generation jobs
                video_job = await self.queue_manager.get_video_job(timeout=10)
                if video_job:
                    await self._process_video_job(video_job)
                    continue
                
                # Check for slideshow generation jobs  
                slideshow_job = await self.queue_manager.get_slideshow_job(timeout=10)
                if slideshow_job:
                    await self._process_slideshow_job(slideshow_job)
                    continue
                
                # Short sleep if no jobs
                await asyncio.sleep(1)
                
            except asyncio.CancelledError:
                logger.info(f"Video worker {self.worker_id} cancelled")
                break
            except Exception as e:
                logger.error(f"Video worker {self.worker_id} error: {e}")
                await asyncio.sleep(5)  # Wait before retrying
        
        logger.info(f"Video worker {self.worker_id} stopped")
    
    def stop(self) -> None:
        """Stop the worker"""
        self.is_running = False
    
    async def _process_video_job(self, job: Dict[str, Any]) -> None:
        """Process a video generation job"""
        job_id = job.get("id", str(uuid.uuid4()))
        project_id = job["data"]["projectId"]
        
        logger.info(f"Worker {self.worker_id} processing video job {job_id}")
        
        try:
            # Update job status
            await self.db_manager.update_site_status(
                project_id, "generating_video", {"workerId": self.worker_id}
            )
            
            # Generate video
            result = await self.video_generator.generate_video(
                project_id=project_id,
                content_sections=job["data"]["contentSections"],
                voice_settings=job["data"].get("voiceSettings", {}),
                project_metadata=job["data"].get("projectMetadata", {}),
            )
            
            if result["success"]:
                # Update database with video info
                await self.db_manager.update_site_video_info(
                    project_id, result
                )
                
                logger.info(f"Video generation completed for job {job_id}")
            else:
                logger.error(f"Video generation failed for job {job_id}: {result.get('error')}")
                await self.db_manager.update_site_status(
                    project_id, "video_generation_failed", {"error": result.get("error")}
                )
        
        except Exception as e:
            logger.error(f"Video job {job_id} processing failed: {e}")
            await self.db_manager.update_site_status(
                project_id, "video_generation_failed", {"error": str(e)}
            )
    
    async def _process_slideshow_job(self, job: Dict[str, Any]) -> None:
        """Process a slideshow generation job"""
        job_id = job.get("id", str(uuid.uuid4()))
        project_id = job["data"]["projectId"]
        
        logger.info(f"Worker {self.worker_id} processing slideshow job {job_id}")
        
        try:
            # Update job status
            await self.db_manager.update_site_status(
                project_id, "generating_slideshow", {"workerId": self.worker_id}
            )
            
            # Generate slideshow
            result = await self.slideshow_generator.generate_slideshow(
                project_id=project_id,
                content_sections=job["data"]["contentSections"],
                design_settings=job["data"].get("designSettings", {}),
                project_metadata=job["data"].get("projectMetadata", {}),
            )
            
            if result["success"]:
                # Update database with slideshow info
                await self.db_manager.update_site_slideshow_info(
                    project_id, result
                )
                
                logger.info(f"Slideshow generation completed for job {job_id}")
            else:
                logger.error(f"Slideshow generation failed for job {job_id}: {result.get('error')}")
                await self.db_manager.update_site_status(
                    project_id, "slideshow_generation_failed", {"error": result.get("error")}
                )
        
        except Exception as e:
            logger.error(f"Slideshow job {job_id} processing failed: {e}")
            await self.db_manager.update_site_status(
                project_id, "slideshow_generation_failed", {"error": str(e)}
            )