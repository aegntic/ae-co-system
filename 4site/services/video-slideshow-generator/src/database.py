"""Database management for video/slideshow service"""

import logging
from typing import Any, Dict
import asyncpg

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.pool = None
    
    async def connect(self) -> None:
        self.pool = await asyncpg.create_pool(self.database_url)
    
    async def disconnect(self) -> None:
        if self.pool:
            await self.pool.close()
    
    async def health_check(self) -> bool:
        try:
            async with self.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            return True
        except:
            return False
    
    async def update_site_status(self, site_id: str, status: str, metadata: Dict[str, Any]) -> None:
        async with self.pool.acquire() as conn:
            await conn.execute(
                "UPDATE generated_sites SET status = $1, theme_config = $2 WHERE id = $3",
                status, metadata, site_id
            )
    
    async def update_site_video_info(self, site_id: str, video_info: Dict[str, Any]) -> None:
        async with self.pool.acquire() as conn:
            await conn.execute(
                "UPDATE generated_sites SET theme_config = theme_config || $1 WHERE id = $2",
                {"video": video_info}, site_id
            )
    
    async def update_site_slideshow_info(self, site_id: str, slideshow_info: Dict[str, Any]) -> None:
        async with self.pool.acquire() as conn:
            await conn.execute(
                "UPDATE generated_sites SET theme_config = theme_config || $1 WHERE id = $2",
                {"slideshow": slideshow_info}, site_id
            )