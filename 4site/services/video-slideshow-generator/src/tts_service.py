"""Text-to-Speech service with multiple provider support"""

import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, Optional

import aiofiles
from gtts import gTTS
import io

from .config import Settings

logger = logging.getLogger(__name__)


class TTSService:
    """Text-to-Speech service supporting multiple providers"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        
    async def generate_speech(
        self,
        text: str,
        voice_settings: Dict[str, Any],
        output_path: Path,
    ) -> Path:
        """Generate speech audio from text"""
        
        voice = voice_settings.get("voice", self.settings.audio_voice)
        speed = voice_settings.get("speed", self.settings.audio_speed)
        language = voice_settings.get("language", "en")
        
        try:
            if self.settings.elevenlabs_api_key and not self.settings.use_local_tts:
                return await self._generate_elevenlabs_speech(
                    text, voice, output_path
                )
            elif self.settings.openai_api_key and not self.settings.use_local_tts:
                return await self._generate_openai_speech(
                    text, voice, speed, output_path
                )
            else:
                return await self._generate_gtts_speech(
                    text, language, speed, output_path
                )
        except Exception as e:
            logger.error(f"TTS generation failed, falling back to gTTS: {e}")
            return await self._generate_gtts_speech(
                text, language, speed, output_path
            )
    
    async def _generate_gtts_speech(
        self,
        text: str,
        language: str,
        speed: float,
        output_path: Path,
    ) -> Path:
        """Generate speech using Google TTS (free)"""
        
        logger.info(f"Generating speech with gTTS: {len(text)} characters")
        
        # Clean text for TTS
        clean_text = self._clean_text_for_tts(text)
        
        # Generate TTS
        tts = gTTS(text=clean_text, lang=language, slow=False)
        
        # Save to temporary buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        # Write to file
        async with aiofiles.open(output_path, 'wb') as f:
            await f.write(audio_buffer.getvalue())
        
        # Adjust speed if needed (would require additional processing)
        if speed != 1.0:
            await self._adjust_audio_speed(output_path, speed)
        
        logger.info(f"gTTS speech generated: {output_path}")
        return output_path
    
    async def _generate_openai_speech(
        self,
        text: str,
        voice: str,
        speed: float,
        output_path: Path,
    ) -> Path:
        """Generate speech using OpenAI TTS API"""
        
        try:
            import openai
            
            client = openai.AsyncOpenAI(api_key=self.settings.openai_api_key)
            
            response = await client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=self._clean_text_for_tts(text),
                speed=speed,
            )
            
            async with aiofiles.open(output_path, 'wb') as f:
                async for chunk in response.iter_bytes():
                    await f.write(chunk)
            
            logger.info(f"OpenAI TTS speech generated: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"OpenAI TTS failed: {e}")
            raise
    
    async def _generate_elevenlabs_speech(
        self,
        text: str,
        voice: str,
        output_path: Path,
    ) -> Path:
        """Generate speech using ElevenLabs API"""
        
        try:
            import elevenlabs
            
            elevenlabs.set_api_key(self.settings.elevenlabs_api_key)
            
            audio = elevenlabs.generate(
                text=self._clean_text_for_tts(text),
                voice=voice,
                model="eleven_monolingual_v1"
            )
            
            async with aiofiles.open(output_path, 'wb') as f:
                await f.write(audio)
            
            logger.info(f"ElevenLabs TTS speech generated: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"ElevenLabs TTS failed: {e}")
            raise
    
    def _clean_text_for_tts(self, text: str) -> str:
        """Clean text for better TTS pronunciation"""
        
        # Remove markdown formatting
        text = text.replace("**", "").replace("*", "")
        text = text.replace("```", "").replace("`", "")
        text = text.replace("#", "")
        
        # Replace common abbreviations
        replacements = {
            "API": "A P I",
            "HTTP": "H T T P",
            "HTTPS": "H T T P S",
            "URL": "U R L",
            "JSON": "J S O N",
            "XML": "X M L",
            "CSS": "C S S",
            "HTML": "H T M L",
            "JS": "JavaScript",
            "TS": "TypeScript",
        }
        
        for abbrev, replacement in replacements.items():
            text = text.replace(abbrev, replacement)
        
        # Limit length
        if len(text) > 3000:
            text = text[:3000] + "..."
        
        return text
    
    async def _adjust_audio_speed(self, audio_path: Path, speed: float) -> None:
        """Adjust audio playback speed using ffmpeg"""
        
        if speed == 1.0:
            return
        
        try:
            temp_path = audio_path.with_suffix('.temp.wav')
            
            cmd = [
                "ffmpeg", "-y",
                "-i", str(audio_path),
                "-filter:a", f"atempo={speed}",
                str(temp_path)
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            await process.communicate()
            
            if process.returncode == 0:
                # Replace original with adjusted version
                temp_path.replace(audio_path)
            else:
                logger.warning(f"Failed to adjust audio speed for {audio_path}")
                
        except Exception as e:
            logger.warning(f"Audio speed adjustment failed: {e}")