"""Intelligent content generation service for tutorial structure analysis and viral content."""

import asyncio
import json
import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
import cv2
import numpy as np
from datetime import datetime, timedelta
import structlog
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
import torch

from ..config.settings import get_settings
from ..services.ai_narration_service import AInarrationService
from ..services.aegnt27_service import Aegnt27Service
from ..models.content_models import (
    ContentFormat, TutorialStructure, ViralClip,
    EngagementMetrics, ContentOptimization
)
from ..utils.video_analyzer import VideoAnalyzer
from ..utils.engagement_predictor import EngagementPredictor

logger = structlog.get_logger()
settings = get_settings()


class ContentType(Enum):
    """Types of content that can be generated."""
    TUTORIAL = "tutorial"
    QUICK_DEMO = "quick_demo"
    DEEP_DIVE = "deep_dive"
    BUG_FIX = "bug_fix"
    CODE_REVIEW = "code_review"
    EXPLANATION = "explanation"
    COMPARISON = "comparison"


class Platform(Enum):
    """Target platforms for content optimization."""
    YOUTUBE_LONG = "youtube_long"
    YOUTUBE_SHORT = "youtube_short"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    INSTAGRAM = "instagram"


@dataclass
class ContentSegment:
    """A segment of content with metadata."""
    start_time: float
    end_time: float
    content_type: str
    importance_score: float
    transcript: str
    visual_complexity: float
    audio_activity: float
    engagement_prediction: float
    tags: List[str]
    

@dataclass
class TutorialChapter:
    """A chapter in a tutorial structure."""
    title: str
    start_time: float
    end_time: float
    description: str
    key_concepts: List[str]
    difficulty_level: str  # beginner, intermediate, advanced
    segments: List[ContentSegment]
    

@dataclass
class ContentGenerationConfig:
    """Configuration for content generation."""
    input_video_path: str
    target_platforms: List[Platform]
    content_types: List[ContentType]
    target_duration_seconds: Dict[Platform, int]
    enable_viral_extraction: bool = True
    enable_tutorial_structure: bool = True
    enable_cross_platform_optimization: bool = True
    max_clips_per_video: int = 10
    min_engagement_score: float = 0.7
    

@dataclass
class GeneratedContent:
    """Result of content generation."""
    original_video_path: str
    tutorial_structure: Optional[TutorialStructure]
    viral_clips: List[ViralClip]
    platform_optimizations: Dict[Platform, ContentOptimization]
    engagement_predictions: EngagementMetrics
    processing_time_seconds: float
    authenticity_score: float
    

class ContentGenerationService:
    """Service for intelligent content generation and optimization."""
    
    def __init__(self):
        self.settings = get_settings()
        self.ai_narration_service = AInarrationService()
        self.aegnt27_service = Aegnt27Service()
        self.video_analyzer = VideoAnalyzer()
        self.engagement_predictor = EngagementPredictor()
        
        # Initialize AI models
        self._initialize_models()
        
        logger.info("Content generation service initialized")
    
    def _initialize_models(self) -> None:
        """Initialize AI models for content analysis."""
        try:
            # Sentence transformer for semantic analysis
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Content classification model
            if torch.cuda.is_available():
                self.device = 'cuda'
            else:
                self.device = 'cpu'
                
            logger.info("AI models initialized", device=self.device)
            
        except Exception as e:
            logger.error("Failed to initialize AI models", error=str(e))
            raise
    
    async def generate_content(
        self,
        config: ContentGenerationConfig,
        progress_callback: Optional[callable] = None
    ) -> GeneratedContent:
        """Generate optimized content for multiple platforms."""
        
        start_time = asyncio.get_event_loop().time()
        
        try:
            # Step 1: Analyze source video
            if progress_callback:
                await progress_callback("Analyzing source video", 0.1)
            
            video_analysis = await self._analyze_source_video(config.input_video_path)
            
            # Step 2: Generate tutorial structure
            tutorial_structure = None
            if config.enable_tutorial_structure:
                if progress_callback:
                    await progress_callback("Generating tutorial structure", 0.3)
                
                tutorial_structure = await self._generate_tutorial_structure(
                    video_analysis, config
                )
            
            # Step 3: Extract viral clips
            viral_clips = []
            if config.enable_viral_extraction:
                if progress_callback:
                    await progress_callback("Extracting viral clips", 0.5)
                
                viral_clips = await self._extract_viral_clips(
                    video_analysis, config
                )
            
            # Step 4: Generate platform optimizations
            platform_optimizations = {}
            if config.enable_cross_platform_optimization:
                if progress_callback:
                    await progress_callback("Optimizing for platforms", 0.7)
                
                platform_optimizations = await self._generate_platform_optimizations(
                    video_analysis, tutorial_structure, viral_clips, config
                )
            
            # Step 5: Predict engagement metrics
            if progress_callback:
                await progress_callback("Predicting engagement", 0.9)
            
            engagement_predictions = await self._predict_engagement(
                video_analysis, platform_optimizations
            )
            
            # Step 6: Apply authenticity injection
            authenticity_score = await self._apply_authenticity_injection(
                video_analysis, platform_optimizations
            )
            
            processing_time = asyncio.get_event_loop().time() - start_time
            
            if progress_callback:
                await progress_callback("Content generation complete", 1.0)
            
            return GeneratedContent(
                original_video_path=config.input_video_path,
                tutorial_structure=tutorial_structure,
                viral_clips=viral_clips,
                platform_optimizations=platform_optimizations,
                engagement_predictions=engagement_predictions,
                processing_time_seconds=processing_time,
                authenticity_score=authenticity_score
            )
            
        except Exception as e:
            logger.error("Content generation failed", error=str(e))
            raise
    
    async def _analyze_source_video(self, video_path: str) -> Dict[str, Any]:
        """Analyze the source video for content extraction."""
        
        try:
            # Basic video analysis
            video_metadata = await self.video_analyzer.get_video_metadata(video_path)
            
            # Extract audio and generate transcript
            transcript = await self.ai_narration_service.transcribe_video(video_path)
            
            # Analyze visual content
            visual_analysis = await self._analyze_visual_content(video_path)
            
            # Detect scenes and transitions
            scenes = await self._detect_scenes_and_transitions(video_path)
            
            # Analyze audio activity
            audio_analysis = await self._analyze_audio_activity(video_path)
            
            # Semantic analysis of transcript
            semantic_analysis = await self._analyze_transcript_semantics(transcript)
            
            return {
                'metadata': video_metadata,
                'transcript': transcript,
                'visual_analysis': visual_analysis,
                'scenes': scenes,
                'audio_analysis': audio_analysis,
                'semantic_analysis': semantic_analysis
            }
            
        except Exception as e:
            logger.error("Video analysis failed", video_path=video_path, error=str(e))
            raise
    
    async def _analyze_visual_content(self, video_path: str) -> Dict[str, Any]:
        """Analyze visual content complexity and importance."""
        
        try:
            cap = cv2.VideoCapture(video_path)
            
            if not cap.isOpened():
                raise RuntimeError(f"Could not open video: {video_path}")
            
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            # Sample frames for analysis
            sample_interval = max(1, frame_count // 100)  # Sample 100 frames max
            visual_complexity_scores = []
            motion_scores = []
            
            prev_frame = None
            frame_idx = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_idx % sample_interval == 0:
                    # Calculate visual complexity (edge density)
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    edges = cv2.Canny(gray, 50, 150)
                    complexity = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
                    visual_complexity_scores.append(complexity)
                    
                    # Calculate motion if we have a previous frame
                    if prev_frame is not None:
                        motion = cv2.calcOpticalFlowPyrLK(
                            prev_frame, gray, None, None
                        )
                        # Simplified motion calculation
                        motion_score = 0.1  # Placeholder
                        motion_scores.append(motion_score)
                    
                    prev_frame = gray.copy()
                
                frame_idx += 1
            
            cap.release()
            
            return {
                'avg_visual_complexity': np.mean(visual_complexity_scores) if visual_complexity_scores else 0,
                'max_visual_complexity': np.max(visual_complexity_scores) if visual_complexity_scores else 0,
                'avg_motion': np.mean(motion_scores) if motion_scores else 0,
                'complexity_timeline': visual_complexity_scores,
                'motion_timeline': motion_scores
            }
            
        except Exception as e:
            logger.error("Visual content analysis failed", error=str(e))
            return {'avg_visual_complexity': 0, 'max_visual_complexity': 0, 'avg_motion': 0}
    
    async def _detect_scenes_and_transitions(self, video_path: str) -> List[Dict[str, Any]]:
        """Detect scene changes and transitions in the video."""
        
        try:
            # Use video analyzer to detect scenes
            scenes = await self.video_analyzer.detect_scenes(video_path)
            
            # Enhance scene detection with content classification
            enhanced_scenes = []
            
            for i, scene in enumerate(scenes):
                # Classify scene content type
                scene_type = await self._classify_scene_content(
                    video_path, scene['start_time'], scene['end_time']
                )
                
                enhanced_scenes.append({
                    'id': i,
                    'start_time': scene['start_time'],
                    'end_time': scene['end_time'],
                    'duration': scene['end_time'] - scene['start_time'],
                    'content_type': scene_type,
                    'importance_score': scene.get('importance_score', 0.5)
                })
            
            return enhanced_scenes
            
        except Exception as e:
            logger.error("Scene detection failed", error=str(e))
            return []
    
    async def _classify_scene_content(self, video_path: str, start_time: float, end_time: float) -> str:
        """Classify the content type of a video scene."""
        
        try:
            # Extract a frame from the middle of the scene for analysis
            mid_time = (start_time + end_time) / 2
            
            # For now, return a basic classification
            # TODO: Implement actual content classification using AI models
            
            duration = end_time - start_time
            
            if duration < 5:
                return "transition"
            elif duration < 30:
                return "demonstration"
            elif duration < 120:
                return "explanation"
            else:
                return "deep_dive"
                
        except Exception as e:
            logger.error("Scene content classification failed", error=str(e))
            return "unknown"
    
    async def _analyze_audio_activity(self, video_path: str) -> Dict[str, Any]:
        """Analyze audio activity and speech patterns."""
        
        try:
            # Extract audio features
            audio_features = await self.video_analyzer.extract_audio_features(video_path)
            
            # Detect speech vs silence regions
            speech_regions = await self._detect_speech_regions(video_path)
            
            # Calculate audio metrics
            total_duration = audio_features.get('duration', 0)
            speech_duration = sum(region['duration'] for region in speech_regions)
            
            speech_ratio = speech_duration / total_duration if total_duration > 0 else 0
            
            return {
                'speech_ratio': speech_ratio,
                'speech_regions': speech_regions,
                'avg_volume': audio_features.get('avg_volume', 0),
                'dynamic_range': audio_features.get('dynamic_range', 0)
            }
            
        except Exception as e:
            logger.error("Audio activity analysis failed", error=str(e))
            return {'speech_ratio': 0, 'speech_regions': [], 'avg_volume': 0}
    
    async def _detect_speech_regions(self, video_path: str) -> List[Dict[str, Any]]:
        """Detect regions with speech activity."""
        
        try:
            # Use AI service for speech detection
            speech_regions = await self.ai_narration_service.detect_speech_regions(video_path)
            
            return speech_regions
            
        except Exception as e:
            logger.error("Speech region detection failed", error=str(e))
            return []
    
    async def _analyze_transcript_semantics(self, transcript: str) -> Dict[str, Any]:
        """Analyze semantic content of the transcript."""
        
        try:
            if not transcript.strip():
                return {'key_topics': [], 'sentiment': 'neutral', 'complexity': 0}
            
            # Split transcript into sentences
            sentences = re.split(r'[.!?]+', transcript)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            if not sentences:
                return {'key_topics': [], 'sentiment': 'neutral', 'complexity': 0}
            
            # Generate embeddings for semantic analysis
            embeddings = self.sentence_model.encode(sentences)
            
            # Cluster sentences to find key topics
            if len(sentences) > 1:
                n_clusters = min(5, len(sentences) // 2)  # Max 5 topics
                if n_clusters > 1:
                    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
                    clusters = kmeans.fit_predict(embeddings)
                    
                    # Find representative sentences for each cluster
                    key_topics = []
                    for i in range(n_clusters):
                        cluster_sentences = [sentences[j] for j, c in enumerate(clusters) if c == i]
                        if cluster_sentences:
                            # Use the first sentence as representative
                            key_topics.append(cluster_sentences[0][:100])  # Truncate for readability
                else:
                    key_topics = [sentences[0][:100]]
            else:
                key_topics = [sentences[0][:100]]
            
            # Calculate text complexity (simplified)
            avg_sentence_length = np.mean([len(s.split()) for s in sentences])
            complexity_score = min(1.0, avg_sentence_length / 20)  # Normalize to 0-1
            
            # Basic sentiment analysis (simplified)
            positive_words = ['good', 'great', 'excellent', 'amazing', 'perfect', 'awesome']
            negative_words = ['bad', 'terrible', 'awful', 'horrible', 'wrong', 'error']
            
            text_lower = transcript.lower()
            positive_count = sum(word in text_lower for word in positive_words)
            negative_count = sum(word in text_lower for word in negative_words)
            
            if positive_count > negative_count:
                sentiment = 'positive'
            elif negative_count > positive_count:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            return {
                'key_topics': key_topics,
                'sentiment': sentiment,
                'complexity': complexity_score,
                'word_count': len(transcript.split()),
                'sentence_count': len(sentences)
            }
            
        except Exception as e:
            logger.error("Transcript semantic analysis failed", error=str(e))
            return {'key_topics': [], 'sentiment': 'neutral', 'complexity': 0}
    
    async def _generate_tutorial_structure(
        self,
        video_analysis: Dict[str, Any],
        config: ContentGenerationConfig
    ) -> TutorialStructure:
        """Generate intelligent tutorial structure from video analysis."""
        
        try:
            scenes = video_analysis['scenes']
            transcript = video_analysis['transcript']
            semantic_analysis = video_analysis['semantic_analysis']
            
            # Create tutorial chapters based on scenes and content
            chapters = []
            
            # Group scenes into logical chapters
            current_chapter_scenes = []
            chapter_start_time = 0
            
            for i, scene in enumerate(scenes):
                current_chapter_scenes.append(scene)
                
                # End chapter if we've accumulated enough content or reached a natural break
                should_end_chapter = (
                    len(current_chapter_scenes) >= 3 or
                    scene['content_type'] in ['transition', 'explanation'] or
                    i == len(scenes) - 1
                )
                
                if should_end_chapter and current_chapter_scenes:
                    chapter_end_time = current_chapter_scenes[-1]['end_time']
                    
                    # Generate chapter metadata
                    chapter = await self._create_tutorial_chapter(
                        current_chapter_scenes,
                        chapter_start_time,
                        chapter_end_time,
                        transcript,
                        len(chapters) + 1
                    )
                    
                    chapters.append(chapter)
                    
                    # Reset for next chapter
                    current_chapter_scenes = []
                    chapter_start_time = chapter_end_time
            
            # Generate overall tutorial metadata
            total_duration = video_analysis['metadata']['duration_seconds']
            difficulty_level = self._determine_difficulty_level(semantic_analysis)
            
            tutorial_structure = TutorialStructure(
                title=await self._generate_tutorial_title(semantic_analysis),
                description=await self._generate_tutorial_description(semantic_analysis),
                total_duration_seconds=total_duration,
                difficulty_level=difficulty_level,
                chapters=chapters,
                key_concepts=semantic_analysis['key_topics'],
                target_audience="developers",
                prerequisites=await self._extract_prerequisites(semantic_analysis)
            )
            
            logger.info(
                "Tutorial structure generated",
                chapters=len(chapters),
                duration=total_duration,
                difficulty=difficulty_level
            )
            
            return tutorial_structure
            
        except Exception as e:
            logger.error("Tutorial structure generation failed", error=str(e))
            raise
    
    async def _create_tutorial_chapter(
        self,
        scenes: List[Dict[str, Any]],
        start_time: float,
        end_time: float,
        transcript: str,
        chapter_number: int
    ) -> TutorialChapter:
        """Create a tutorial chapter from a group of scenes."""
        
        try:
            # Extract transcript for this chapter
            chapter_transcript = self._extract_transcript_segment(transcript, start_time, end_time)
            
            # Generate chapter title and description
            title = await self._generate_chapter_title(chapter_transcript, chapter_number)
            description = await self._generate_chapter_description(chapter_transcript)
            
            # Extract key concepts
            key_concepts = await self._extract_chapter_concepts(chapter_transcript)
            
            # Determine difficulty level
            difficulty_level = self._determine_chapter_difficulty(chapter_transcript)
            
            # Create content segments
            segments = []
            for scene in scenes:
                segment = ContentSegment(
                    start_time=scene['start_time'],
                    end_time=scene['end_time'],
                    content_type=scene['content_type'],
                    importance_score=scene['importance_score'],
                    transcript=self._extract_transcript_segment(
                        transcript, scene['start_time'], scene['end_time']
                    ),
                    visual_complexity=0.5,  # Placeholder
                    audio_activity=0.5,     # Placeholder
                    engagement_prediction=0.7,  # Placeholder
                    tags=[]  # Placeholder
                )
                segments.append(segment)
            
            return TutorialChapter(
                title=title,
                start_time=start_time,
                end_time=end_time,
                description=description,
                key_concepts=key_concepts,
                difficulty_level=difficulty_level,
                segments=segments
            )
            
        except Exception as e:
            logger.error("Chapter creation failed", error=str(e))
            raise
    
    def _extract_transcript_segment(self, transcript: str, start_time: float, end_time: float) -> str:
        """Extract transcript segment for a time range."""
        
        # This is a simplified implementation
        # In a real implementation, you'd need timestamp alignment
        
        words = transcript.split()
        total_duration = 300  # Assume 5 minutes for demo
        words_per_second = len(words) / total_duration
        
        start_word = int(start_time * words_per_second)
        end_word = int(end_time * words_per_second)
        
        start_word = max(0, min(start_word, len(words)))
        end_word = max(start_word, min(end_word, len(words)))
        
        return ' '.join(words[start_word:end_word])
    
    async def _generate_tutorial_title(self, semantic_analysis: Dict[str, Any]) -> str:
        """Generate an engaging title for the tutorial."""
        
        key_topics = semantic_analysis.get('key_topics', [])
        
        if key_topics:
            main_topic = key_topics[0][:50]  # Use first key topic
            return f"Complete Guide: {main_topic}"
        else:
            return "Programming Tutorial"
    
    async def _generate_tutorial_description(self, semantic_analysis: Dict[str, Any]) -> str:
        """Generate a description for the tutorial."""
        
        key_topics = semantic_analysis.get('key_topics', [])
        complexity = semantic_analysis.get('complexity', 0)
        
        if complexity > 0.7:
            level = "advanced"
        elif complexity > 0.4:
            level = "intermediate"
        else:
            level = "beginner"
        
        description = f"This {level} tutorial covers: "
        if key_topics:
            description += ", ".join(key_topics[:3])
        else:
            description += "essential programming concepts"
        
        return description
    
    def _determine_difficulty_level(self, semantic_analysis: Dict[str, Any]) -> str:
        """Determine the difficulty level of the tutorial."""
        
        complexity = semantic_analysis.get('complexity', 0)
        
        if complexity > 0.7:
            return "advanced"
        elif complexity > 0.4:
            return "intermediate"
        else:
            return "beginner"
    
    async def _extract_viral_clips(
        self,
        video_analysis: Dict[str, Any],
        config: ContentGenerationConfig
    ) -> List[ViralClip]:
        """Extract viral-worthy clips from the video."""
        
        try:
            scenes = video_analysis['scenes']
            visual_analysis = video_analysis['visual_analysis']
            
            viral_clips = []
            
            for scene in scenes:
                # Calculate viral potential
                viral_score = await self._calculate_viral_potential(scene, video_analysis)
                
                if viral_score >= config.min_engagement_score:
                    clip_duration = scene['end_time'] - scene['start_time']
                    
                    # Filter by duration constraints
                    if (settings.content_generation.viral_clip_min_duration <= 
                        clip_duration <= 
                        settings.content_generation.viral_clip_max_duration):
                        
                        viral_clip = ViralClip(
                            start_time=scene['start_time'],
                            end_time=scene['end_time'],
                            duration_seconds=clip_duration,
                            viral_score=viral_score,
                            content_type=scene['content_type'],
                            title=await self._generate_clip_title(scene, video_analysis),
                            description=await self._generate_clip_description(scene, video_analysis),
                            hashtags=await self._generate_clip_hashtags(scene, video_analysis),
                            platforms=[Platform.YOUTUBE_SHORT, Platform.TIKTOK],
                            engagement_prediction={
                                'views': int(viral_score * 10000),
                                'likes': int(viral_score * 500),
                                'shares': int(viral_score * 100),
                                'comments': int(viral_score * 50)
                            }
                        )
                        
                        viral_clips.append(viral_clip)
                        
                        if len(viral_clips) >= config.max_clips_per_video:
                            break
            
            # Sort by viral score
            viral_clips.sort(key=lambda x: x.viral_score, reverse=True)
            
            logger.info(f"Extracted {len(viral_clips)} viral clips")
            
            return viral_clips
            
        except Exception as e:
            logger.error("Viral clip extraction failed", error=str(e))
            return []
    
    async def _calculate_viral_potential(self, scene: Dict[str, Any], video_analysis: Dict[str, Any]) -> float:
        """Calculate the viral potential of a scene."""
        
        try:
            # Factors that contribute to viral potential
            factors = {
                'duration_score': self._score_duration_for_viral(scene),
                'content_type_score': self._score_content_type_for_viral(scene['content_type']),
                'importance_score': scene.get('importance_score', 0.5),
                'visual_complexity_score': 0.5,  # Placeholder
                'audio_activity_score': 0.5,    # Placeholder
            }
            
            # Weighted average
            weights = {
                'duration_score': 0.2,
                'content_type_score': 0.3,
                'importance_score': 0.3,
                'visual_complexity_score': 0.1,
                'audio_activity_score': 0.1
            }
            
            viral_score = sum(
                factors[factor] * weights[factor]
                for factor in factors
            )
            
            return min(1.0, max(0.0, viral_score))
            
        except Exception as e:
            logger.error("Viral potential calculation failed", error=str(e))
            return 0.0
    
    def _score_duration_for_viral(self, scene: Dict[str, Any]) -> float:
        """Score scene duration for viral potential."""
        
        duration = scene['end_time'] - scene['start_time']
        
        # Optimal duration for viral content is 15-45 seconds
        if 15 <= duration <= 45:
            return 1.0
        elif 10 <= duration <= 60:
            return 0.8
        elif 5 <= duration <= 90:
            return 0.6
        else:
            return 0.3
    
    def _score_content_type_for_viral(self, content_type: str) -> float:
        """Score content type for viral potential."""
        
        viral_content_types = {
            'demonstration': 0.9,
            'explanation': 0.7,
            'transition': 0.3,
            'deep_dive': 0.5,
            'unknown': 0.4
        }
        
        return viral_content_types.get(content_type, 0.4)
    
    async def _generate_platform_optimizations(
        self,
        video_analysis: Dict[str, Any],
        tutorial_structure: Optional[TutorialStructure],
        viral_clips: List[ViralClip],
        config: ContentGenerationConfig
    ) -> Dict[Platform, ContentOptimization]:
        """Generate platform-specific content optimizations."""
        
        optimizations = {}
        
        for platform in config.target_platforms:
            try:
                optimization = await self._create_platform_optimization(
                    platform, video_analysis, tutorial_structure, viral_clips, config
                )
                optimizations[platform] = optimization
                
            except Exception as e:
                logger.error(f"Platform optimization failed for {platform.value}", error=str(e))
        
        return optimizations
    
    async def _create_platform_optimization(
        self,
        platform: Platform,
        video_analysis: Dict[str, Any],
        tutorial_structure: Optional[TutorialStructure],
        viral_clips: List[ViralClip],
        config: ContentGenerationConfig
    ) -> ContentOptimization:
        """Create optimization for a specific platform."""
        
        try:
            # Platform-specific parameters
            platform_config = self._get_platform_config(platform)
            
            # Generate title and description
            title = await self._generate_platform_title(platform, video_analysis)
            description = await self._generate_platform_description(platform, video_analysis)
            
            # Generate hashtags
            hashtags = await self._generate_platform_hashtags(platform, video_analysis)
            
            # Select best clips for this platform
            platform_clips = [
                clip for clip in viral_clips
                if platform in clip.platforms
            ][:platform_config['max_clips']]
            
            # Generate thumbnail recommendations
            thumbnail_recommendations = await self._generate_thumbnail_recommendations(
                platform, video_analysis
            )
            
            return ContentOptimization(
                platform=platform,
                title=title,
                description=description,
                hashtags=hashtags,
                recommended_clips=platform_clips,
                thumbnail_recommendations=thumbnail_recommendations,
                posting_schedule=await self._generate_posting_schedule(platform),
                engagement_strategy=await self._generate_engagement_strategy(platform),
                target_metrics=platform_config['target_metrics']
            )
            
        except Exception as e:
            logger.error(f"Platform optimization creation failed for {platform.value}", error=str(e))
            raise
    
    def _get_platform_config(self, platform: Platform) -> Dict[str, Any]:
        """Get configuration parameters for a platform."""
        
        configs = {
            Platform.YOUTUBE_LONG: {
                'max_title_length': 100,
                'max_description_length': 5000,
                'max_hashtags': 15,
                'max_clips': 3,
                'aspect_ratio': '16:9',
                'optimal_duration': 600,  # 10 minutes
                'target_metrics': {
                    'views': 10000,
                    'likes': 500,
                    'comments': 100,
                    'subscribers': 50
                }
            },
            Platform.YOUTUBE_SHORT: {
                'max_title_length': 100,
                'max_description_length': 1000,
                'max_hashtags': 3,
                'max_clips': 1,
                'aspect_ratio': '9:16',
                'optimal_duration': 30,
                'target_metrics': {
                    'views': 50000,
                    'likes': 2000,
                    'comments': 200,
                    'subscribers': 100
                }
            },
            Platform.TIKTOK: {
                'max_title_length': 150,
                'max_description_length': 300,
                'max_hashtags': 5,
                'max_clips': 1,
                'aspect_ratio': '9:16',
                'optimal_duration': 45,
                'target_metrics': {
                    'views': 100000,
                    'likes': 5000,
                    'comments': 500,
                    'shares': 1000
                }
            },
            Platform.LINKEDIN: {
                'max_title_length': 150,
                'max_description_length': 3000,
                'max_hashtags': 5,
                'max_clips': 2,
                'aspect_ratio': '16:9',
                'optimal_duration': 120,
                'target_metrics': {
                    'views': 5000,
                    'likes': 200,
                    'comments': 50,
                    'shares': 100
                }
            }
        }
        
        return configs.get(platform, configs[Platform.YOUTUBE_LONG])
    
    async def _predict_engagement(
        self,
        video_analysis: Dict[str, Any],
        platform_optimizations: Dict[Platform, ContentOptimization]
    ) -> EngagementMetrics:
        """Predict engagement metrics across platforms."""
        
        try:
            # Use engagement predictor service
            predictions = await self.engagement_predictor.predict_multi_platform(
                video_analysis, platform_optimizations
            )
            
            return predictions
            
        except Exception as e:
            logger.error("Engagement prediction failed", error=str(e))
            # Return default predictions
            return EngagementMetrics(
                total_predicted_views=10000,
                platform_breakdown={platform: 1000 for platform in platform_optimizations.keys()},
                engagement_rate=0.05,
                viral_probability=0.1,
                peak_performance_time=datetime.now() + timedelta(hours=24)
            )
    
    async def _apply_authenticity_injection(
        self,
        video_analysis: Dict[str, Any],
        platform_optimizations: Dict[Platform, ContentOptimization]
    ) -> float:
        """Apply aegnt-27 authenticity injection to content."""
        
        try:
            # Use aegnt-27 service for authenticity
            authenticity_result = await self.aegnt27_service.process_content_authenticity(
                content_data={
                    'video_analysis': video_analysis,
                    'platform_optimizations': platform_optimizations
                },
                authenticity_level=settings.ai.authenticity_level
            )
            
            return authenticity_result.get('score', 0.0)
            
        except Exception as e:
            logger.error("Authenticity injection failed", error=str(e))
            return 0.0
    
    # Additional helper methods would be implemented here...
    
    async def get_generation_queue_status(self) -> Dict[str, Any]:
        """Get current content generation queue status."""
        return {
            'active_generations': 0,  # Placeholder
            'queue_length': 0,        # Placeholder
            'avg_processing_time': 300  # 5 minutes average
        }
    
    async def shutdown(self) -> None:
        """Shutdown the content generation service."""
        logger.info("Shutting down content generation service")
        # Cleanup resources
        logger.info("Content generation service shutdown complete")
