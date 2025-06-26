"""Engagement Simulation Service

Simulates authentic engagement patterns for YouTube videos including
watch time curves, retention patterns, comments, and interactions.
"""

import asyncio
import random
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
import logging
from scipy import stats

from ..models.creator_models import CreatorPersona, ContentType
from ..core.aegnt27_integration import Aegnt27Engine

logger = logging.getLogger(__name__)

class EngagementType(Enum):
    """Types of user engagement"""
    VIEW = "view"
    LIKE = "like"
    DISLIKE = "dislike"
    COMMENT = "comment"
    SUBSCRIBE = "subscribe"
    SHARE = "share"
    SAVE = "save"
    CLICK_LINK = "click_link"
    NOTIFICATION_BELL = "notification_bell"

class ViewerType(Enum):
    """Types of viewers with different behavior patterns"""
    CASUAL_BROWSER = "casual_browser"       # Quick views, low engagement
    INTERESTED_LEARNER = "interested_learner"  # Moderate watch time, some engagement
    DEDICATED_FOLLOWER = "dedicated_follower"  # High watch time, regular engagement
    TUTORIAL_SEEKER = "tutorial_seeker"     # Skips around, practical engagement
    BACKGROUND_LISTENER = "background_listener"  # Full watch time, minimal interaction
    EXPERT_REVIEWER = "expert_reviewer"     # Selective watching, quality comments
    BINGE_WATCHER = "binge_watcher"         # Watches multiple videos, batch engagement

@dataclass
class ViewerProfile:
    """Profile of a simulated viewer"""
    viewer_type: ViewerType
    attention_span: float = 0.7  # 0.0-1.0
    engagement_likelihood: float = 0.3  # 0.0-1.0
    technical_level: float = 0.5  # 0.0-1.0
    patience: float = 0.6  # 0.0-1.0
    subscription_probability: float = 0.1  # 0.0-1.0
    comment_probability: float = 0.05  # 0.0-1.0
    like_probability: float = 0.15  # 0.0-1.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "viewer_type": self.viewer_type.value,
            "attention_span": self.attention_span,
            "engagement_likelihood": self.engagement_likelihood,
            "technical_level": self.technical_level,
            "patience": self.patience,
            "subscription_probability": self.subscription_probability,
            "comment_probability": self.comment_probability,
            "like_probability": self.like_probability
        }

@dataclass
class WatchTimePoint:
    """A point in the watch time curve"""
    timestamp: float  # seconds into video
    retention_percentage: float  # 0.0-1.0
    viewer_count: int
    engagement_events: List[EngagementType] = field(default_factory=list)
    
@dataclass
class EngagementEvent:
    """A single engagement event"""
    timestamp: float  # seconds into video
    event_type: EngagementType
    viewer_profile: ViewerProfile
    authenticity_score: float  # How authentic this event appears
    context: Dict[str, Any] = field(default_factory=dict)
    
@dataclass
class VideoEngagementPattern:
    """Complete engagement pattern for a video"""
    video_duration: float  # seconds
    watch_time_curve: List[WatchTimePoint]
    engagement_events: List[EngagementEvent]
    overall_retention: float
    average_watch_time: float
    engagement_rate: float
    authenticity_score: float
    
class EngagementSimulationService:
    """Service for simulating authentic engagement patterns"""
    
    def __init__(self, aegnt27_engine: Optional[Aegnt27Engine] = None):
        self.aegnt27_engine = aegnt27_engine
        self.viewer_profiles = self._initialize_viewer_profiles()
        self.content_type_modifiers = self._initialize_content_modifiers()
        self.engagement_cache = {}
        
    def _initialize_viewer_profiles(self) -> Dict[ViewerType, ViewerProfile]:
        """Initialize realistic viewer profiles"""
        return {
            ViewerType.CASUAL_BROWSER: ViewerProfile(
                viewer_type=ViewerType.CASUAL_BROWSER,
                attention_span=0.3,
                engagement_likelihood=0.1,
                technical_level=0.3,
                patience=0.2,
                subscription_probability=0.02,
                comment_probability=0.01,
                like_probability=0.05
            ),
            ViewerType.INTERESTED_LEARNER: ViewerProfile(
                viewer_type=ViewerType.INTERESTED_LEARNER,
                attention_span=0.7,
                engagement_likelihood=0.4,
                technical_level=0.5,
                patience=0.6,
                subscription_probability=0.08,
                comment_probability=0.03,
                like_probability=0.20
            ),
            ViewerType.DEDICATED_FOLLOWER: ViewerProfile(
                viewer_type=ViewerType.DEDICATED_FOLLOWER,
                attention_span=0.9,
                engagement_likelihood=0.8,
                technical_level=0.7,
                patience=0.9,
                subscription_probability=0.95,  # Already subscribed
                comment_probability=0.15,
                like_probability=0.60
            ),
            ViewerType.TUTORIAL_SEEKER: ViewerProfile(
                viewer_type=ViewerType.TUTORIAL_SEEKER,
                attention_span=0.6,
                engagement_likelihood=0.3,
                technical_level=0.8,
                patience=0.4,
                subscription_probability=0.12,
                comment_probability=0.08,
                like_probability=0.25
            ),
            ViewerType.BACKGROUND_LISTENER: ViewerProfile(
                viewer_type=ViewerType.BACKGROUND_LISTENER,
                attention_span=1.0,
                engagement_likelihood=0.1,
                technical_level=0.4,
                patience=1.0,
                subscription_probability=0.03,
                comment_probability=0.01,
                like_probability=0.08
            ),
            ViewerType.EXPERT_REVIEWER: ViewerProfile(
                viewer_type=ViewerType.EXPERT_REVIEWER,
                attention_span=0.8,
                engagement_likelihood=0.6,
                technical_level=0.95,
                patience=0.7,
                subscription_probability=0.15,
                comment_probability=0.25,
                like_probability=0.35
            ),
            ViewerType.BINGE_WATCHER: ViewerProfile(
                viewer_type=ViewerType.BINGE_WATCHER,
                attention_span=0.85,
                engagement_likelihood=0.5,
                technical_level=0.6,
                patience=0.8,
                subscription_probability=0.40,
                comment_probability=0.10,
                like_probability=0.45
            )
        }
        
    def _initialize_content_modifiers(self) -> Dict[ContentType, Dict[str, float]]:
        """Initialize content type modifiers for engagement patterns"""
        return {
            ContentType.TUTORIAL: {
                "retention_boost": 1.2,
                "engagement_boost": 1.1,
                "skip_tendency": 0.3,
                "rewatch_probability": 0.15
            },
            ContentType.LIVE_CODING: {
                "retention_boost": 0.9,
                "engagement_boost": 1.3,
                "skip_tendency": 0.4,
                "rewatch_probability": 0.05
            },
            ContentType.QUICK_DEMO: {
                "retention_boost": 1.4,
                "engagement_boost": 0.8,
                "skip_tendency": 0.2,
                "rewatch_probability": 0.25
            },
            ContentType.DEEP_DIVE: {
                "retention_boost": 0.8,
                "engagement_boost": 1.4,
                "skip_tendency": 0.5,
                "rewatch_probability": 0.20
            },
            ContentType.DEBUGGING: {
                "retention_boost": 0.7,
                "engagement_boost": 1.2,
                "skip_tendency": 0.6,
                "rewatch_probability": 0.10
            }
        }
        
    async def simulate_video_engagement(self,
                                      video_duration: float,
                                      content_type: ContentType,
                                      creator_persona: CreatorPersona,
                                      expected_views: int = 1000,
                                      authenticity_target: float = 0.95) -> VideoEngagementPattern:
        """Simulate complete engagement pattern for a video"""
        
        logger.info(f"Simulating engagement for {video_duration}s {content_type.value} video")
        
        # Generate viewer distribution
        viewer_distribution = self._generate_viewer_distribution(content_type, expected_views)
        
        # Generate watch time curve
        watch_time_curve = self._generate_watch_time_curve(
            video_duration, content_type, creator_persona, viewer_distribution
        )
        
        # Generate engagement events
        engagement_events = await self._generate_engagement_events(
            video_duration, content_type, creator_persona, viewer_distribution, authenticity_target
        )
        
        # Calculate overall metrics
        overall_retention = self._calculate_overall_retention(watch_time_curve)
        average_watch_time = self._calculate_average_watch_time(watch_time_curve, video_duration)
        engagement_rate = self._calculate_engagement_rate(engagement_events, expected_views)
        
        # Calculate authenticity score
        authenticity_score = await self._calculate_pattern_authenticity(
            watch_time_curve, engagement_events, content_type
        )
        
        return VideoEngagementPattern(
            video_duration=video_duration,
            watch_time_curve=watch_time_curve,
            engagement_events=engagement_events,
            overall_retention=overall_retention,
            average_watch_time=average_watch_time,
            engagement_rate=engagement_rate,
            authenticity_score=authenticity_score
        )
        
    def _generate_viewer_distribution(self, 
                                    content_type: ContentType, 
                                    total_views: int) -> Dict[ViewerType, int]:
        """Generate realistic distribution of viewer types"""
        
        # Base distribution percentages
        base_distribution = {
            ViewerType.CASUAL_BROWSER: 0.35,
            ViewerType.INTERESTED_LEARNER: 0.25,
            ViewerType.DEDICATED_FOLLOWER: 0.15,
            ViewerType.TUTORIAL_SEEKER: 0.10,
            ViewerType.BACKGROUND_LISTENER: 0.08,
            ViewerType.EXPERT_REVIEWER: 0.04,
            ViewerType.BINGE_WATCHER: 0.03
        }
        
        # Adjust distribution based on content type
        content_adjustments = {
            ContentType.TUTORIAL: {
                ViewerType.TUTORIAL_SEEKER: 1.5,
                ViewerType.INTERESTED_LEARNER: 1.3
            },
            ContentType.DEEP_DIVE: {
                ViewerType.EXPERT_REVIEWER: 2.0,
                ViewerType.DEDICATED_FOLLOWER: 1.4,
                ViewerType.CASUAL_BROWSER: 0.6
            },
            ContentType.QUICK_DEMO: {
                ViewerType.CASUAL_BROWSER: 1.4,
                ViewerType.TUTORIAL_SEEKER: 1.2,
                ViewerType.BACKGROUND_LISTENER: 0.5
            }
        }
        
        # Apply content-specific adjustments
        adjusted_distribution = base_distribution.copy()
        if content_type in content_adjustments:
            for viewer_type, multiplier in content_adjustments[content_type].items():
                adjusted_distribution[viewer_type] *= multiplier
                
        # Normalize distribution
        total_weight = sum(adjusted_distribution.values())
        for viewer_type in adjusted_distribution:
            adjusted_distribution[viewer_type] /= total_weight
            
        # Convert to actual counts
        viewer_counts = {}
        remaining_views = total_views
        
        for viewer_type, percentage in adjusted_distribution.items():
            if viewer_type == list(adjusted_distribution.keys())[-1]:  # Last type gets remainder
                count = remaining_views
            else:
                count = int(total_views * percentage)
                remaining_views -= count
                
            viewer_counts[viewer_type] = max(0, count)
            
        return viewer_counts
        
    def _generate_watch_time_curve(self,
                                 video_duration: float,
                                 content_type: ContentType,
                                 creator_persona: CreatorPersona,
                                 viewer_distribution: Dict[ViewerType, int]) -> List[WatchTimePoint]:
        """Generate realistic watch time retention curve"""
        
        # Create time points (every 30 seconds or duration/20, whichever is smaller)
        interval = min(30, video_duration / 20)
        time_points = np.arange(0, video_duration + interval, interval)
        
        curve_points = []
        total_viewers = sum(viewer_distribution.values())
        
        for timestamp in time_points:
            # Calculate retention for each viewer type at this timestamp
            remaining_viewers = 0
            
            for viewer_type, count in viewer_distribution.items():
                profile = self.viewer_profiles[viewer_type]
                retention_rate = self._calculate_retention_at_timestamp(
                    timestamp, video_duration, profile, content_type, creator_persona
                )
                remaining_viewers += int(count * retention_rate)
                
            retention_percentage = remaining_viewers / total_viewers if total_viewers > 0 else 0
            
            curve_points.append(WatchTimePoint(
                timestamp=timestamp,
                retention_percentage=retention_percentage,
                viewer_count=remaining_viewers
            ))
            
        return curve_points
        
    def _calculate_retention_at_timestamp(self,
                                        timestamp: float,
                                        video_duration: float,
                                        viewer_profile: ViewerProfile,
                                        content_type: ContentType,
                                        creator_persona: CreatorPersona) -> float:
        """Calculate retention rate for a viewer type at specific timestamp"""
        
        # Progress through video (0.0 to 1.0)
        progress = timestamp / video_duration
        
        # Base retention curve (exponential decay)
        base_retention = np.exp(-progress / viewer_profile.attention_span)
        
        # Content type modifiers
        content_modifier = self.content_type_modifiers.get(content_type, {})
        retention_boost = content_modifier.get("retention_boost", 1.0)
        skip_tendency = content_modifier.get("skip_tendency", 0.3)
        
        # Apply content boost
        retention = base_retention * retention_boost
        
        # Apply skip behavior at certain points
        if progress > 0.1:  # Skip behavior after intro
            skip_probability = skip_tendency * (1 - viewer_profile.patience)
            if random.random() < skip_probability * 0.1:  # 10% chance per time point
                retention *= 0.7  # Some viewers skip ahead
                
        # Creator-specific adjustments
        if creator_persona.personality_traits.explanation_clarity > 0.8:
            retention *= 1.1  # Clear explanations improve retention
            
        if creator_persona.voice_profile.energy_level > 0.8:
            retention *= 1.05  # High energy improves retention
            
        # Viewer type specific behaviors
        if viewer_profile.viewer_type == ViewerType.BACKGROUND_LISTENER:
            retention = max(retention, 0.8)  # Background listeners stay longer
        elif viewer_profile.viewer_type == ViewerType.TUTORIAL_SEEKER and progress > 0.3:
            # Tutorial seekers might skip to specific parts
            if random.random() < 0.2:
                retention *= 0.5
                
        return max(0.0, min(1.0, retention))
        
    async def _generate_engagement_events(self,
                                        video_duration: float,
                                        content_type: ContentType,
                                        creator_persona: CreatorPersona,
                                        viewer_distribution: Dict[ViewerType, int],
                                        authenticity_target: float) -> List[EngagementEvent]:
        """Generate realistic engagement events throughout the video"""
        
        events = []
        total_viewers = sum(viewer_distribution.values())
        
        # Generate events for each viewer type
        for viewer_type, count in viewer_distribution.items():
            profile = self.viewer_profiles[viewer_type]
            
            # Generate events for this viewer type
            type_events = await self._generate_events_for_viewer_type(
                video_duration, content_type, creator_persona, profile, count, authenticity_target
            )
            events.extend(type_events)
            
        # Sort events by timestamp
        events.sort(key=lambda e: e.timestamp)
        
        # Add some realistic clustering (people tend to engage at similar moments)
        events = self._add_engagement_clustering(events, video_duration)
        
        return events
        
    async def _generate_events_for_viewer_type(self,
                                             video_duration: float,
                                             content_type: ContentType,
                                             creator_persona: CreatorPersona,
                                             viewer_profile: ViewerProfile,
                                             viewer_count: int,
                                             authenticity_target: float) -> List[EngagementEvent]:
        """Generate engagement events for a specific viewer type"""
        
        events = []
        
        # Calculate how many viewers of this type will engage
        engaging_viewers = int(viewer_count * viewer_profile.engagement_likelihood)
        
        for _ in range(engaging_viewers):
            # Determine when this viewer will engage
            engagement_timestamps = self._generate_engagement_timestamps(
                video_duration, viewer_profile
            )
            
            for timestamp in engagement_timestamps:
                # Determine what type of engagement
                event_type = self._select_engagement_type(viewer_profile, timestamp, video_duration)
                
                if event_type:
                    # Calculate authenticity score for this event
                    authenticity_score = await self._calculate_event_authenticity(
                        event_type, timestamp, viewer_profile, authenticity_target
                    )
                    
                    event = EngagementEvent(
                        timestamp=timestamp,
                        event_type=event_type,
                        viewer_profile=viewer_profile,
                        authenticity_score=authenticity_score,
                        context={
                            "content_type": content_type.value,
                            "creator_energy": creator_persona.voice_profile.energy_level,
                            "viewer_technical_level": viewer_profile.technical_level
                        }
                    )
                    
                    events.append(event)
                    
        return events
        
    def _generate_engagement_timestamps(self, 
                                      video_duration: float, 
                                      viewer_profile: ViewerProfile) -> List[float]:
        """Generate timestamps when a viewer is likely to engage"""
        
        timestamps = []
        
        # Early engagement (intro period)
        if random.random() < 0.3:
            timestamps.append(random.uniform(10, 60))
            
        # Mid-video engagement
        mid_point = video_duration / 2
        if random.random() < viewer_profile.engagement_likelihood:
            timestamps.append(random.uniform(mid_point - 60, mid_point + 60))
            
        # End engagement (if viewer makes it that far)
        if random.random() < (viewer_profile.attention_span * 0.5):
            end_start = max(video_duration - 120, video_duration * 0.8)
            timestamps.append(random.uniform(end_start, video_duration))
            
        # Random additional engagement points
        additional_engagements = np.random.poisson(viewer_profile.engagement_likelihood * 2)
        for _ in range(additional_engagements):
            timestamps.append(random.uniform(0, video_duration))
            
        return sorted(timestamps)
        
    def _select_engagement_type(self, 
                              viewer_profile: ViewerProfile, 
                              timestamp: float, 
                              video_duration: float) -> Optional[EngagementType]:
        """Select the type of engagement based on viewer profile and timing"""
        
        # Progress through video
        progress = timestamp / video_duration
        
        # Base probabilities from viewer profile
        probabilities = {
            EngagementType.LIKE: viewer_profile.like_probability,
            EngagementType.COMMENT: viewer_profile.comment_probability,
            EngagementType.SUBSCRIBE: viewer_profile.subscription_probability,
            EngagementType.SHARE: viewer_profile.engagement_likelihood * 0.05,
            EngagementType.SAVE: viewer_profile.engagement_likelihood * 0.03,
            EngagementType.DISLIKE: viewer_profile.like_probability * 0.1
        }
        
        # Adjust probabilities based on timing
        if progress < 0.1:  # Early in video
            probabilities[EngagementType.SUBSCRIBE] *= 0.5  # Less likely to subscribe early
            probabilities[EngagementType.LIKE] *= 0.7
        elif progress > 0.8:  # Near end
            probabilities[EngagementType.SUBSCRIBE] *= 1.5  # More likely to subscribe after watching
            probabilities[EngagementType.LIKE] *= 1.3
            probabilities[EngagementType.COMMENT] *= 1.2
            
        # Select engagement type based on probabilities
        for engagement_type, probability in probabilities.items():
            if random.random() < probability:
                return engagement_type
                
        return None  # No engagement
        
    async def _calculate_event_authenticity(self,
                                          event_type: EngagementType,
                                          timestamp: float,
                                          viewer_profile: ViewerProfile,
                                          authenticity_target: float) -> float:
        """Calculate authenticity score for an engagement event"""
        
        # Base authenticity from aegnt-27 if available
        if self.aegnt27_engine:
            try:
                # Use aegnt-27 to validate event authenticity
                validation = await self.aegnt27_engine.validate_authenticity(
                    content=f"Engagement event: {event_type.value} at {timestamp}s",
                    authenticity_level="advanced"
                )
                base_score = validation.get("authenticity_score", 0.85)
            except Exception as e:
                logger.warning(f"aegnt-27 validation failed: {e}")
                base_score = 0.85
        else:
            base_score = 0.85
            
        # Adjust based on event timing naturalness
        timing_factor = self._calculate_timing_naturalness(timestamp, event_type)
        
        # Adjust based on viewer profile consistency
        profile_factor = self._calculate_profile_consistency(event_type, viewer_profile)
        
        # Combine factors
        authenticity_score = (base_score * 0.6 + timing_factor * 0.2 + profile_factor * 0.2)
        
        # Add small random variation for realism
        authenticity_score += random.uniform(-0.02, 0.02)
        
        return max(0.0, min(1.0, authenticity_score))
        
    def _calculate_timing_naturalness(self, timestamp: float, event_type: EngagementType) -> float:
        """Calculate how natural the timing of an engagement event is"""
        
        # Some engagement types are more natural at certain times
        natural_timing_scores = {
            EngagementType.LIKE: 0.9,      # Likes can happen anytime
            EngagementType.COMMENT: 0.85,  # Comments often at end or key moments
            EngagementType.SUBSCRIBE: 0.9, # Subscribes often at end
            EngagementType.SHARE: 0.8,     # Shares often after watching some content
            EngagementType.SAVE: 0.85,     # Saves often early or at key moments
            EngagementType.DISLIKE: 0.75   # Dislikes often early if content disappoints
        }
        
        return natural_timing_scores.get(event_type, 0.8)
        
    def _calculate_profile_consistency(self, 
                                     event_type: EngagementType, 
                                     viewer_profile: ViewerProfile) -> float:
        """Calculate how consistent an event is with the viewer profile"""
        
        # High engagement viewers should have high engagement events
        if event_type in [EngagementType.COMMENT, EngagementType.SUBSCRIBE]:
            if viewer_profile.engagement_likelihood > 0.7:
                return 0.95
            elif viewer_profile.engagement_likelihood > 0.4:
                return 0.85
            else:
                return 0.70
                
        # Casual engagement for all viewer types
        return 0.90
        
    def _add_engagement_clustering(self, 
                                 events: List[EngagementEvent], 
                                 video_duration: float) -> List[EngagementEvent]:
        """Add realistic clustering to engagement events"""
        
        # Identify "hot moments" where multiple people engage
        if len(events) < 10:
            return events
            
        # Find natural cluster points (every 2 minutes or at key content moments)
        cluster_points = list(range(0, int(video_duration), 120))  # Every 2 minutes
        
        clustered_events = []
        
        for event in events:
            # Find nearest cluster point
            nearest_cluster = min(cluster_points, key=lambda x: abs(x - event.timestamp))
            
            # 30% chance to cluster around this point
            if random.random() < 0.3 and abs(event.timestamp - nearest_cluster) > 30:
                # Move event closer to cluster point
                cluster_offset = random.uniform(-15, 15)
                new_timestamp = max(0, min(video_duration, nearest_cluster + cluster_offset))
                
                event.timestamp = new_timestamp
                
            clustered_events.append(event)
            
        return sorted(clustered_events, key=lambda e: e.timestamp)
        
    def _calculate_overall_retention(self, watch_time_curve: List[WatchTimePoint]) -> float:
        """Calculate overall retention rate"""
        if not watch_time_curve:
            return 0.0
            
        # Average retention across all time points
        total_retention = sum(point.retention_percentage for point in watch_time_curve)
        return total_retention / len(watch_time_curve)
        
    def _calculate_average_watch_time(self, 
                                    watch_time_curve: List[WatchTimePoint], 
                                    video_duration: float) -> float:
        """Calculate average watch time in seconds"""
        if not watch_time_curve:
            return 0.0
            
        # Integrate under the retention curve
        total_watch_time = 0
        
        for i in range(1, len(watch_time_curve)):
            prev_point = watch_time_curve[i-1]
            curr_point = watch_time_curve[i]
            
            # Trapezoidal integration
            time_interval = curr_point.timestamp - prev_point.timestamp
            avg_retention = (prev_point.retention_percentage + curr_point.retention_percentage) / 2
            
            total_watch_time += time_interval * avg_retention
            
        return total_watch_time
        
    def _calculate_engagement_rate(self, 
                                 engagement_events: List[EngagementEvent], 
                                 total_views: int) -> float:
        """Calculate overall engagement rate"""
        if total_views == 0:
            return 0.0
            
        # Count meaningful engagement events (exclude views)
        meaningful_events = [
            e for e in engagement_events 
            if e.event_type != EngagementType.VIEW
        ]
        
        return len(meaningful_events) / total_views
        
    async def _calculate_pattern_authenticity(self,
                                            watch_time_curve: List[WatchTimePoint],
                                            engagement_events: List[EngagementEvent],
                                            content_type: ContentType) -> float:
        """Calculate overall authenticity of the engagement pattern"""
        
        # Retention curve authenticity
        retention_authenticity = self._analyze_retention_authenticity(watch_time_curve)
        
        # Engagement timing authenticity
        timing_authenticity = self._analyze_engagement_timing_authenticity(engagement_events)
        
        # Event distribution authenticity
        distribution_authenticity = self._analyze_event_distribution_authenticity(engagement_events)
        
        # Content type consistency
        content_consistency = self._analyze_content_type_consistency(engagement_events, content_type)
        
        # Combine all authenticity factors
        overall_authenticity = (
            retention_authenticity * 0.3 +
            timing_authenticity * 0.25 +
            distribution_authenticity * 0.25 +
            content_consistency * 0.2
        )
        
        return max(0.0, min(1.0, overall_authenticity))
        
    def _analyze_retention_authenticity(self, watch_time_curve: List[WatchTimePoint]) -> float:
        """Analyze how authentic the retention curve looks"""
        if len(watch_time_curve) < 3:
            return 0.5
            
        retentions = [point.retention_percentage for point in watch_time_curve]
        
        # Check for natural decline (authentic videos should generally decline)
        is_declining = all(retentions[i] >= retentions[i+1] for i in range(len(retentions)-1))
        decline_score = 0.8 if is_declining else 0.4
        
        # Check for reasonable variance (too smooth = suspicious)
        retention_variance = np.var(retentions)
        variance_score = min(1.0, retention_variance * 10)  # Normalize
        
        # Check for realistic end retention (should be 20-80% typically)
        end_retention = retentions[-1]
        end_score = 1.0 if 0.2 <= end_retention <= 0.8 else 0.6
        
        return (decline_score * 0.4 + variance_score * 0.3 + end_score * 0.3)
        
    def _analyze_engagement_timing_authenticity(self, engagement_events: List[EngagementEvent]) -> float:
        """Analyze how authentic the timing of engagement events is"""
        if not engagement_events:
            return 0.5
            
        # Calculate average authenticity of individual events
        individual_scores = [event.authenticity_score for event in engagement_events]
        avg_individual_score = np.mean(individual_scores)
        
        # Check for realistic clustering (events should cluster somewhat)
        timestamps = [event.timestamp for event in engagement_events]
        clustering_score = self._calculate_clustering_score(timestamps)
        
        return (avg_individual_score * 0.7 + clustering_score * 0.3)
        
    def _calculate_clustering_score(self, timestamps: List[float]) -> float:
        """Calculate how realistically clustered the timestamps are"""
        if len(timestamps) < 3:
            return 0.8
            
        # Calculate intervals between consecutive events
        intervals = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)]
        
        # Realistic engagement should have some short intervals (clustering)
        # and some longer intervals (gaps)
        short_intervals = sum(1 for interval in intervals if interval < 30)
        medium_intervals = sum(1 for interval in intervals if 30 <= interval <= 120)
        long_intervals = sum(1 for interval in intervals if interval > 120)
        
        total_intervals = len(intervals)
        
        # Good distribution: some clustering, some spacing
        short_ratio = short_intervals / total_intervals
        medium_ratio = medium_intervals / total_intervals
        long_ratio = long_intervals / total_intervals
        
        # Ideal ratios (somewhat arbitrary but realistic)
        ideal_short = 0.3
        ideal_medium = 0.5
        ideal_long = 0.2
        
        # Calculate score based on how close to ideal
        short_score = 1.0 - abs(short_ratio - ideal_short)
        medium_score = 1.0 - abs(medium_ratio - ideal_medium)
        long_score = 1.0 - abs(long_ratio - ideal_long)
        
        return (short_score + medium_score + long_score) / 3
        
    def _analyze_event_distribution_authenticity(self, engagement_events: List[EngagementEvent]) -> float:
        """Analyze how authentic the distribution of event types is"""
        if not engagement_events:
            return 0.5
            
        # Count event types
        event_counts = {}
        for event in engagement_events:
            event_type = event.event_type
            event_counts[event_type] = event_counts.get(event_type, 0) + 1
            
        total_events = len(engagement_events)
        
        # Calculate ratios
        like_ratio = event_counts.get(EngagementType.LIKE, 0) / total_events
        comment_ratio = event_counts.get(EngagementType.COMMENT, 0) / total_events
        subscribe_ratio = event_counts.get(EngagementType.SUBSCRIBE, 0) / total_events
        
        # Realistic ratios for typical YouTube videos
        # Likes should be most common, then comments, then subscribes
        authenticity_score = 0.8  # Base score
        
        if like_ratio > comment_ratio > subscribe_ratio:
            authenticity_score += 0.1  # Bonus for realistic ordering
            
        # Check for reasonable absolute values
        if 0.4 <= like_ratio <= 0.8:  # Likes should be 40-80% of engagement
            authenticity_score += 0.05
        if 0.1 <= comment_ratio <= 0.4:  # Comments should be 10-40%
            authenticity_score += 0.05
        if 0.01 <= subscribe_ratio <= 0.15:  # Subscribes should be 1-15%
            authenticity_score += 0.05
            
        return min(1.0, authenticity_score)
        
    def _analyze_content_type_consistency(self, 
                                        engagement_events: List[EngagementEvent], 
                                        content_type: ContentType) -> float:
        """Analyze if engagement pattern matches content type expectations"""
        
        # This is a simplified analysis - could be much more sophisticated
        base_score = 0.85
        
        # Add content-specific checks here
        if content_type == ContentType.TUTORIAL:
            # Tutorials should have good engagement throughout
            if len(engagement_events) > 5:
                base_score += 0.1
        elif content_type == ContentType.QUICK_DEMO:
            # Quick demos should have early engagement
            early_events = sum(1 for e in engagement_events if e.timestamp < 60)
            if early_events > len(engagement_events) * 0.6:
                base_score += 0.1
                
        return min(1.0, base_score)
        
    async def batch_simulate_engagement(self, 
                                      video_specs: List[Dict[str, Any]],
                                      authenticity_target: float = 0.95) -> List[VideoEngagementPattern]:
        """Simulate engagement for multiple videos in batch"""
        
        logger.info(f"Batch simulating engagement for {len(video_specs)} videos")
        
        tasks = []
        for spec in video_specs:
            task = self.simulate_video_engagement(
                video_duration=spec['duration'],
                content_type=ContentType(spec['content_type']),
                creator_persona=spec['creator_persona'],
                expected_views=spec.get('expected_views', 1000),
                authenticity_target=authenticity_target
            )
            tasks.append(task)
            
        patterns = await asyncio.gather(*tasks)
        return patterns
        
    def get_engagement_statistics(self, patterns: List[VideoEngagementPattern]) -> Dict[str, Any]:
        """Get comprehensive statistics about engagement patterns"""
        
        if not patterns:
            return {"error": "No patterns provided"}
            
        stats = {
            "total_videos": len(patterns),
            "average_retention": np.mean([p.overall_retention for p in patterns]),
            "average_watch_time": np.mean([p.average_watch_time for p in patterns]),
            "average_engagement_rate": np.mean([p.engagement_rate for p in patterns]),
            "average_authenticity": np.mean([p.authenticity_score for p in patterns]),
            "retention_range": {
                "min": min(p.overall_retention for p in patterns),
                "max": max(p.overall_retention for p in patterns)
            },
            "authenticity_distribution": {
                "above_90": sum(1 for p in patterns if p.authenticity_score >= 0.90),
                "above_95": sum(1 for p in patterns if p.authenticity_score >= 0.95),
                "below_80": sum(1 for p in patterns if p.authenticity_score < 0.80)
            }
        }
        
        return stats
