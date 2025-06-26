"""Queue management for video/slideshow jobs"""

import json
import logging
import uuid
from typing import Any, Dict, Optional
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class QueueManager:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.redis_client = None
    
    async def connect(self) -> None:
        self.redis_client = redis.from_url(self.redis_url)
    
    async def disconnect(self) -> None:
        if self.redis_client:
            await self.redis_client.close()
    
    async def health_check(self) -> bool:
        try:
            await self.redis_client.ping()
            return True
        except:
            return False
    
    async def add_video_job(self, job_data: Dict[str, Any]) -> str:
        job_id = str(uuid.uuid4())
        job = {"id": job_id, "type": "video", "data": job_data}
        await self.redis_client.lpush("video_generation_queue", json.dumps(job))
        return job_id
    
    async def add_slideshow_job(self, job_data: Dict[str, Any]) -> str:
        job_id = str(uuid.uuid4())
        job = {"id": job_id, "type": "slideshow", "data": job_data}
        await self.redis_client.lpush("slideshow_generation_queue", json.dumps(job))
        return job_id
    
    async def get_video_job(self, timeout: int = 10) -> Optional[Dict[str, Any]]:
        result = await self.redis_client.blpop("video_generation_queue", timeout=timeout)
        if result:
            return json.loads(result[1])
        return None
    
    async def get_slideshow_job(self, timeout: int = 10) -> Optional[Dict[str, Any]]:
        result = await self.redis_client.blpop("slideshow_generation_queue", timeout=timeout)
        if result:
            return json.loads(result[1])
        return None
    
    async def get_queue_stats(self) -> Dict[str, int]:
        video_count = await self.redis_client.llen("video_generation_queue")
        slideshow_count = await self.redis_client.llen("slideshow_generation_queue")
        return {
            "video_queue": video_count,
            "slideshow_queue": slideshow_count,
            "total": video_count + slideshow_count,
        }