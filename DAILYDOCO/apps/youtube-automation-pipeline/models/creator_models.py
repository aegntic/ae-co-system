"""Creator Models for Human Authenticity System

Data models for creator personas, upload patterns, and content styles
used in the aegnt-27 Human Peak Protocol integration.
"""

import json
import random
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid

class ContentType(Enum):
    """Types of content that can be generated"""
    TUTORIAL = "tutorial"
    LIVE_CODING = "live_coding"
    EXPLANATION = "explanation"
    QUICK_DEMO = "quick_demo"
    DEEP_DIVE = "deep_dive"
    PROBLEM_SOLVING = "problem_solving"
    CODE_REVIEW = "code_review"
    PROJECT_BUILD = "project_build"
    TECH_REVIEW = "tech_review"
    DEBUGGING = "debugging"

class UploadFrequency(Enum):
    """Upload frequency patterns"""
    DAILY = "daily"
    WEEKLY = "weekly"
    BI_WEEKLY = "bi_weekly"
    IRREGULAR = "irregular"
    BURST = "burst"  # Multiple uploads in short time
    SEASONAL = "seasonal"  # Varies by season/events

class CreatorArchetype(Enum):
    """Creator personality archetypes"""
    ANALYTICAL_EDUCATOR = "analytical_educator"
    CASUAL_EXPLAINER = "casual_explainer"
    ENERGETIC_PRESENTER = "energetic_presenter"
    METHODICAL_TEACHER = "methodical_teacher"
    CREATIVE_PROBLEM_SOLVER = "creative_problem_solver"
    TECHNICAL_EXPERT = "technical_expert"
    BEGINNER_FRIENDLY = "beginner_friendly"
    ADVANCED_SPECIALIST = "advanced_specialist"
    DEBUGGING_DETECTIVE = "debugging_detective"
    ARCHITECTURE_ARCHITECT = "architecture_architect"
    PERFORMANCE_OPTIMIZER = "performance_optimizer"
    SECURITY_SPECIALIST = "security_specialist"

@dataclass
class VoiceProfile:
    """Voice characteristics for a creator persona"""
    pitch_range: float = 1.0  # 0.5-2.0, 1.0 = normal
    speech_pace: float = 1.0  # 0.5-2.0, 1.0 = normal speed
    energy_level: float = 0.7  # 0.0-1.0
    pause_frequency: float = 1.0  # Relative to normal
    filler_words: List[str] = field(default_factory=lambda: ["um", "uh"])
    accent_strength: float = 0.0  # 0.0-1.0, 0 = neutral
    technical_vocabulary: float = 0.8  # 0.0-1.0, how technical language is
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'VoiceProfile':
        return cls(**data)

@dataclass
class ContentStyle:
    """Content creation style preferences"""
    primary_type: ContentType
    secondary_types: List[ContentType] = field(default_factory=list)
    average_duration: float = 600  # seconds
    introduction_style: str = "casual"  # casual, formal, quick, detailed
    conclusion_style: str = "summary"  # summary, call_to_action, casual, abrupt
    interaction_level: float = 0.5  # 0.0-1.0, how much audience interaction
    code_explanation_depth: float = 0.7  # 0.0-1.0
    visual_aids_usage: float = 0.6  # 0.0-1.0
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['primary_type'] = self.primary_type.value
        data['secondary_types'] = [t.value for t in self.secondary_types]
        return data
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ContentStyle':
        data['primary_type'] = ContentType(data['primary_type'])
        data['secondary_types'] = [ContentType(t) for t in data.get('secondary_types', [])]
        return cls(**data)

@dataclass
class UploadPattern:
    """Upload timing and frequency patterns"""
    frequency: UploadFrequency
    preferred_days: List[int] = field(default_factory=lambda: [1, 3, 5])  # Monday=0
    preferred_times: List[int] = field(default_factory=lambda: [14, 18])  # Hours (24h format)
    timezone_offset: int = 0  # Hours from UTC
    consistency_score: float = 0.8  # 0.0-1.0, how consistent the schedule is
    seasonal_variation: bool = False
    holiday_adjustments: bool = True
    weekend_preference: str = "avoid"  # avoid, prefer, neutral
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['frequency'] = self.frequency.value
        return data
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UploadPattern':
        data['frequency'] = UploadFrequency(data['frequency'])
        return cls(**data)

@dataclass
class PersonalityTraits:
    """Personality traits affecting content and behavior"""
    technical_depth: float = 0.7  # 0.0-1.0, how deep into technical details
    explanation_clarity: float = 0.8  # 0.0-1.0, how clear explanations are
    energy_consistency: float = 0.6  # 0.0-1.0, energy level consistency
    mistake_tolerance: float = 0.03  # 0.0-0.1, acceptable error rate
    perfectionism: float = 0.5  # 0.0-1.0, how much perfection is demanded
    adaptability: float = 0.7  # 0.0-1.0, how quickly persona adapts
    creativity: float = 0.6  # 0.0-1.0, creative approach to problems
    patience: float = 0.8  # 0.0-1.0, patience with complex topics
    humor_usage: float = 0.3  # 0.0-1.0, how much humor is used
    community_engagement: float = 0.5  # 0.0-1.0, community interaction level
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PersonalityTraits':
        return cls(**data)

@dataclass
class EvolutionParameters:
    """Parameters controlling how the persona evolves over time"""
    improvement_rate: float = 0.005  # Daily improvement rate
    adaptation_speed: float = 0.2  # How quickly to adapt to feedback
    learning_curve: str = "gradual"  # gradual, rapid, plateau
    skill_development_areas: List[str] = field(default_factory=lambda: ["presentation", "technical_depth"])
    authenticity_target: float = 0.95  # Target authenticity score
    current_authenticity: float = 0.85  # Current authenticity score
    experience_level: str = "intermediate"  # beginner, intermediate, advanced, expert
    growth_trajectory: str = "ascending"  # ascending, stable, declining
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'EvolutionParameters':
        return cls(**data)

@dataclass
class AuthenticityMetrics:
    """Metrics tracking authenticity performance"""
    current_score: float = 0.85
    target_score: float = 0.95
    detection_resistance: float = 0.90
    behavioral_patterns_active: int = 20  # Out of 27 total
    platform_compliance_score: float = 0.92
    improvement_velocity: float = 0.01  # Score improvement per week
    consistency_rating: float = 0.88
    last_updated: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['last_updated'] = self.last_updated.isoformat()
        return data
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AuthenticityMetrics':
        if 'last_updated' in data and isinstance(data['last_updated'], str):
            data['last_updated'] = datetime.fromisoformat(data['last_updated'])
        return cls(**data)

@dataclass
class CreatorPersona:
    """Complete creator persona with all characteristics"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Creator"
    archetype: CreatorArchetype = CreatorArchetype.CASUAL_EXPLAINER
    
    # Core characteristics
    voice_profile: VoiceProfile = field(default_factory=VoiceProfile)
    content_style: ContentStyle = field(default_factory=ContentStyle)
    upload_pattern: UploadPattern = field(default_factory=UploadPattern)
    personality_traits: PersonalityTraits = field(default_factory=PersonalityTraits)
    evolution_parameters: EvolutionParameters = field(default_factory=EvolutionParameters)
    authenticity_metrics: AuthenticityMetrics = field(default_factory=AuthenticityMetrics)
    
    # Technical preferences
    preferred_languages: List[str] = field(default_factory=lambda: ["python", "javascript"])
    preferred_tools: List[str] = field(default_factory=lambda: ["vscode", "terminal"])
    operating_system: str = "linux"
    development_environment: str = "vscode"
    
    # Metadata
    created_date: datetime = field(default_factory=datetime.now)
    last_updated: datetime = field(default_factory=datetime.now)
    active: bool = True
    performance_history: List[Dict[str, Any]] = field(default_factory=list)
    
    def __post_init__(self):
        """Initialize derived properties after creation"""
        if isinstance(self.archetype, str):
            self.archetype = CreatorArchetype(self.archetype)
            
    def calculate_wpm(self) -> float:
        """Calculate words per minute based on persona characteristics"""
        base_wpm = 65  # Average typing speed
        
        # Adjust based on technical depth (more technical = slower)
        tech_factor = 1.0 - (self.personality_traits.technical_depth * 0.3)
        
        # Adjust based on explanation clarity (clearer = slightly slower)
        clarity_factor = 1.0 - (self.personality_traits.explanation_clarity * 0.1)
        
        # Adjust based on energy level
        energy_factor = 0.8 + (self.voice_profile.energy_level * 0.4)
        
        wpm = base_wpm * tech_factor * clarity_factor * energy_factor
        
        # Add some persona-specific variation
        variation = random.uniform(0.9, 1.1)
        
        return max(30, min(120, wpm * variation))
        
    def get_voice_profile_dict(self) -> Dict[str, Any]:
        """Get voice profile as dictionary for audio processing"""
        return {
            "speech_pace": self.voice_profile.speech_pace,
            "energy_level": self.voice_profile.energy_level,
            "pause_frequency": self.voice_profile.pause_frequency,
            "pitch_range": self.voice_profile.pitch_range,
            "filler_words": self.voice_profile.filler_words,
            "technical_vocabulary": self.voice_profile.technical_vocabulary
        }
        
    def get_next_upload_time(self, current_time: datetime = None) -> datetime:
        """Calculate next upload time based on upload pattern"""
        if current_time is None:
            current_time = datetime.now()
            
        # Get preferred day and time
        if self.upload_pattern.preferred_days:
            target_day = random.choice(self.upload_pattern.preferred_days)
        else:
            target_day = current_time.weekday()
            
        if self.upload_pattern.preferred_times:
            target_hour = random.choice(self.upload_pattern.preferred_times)
        else:
            target_hour = 14  # Default to 2 PM
            
        # Calculate next occurrence
        days_ahead = target_day - current_time.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
            
        next_upload = current_time + timedelta(days=days_ahead)
        next_upload = next_upload.replace(
            hour=target_hour,
            minute=random.randint(0, 59),
            second=random.randint(0, 59),
            microsecond=0
        )
        
        # Add consistency-based variation
        if self.upload_pattern.consistency_score < 1.0:
            variation_hours = (1.0 - self.upload_pattern.consistency_score) * 4
            variation = random.uniform(-variation_hours, variation_hours)
            next_upload += timedelta(hours=variation)
            
        return next_upload
        
    def update_authenticity_metrics(self, new_score: float, detection_resistance: float = None):
        """Update authenticity metrics with new performance data"""
        old_score = self.authenticity_metrics.current_score
        self.authenticity_metrics.current_score = new_score
        
        if detection_resistance is not None:
            self.authenticity_metrics.detection_resistance = detection_resistance
            
        # Calculate improvement velocity
        score_change = new_score - old_score
        self.authenticity_metrics.improvement_velocity = score_change
        
        # Update last updated timestamp
        self.authenticity_metrics.last_updated = datetime.now()
        self.last_updated = datetime.now()
        
        # Add to performance history
        self.performance_history.append({
            "timestamp": datetime.now().isoformat(),
            "authenticity_score": new_score,
            "detection_resistance": detection_resistance,
            "improvement": score_change
        })
        
        # Keep only last 100 entries
        if len(self.performance_history) > 100:
            self.performance_history = self.performance_history[-100:]
            
    def evolve(self) -> bool:
        """Evolve the persona based on evolution parameters"""
        evolved = False
        
        # Improve authenticity if below target
        if (self.authenticity_metrics.current_score < 
            self.evolution_parameters.authenticity_target):
            
            improvement = self.evolution_parameters.improvement_rate
            
            # Apply learning curve
            if self.evolution_parameters.learning_curve == "rapid":
                improvement *= 1.5
            elif self.evolution_parameters.learning_curve == "plateau":
                improvement *= 0.5
                
            new_score = min(
                self.evolution_parameters.authenticity_target,
                self.authenticity_metrics.current_score + improvement
            )
            
            if new_score > self.authenticity_metrics.current_score:
                self.update_authenticity_metrics(new_score)
                evolved = True
                
        # Evolve personality traits slightly
        if random.random() < self.evolution_parameters.adaptation_speed:
            # Small adjustments to traits
            traits = self.personality_traits
            
            if "presentation" in self.evolution_parameters.skill_development_areas:
                traits.explanation_clarity += random.uniform(-0.01, 0.02)
                traits.explanation_clarity = max(0.0, min(1.0, traits.explanation_clarity))
                evolved = True
                
            if "technical_depth" in self.evolution_parameters.skill_development_areas:
                traits.technical_depth += random.uniform(-0.005, 0.015)
                traits.technical_depth = max(0.0, min(1.0, traits.technical_depth))
                evolved = True
                
        return evolved
        
    def get_content_preferences(self) -> Dict[str, Any]:
        """Get content preferences for this persona"""
        return {
            "primary_content_type": self.content_style.primary_type.value,
            "average_duration": self.content_style.average_duration,
            "technical_depth": self.personality_traits.technical_depth,
            "interaction_level": self.content_style.interaction_level,
            "preferred_languages": self.preferred_languages,
            "explanation_style": {
                "clarity": self.personality_traits.explanation_clarity,
                "pace": self.voice_profile.speech_pace,
                "detail_level": self.content_style.code_explanation_depth
            }
        }
        
    def calculate_delay_probability(self, scheduled_time: datetime) -> float:
        """Calculate probability of upload delay based on persona characteristics"""
        base_delay_prob = 1.0 - self.upload_pattern.consistency_score
        
        # Adjust based on time of day
        hour = scheduled_time.hour
        if hour < 6 or hour > 22:  # Very early or very late
            base_delay_prob *= 1.5
        elif hour in [12, 13, 17, 18]:  # Lunch or end of workday
            base_delay_prob *= 1.2
            
        # Adjust based on day of week
        if scheduled_time.weekday() == 4:  # Friday
            base_delay_prob *= 1.3
        elif scheduled_time.weekday() in [5, 6]:  # Weekend
            if self.upload_pattern.weekend_preference == "avoid":
                base_delay_prob *= 0.7  # Less likely to delay if uploading on weekend
            else:
                base_delay_prob *= 1.1
                
        # Adjust based on perfectionism
        base_delay_prob += self.personality_traits.perfectionism * 0.1
        
        return max(0.0, min(1.0, base_delay_prob))
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert persona to dictionary for serialization"""
        data = {
            "id": self.id,
            "name": self.name,
            "archetype": self.archetype.value,
            "voice_profile": self.voice_profile.to_dict(),
            "content_style": self.content_style.to_dict(),
            "upload_pattern": self.upload_pattern.to_dict(),
            "personality_traits": self.personality_traits.to_dict(),
            "evolution_parameters": self.evolution_parameters.to_dict(),
            "authenticity_metrics": self.authenticity_metrics.to_dict(),
            "preferred_languages": self.preferred_languages,
            "preferred_tools": self.preferred_tools,
            "operating_system": self.operating_system,
            "development_environment": self.development_environment,
            "created_date": self.created_date.isoformat(),
            "last_updated": self.last_updated.isoformat(),
            "active": self.active,
            "performance_history": self.performance_history
        }
        return data
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CreatorPersona':
        """Create persona from dictionary"""
        # Handle datetime fields
        if 'created_date' in data and isinstance(data['created_date'], str):
            data['created_date'] = datetime.fromisoformat(data['created_date'])
        if 'last_updated' in data and isinstance(data['last_updated'], str):
            data['last_updated'] = datetime.fromisoformat(data['last_updated'])
            
        # Handle nested objects
        if 'voice_profile' in data:
            data['voice_profile'] = VoiceProfile.from_dict(data['voice_profile'])
        if 'content_style' in data:
            data['content_style'] = ContentStyle.from_dict(data['content_style'])
        if 'upload_pattern' in data:
            data['upload_pattern'] = UploadPattern.from_dict(data['upload_pattern'])
        if 'personality_traits' in data:
            data['personality_traits'] = PersonalityTraits.from_dict(data['personality_traits'])
        if 'evolution_parameters' in data:
            data['evolution_parameters'] = EvolutionParameters.from_dict(data['evolution_parameters'])
        if 'authenticity_metrics' in data:
            data['authenticity_metrics'] = AuthenticityMetrics.from_dict(data['authenticity_metrics'])
            
        return cls(**data)
        
    @classmethod
    def generate_random(cls, archetype: CreatorArchetype = None) -> 'CreatorPersona':
        """Generate a random creator persona with realistic characteristics"""
        
        if archetype is None:
            archetype = random.choice(list(CreatorArchetype))
            
        # Generate characteristics based on archetype
        persona_id = str(uuid.uuid4())[:8]
        name = f"Creator_{persona_id}"
        
        # Voice profile based on archetype
        voice_profile = VoiceProfile(
            pitch_range=random.uniform(0.8, 1.3),
            speech_pace=random.uniform(0.7, 1.4),
            energy_level=random.uniform(0.3, 0.95),
            pause_frequency=random.uniform(0.5, 2.0),
            filler_words=random.choice([
                ["um", "uh"],
                ["so", "like"],
                ["you know", "right"],
                ["um", "uh", "so"]
            ]),
            technical_vocabulary=random.uniform(0.5, 0.95)
        )
        
        # Content style
        content_style = ContentStyle(
            primary_type=random.choice(list(ContentType)),
            average_duration=random.uniform(300, 2400),
            introduction_style=random.choice(["casual", "formal", "quick", "detailed"]),
            conclusion_style=random.choice(["summary", "call_to_action", "casual", "abrupt"]),
            interaction_level=random.uniform(0.2, 0.9),
            code_explanation_depth=random.uniform(0.4, 0.95),
            visual_aids_usage=random.uniform(0.3, 0.9)
        )
        
        # Upload pattern
        upload_pattern = UploadPattern(
            frequency=random.choice(list(UploadFrequency)),
            preferred_days=random.sample(range(7), random.randint(1, 4)),
            preferred_times=random.sample(range(6, 23), random.randint(1, 3)),
            consistency_score=random.uniform(0.6, 0.98)
        )
        
        # Personality traits
        personality_traits = PersonalityTraits(
            technical_depth=random.uniform(0.3, 0.95),
            explanation_clarity=random.uniform(0.5, 0.95),
            energy_consistency=random.uniform(0.4, 0.9),
            mistake_tolerance=random.uniform(0.01, 0.08),
            perfectionism=random.uniform(0.2, 0.9),
            adaptability=random.uniform(0.3, 0.9),
            creativity=random.uniform(0.3, 0.9),
            patience=random.uniform(0.4, 0.95)
        )
        
        # Evolution parameters
        evolution_parameters = EvolutionParameters(
            improvement_rate=random.uniform(0.001, 0.01),
            adaptation_speed=random.uniform(0.1, 0.5),
            authenticity_target=random.uniform(0.90, 0.98),
            current_authenticity=random.uniform(0.75, 0.90)
        )
        
        # Authenticity metrics
        authenticity_metrics = AuthenticityMetrics(
            current_score=evolution_parameters.current_authenticity,
            target_score=evolution_parameters.authenticity_target,
            detection_resistance=random.uniform(0.80, 0.95),
            behavioral_patterns_active=random.randint(15, 25)
        )
        
        return cls(
            id=persona_id,
            name=name,
            archetype=archetype,
            voice_profile=voice_profile,
            content_style=content_style,
            upload_pattern=upload_pattern,
            personality_traits=personality_traits,
            evolution_parameters=evolution_parameters,
            authenticity_metrics=authenticity_metrics,
            preferred_languages=random.sample(
                ["python", "javascript", "typescript", "rust", "go", "java", "c++"],
                random.randint(1, 3)
            ),
            preferred_tools=random.sample(
                ["vscode", "vim", "terminal", "git", "docker", "kubernetes"],
                random.randint(2, 4)
            )
        )
        
    def __str__(self) -> str:
        return f"CreatorPersona(id={self.id}, archetype={self.archetype.value}, authenticity={self.authenticity_metrics.current_score:.2f})"
        
    def __repr__(self) -> str:
        return self.__str__()

class PersonaManager:
    """Manager for creator personas with batch operations"""
    
    def __init__(self):
        self.personas: Dict[str, CreatorPersona] = {}
        
    def add_persona(self, persona: CreatorPersona) -> str:
        """Add a persona to the manager"""
        self.personas[persona.id] = persona
        return persona.id
        
    def get_persona(self, persona_id: str) -> Optional[CreatorPersona]:
        """Get a persona by ID"""
        return self.personas.get(persona_id)
        
    def remove_persona(self, persona_id: str) -> bool:
        """Remove a persona by ID"""
        if persona_id in self.personas:
            del self.personas[persona_id]
            return True
        return False
        
    def generate_personas(self, count: int) -> List[str]:
        """Generate multiple random personas"""
        persona_ids = []
        
        for _ in range(count):
            persona = CreatorPersona.generate_random()
            persona_id = self.add_persona(persona)
            persona_ids.append(persona_id)
            
        return persona_ids
        
    def evolve_all_personas(self) -> int:
        """Evolve all personas and return count of evolved personas"""
        evolved_count = 0
        
        for persona in self.personas.values():
            if persona.evolve():
                evolved_count += 1
                
        return evolved_count
        
    def get_personas_by_archetype(self, archetype: CreatorArchetype) -> List[CreatorPersona]:
        """Get all personas of a specific archetype"""
        return [p for p in self.personas.values() if p.archetype == archetype]
        
    def get_top_performers(self, limit: int = 10) -> List[CreatorPersona]:
        """Get top performing personas by authenticity score"""
        sorted_personas = sorted(
            self.personas.values(),
            key=lambda p: p.authenticity_metrics.current_score,
            reverse=True
        )
        return sorted_personas[:limit]
        
    def get_personas_needing_improvement(self, threshold: float = 0.90) -> List[CreatorPersona]:
        """Get personas with authenticity scores below threshold"""
        return [
            p for p in self.personas.values()
            if p.authenticity_metrics.current_score < threshold
        ]
        
    def save_to_file(self, filepath: str) -> bool:
        """Save all personas to a JSON file"""
        try:
            data = [persona.to_dict() for persona in self.personas.values()]
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving personas: {e}")
            return False
            
    def load_from_file(self, filepath: str) -> bool:
        """Load personas from a JSON file"""
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
                
            for persona_data in data:
                persona = CreatorPersona.from_dict(persona_data)
                self.add_persona(persona)
                
            return True
        except Exception as e:
            print(f"Error loading personas: {e}")
            return False
            
    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about managed personas"""
        if not self.personas:
            return {"total_personas": 0}
            
        authenticity_scores = [p.authenticity_metrics.current_score for p in self.personas.values()]
        archetype_counts = {}
        
        for persona in self.personas.values():
            archetype = persona.archetype.value
            archetype_counts[archetype] = archetype_counts.get(archetype, 0) + 1
            
        return {
            "total_personas": len(self.personas),
            "average_authenticity": sum(authenticity_scores) / len(authenticity_scores),
            "min_authenticity": min(authenticity_scores),
            "max_authenticity": max(authenticity_scores),
            "archetype_distribution": archetype_counts,
            "active_personas": sum(1 for p in self.personas.values() if p.active),
            "personas_above_90_percent": sum(1 for score in authenticity_scores if score >= 0.90),
            "personas_above_95_percent": sum(1 for score in authenticity_scores if score >= 0.95)
        }
