import os
import json
from typing import Dict, Any, Optional, List

from pytube import YouTube
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled

class VideoProcessor:
    """Handles fetching and processing of YouTube video data."""
    
    def __init__(self, data_dir: str = "data"):
        """Initialize the VideoProcessor.
        
        Args:
            data_dir: Directory to store processed data
        """
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
    
    def extract_video_id(self, url: str) -> str:
        """Extract the video ID from a YouTube URL.
        
        Args:
            url: YouTube video URL
            
        Returns:
            YouTube video ID
        """
        try:
            # Let pytube handle parsing the URL
            yt = YouTube(url)
            return yt.video_id
        except Exception as e:
            raise ValueError(f"Failed to extract video ID from URL: {e}")
    
    def get_video_metadata(self, url: str) -> Dict[str, Any]:
        """Fetch metadata for a YouTube video.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dictionary containing video metadata
        """
        try:
            yt = YouTube(url)
            return {
                "id": yt.video_id,
                "title": yt.title,
                "description": yt.description,
                "author": yt.author,
                "length": yt.length,
                "publish_date": yt.publish_date.isoformat() if yt.publish_date else None,
                "views": yt.views,
                "thumbnail_url": yt.thumbnail_url,
                "keywords": yt.keywords,
                "url": url,
            }
        except Exception as e:
            raise RuntimeError(f"Failed to fetch video metadata: {e}")
    
    def get_video_transcript(self, video_id: str, languages: List[str] = ['en']) -> List[Dict[str, Any]]:
        """Fetch transcript for a YouTube video.
        
        Args:
            video_id: YouTube video ID
            languages: List of language codes to try
            
        Returns:
            List of transcript segments
        """
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
            return transcript
        except TranscriptsDisabled:
            return []
        except Exception as e:
            raise RuntimeError(f"Failed to fetch video transcript: {e}")
    
    def process_video(self, url: str, save: bool = True) -> Dict[str, Any]:
        """Process a YouTube video, extracting metadata and transcript.
        
        Args:
            url: YouTube video URL
            save: Whether to save the processed data to disk
            
        Returns:
            Dictionary containing processed video data
        """
        # Extract video ID
        video_id = self.extract_video_id(url)
        
        # Get metadata
        metadata = self.get_video_metadata(url)
        
        # Get transcript
        transcript = self.get_video_transcript(video_id)
        
        # Combine into a single data structure
        video_data = {
            "metadata": metadata,
            "transcript": transcript,
            "transcript_text": " ".join(segment["text"] for segment in transcript) if transcript else ""
        }
        
        # Save data if requested
        if save:
            output_path = os.path.join(self.data_dir, f"{video_id}.json")
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(video_data, f, ensure_ascii=False, indent=2)
        
        return video_data