"""YouTube API v3 integration service for multi-channel management and automation."""

import asyncio
import json
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta, timezone
from pathlib import Path
import aiofiles
import structlog
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.http import MediaFileUpload
import httpx
from dataclasses import dataclass, asdict
from enum import Enum

from ..config.settings import get_settings
from ..models.youtube_models import (
    Channel, Video, UploadJob, AnalyticsData, 
    UploadStatus, VideoMetadata, ChannelStatus
)
from ..utils.rate_limiter import RateLimiter
from ..utils.encryption import EncryptionManager

logger = structlog.get_logger()
settings = get_settings()


class VideoPrivacy(Enum):
    """YouTube video privacy settings."""
    PUBLIC = "public"
    UNLISTED = "unlisted"
    PRIVATE = "private"
    SCHEDULED = "scheduled"


class VideoCategory(Enum):
    """YouTube video categories."""
    SCIENCE_TECHNOLOGY = "28"
    EDUCATION = "27"
    HOWTO_STYLE = "26"
    ENTERTAINMENT = "24"
    GAMING = "20"
    NEWS_POLITICS = "25"
    PEOPLE_BLOGS = "22"


@dataclass
class UploadMetadata:
    """Metadata for video upload."""
    title: str
    description: str
    tags: List[str]
    category_id: str = VideoCategory.SCIENCE_TECHNOLOGY.value
    privacy_status: str = VideoPrivacy.PUBLIC.value
    scheduled_publish_time: Optional[datetime] = None
    thumbnail_path: Optional[str] = None
    playlist_id: Optional[str] = None
    language: str = "en"
    default_audio_language: str = "en"
    

@dataclass
class ChannelCredentials:
    """YouTube channel credentials."""
    channel_id: str
    channel_name: str
    credentials_json: str
    access_token: str
    refresh_token: str
    token_expiry: datetime
    quota_remaining: int
    daily_upload_count: int
    last_upload_time: Optional[datetime] = None
    is_active: bool = True
    

class YouTubeAPIService:
    """YouTube API v3 service for multi-channel automation."""
    
    def __init__(self):
        self.settings = get_settings()
        self.rate_limiter = RateLimiter(
            requests_per_minute=self.settings.youtube_api.quota_per_day // (24 * 60),
            burst_limit=100
        )
        self.encryption_manager = EncryptionManager()
        
        # Channel management
        self.active_channels: Dict[str, ChannelCredentials] = {}
        self.channel_rotation_index = 0
        
        # API clients cache
        self.youtube_clients: Dict[str, Any] = {}
        
        # Upload queue management
        self.upload_semaphore = asyncio.Semaphore(self.settings.scaling.upload_workers)
        
        logger.info(
            "YouTube API service initialized",
            max_channels=self.settings.youtube_api.max_channels_per_account,
            upload_workers=self.settings.scaling.upload_workers
        )
    
    async def initialize_channels(self, credentials_dir: str) -> None:
        """Initialize all configured YouTube channels."""
        
        credentials_path = Path(credentials_dir)
        if not credentials_path.exists():
            logger.warning("YouTube credentials directory not found", path=credentials_dir)
            return
        
        # Load channel credentials
        credential_files = list(credentials_path.glob("*.json"))
        
        for cred_file in credential_files:
            try:
                await self._load_channel_credentials(cred_file)
            except Exception as e:
                logger.error("Failed to load channel credentials", file=cred_file, error=str(e))
        
        logger.info(
            "Channel initialization complete",
            active_channels=len(self.active_channels)
        )
    
    async def _load_channel_credentials(self, credentials_file: Path) -> None:
        """Load credentials for a single channel."""
        
        async with aiofiles.open(credentials_file, 'r') as f:
            cred_data = json.loads(await f.read())
        
        # Decrypt sensitive data
        decrypted_creds = self.encryption_manager.decrypt_credentials(cred_data)
        
        # Create credentials object
        credentials = Credentials.from_authorized_user_info(decrypted_creds)
        
        # Refresh if needed
        if credentials.expired:
            credentials.refresh(Request())
        
        # Build YouTube client
        youtube_client = build('youtube', 'v3', credentials=credentials)
        
        # Get channel info
        channels_response = youtube_client.channels().list(
            part='snippet,statistics,status',
            mine=True
        ).execute()
        
        if not channels_response.get('items'):
            logger.warning("No channels found for credentials", file=credentials_file)
            return
        
        channel_info = channels_response['items'][0]
        channel_id = channel_info['id']
        
        # Create channel credentials object
        channel_creds = ChannelCredentials(
            channel_id=channel_id,
            channel_name=channel_info['snippet']['title'],
            credentials_json=json.dumps(decrypted_creds),
            access_token=credentials.token,
            refresh_token=credentials.refresh_token,
            token_expiry=credentials.expiry or datetime.now(timezone.utc) + timedelta(hours=1),
            quota_remaining=self.settings.youtube_api.quota_per_day,
            daily_upload_count=0
        )
        
        # Store credentials and client
        self.active_channels[channel_id] = channel_creds
        self.youtube_clients[channel_id] = youtube_client
        
        logger.info(
            "Channel loaded successfully",
            channel_id=channel_id,
            channel_name=channel_creds.channel_name
        )
    
    async def upload_video(
        self,
        video_path: str,
        metadata: UploadMetadata,
        channel_id: Optional[str] = None,
        job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Upload video to YouTube with automatic channel rotation."""
        
        async with self.upload_semaphore:
            try:
                # Select channel for upload
                selected_channel = await self._select_upload_channel(channel_id)
                
                if not selected_channel:
                    raise RuntimeError("No available channels for upload")
                
                # Apply rate limiting
                await self.rate_limiter.acquire()
                
                # Perform upload
                upload_result = await self._perform_upload(
                    video_path=video_path,
                    metadata=metadata,
                    channel=selected_channel,
                    job_id=job_id
                )
                
                # Update channel stats
                selected_channel.daily_upload_count += 1
                selected_channel.last_upload_time = datetime.now(timezone.utc)
                selected_channel.quota_remaining -= 1600  # Approximate quota cost
                
                logger.info(
                    "Video upload successful",
                    video_id=upload_result.get("video_id"),
                    channel_id=selected_channel.channel_id,
                    job_id=job_id
                )
                
                return upload_result
                
            except Exception as e:
                logger.error("Video upload failed", error=str(e), job_id=job_id)
                raise
    
    async def _select_upload_channel(self, preferred_channel_id: Optional[str] = None) -> Optional[ChannelCredentials]:
        """Select the best channel for upload based on quotas and rotation."""
        
        if not self.active_channels:
            return None
        
        # Use preferred channel if specified and available
        if preferred_channel_id and preferred_channel_id in self.active_channels:
            channel = self.active_channels[preferred_channel_id]
            if await self._is_channel_available_for_upload(channel):
                return channel
        
        # Find available channels
        available_channels = [
            channel for channel in self.active_channels.values()
            if await self._is_channel_available_for_upload(channel)
        ]
        
        if not available_channels:
            logger.warning("No available channels for upload")
            return None
        
        # Use rotation if enabled
        if self.settings.youtube_api.channel_rotation_enabled:
            # Round-robin selection
            selected_channel = available_channels[self.channel_rotation_index % len(available_channels)]
            self.channel_rotation_index += 1
        else:
            # Select channel with most remaining quota
            selected_channel = max(available_channels, key=lambda c: c.quota_remaining)
        
        return selected_channel
    
    async def _is_channel_available_for_upload(self, channel: ChannelCredentials) -> bool:
        """Check if channel is available for upload."""
        
        if not channel.is_active:
            return False
        
        # Check quota
        if channel.quota_remaining < 1600:  # Minimum quota for upload
            return False
        
        # Check daily upload limit
        if channel.daily_upload_count >= self.settings.youtube_api.uploads_per_day_per_channel:
            return False
        
        # Check minimum interval between uploads
        if channel.last_upload_time:
            time_since_last = datetime.now(timezone.utc) - channel.last_upload_time
            min_interval = timedelta(minutes=self.settings.youtube_api.min_upload_interval_minutes)
            
            if time_since_last < min_interval:
                return False
        
        # Check token expiry
        if channel.token_expiry <= datetime.now(timezone.utc):
            # Try to refresh token
            try:
                await self._refresh_channel_token(channel)
            except Exception as e:
                logger.error("Failed to refresh channel token", channel_id=channel.channel_id, error=str(e))
                return False
        
        return True
    
    async def _refresh_channel_token(self, channel: ChannelCredentials) -> None:
        """Refresh OAuth token for channel."""
        
        try:
            cred_data = json.loads(channel.credentials_json)
            credentials = Credentials.from_authorized_user_info(cred_data)
            
            credentials.refresh(Request())
            
            # Update channel credentials
            channel.access_token = credentials.token
            channel.token_expiry = credentials.expiry or datetime.now(timezone.utc) + timedelta(hours=1)
            
            # Update YouTube client
            self.youtube_clients[channel.channel_id] = build('youtube', 'v3', credentials=credentials)
            
            logger.info("Channel token refreshed", channel_id=channel.channel_id)
            
        except Exception as e:
            logger.error("Token refresh failed", channel_id=channel.channel_id, error=str(e))
            raise
    
    async def _perform_upload(
        self,
        video_path: str,
        metadata: UploadMetadata,
        channel: ChannelCredentials,
        job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Perform the actual video upload."""
        
        try:
            youtube_client = self.youtube_clients[channel.channel_id]
            
            # Prepare video metadata
            video_body = {
                'snippet': {
                    'title': metadata.title,
                    'description': metadata.description,
                    'tags': metadata.tags,
                    'categoryId': metadata.category_id,
                    'defaultLanguage': metadata.language,
                    'defaultAudioLanguage': metadata.default_audio_language
                },
                'status': {
                    'privacyStatus': metadata.privacy_status,
                    'madeForKids': False,
                    'selfDeclaredMadeForKids': False
                }
            }
            
            # Add scheduled publish time if specified
            if metadata.scheduled_publish_time:
                video_body['status']['publishAt'] = metadata.scheduled_publish_time.isoformat()
                video_body['status']['privacyStatus'] = 'private'  # Required for scheduled videos
            
            # Create media upload object
            media = MediaFileUpload(
                video_path,
                chunksize=-1,  # Upload in a single chunk
                resumable=True,
                mimetype='video/*'
            )
            
            # Execute upload
            insert_request = youtube_client.videos().insert(
                part=','.join(video_body.keys()),
                body=video_body,
                media_body=media
            )
            
            # Upload with progress tracking
            response = await self._execute_upload_with_retry(insert_request, job_id)
            
            video_id = response['id']
            
            # Upload thumbnail if provided
            if metadata.thumbnail_path and Path(metadata.thumbnail_path).exists():
                await self._upload_thumbnail(youtube_client, video_id, metadata.thumbnail_path)
            
            # Add to playlist if specified
            if metadata.playlist_id:
                await self._add_to_playlist(youtube_client, video_id, metadata.playlist_id)
            
            return {
                'success': True,
                'video_id': video_id,
                'video_url': f'https://www.youtube.com/watch?v={video_id}',
                'channel_id': channel.channel_id,
                'upload_time': datetime.now(timezone.utc).isoformat()
            }
            
        except HttpError as e:
            error_details = json.loads(e.content.decode('utf-8'))
            logger.error("YouTube API error during upload", error=error_details, job_id=job_id)
            raise
        except Exception as e:
            logger.error("Upload execution failed", error=str(e), job_id=job_id)
            raise
    
    async def _execute_upload_with_retry(
        self,
        insert_request: Any,
        job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute upload with exponential backoff retry."""
        
        max_retries = self.settings.youtube_api.max_upload_retries
        
        for attempt in range(max_retries + 1):
            try:
                # Execute the upload request
                response = None
                error = None
                
                # Resumable upload loop
                while response is None:
                    try:
                        logger.info(f"Upload attempt {attempt + 1}", job_id=job_id)
                        status, response = insert_request.next_chunk()
                        
                        if status:
                            logger.info(
                                "Upload progress",
                                progress=f"{status.progress() * 100:.1f}%",
                                job_id=job_id
                            )
                    
                    except HttpError as e:
                        if e.resp.status in [500, 502, 503, 504]:
                            # Retriable errors
                            error = e
                            break
                        else:
                            # Non-retriable errors
                            raise
                
                if response:
                    return response
                
                if error and attempt < max_retries:
                    # Exponential backoff
                    wait_time = (2 ** attempt) * 60  # Start with 1 minute
                    logger.warning(
                        "Upload failed, retrying",
                        attempt=attempt + 1,
                        wait_time=wait_time,
                        error=str(error),
                        job_id=job_id
                    )
                    await asyncio.sleep(wait_time)
                    continue
                
                if error:
                    raise error
            
            except Exception as e:
                if attempt < max_retries:
                    wait_time = (2 ** attempt) * 60
                    logger.warning(
                        "Upload error, retrying",
                        attempt=attempt + 1,
                        wait_time=wait_time,
                        error=str(e),
                        job_id=job_id
                    )
                    await asyncio.sleep(wait_time)
                else:
                    raise
        
        raise RuntimeError(f"Upload failed after {max_retries} retries")
    
    async def _upload_thumbnail(
        self,
        youtube_client: Any,
        video_id: str,
        thumbnail_path: str
    ) -> None:
        """Upload custom thumbnail for video."""
        
        try:
            thumbnail_media = MediaFileUpload(
                thumbnail_path,
                mimetype='image/jpeg',
                resumable=False
            )
            
            youtube_client.thumbnails().set(
                videoId=video_id,
                media_body=thumbnail_media
            ).execute()
            
            logger.info("Thumbnail uploaded successfully", video_id=video_id)
            
        except Exception as e:
            logger.error("Thumbnail upload failed", video_id=video_id, error=str(e))
            # Don't fail the entire upload for thumbnail issues
    
    async def _add_to_playlist(
        self,
        youtube_client: Any,
        video_id: str,
        playlist_id: str
    ) -> None:
        """Add video to specified playlist."""
        
        try:
            playlist_item_body = {
                'snippet': {
                    'playlistId': playlist_id,
                    'resourceId': {
                        'kind': 'youtube#video',
                        'videoId': video_id
                    }
                }
            }
            
            youtube_client.playlistItems().insert(
                part='snippet',
                body=playlist_item_body
            ).execute()
            
            logger.info("Video added to playlist", video_id=video_id, playlist_id=playlist_id)
            
        except Exception as e:
            logger.error("Failed to add video to playlist", video_id=video_id, playlist_id=playlist_id, error=str(e))
            # Don't fail the entire upload for playlist issues
    
    async def get_video_analytics(
        self,
        video_id: str,
        channel_id: Optional[str] = None,
        metrics: List[str] = None
    ) -> Dict[str, Any]:
        """Get analytics data for a video."""
        
        if not metrics:
            metrics = [
                'views', 'likes', 'dislikes', 'comments',
                'shares', 'watchTimeMinutes', 'averageViewDuration',
                'clickThroughRate', 'subscribersGained'
            ]
        
        try:
            # Select channel client
            if channel_id and channel_id in self.youtube_clients:
                youtube_client = self.youtube_clients[channel_id]
            else:
                # Use first available client
                youtube_client = next(iter(self.youtube_clients.values()))
            
            # Get video statistics
            video_response = youtube_client.videos().list(
                part='statistics,snippet,contentDetails',
                id=video_id
            ).execute()
            
            if not video_response.get('items'):
                raise ValueError(f"Video not found: {video_id}")
            
            video_data = video_response['items'][0]
            
            # Get analytics data from YouTube Analytics API
            # Note: This requires additional setup for Analytics API
            analytics_data = {
                'video_id': video_id,
                'views': int(video_data['statistics'].get('viewCount', 0)),
                'likes': int(video_data['statistics'].get('likeCount', 0)),
                'comments': int(video_data['statistics'].get('commentCount', 0)),
                'duration': video_data['contentDetails']['duration'],
                'published_at': video_data['snippet']['publishedAt'],
                'title': video_data['snippet']['title']
            }
            
            return analytics_data
            
        except Exception as e:
            logger.error("Failed to get video analytics", video_id=video_id, error=str(e))
            raise
    
    async def get_channel_analytics(
        self,
        channel_id: str,
        date_range: Tuple[datetime, datetime]
    ) -> Dict[str, Any]:
        """Get analytics data for a channel."""
        
        try:
            youtube_client = self.youtube_clients[channel_id]
            
            # Get channel statistics
            channel_response = youtube_client.channels().list(
                part='statistics,snippet',
                id=channel_id
            ).execute()
            
            if not channel_response.get('items'):
                raise ValueError(f"Channel not found: {channel_id}")
            
            channel_data = channel_response['items'][0]
            
            analytics_data = {
                'channel_id': channel_id,
                'subscriber_count': int(channel_data['statistics'].get('subscriberCount', 0)),
                'video_count': int(channel_data['statistics'].get('videoCount', 0)),
                'view_count': int(channel_data['statistics'].get('viewCount', 0)),
                'channel_name': channel_data['snippet']['title'],
                'date_range': {
                    'start': date_range[0].isoformat(),
                    'end': date_range[1].isoformat()
                }
            }
            
            return analytics_data
            
        except Exception as e:
            logger.error("Failed to get channel analytics", channel_id=channel_id, error=str(e))
            raise
    
    async def manage_channel_quotas(self) -> Dict[str, Any]:
        """Manage and optimize channel quota usage."""
        
        quota_status = {}
        
        for channel_id, channel in self.active_channels.items():
            # Reset daily counters if needed
            if self._should_reset_daily_counters(channel):
                channel.daily_upload_count = 0
                channel.quota_remaining = self.settings.youtube_api.quota_per_day
            
            quota_status[channel_id] = {
                'channel_name': channel.channel_name,
                'quota_remaining': channel.quota_remaining,
                'daily_uploads': channel.daily_upload_count,
                'max_daily_uploads': self.settings.youtube_api.uploads_per_day_per_channel,
                'is_available': await self._is_channel_available_for_upload(channel),
                'last_upload': channel.last_upload_time.isoformat() if channel.last_upload_time else None
            }
        
        return {
            'total_channels': len(self.active_channels),
            'available_channels': sum(1 for status in quota_status.values() if status['is_available']),
            'channel_details': quota_status
        }
    
    def _should_reset_daily_counters(self, channel: ChannelCredentials) -> bool:
        """Check if daily counters should be reset."""
        
        if not channel.last_upload_time:
            return False
        
        # Reset if last upload was yesterday or earlier
        last_upload_date = channel.last_upload_time.date()
        today = datetime.now(timezone.utc).date()
        
        return last_upload_date < today
    
    async def create_playlist(
        self,
        channel_id: str,
        title: str,
        description: str,
        privacy_status: str = "public"
    ) -> str:
        """Create a new playlist on the specified channel."""
        
        try:
            youtube_client = self.youtube_clients[channel_id]
            
            playlist_body = {
                'snippet': {
                    'title': title,
                    'description': description
                },
                'status': {
                    'privacyStatus': privacy_status
                }
            }
            
            response = youtube_client.playlists().insert(
                part='snippet,status',
                body=playlist_body
            ).execute()
            
            playlist_id = response['id']
            
            logger.info("Playlist created", playlist_id=playlist_id, channel_id=channel_id)
            
            return playlist_id
            
        except Exception as e:
            logger.error("Failed to create playlist", channel_id=channel_id, error=str(e))
            raise
    
    async def get_upload_queue_status(self) -> Dict[str, Any]:
        """Get current upload queue status."""
        
        return {
            'active_uploads': self.settings.scaling.upload_workers - self.upload_semaphore._value,
            'max_concurrent_uploads': self.settings.scaling.upload_workers,
            'available_channels': len([
                ch for ch in self.active_channels.values()
                if await self._is_channel_available_for_upload(ch)
            ]),
            'total_channels': len(self.active_channels)
        }
    
    async def shutdown(self) -> None:
        """Shutdown the YouTube API service."""
        logger.info("Shutting down YouTube API service")
        
        # Save channel states if needed
        # Close any open connections
        
        logger.info("YouTube API service shutdown complete")
