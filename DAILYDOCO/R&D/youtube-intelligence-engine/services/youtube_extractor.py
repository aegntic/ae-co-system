"""YouTube Content Extractor - Extracts video content, metadata, and transcripts."""

import asyncio
import tempfile
import os
from typing import Dict, Any, Optional
import structlog
from pathlib import Path

try:
    import yt_dlp
except ImportError:
    yt_dlp = None

try:
    import whisper
except ImportError:
    whisper = None

logger = structlog.get_logger()


class YouTubeExtractor:
    """Advanced YouTube content extraction with multi-modal analysis."""
    
    def __init__(self, temp_dir: Optional[str] = None):
        self.temp_dir = temp_dir or tempfile.gettempdir()
        self.whisper_model = None
        
        if whisper:
            try:
                self.whisper_model = whisper.load_model("base")
                logger.info("Whisper model loaded for transcription")
            except Exception as e:
                logger.warning("Failed to load Whisper model", error=str(e))
    
    async def extract_content(self, url: str) -> Dict[str, Any]:
        """Extract comprehensive content from YouTube URL."""
        logger.info("Extracting YouTube content", url=url)
        
        if not yt_dlp:
            raise RuntimeError("yt-dlp not installed. Install with: uv add yt-dlp")
        
        try:
            # Extract metadata and video info
            metadata = await self._extract_metadata(url)
            
            # Extract transcript (try multiple methods)
            transcript = await self._extract_transcript(url, metadata)
            
            # Extract audio features (if needed for advanced analysis)
            audio_features = await self._extract_audio_features(url, metadata)
            
            return {
                "url": url,
                "metadata": metadata,
                "transcript": transcript,
                "audio_features": audio_features,
                "extraction_timestamp": asyncio.get_event_loop().time()
            }
            
        except Exception as e:
            logger.error("Content extraction failed", url=url, error=str(e))
            raise
    
    async def _extract_metadata(self, url: str) -> Dict[str, Any]:
        """Extract video metadata using yt-dlp."""
        logger.info("Extracting metadata", url=url)
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'writeinfojson': False,
            'writethumbnail': False,
            'writesubtitles': False,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Run in thread to avoid blocking async loop
                info = await asyncio.get_event_loop().run_in_executor(
                    None, ydl.extract_info, url, False
                )
                
                return {
                    'title': info.get('title', ''),
                    'description': info.get('description', ''),
                    'duration': info.get('duration', 0),
                    'view_count': info.get('view_count', 0),
                    'like_count': info.get('like_count', 0),
                    'channel': info.get('uploader', ''),
                    'channel_id': info.get('uploader_id', ''),
                    'upload_date': info.get('upload_date', ''),
                    'tags': info.get('tags', []),
                    'categories': info.get('categories', []),
                    'thumbnail': info.get('thumbnail', ''),
                    'webpage_url': info.get('webpage_url', url),
                    'video_id': info.get('id', ''),
                    'language': info.get('language', 'en'),
                    'availability': info.get('availability', 'public')
                }
                
        except Exception as e:
            logger.error("Metadata extraction failed", url=url, error=str(e))
            return {'title': '', 'description': '', 'url': url}
    
    async def _extract_transcript(self, url: str, metadata: Dict[str, Any]) -> str:
        """Extract transcript using multiple methods."""
        logger.info("Extracting transcript", url=url)
        
        # Method 1: Try to get existing subtitles
        subtitles = await self._get_existing_subtitles(url)
        if subtitles:
            logger.info("Found existing subtitles")
            return subtitles
        
        # Method 2: Use Whisper for transcription (if available)
        if self.whisper_model:
            whisper_transcript = await self._transcribe_with_whisper(url)
            if whisper_transcript:
                logger.info("Generated transcript with Whisper")
                return whisper_transcript
        
        # Method 3: Fallback to description analysis
        logger.info("Using description as fallback transcript")
        return metadata.get('description', '')
    
    async def _get_existing_subtitles(self, url: str) -> Optional[str]:
        """Try to extract existing subtitles."""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en', 'en-US', 'en-GB'],
            'skip_download': True,
            'outtmpl': os.path.join(self.temp_dir, '%(id)s.%(ext)s')
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = await asyncio.get_event_loop().run_in_executor(
                    None, ydl.extract_info, url, False
                )
                
                # Check if subtitles are available
                if 'subtitles' in info and info['subtitles']:
                    # Try to download subtitles
                    await asyncio.get_event_loop().run_in_executor(
                        None, ydl.download, [url]
                    )
                    
                    # Look for subtitle files
                    video_id = info.get('id', '')
                    for ext in ['.en.vtt', '.en.srt', '.vtt', '.srt']:
                        subtitle_file = Path(self.temp_dir) / f"{video_id}{ext}"
                        if subtitle_file.exists():
                            content = subtitle_file.read_text(encoding='utf-8')
                            subtitle_file.unlink()  # Clean up
                            return self._clean_subtitle_text(content)
                
                return None
                
        except Exception as e:
            logger.warning("Subtitle extraction failed", url=url, error=str(e))
            return None
    
    def _clean_subtitle_text(self, subtitle_content: str) -> str:
        """Clean subtitle content to extract just the text."""
        import re
        
        # Remove VTT/SRT timing information
        cleaned = re.sub(r'\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}', '', subtitle_content)
        cleaned = re.sub(r'WEBVTT', '', cleaned)
        cleaned = re.sub(r'\d+\n', '', cleaned)  # Remove subtitle numbers
        cleaned = re.sub(r'<[^>]+>', '', cleaned)  # Remove HTML tags
        cleaned = re.sub(r'\n+', ' ', cleaned)  # Replace multiple newlines with space
        
        return cleaned.strip()
    
    async def _transcribe_with_whisper(self, url: str) -> Optional[str]:
        """Transcribe audio using Whisper model."""
        if not self.whisper_model:
            return None
        
        try:
            # Download audio only
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(self.temp_dir, '%(id)s.%(ext)s'),
                'quiet': True,
                'no_warnings': True,
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'wav',
                }]
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = await asyncio.get_event_loop().run_in_executor(
                    None, ydl.extract_info, url, True
                )
                
                video_id = info.get('id', '')
                audio_file = Path(self.temp_dir) / f"{video_id}.wav"
                
                if audio_file.exists():
                    # Transcribe with Whisper
                    result = await asyncio.get_event_loop().run_in_executor(
                        None, self.whisper_model.transcribe, str(audio_file)
                    )
                    
                    # Clean up audio file
                    audio_file.unlink()
                    
                    return result.get('text', '')
                
        except Exception as e:
            logger.warning("Whisper transcription failed", url=url, error=str(e))
        
        return None
    
    async def _extract_audio_features(self, url: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Extract audio features for advanced analysis."""
        # For now, return basic features from metadata
        # Could be extended with actual audio analysis using librosa
        return {
            'duration': metadata.get('duration', 0),
            'has_audio': True,  # Assume videos have audio
            'estimated_speech_ratio': 0.7,  # Placeholder
            'audio_quality': 'medium'  # Placeholder
        }
    
    async def validate_url(self, url: str) -> bool:
        """Validate if URL is a valid YouTube URL."""
        youtube_patterns = [
            r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)',
            r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]+)',
            r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]+)',
            r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([\w-]+)'
        ]
        
        import re
        for pattern in youtube_patterns:
            if re.match(pattern, url):
                return True
        
        return False
    
    async def get_video_id(self, url: str) -> Optional[str]:
        """Extract video ID from YouTube URL."""
        import re
        
        patterns = [
            r'(?:v=|/)([0-9A-Za-z_-]{11}).*',
            r'(?:embed/)([0-9A-Za-z_-]{11})',
            r'(?:v/)([0-9A-Za-z_-]{11})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
