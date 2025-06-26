"""Video generation functionality using MoviePy"""

import asyncio
import logging
import os
import tempfile
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from moviepy.editor import (
    AudioFileClip,
    ColorClip,
    CompositeVideoClip,
    ImageClip,
    TextClip,
    VideoFileClip,
    concatenate_videoclips,
)
from PIL import Image, ImageDraw, ImageFont

from .config import Settings
from .tts_service import TTSService

logger = logging.getLogger(__name__)


class VideoGenerator:
    """AI-powered video generator for repository presentations"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.tts_service = TTSService(settings)
        self.output_dir = Path(settings.output_directory)
        self.temp_dir = Path(settings.temp_directory)
        
        # Create directories
        self.output_dir.mkdir(exist_ok=True)
        self.temp_dir.mkdir(exist_ok=True)
        
        # Parse video resolution
        self.width, self.height = map(int, settings.video_resolution.split('x'))
        
    async def generate_video(
        self,
        project_id: str,
        content_sections: List[Dict[str, Any]],
        voice_settings: Dict[str, Any],
        project_metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate a complete video presentation"""
        
        logger.info(f"Starting video generation for project {project_id}")
        
        try:
            # Create temporary directory for this job
            job_temp_dir = self.temp_dir / f"video_{project_id}_{uuid.uuid4().hex[:8]}"
            job_temp_dir.mkdir(exist_ok=True)
            
            # Generate video sections
            video_clips = []
            total_duration = 0
            
            # Create intro section
            intro_clip = await self._create_intro_section(
                project_metadata, job_temp_dir
            )
            video_clips.append(intro_clip)
            total_duration += intro_clip.duration
            
            # Create content sections
            for i, section in enumerate(content_sections):
                if total_duration >= self.settings.max_video_duration:
                    logger.warning(f"Reached max video duration, stopping at section {i}")
                    break
                    
                section_clip = await self._create_content_section(
                    section, voice_settings, job_temp_dir, i
                )
                video_clips.append(section_clip)
                total_duration += section_clip.duration
            
            # Create outro section
            outro_clip = await self._create_outro_section(
                project_metadata, job_temp_dir
            )
            video_clips.append(outro_clip)
            total_duration += outro_clip.duration
            
            # Concatenate all clips
            logger.info(f"Concatenating {len(video_clips)} video clips")
            final_video = concatenate_videoclips(video_clips, method="compose")
            
            # Add background music if enabled
            if self.settings.background_music_enabled:
                final_video = await self._add_background_music(
                    final_video, job_temp_dir
                )
            
            # Export final video
            output_filename = f"project_{project_id}_video.mp4"
            output_path = self.output_dir / output_filename
            
            logger.info(f"Exporting video to {output_path}")
            final_video.write_videofile(
                str(output_path),
                fps=self.settings.video_fps,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=str(job_temp_dir / "temp_audio.m4a"),
                remove_temp=True,
                verbose=False,
                logger=None,
            )
            
            # Clean up
            final_video.close()
            for clip in video_clips:
                clip.close()
            
            if self.settings.cleanup_temp_files:
                await self._cleanup_temp_directory(job_temp_dir)
            
            # Get file info
            file_size = output_path.stat().st_size
            
            logger.info(f"Video generation completed: {output_path} ({file_size} bytes)")
            
            return {
                "success": True,
                "output_path": str(output_path),
                "filename": output_filename,
                "duration": total_duration,
                "file_size": file_size,
                "resolution": f"{self.width}x{self.height}",
                "fps": self.settings.video_fps,
            }
            
        except Exception as e:
            logger.error(f"Video generation failed for project {project_id}: {e}")
            return {
                "success": False,
                "error": str(e),
            }
    
    async def _create_intro_section(
        self, 
        project_metadata: Dict[str, Any], 
        temp_dir: Path
    ) -> VideoFileClip:
        """Create intro section with project title and description"""
        
        duration = 5.0  # 5 seconds intro
        
        # Create background
        background = ColorClip(
            size=(self.width, self.height),
            color=(41, 128, 185),  # Blue background
            duration=duration
        )
        
        # Create title text
        title = project_metadata.get("name", "Project Showcase")
        title_clip = TextClip(
            title,
            fontsize=72,
            color='white',
            font='Arial-Bold',
            size=(self.width - 200, None)
        ).set_position('center').set_duration(duration)
        
        # Create subtitle text
        subtitle = project_metadata.get("description", "")
        if subtitle:
            subtitle_clip = TextClip(
                subtitle[:100] + ("..." if len(subtitle) > 100 else ""),
                fontsize=36,
                color='white',
                font='Arial',
                size=(self.width - 200, None)
            ).set_position(('center', self.height * 0.7)).set_duration(duration)
            
            # Composite video
            intro_video = CompositeVideoClip([
                background,
                title_clip,
                subtitle_clip
            ], size=(self.width, self.height))
        else:
            intro_video = CompositeVideoClip([
                background,
                title_clip
            ], size=(self.width, self.height))
        
        return intro_video
    
    async def _create_content_section(
        self,
        section: Dict[str, Any],
        voice_settings: Dict[str, Any],
        temp_dir: Path,
        section_index: int,
    ) -> VideoFileClip:
        """Create a video section for content"""
        
        section_title = section.get("title", f"Section {section_index + 1}")
        section_content = section.get("content", "")
        
        # Generate speech audio
        audio_path = await self.tts_service.generate_speech(
            text=f"{section_title}. {section_content}",
            voice_settings=voice_settings,
            output_path=temp_dir / f"section_{section_index}_audio.wav"
        )
        
        # Load audio to get duration
        audio_clip = AudioFileClip(str(audio_path))
        duration = audio_clip.duration
        
        # Create visual background
        background = await self._create_section_background(
            section_title, section_content, duration, temp_dir, section_index
        )
        
        # Add audio to video
        final_clip = background.set_audio(audio_clip)
        
        return final_clip
    
    async def _create_section_background(
        self,
        title: str,
        content: str,
        duration: float,
        temp_dir: Path,
        section_index: int,
    ) -> VideoFileClip:
        """Create visual background for a section"""
        
        # Create gradient background
        background_color = self._get_section_color(section_index)
        background = ColorClip(
            size=(self.width, self.height),
            color=background_color,
            duration=duration
        )
        
        # Create title
        title_clip = TextClip(
            title,
            fontsize=48,
            color='white',
            font='Arial-Bold',
            size=(self.width - 200, None)
        ).set_position(('center', 100)).set_duration(duration)
        
        # Create content text (split into chunks if too long)
        content_clips = []
        if content:
            content_chunks = self._split_text_into_chunks(content)
            for i, chunk in enumerate(content_chunks):
                chunk_clip = TextClip(
                    chunk,
                    fontsize=24,
                    color='white',
                    font='Arial',
                    size=(self.width - 300, None),
                    method='caption'
                ).set_position(('center', 200 + i * 100)).set_duration(duration)
                content_clips.append(chunk_clip)
        
        # Composite all elements
        all_clips = [background, title_clip] + content_clips
        composite_video = CompositeVideoClip(all_clips, size=(self.width, self.height))
        
        return composite_video
    
    async def _create_outro_section(
        self, 
        project_metadata: Dict[str, Any], 
        temp_dir: Path
    ) -> VideoFileClip:
        """Create outro section with call-to-action"""
        
        duration = 3.0  # 3 seconds outro
        
        # Create background
        background = ColorClip(
            size=(self.width, self.height),
            color=(46, 204, 113),  # Green background
            duration=duration
        )
        
        # Create CTA text
        cta_text = "Visit the project to learn more!"
        cta_clip = TextClip(
            cta_text,
            fontsize=48,
            color='white',
            font='Arial-Bold',
            size=(self.width - 200, None)
        ).set_position('center').set_duration(duration)
        
        # Add Project4Site branding
        branding_clip = TextClip(
            "Generated with Project4Site",
            fontsize=24,
            color='white',
            font='Arial',
            size=(self.width - 200, None)
        ).set_position(('center', self.height * 0.8)).set_duration(duration)
        
        # Composite video
        outro_video = CompositeVideoClip([
            background,
            cta_clip,
            branding_clip
        ], size=(self.width, self.height))
        
        return outro_video
    
    async def _add_background_music(
        self, 
        video: VideoFileClip, 
        temp_dir: Path
    ) -> VideoFileClip:
        """Add subtle background music to the video"""
        
        try:
            # Generate a simple background tone
            music_path = await self._generate_background_music(
                video.duration, temp_dir
            )
            
            if music_path and music_path.exists():
                music_clip = AudioFileClip(str(music_path))
                music_clip = music_clip.volumex(0.1)  # Very low volume
                
                # Composite audio
                if video.audio:
                    final_audio = CompositeAudioClip([video.audio, music_clip])
                else:
                    final_audio = music_clip
                
                return video.set_audio(final_audio)
            
        except Exception as e:
            logger.warning(f"Failed to add background music: {e}")
        
        return video
    
    async def _generate_background_music(
        self, 
        duration: float, 
        temp_dir: Path
    ) -> Optional[Path]:
        """Generate simple background music tone"""
        
        try:
            import subprocess
            
            # Generate a simple sine wave tone using ffmpeg
            music_path = temp_dir / "background_music.wav"
            
            # Create a subtle 440Hz tone
            cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", f"sine=frequency=440:duration={duration}",
                "-af", "volume=0.1",
                str(music_path)
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            await process.communicate()
            
            if process.returncode == 0:
                return music_path
                
        except Exception as e:
            logger.warning(f"Failed to generate background music: {e}")
        
        return None
    
    def _get_section_color(self, section_index: int) -> Tuple[int, int, int]:
        """Get color for section background"""
        colors = [
            (52, 152, 219),   # Blue
            (155, 89, 182),   # Purple
            (26, 188, 156),   # Turquoise
            (241, 196, 15),   # Yellow
            (230, 126, 34),   # Orange
            (231, 76, 60),    # Red
        ]
        return colors[section_index % len(colors)]
    
    def _split_text_into_chunks(self, text: str, max_length: int = 100) -> List[str]:
        """Split text into readable chunks"""
        words = text.split()
        chunks = []
        current_chunk = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) + 1 <= max_length:
                current_chunk.append(word)
                current_length += len(word) + 1
            else:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_length = len(word)
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks[:5]  # Limit to 5 chunks per section
    
    async def _cleanup_temp_directory(self, temp_dir: Path) -> None:
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(temp_dir)
            logger.debug(f"Cleaned up temp directory: {temp_dir}")
        except Exception as e:
            logger.warning(f"Failed to clean up temp directory {temp_dir}: {e}")