"""Timing Utilities for Human-Like Patterns

Utilities for generating realistic human timing patterns, delays,
and scheduling variations for the YouTube automation pipeline.
"""

import random
import numpy as np
from datetime import datetime, timedelta, time
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import pytz
import logging

logger = logging.getLogger(__name__)

class DelayReason(Enum):
    """Reasons for upload delays"""
    ON_TIME = "on_time"
    TECHNICAL_ISSUES = "technical_issues"
    CONTENT_REVIEW = "content_review"
    LAST_MINUTE_EDITS = "last_minute_edits"
    RENDER_PROBLEMS = "render_problems"
    INTERNET_ISSUES = "internet_issues"
    PERSONAL_INTERRUPTION = "personal_interruption"
    QUALITY_CONCERNS = "quality_concerns"
    PLATFORM_ISSUES = "platform_issues"
    EARLY_PREPARATION = "early_preparation"
    SCHEDULE_CHANGE = "schedule_change"

class TimeOfDay(Enum):
    """Time periods for different behavior patterns"""
    EARLY_MORNING = "early_morning"  # 5-8 AM
    MORNING = "morning"              # 8-12 PM
    LUNCH = "lunch"                  # 12-2 PM
    AFTERNOON = "afternoon"          # 2-6 PM
    EVENING = "evening"              # 6-9 PM
    NIGHT = "night"                  # 9 PM-12 AM
    LATE_NIGHT = "late_night"        # 12-5 AM

@dataclass
class TimingPattern:
    """Represents a timing pattern with natural variations"""
    base_time: datetime
    variation_minutes: float
    consistency_factor: float  # 0.0-1.0
    day_of_week_factor: float
    time_of_day_factor: float
    external_factors: Dict[str, float]  # holidays, events, etc.
    
@dataclass
class UploadDelay:
    """Represents an upload delay with context"""
    scheduled_time: datetime
    actual_time: datetime
    delay_minutes: float
    reason: DelayReason
    severity: str  # "minor", "moderate", "major"
    authenticity_impact: float  # How this affects authenticity score
    
class HumanTimingGenerator:
    """Generates realistic human timing patterns with natural variations"""
    
    def __init__(self, timezone: str = "UTC"):
        self.timezone = pytz.timezone(timezone)
        self.delay_probability_cache = {}
        self.time_patterns = self._initialize_time_patterns()
        
    def _initialize_time_patterns(self) -> Dict[str, Dict[str, float]]:
        """Initialize realistic time patterns for different scenarios"""
        return {
            "upload_delays": {
                "early_morning": 0.15,  # Low delay probability
                "morning": 0.20,
                "lunch": 0.35,         # Higher delays during lunch
                "afternoon": 0.30,
                "evening": 0.25,
                "night": 0.40,         # Higher delays at night
                "late_night": 0.50     # Highest delay probability
            },
            "day_of_week": {
                "monday": 1.0,          # Baseline
                "tuesday": 0.9,
                "wednesday": 0.95,
                "thursday": 1.1,
                "friday": 1.3,          # More delays on Friday
                "saturday": 0.8,        # Weekend - more flexible
                "sunday": 0.7
            },
            "seasonal": {
                "holiday_week": 1.5,    # More delays during holidays
                "summer": 1.1,          # Slight increase in summer
                "winter": 0.9,          # Slightly more consistent in winter
                "back_to_school": 1.2   # Busy period
            }
        }
        
    def generate_realistic_delay(self, 
                               scheduled_time: datetime,
                               consistency_score: float = 0.8,
                               creator_type: str = "casual") -> UploadDelay:
        """Generate a realistic upload delay with human-like characteristics"""
        
        # Determine time of day
        time_period = self._get_time_period(scheduled_time.hour)
        
        # Calculate base delay probability
        base_delay_prob = self.time_patterns["upload_delays"][time_period.value]
        
        # Adjust for consistency score (higher consistency = lower delay probability)
        consistency_factor = 1.0 - consistency_score
        delay_probability = base_delay_prob * (1.0 + consistency_factor)
        
        # Adjust for day of week
        day_name = scheduled_time.strftime("%A").lower()
        day_factor = self.time_patterns["day_of_week"].get(day_name, 1.0)
        delay_probability *= day_factor
        
        # Adjust for creator type
        creator_factors = {
            "professional": 0.7,
            "casual": 1.0,
            "beginner": 1.3,
            "perfectionist": 1.4
        }
        delay_probability *= creator_factors.get(creator_type, 1.0)
        
        # Determine if there will be a delay
        will_delay = random.random() < delay_probability
        
        if not will_delay:
            # Small variation even when "on time"
            variation = random.uniform(-5, 15)  # -5 to +15 minutes
            actual_time = scheduled_time + timedelta(minutes=variation)
            delay_minutes = variation
            reason = DelayReason.ON_TIME if variation <= 5 else DelayReason.LAST_MINUTE_EDITS
            severity = "minor"
        else:
            # Generate realistic delay
            delay_minutes, reason, severity = self._generate_delay_details(time_period, creator_type)
            actual_time = scheduled_time + timedelta(minutes=delay_minutes)
            
        # Calculate authenticity impact
        authenticity_impact = self._calculate_authenticity_impact(delay_minutes, reason)
        
        return UploadDelay(
            scheduled_time=scheduled_time,
            actual_time=actual_time,
            delay_minutes=delay_minutes,
            reason=reason,
            severity=severity,
            authenticity_impact=authenticity_impact
        )
        
    def _get_time_period(self, hour: int) -> TimeOfDay:
        """Determine time period from hour"""
        if 5 <= hour < 8:
            return TimeOfDay.EARLY_MORNING
        elif 8 <= hour < 12:
            return TimeOfDay.MORNING
        elif 12 <= hour < 14:
            return TimeOfDay.LUNCH
        elif 14 <= hour < 18:
            return TimeOfDay.AFTERNOON
        elif 18 <= hour < 21:
            return TimeOfDay.EVENING
        elif 21 <= hour < 24:
            return TimeOfDay.NIGHT
        else:  # 0-5
            return TimeOfDay.LATE_NIGHT
            
    def _generate_delay_details(self, 
                              time_period: TimeOfDay, 
                              creator_type: str) -> Tuple[float, DelayReason, str]:
        """Generate realistic delay duration, reason, and severity"""
        
        # Delay duration distributions by time period
        delay_distributions = {
            TimeOfDay.EARLY_MORNING: (15, 45),   # Shorter delays early
            TimeOfDay.MORNING: (20, 60),
            TimeOfDay.LUNCH: (30, 90),           # Longer delays during lunch
            TimeOfDay.AFTERNOON: (25, 75),
            TimeOfDay.EVENING: (20, 80),
            TimeOfDay.NIGHT: (30, 120),          # Variable delays at night
            TimeOfDay.LATE_NIGHT: (45, 180)     # Longest delays late night
        }
        
        min_delay, max_delay = delay_distributions[time_period]
        
        # Generate delay with log-normal distribution (more realistic)
        mu = np.log(min_delay + 10)
        sigma = 0.8
        delay_minutes = np.random.lognormal(mu, sigma)
        
        # Clamp to reasonable bounds
        delay_minutes = max(min_delay, min(max_delay, delay_minutes))
        
        # Determine reason based on delay duration and time
        reason = self._select_delay_reason(delay_minutes, time_period, creator_type)
        
        # Determine severity
        if delay_minutes < 30:
            severity = "minor"
        elif delay_minutes < 90:
            severity = "moderate"
        else:
            severity = "major"
            
        return delay_minutes, reason, severity
        
    def _select_delay_reason(self, 
                           delay_minutes: float, 
                           time_period: TimeOfDay, 
                           creator_type: str) -> DelayReason:
        """Select appropriate delay reason based on context"""
        
        # Reason probabilities by delay duration
        if delay_minutes < 15:
            reasons = [
                (DelayReason.LAST_MINUTE_EDITS, 0.4),
                (DelayReason.CONTENT_REVIEW, 0.3),
                (DelayReason.TECHNICAL_ISSUES, 0.2),
                (DelayReason.EARLY_PREPARATION, 0.1)
            ]
        elif delay_minutes < 60:
            reasons = [
                (DelayReason.TECHNICAL_ISSUES, 0.25),
                (DelayReason.CONTENT_REVIEW, 0.25),
                (DelayReason.LAST_MINUTE_EDITS, 0.20),
                (DelayReason.RENDER_PROBLEMS, 0.15),
                (DelayReason.INTERNET_ISSUES, 0.10),
                (DelayReason.QUALITY_CONCERNS, 0.05)
            ]
        else:  # Long delays
            reasons = [
                (DelayReason.QUALITY_CONCERNS, 0.30),
                (DelayReason.TECHNICAL_ISSUES, 0.25),
                (DelayReason.PERSONAL_INTERRUPTION, 0.20),
                (DelayReason.RENDER_PROBLEMS, 0.15),
                (DelayReason.PLATFORM_ISSUES, 0.10)
            ]
            
        # Adjust probabilities based on time period
        if time_period == TimeOfDay.LUNCH:
            # More personal interruptions during lunch
            reasons = [(r, p*1.5 if r == DelayReason.PERSONAL_INTERRUPTION else p*0.9) 
                      for r, p in reasons]
        elif time_period in [TimeOfDay.NIGHT, TimeOfDay.LATE_NIGHT]:
            # More technical issues at night
            reasons = [(r, p*1.3 if r == DelayReason.TECHNICAL_ISSUES else p*0.95) 
                      for r, p in reasons]
                      
        # Adjust for creator type
        if creator_type == "perfectionist":
            reasons = [(r, p*1.5 if r == DelayReason.QUALITY_CONCERNS else p*0.9) 
                      for r, p in reasons]
        elif creator_type == "beginner":
            reasons = [(r, p*1.3 if r == DelayReason.TECHNICAL_ISSUES else p*0.95) 
                      for r, p in reasons]
                      
        # Normalize probabilities
        total_prob = sum(p for _, p in reasons)
        reasons = [(r, p/total_prob) for r, p in reasons]
        
        # Select reason based on probabilities
        rand_val = random.random()
        cumulative = 0
        
        for reason, prob in reasons:
            cumulative += prob
            if rand_val <= cumulative:
                return reason
                
        return reasons[0][0]  # Fallback
        
    def _calculate_authenticity_impact(self, delay_minutes: float, reason: DelayReason) -> float:
        """Calculate how delay affects authenticity score"""
        
        # Base impact based on delay duration
        if delay_minutes <= 5:
            base_impact = 0.02    # Very minor positive impact (shows human timing)
        elif delay_minutes <= 30:
            base_impact = 0.01    # Minor positive impact
        elif delay_minutes <= 90:
            base_impact = 0.0     # Neutral impact
        elif delay_minutes <= 180:
            base_impact = -0.01   # Slight negative impact
        else:
            base_impact = -0.02   # Negative impact (too unrealistic)
            
        # Reason-based adjustments
        reason_adjustments = {
            DelayReason.ON_TIME: 0.01,
            DelayReason.EARLY_PREPARATION: 0.015,
            DelayReason.LAST_MINUTE_EDITS: 0.005,
            DelayReason.CONTENT_REVIEW: 0.005,
            DelayReason.QUALITY_CONCERNS: 0.002,
            DelayReason.TECHNICAL_ISSUES: 0.0,
            DelayReason.RENDER_PROBLEMS: 0.0,
            DelayReason.INTERNET_ISSUES: -0.005,
            DelayReason.PERSONAL_INTERRUPTION: 0.0,
            DelayReason.PLATFORM_ISSUES: -0.01,
            DelayReason.SCHEDULE_CHANGE: -0.005
        }
        
        adjustment = reason_adjustments.get(reason, 0.0)
        
        return base_impact + adjustment
        
    def generate_batch_timing_pattern(self, 
                                    count: int,
                                    base_interval_hours: float = 24,
                                    consistency_score: float = 0.8,
                                    creator_type: str = "casual") -> List[datetime]:
        """Generate a batch of upload times with realistic patterns"""
        
        upload_times = []
        current_time = datetime.now()
        
        for i in range(count):
            # Calculate base next upload time
            next_base_time = current_time + timedelta(hours=base_interval_hours)
            
            # Generate delay for this upload
            delay = self.generate_realistic_delay(next_base_time, consistency_score, creator_type)
            
            upload_times.append(delay.actual_time)
            current_time = delay.actual_time
            
            # Add some variation to interval for next upload
            interval_variation = random.uniform(0.8, 1.3)  # ±30% variation
            base_interval_hours *= interval_variation
            
            # Keep interval within reasonable bounds
            base_interval_hours = max(12, min(48, base_interval_hours))
            
        return upload_times
        
    def simulate_creator_schedule(self, 
                                days: int = 30,
                                uploads_per_week: float = 3.5,
                                consistency_score: float = 0.8,
                                preferred_hours: List[int] = None) -> List[UploadDelay]:
        """Simulate a creator's upload schedule over a period"""
        
        if preferred_hours is None:
            preferred_hours = [14, 18, 20]  # 2 PM, 6 PM, 8 PM
            
        schedule = []
        current_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Calculate average days between uploads
        days_between_uploads = 7.0 / uploads_per_week
        
        upload_date = current_date
        
        while upload_date <= current_date + timedelta(days=days):
            # Choose a preferred hour with some variation
            preferred_hour = random.choice(preferred_hours)
            hour_variation = random.uniform(-2, 2)  # ±2 hours variation
            actual_hour = max(6, min(23, preferred_hour + hour_variation))
            
            # Create scheduled time
            scheduled_time = upload_date.replace(
                hour=int(actual_hour),
                minute=random.randint(0, 59),
                second=random.randint(0, 59)
            )
            
            # Generate delay for this upload
            delay = self.generate_realistic_delay(scheduled_time, consistency_score)
            schedule.append(delay)
            
            # Calculate next upload date
            days_to_next = days_between_uploads * random.uniform(0.7, 1.4)
            upload_date += timedelta(days=days_to_next)
            
        return schedule
        
    def analyze_timing_authenticity(self, upload_times: List[datetime]) -> Dict[str, float]:
        """Analyze how authentic a series of upload times appears"""
        
        if len(upload_times) < 2:
            return {"authenticity_score": 0.5, "consistency": 0.0, "variance": 0.0}
            
        # Calculate intervals between uploads
        intervals = []
        for i in range(1, len(upload_times)):
            interval = (upload_times[i] - upload_times[i-1]).total_seconds() / 3600  # hours
            intervals.append(interval)
            
        # Analyze consistency
        mean_interval = np.mean(intervals)
        std_interval = np.std(intervals)
        consistency = 1.0 - min(1.0, std_interval / mean_interval) if mean_interval > 0 else 0.0
        
        # Analyze variance (too consistent = suspicious)
        variance_score = min(1.0, std_interval / 12.0)  # Normalize to 12-hour standard
        
        # Check for human-like patterns
        time_of_day_scores = []
        for upload_time in upload_times:
            hour = upload_time.hour
            # Human-like hours get higher scores
            if 8 <= hour <= 22:  # Reasonable hours
                time_of_day_scores.append(1.0)
            elif 6 <= hour < 8 or 22 < hour <= 24:
                time_of_day_scores.append(0.8)
            else:  # 0-6 AM
                time_of_day_scores.append(0.3)
                
        time_of_day_authenticity = np.mean(time_of_day_scores)
        
        # Day of week analysis
        day_distribution = {i: 0 for i in range(7)}
        for upload_time in upload_times:
            day_distribution[upload_time.weekday()] += 1
            
        # Calculate day distribution entropy (higher = more realistic)
        total_uploads = len(upload_times)
        day_entropy = 0
        for count in day_distribution.values():
            if count > 0:
                p = count / total_uploads
                day_entropy -= p * np.log2(p)
                
        # Normalize entropy (max entropy for 7 days is log2(7) ≈ 2.807)
        day_diversity = day_entropy / 2.807
        
        # Overall authenticity score
        authenticity_score = (
            consistency * 0.3 +           # Consistency is important
            variance_score * 0.2 +        # Some variance is human
            time_of_day_authenticity * 0.3 +  # Reasonable hours
            day_diversity * 0.2           # Varied days
        )
        
        return {
            "authenticity_score": authenticity_score,
            "consistency": consistency,
            "variance": variance_score,
            "time_of_day_authenticity": time_of_day_authenticity,
            "day_diversity": day_diversity,
            "mean_interval_hours": mean_interval,
            "interval_std_hours": std_interval,
            "total_uploads": len(upload_times)
        }
        
    def optimize_schedule_for_authenticity(self, 
                                         base_schedule: List[datetime],
                                         target_authenticity: float = 0.90) -> List[datetime]:
        """Optimize a schedule to achieve target authenticity score"""
        
        current_schedule = base_schedule.copy()
        current_authenticity = self.analyze_timing_authenticity(current_schedule)["authenticity_score"]
        
        iterations = 0
        max_iterations = 100
        
        while current_authenticity < target_authenticity and iterations < max_iterations:
            # Try random adjustments
            test_schedule = current_schedule.copy()
            
            # Randomly adjust some upload times
            num_adjustments = max(1, len(test_schedule) // 10)
            indices_to_adjust = random.sample(range(len(test_schedule)), num_adjustments)
            
            for idx in indices_to_adjust:
                # Add random variation
                variation_hours = random.uniform(-6, 6)
                test_schedule[idx] += timedelta(hours=variation_hours)
                
            # Sort the schedule
            test_schedule.sort()
            
            # Check if this improves authenticity
            test_authenticity = self.analyze_timing_authenticity(test_schedule)["authenticity_score"]
            
            if test_authenticity > current_authenticity:
                current_schedule = test_schedule
                current_authenticity = test_authenticity
                
            iterations += 1
            
        return current_schedule
        
    def get_timing_recommendations(self, 
                                 upload_history: List[datetime],
                                 target_consistency: float = 0.8) -> List[str]:
        """Get recommendations for improving timing authenticity"""
        
        analysis = self.analyze_timing_authenticity(upload_history)
        recommendations = []
        
        if analysis["consistency"] < target_consistency:
            recommendations.append(
                f"Improve consistency: current {analysis['consistency']:.2f}, target {target_consistency:.2f}"
            )
            
        if analysis["variance"] < 0.3:
            recommendations.append(
                "Add more natural variation to upload times (current schedule too rigid)"
            )
        elif analysis["variance"] > 0.8:
            recommendations.append(
                "Reduce variation in upload times (current schedule too chaotic)"
            )
            
        if analysis["time_of_day_authenticity"] < 0.8:
            recommendations.append(
                "Upload during more typical hours (8 AM - 10 PM)"
            )
            
        if analysis["day_diversity"] < 0.5:
            recommendations.append(
                "Vary upload days throughout the week for more natural patterns"
            )
            
        if not recommendations:
            recommendations.append("Timing patterns look good! Maintain current approach.")
            
        return recommendations
        
    def generate_realistic_burst_pattern(self, 
                                       burst_size: int = 5,
                                       burst_duration_hours: float = 8,
                                       consistency_score: float = 0.7) -> List[datetime]:
        """Generate a realistic burst upload pattern (multiple uploads in short time)"""
        
        base_time = datetime.now()
        burst_times = []
        
        # Generate times within the burst duration
        for i in range(burst_size):
            # Calculate position within burst (0.0 to 1.0)
            position = i / (burst_size - 1) if burst_size > 1 else 0.0
            
            # Base time within burst duration
            base_offset_hours = position * burst_duration_hours
            
            # Add realistic spacing (not perfectly even)
            if i == 0:
                spacing_variation = 0  # First upload on time
            else:
                # Increasing variation as burst progresses (fatigue/rushing)
                max_variation = (1.0 - consistency_score) * 2.0 * (position + 0.5)
                spacing_variation = random.uniform(-max_variation, max_variation)
                
            actual_offset_hours = base_offset_hours + spacing_variation
            upload_time = base_time + timedelta(hours=actual_offset_hours)
            
            burst_times.append(upload_time)
            
        return sorted(burst_times)
