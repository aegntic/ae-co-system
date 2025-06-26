"""Platform Compliance and Anti-Detection Service

Provides comprehensive platform compliance validation and anti-detection
systems for YouTube automation at scale.
"""

import asyncio
import hashlib
import json
import random
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import logging
import numpy as np
from urllib.parse import urlparse

from ..core.aegnt27_integration import Aegnt27Engine
from ..models.creator_models import CreatorPersona

logger = logging.getLogger(__name__)

class ComplianceLevel(Enum):
    """Compliance risk levels"""
    SAFE = "safe"              # Very low risk
    LOW_RISK = "low_risk"      # Minor concerns
    MEDIUM_RISK = "medium_risk"  # Moderate concerns
    HIGH_RISK = "high_risk"    # Significant concerns
    CRITICAL = "critical"      # Immediate action required

class DetectionRisk(Enum):
    """AI/Platform detection risk levels"""
    UNDETECTABLE = "undetectable"  # 98%+ authenticity
    LOW = "low"                    # 95-98% authenticity
    MODERATE = "moderate"          # 90-95% authenticity
    HIGH = "high"                  # 80-90% authenticity
    VERY_HIGH = "very_high"        # <80% authenticity

class PlatformRule(Enum):
    """Platform-specific rules and guidelines"""
    SPAM_PREVENTION = "spam_prevention"
    CONTENT_POLICY = "content_policy"
    UPLOAD_FREQUENCY = "upload_frequency"
    METADATA_GUIDELINES = "metadata_guidelines"
    THUMBNAIL_POLICY = "thumbnail_policy"
    COMMUNITY_GUIDELINES = "community_guidelines"
    COPYRIGHT_POLICY = "copyright_policy"
    MONETIZATION_POLICY = "monetization_policy"

@dataclass
class ComplianceCheck:
    """Result of a compliance check"""
    rule: PlatformRule
    compliance_level: ComplianceLevel
    score: float  # 0.0-1.0
    details: str
    recommendations: List[str] = field(default_factory=list)
    automated_fixes: List[str] = field(default_factory=list)
    
@dataclass
class DetectionAnalysis:
    """AI detection analysis result"""
    detection_risk: DetectionRisk
    confidence: float  # 0.0-1.0
    detected_patterns: List[str] = field(default_factory=list)
    authenticity_score: float = 0.0
    recommendations: List[str] = field(default_factory=list)
    
@dataclass
class PlatformValidationResult:
    """Complete platform validation result"""
    overall_compliance: ComplianceLevel
    overall_detection_risk: DetectionRisk
    compliance_score: float
    authenticity_score: float
    compliance_checks: List[ComplianceCheck] = field(default_factory=list)
    detection_analysis: Optional[DetectionAnalysis] = None
    metadata_validation: Dict[str, Any] = field(default_factory=dict)
    content_validation: Dict[str, Any] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)
    
class PlatformComplianceService:
    """Service for platform compliance and anti-detection validation"""
    
    def __init__(self, aegnt27_engine: Optional[Aegnt27Engine] = None):
        self.aegnt27_engine = aegnt27_engine
        self.compliance_rules = self._initialize_compliance_rules()
        self.detection_patterns = self._initialize_detection_patterns()
        self.platform_limits = self._initialize_platform_limits()
        self.validation_cache = {}
        
    def _initialize_compliance_rules(self) -> Dict[PlatformRule, Dict[str, Any]]:
        """Initialize platform compliance rules"""
        return {
            PlatformRule.SPAM_PREVENTION: {
                "max_uploads_per_hour": 5,
                "max_uploads_per_day": 50,
                "min_interval_minutes": 10,
                "duplicate_content_threshold": 0.85,
                "repetitive_metadata_threshold": 0.8
            },
            PlatformRule.CONTENT_POLICY: {
                "min_video_length": 60,  # seconds
                "max_video_length": 43200,  # 12 hours
                "prohibited_keywords": [
                    "spam", "fake", "bot", "automated", "generated", "artificial"
                ],
                "required_human_elements": True
            },
            PlatformRule.UPLOAD_FREQUENCY: {
                "max_burst_uploads": 10,
                "burst_window_hours": 4,
                "consistent_timing_variance": 0.3,  # 30% variance allowed
                "weekend_upload_limit_multiplier": 0.7
            },
            PlatformRule.METADATA_GUIDELINES: {
                "title_max_length": 100,
                "description_max_length": 5000,
                "tags_max_count": 30,
                "min_description_length": 50,
                "keyword_stuffing_threshold": 0.15  # Max 15% keyword density
            },
            PlatformRule.THUMBNAIL_POLICY: {
                "min_resolution": (1280, 720),
                "max_file_size_mb": 2,
                "allowed_formats": ["jpg", "jpeg", "png", "gif", "bmp"],
                "prohibited_elements": ["clickbait_excessive", "misleading", "low_quality"]
            }
        }
        
    def _initialize_detection_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Initialize AI detection patterns to avoid"""
        return {
            "content_patterns": {
                "repetitive_structures": {
                    "threshold": 0.8,
                    "indicators": ["identical_intros", "same_conclusions", "template_following"]
                },
                "unnatural_language": {
                    "threshold": 0.7,
                    "indicators": ["perfect_grammar", "robotic_tone", "lack_of_fillers"]
                },
                "metadata_patterns": {
                    "threshold": 0.75,
                    "indicators": ["sequential_titles", "template_descriptions", "identical_tags"]
                }
            },
            "behavioral_patterns": {
                "upload_timing": {
                    "threshold": 0.9,
                    "indicators": ["perfect_consistency", "non_human_hours", "automated_intervals"]
                },
                "engagement_patterns": {
                    "threshold": 0.85,
                    "indicators": ["unrealistic_retention", "perfect_curves", "artificial_interactions"]
                }
            },
            "technical_patterns": {
                "video_processing": {
                    "threshold": 0.8,
                    "indicators": ["identical_encoding", "batch_artifacts", "automation_signatures"]
                },
                "audio_processing": {
                    "threshold": 0.75,
                    "indicators": ["synthetic_voice", "unnatural_pauses", "robotic_intonation"]
                }
            }
        }
        
    def _initialize_platform_limits(self) -> Dict[str, Any]:
        """Initialize platform-specific limits and quotas"""
        return {
            "youtube": {
                "api_quota_daily": 10000,
                "upload_quota_daily": 100,
                "channels_per_account": 50,
                "max_concurrent_uploads": 6,
                "content_id_scan_time": 300,  # seconds
                "processing_delay_range": (30, 180)  # seconds
            },
            "automation_detection": {
                "pattern_analysis_window": 30,  # days
                "suspicion_threshold": 0.8,
                "confidence_requirement": 0.95,
                "false_positive_tolerance": 0.05
            }
        }
        
    async def validate_content_compliance(self, 
                                        content_data: Dict[str, Any],
                                        creator_persona: CreatorPersona) -> PlatformValidationResult:
        """Comprehensive content compliance validation"""
        
        logger.info(f"Validating content compliance for {content_data.get('title', 'Unknown')}")
        
        compliance_checks = []
        
        # Run individual compliance checks
        checks = await asyncio.gather(
            self._check_spam_prevention(content_data, creator_persona),
            self._check_content_policy(content_data, creator_persona),
            self._check_metadata_guidelines(content_data),
            self._check_upload_frequency(content_data, creator_persona),
            return_exceptions=True
        )
        
        for check in checks:
            if isinstance(check, ComplianceCheck):
                compliance_checks.append(check)
            elif isinstance(check, Exception):
                logger.error(f"Compliance check failed: {check}")
                
        # Run AI detection analysis
        detection_analysis = await self._analyze_ai_detection_risk(content_data, creator_persona)
        
        # Calculate overall scores
        compliance_score = self._calculate_overall_compliance_score(compliance_checks)
        overall_compliance = self._determine_compliance_level(compliance_score)
        
        # Generate recommendations
        recommendations = self._generate_compliance_recommendations(compliance_checks, detection_analysis)
        
        return PlatformValidationResult(
            overall_compliance=overall_compliance,
            overall_detection_risk=detection_analysis.detection_risk,
            compliance_score=compliance_score,
            authenticity_score=detection_analysis.authenticity_score,
            compliance_checks=compliance_checks,
            detection_analysis=detection_analysis,
            recommendations=recommendations
        )
        
    async def _check_spam_prevention(self, 
                                   content_data: Dict[str, Any], 
                                   creator_persona: CreatorPersona) -> ComplianceCheck:
        """Check spam prevention compliance"""
        
        rules = self.compliance_rules[PlatformRule.SPAM_PREVENTION]
        score = 1.0
        details = []
        recommendations = []
        
        # Check for duplicate content indicators
        title = content_data.get("title", "")
        description = content_data.get("description", "")
        
        # Simulate duplicate content check (would use actual content analysis)
        content_hash = hashlib.md5(f"{title}{description}".encode()).hexdigest()
        duplicate_probability = random.uniform(0.0, 0.3)  # Simulated
        
        if duplicate_probability > rules["duplicate_content_threshold"]:
            score -= 0.4
            details.append(f"High duplicate content probability: {duplicate_probability:.2f}")
            recommendations.append("Add more unique elements to content")
            
        # Check metadata repetition
        metadata_repetition = self._analyze_metadata_repetition(content_data)
        if metadata_repetition > rules["repetitive_metadata_threshold"]:
            score -= 0.3
            details.append(f"Repetitive metadata detected: {metadata_repetition:.2f}")
            recommendations.append("Vary metadata patterns across uploads")
            
        # Check upload frequency compliance (simplified)
        upload_frequency_score = self._check_upload_frequency_compliance(creator_persona)
        score = min(score, upload_frequency_score)
        
        if upload_frequency_score < 0.8:
            details.append("Upload frequency may trigger spam detection")
            recommendations.append("Adjust upload schedule for more natural patterns")
            
        compliance_level = self._score_to_compliance_level(score)
        
        return ComplianceCheck(
            rule=PlatformRule.SPAM_PREVENTION,
            compliance_level=compliance_level,
            score=score,
            details="; ".join(details) if details else "Spam prevention checks passed",
            recommendations=recommendations
        )
        
    async def _check_content_policy(self, 
                                  content_data: Dict[str, Any], 
                                  creator_persona: CreatorPersona) -> ComplianceCheck:
        """Check content policy compliance"""
        
        rules = self.compliance_rules[PlatformRule.CONTENT_POLICY]
        score = 1.0
        details = []
        recommendations = []
        
        # Check video length
        duration = content_data.get("duration", 0)
        if duration < rules["min_video_length"]:
            score -= 0.3
            details.append(f"Video too short: {duration}s (min: {rules['min_video_length']}s)")
            recommendations.append("Increase video length to meet minimum requirements")
        elif duration > rules["max_video_length"]:
            score -= 0.2
            details.append(f"Video very long: {duration}s (max recommended: {rules['max_video_length']}s)")
            
        # Check for prohibited keywords
        text_content = f"{content_data.get('title', '')} {content_data.get('description', '')}".lower()
        prohibited_found = []
        
        for keyword in rules["prohibited_keywords"]:
            if keyword in text_content:
                prohibited_found.append(keyword)
                
        if prohibited_found:
            score -= 0.5
            details.append(f"Prohibited keywords found: {', '.join(prohibited_found)}")
            recommendations.append("Remove or replace prohibited keywords")
            
        # Check for human elements requirement
        if rules["required_human_elements"]:
            human_score = await self._assess_human_elements(content_data, creator_persona)
            if human_score < 0.8:
                score -= 0.4
                details.append(f"Insufficient human elements detected: {human_score:.2f}")
                recommendations.append("Add more natural human elements to content")
                
        compliance_level = self._score_to_compliance_level(score)
        
        return ComplianceCheck(
            rule=PlatformRule.CONTENT_POLICY,
            compliance_level=compliance_level,
            score=score,
            details="; ".join(details) if details else "Content policy checks passed",
            recommendations=recommendations
        )
        
    async def _check_metadata_guidelines(self, content_data: Dict[str, Any]) -> ComplianceCheck:
        """Check metadata guidelines compliance"""
        
        rules = self.compliance_rules[PlatformRule.METADATA_GUIDELINES]
        score = 1.0
        details = []
        recommendations = []
        
        # Check title length
        title = content_data.get("title", "")
        if len(title) > rules["title_max_length"]:
            score -= 0.2
            details.append(f"Title too long: {len(title)} chars (max: {rules['title_max_length']})")
            recommendations.append("Shorten title to meet length requirements")
            
        # Check description length
        description = content_data.get("description", "")
        if len(description) > rules["description_max_length"]:
            score -= 0.1
            details.append(f"Description too long: {len(description)} chars")
        elif len(description) < rules["min_description_length"]:
            score -= 0.3
            details.append(f"Description too short: {len(description)} chars (min: {rules['min_description_length']})")
            recommendations.append("Add more detailed description")
            
        # Check tags count
        tags = content_data.get("tags", [])
        if len(tags) > rules["tags_max_count"]:
            score -= 0.2
            details.append(f"Too many tags: {len(tags)} (max: {rules['tags_max_count']})")
            recommendations.append("Reduce number of tags")
            
        # Check keyword stuffing
        keyword_density = self._calculate_keyword_density(title, description, tags)
        if keyword_density > rules["keyword_stuffing_threshold"]:
            score -= 0.4
            details.append(f"Keyword stuffing detected: {keyword_density:.2f}")
            recommendations.append("Reduce keyword density in metadata")
            
        compliance_level = self._score_to_compliance_level(score)
        
        return ComplianceCheck(
            rule=PlatformRule.METADATA_GUIDELINES,
            compliance_level=compliance_level,
            score=score,
            details="; ".join(details) if details else "Metadata guidelines checks passed",
            recommendations=recommendations
        )
        
    async def _check_upload_frequency(self, 
                                     content_data: Dict[str, Any], 
                                     creator_persona: CreatorPersona) -> ComplianceCheck:
        """Check upload frequency compliance"""
        
        rules = self.compliance_rules[PlatformRule.UPLOAD_FREQUENCY]
        score = 1.0
        details = []
        recommendations = []
        
        # Simulate upload history analysis
        upload_history = self._get_simulated_upload_history(creator_persona)
        
        # Check burst uploads
        recent_uploads = [u for u in upload_history if u > datetime.now() - timedelta(hours=rules["burst_window_hours"])]
        if len(recent_uploads) > rules["max_burst_uploads"]:
            score -= 0.5
            details.append(f"Too many recent uploads: {len(recent_uploads)} in {rules['burst_window_hours']}h")
            recommendations.append("Space out uploads more evenly")
            
        # Check timing consistency
        timing_variance = self._calculate_timing_variance(upload_history)
        if timing_variance > rules["consistent_timing_variance"]:
            score -= 0.2
            details.append(f"High timing variance: {timing_variance:.2f}")
        elif timing_variance < 0.1:  # Too consistent can also be suspicious
            score -= 0.1
            details.append(f"Timing too consistent: {timing_variance:.2f}")
            recommendations.append("Add more natural variation to upload timing")
            
        compliance_level = self._score_to_compliance_level(score)
        
        return ComplianceCheck(
            rule=PlatformRule.UPLOAD_FREQUENCY,
            compliance_level=compliance_level,
            score=score,
            details="; ".join(details) if details else "Upload frequency checks passed",
            recommendations=recommendations
        )
        
    async def _analyze_ai_detection_risk(self, 
                                        content_data: Dict[str, Any], 
                                        creator_persona: CreatorPersona) -> DetectionAnalysis:
        """Analyze AI detection risk using aegnt-27"""
        
        detected_patterns = []
        authenticity_score = 0.85  # Default fallback
        
        # Use aegnt-27 for comprehensive detection analysis
        if self.aegnt27_engine:
            try:
                # Validate content authenticity
                content_text = f"{content_data.get('title', '')} {content_data.get('description', '')}"
                validation_result = await self.aegnt27_engine.validate_authenticity(
                    content=content_text,
                    target_models=["gpt_zero", "originality_ai", "youtube"],
                    authenticity_level="advanced"
                )
                
                authenticity_score = validation_result.get("authenticity_score", 0.85)
                
                # Check individual model scores
                model_scores = validation_result.get("model_scores", {})
                for model, score in model_scores.items():
                    if score < 0.90:
                        detected_patterns.append(f"Low {model} score: {score:.2f}")
                        
            except Exception as e:
                logger.warning(f"aegnt-27 detection analysis failed: {e}")
                
        # Additional pattern analysis
        content_patterns = self._analyze_content_patterns(content_data)
        behavioral_patterns = self._analyze_behavioral_patterns(creator_persona)
        technical_patterns = self._analyze_technical_patterns(content_data)
        
        detected_patterns.extend(content_patterns)
        detected_patterns.extend(behavioral_patterns)
        detected_patterns.extend(technical_patterns)
        
        # Determine detection risk level
        detection_risk = self._calculate_detection_risk(authenticity_score, detected_patterns)
        
        # Generate recommendations
        recommendations = self._generate_detection_recommendations(detected_patterns, authenticity_score)
        
        return DetectionAnalysis(
            detection_risk=detection_risk,
            confidence=min(0.95, authenticity_score + 0.1),
            detected_patterns=detected_patterns,
            authenticity_score=authenticity_score,
            recommendations=recommendations
        )
        
    def _analyze_metadata_repetition(self, content_data: Dict[str, Any]) -> float:
        """Analyze metadata for repetitive patterns"""
        
        # Simplified analysis - would be more sophisticated in production
        title = content_data.get("title", "")
        description = content_data.get("description", "")
        
        # Check for template-like structures
        template_indicators = [
            r"Tutorial \d+:", r"Part \d+ -", r"Episode \d+:",
            r"\[.*\]", r"How to .* in \d+ minutes"
        ]
        
        repetition_score = 0.0
        for pattern in template_indicators:
            if re.search(pattern, title):
                repetition_score += 0.2
                
        # Check description patterns
        if "subscribe" in description.lower() and "like" in description.lower():
            repetition_score += 0.1
            
        return min(1.0, repetition_score)
        
    def _check_upload_frequency_compliance(self, creator_persona: CreatorPersona) -> float:
        """Check upload frequency for compliance"""
        
        # Use persona's upload pattern to assess compliance
        consistency = creator_persona.upload_pattern.consistency_score
        
        # High consistency might be suspicious
        if consistency > 0.95:
            return 0.7
        elif consistency > 0.90:
            return 0.8
        elif consistency < 0.5:
            return 0.6  # Too inconsistent is also problematic
        else:
            return 0.9
            
    async def _assess_human_elements(self, 
                                   content_data: Dict[str, Any], 
                                   creator_persona: CreatorPersona) -> float:
        """Assess presence of human elements in content"""
        
        human_score = 0.5  # Base score
        
        # Check for natural language elements
        text_content = f"{content_data.get('title', '')} {content_data.get('description', '')}"
        
        # Look for human language patterns
        human_indicators = [
            r"\b(um|uh|so|like|you know)\b",  # Filler words
            r"\b(guys|folks|everyone)\b",      # Casual address
            r"[.!?]{2,}",                      # Emotional punctuation
            r"\b(really|pretty|quite)\b",     # Intensifiers
        ]
        
        for pattern in human_indicators:
            if re.search(pattern, text_content, re.IGNORECASE):
                human_score += 0.1
                
        # Factor in persona characteristics
        human_score += creator_persona.personality_traits.mistake_tolerance * 0.3
        human_score += (1.0 - creator_persona.personality_traits.perfectionism) * 0.2
        
        return min(1.0, human_score)
        
    def _calculate_keyword_density(self, 
                                 title: str, 
                                 description: str, 
                                 tags: List[str]) -> float:
        """Calculate keyword density in metadata"""
        
        all_text = f"{title} {description} {' '.join(tags)}".lower()
        words = re.findall(r'\b\w+\b', all_text)
        
        if not words:
            return 0.0
            
        # Count word frequencies
        word_counts = {}
        for word in words:
            word_counts[word] = word_counts.get(word, 0) + 1
            
        # Find most frequent word
        max_count = max(word_counts.values())
        
        return max_count / len(words)
        
    def _get_simulated_upload_history(self, creator_persona: CreatorPersona) -> List[datetime]:
        """Get simulated upload history for analysis"""
        
        # Generate simulated upload history based on persona
        history = []
        current_time = datetime.now()
        
        # Generate last 30 days of uploads
        for i in range(30):
            day = current_time - timedelta(days=i)
            
            # Probability of upload based on persona pattern
            if random.random() < 0.3:  # 30% chance per day
                # Add some time variation
                upload_time = day + timedelta(
                    hours=random.choice(creator_persona.upload_pattern.preferred_times),
                    minutes=random.randint(0, 59)
                )
                history.append(upload_time)
                
        return sorted(history)
        
    def _calculate_timing_variance(self, upload_history: List[datetime]) -> float:
        """Calculate variance in upload timing"""
        
        if len(upload_history) < 3:
            return 0.5
            
        # Calculate intervals between uploads
        intervals = []
        for i in range(1, len(upload_history)):
            interval = (upload_history[i] - upload_history[i-1]).total_seconds() / 3600
            intervals.append(interval)
            
        if not intervals:
            return 0.5
            
        # Calculate coefficient of variation
        mean_interval = np.mean(intervals)
        std_interval = np.std(intervals)
        
        if mean_interval == 0:
            return 0.0
            
        return std_interval / mean_interval
        
    def _analyze_content_patterns(self, content_data: Dict[str, Any]) -> List[str]:
        """Analyze content for AI-generated patterns"""
        
        patterns = []
        
        # Check title patterns
        title = content_data.get("title", "")
        if re.search(r"\b(learn|master|complete guide|tutorial)\b", title, re.IGNORECASE):
            if len(re.findall(r"\b(learn|master|complete|tutorial)\b", title, re.IGNORECASE)) > 2:
                patterns.append("Keyword-heavy title pattern")
                
        # Check description patterns
        description = content_data.get("description", "")
        if len(description) > 500 and description.count('\n') < 3:
            patterns.append("Wall-of-text description pattern")
            
        return patterns
        
    def _analyze_behavioral_patterns(self, creator_persona: CreatorPersona) -> List[str]:
        """Analyze behavioral patterns for automation indicators"""
        
        patterns = []
        
        # Check consistency scores
        if creator_persona.upload_pattern.consistency_score > 0.95:
            patterns.append("Extremely consistent upload timing")
            
        if creator_persona.authenticity_metrics.current_score < 0.85:
            patterns.append("Low overall authenticity score")
            
        return patterns
        
    def _analyze_technical_patterns(self, content_data: Dict[str, Any]) -> List[str]:
        """Analyze technical patterns for automation indicators"""
        
        patterns = []
        
        # Check for batch processing indicators
        if content_data.get("processing_time", 0) < 60:  # Very fast processing
            patterns.append("Unusually fast processing time")
            
        # Check metadata timestamps
        if "metadata" in content_data:
            metadata = content_data["metadata"]
            if metadata.get("created") == metadata.get("modified"):
                patterns.append("Identical creation and modification times")
                
        return patterns
        
    def _calculate_detection_risk(self, 
                                authenticity_score: float, 
                                detected_patterns: List[str]) -> DetectionRisk:
        """Calculate overall detection risk level"""
        
        if authenticity_score >= 0.98 and len(detected_patterns) == 0:
            return DetectionRisk.UNDETECTABLE
        elif authenticity_score >= 0.95 and len(detected_patterns) <= 1:
            return DetectionRisk.LOW
        elif authenticity_score >= 0.90 and len(detected_patterns) <= 3:
            return DetectionRisk.MODERATE
        elif authenticity_score >= 0.80:
            return DetectionRisk.HIGH
        else:
            return DetectionRisk.VERY_HIGH
            
    def _generate_detection_recommendations(self, 
                                          detected_patterns: List[str], 
                                          authenticity_score: float) -> List[str]:
        """Generate recommendations to improve detection resistance"""
        
        recommendations = []
        
        if authenticity_score < 0.90:
            recommendations.append("Improve content authenticity using aegnt-27 enhancements")
            
        if "timing" in str(detected_patterns).lower():
            recommendations.append("Add more natural variation to upload timing")
            
        if "template" in str(detected_patterns).lower():
            recommendations.append("Vary content structure and metadata patterns")
            
        if len(detected_patterns) > 3:
            recommendations.append("Reduce automation indicators in content generation")
            
        if not recommendations:
            recommendations.append("Continue current authenticity practices")
            
        return recommendations
        
    def _calculate_overall_compliance_score(self, compliance_checks: List[ComplianceCheck]) -> float:
        """Calculate overall compliance score"""
        
        if not compliance_checks:
            return 0.5
            
        # Weight different rules
        weights = {
            PlatformRule.SPAM_PREVENTION: 0.3,
            PlatformRule.CONTENT_POLICY: 0.25,
            PlatformRule.UPLOAD_FREQUENCY: 0.2,
            PlatformRule.METADATA_GUIDELINES: 0.15,
            PlatformRule.THUMBNAIL_POLICY: 0.1
        }
        
        weighted_score = 0.0
        total_weight = 0.0
        
        for check in compliance_checks:
            weight = weights.get(check.rule, 0.1)
            weighted_score += check.score * weight
            total_weight += weight
            
        return weighted_score / total_weight if total_weight > 0 else 0.5
        
    def _determine_compliance_level(self, score: float) -> ComplianceLevel:
        """Determine compliance level from score"""
        
        if score >= 0.95:
            return ComplianceLevel.SAFE
        elif score >= 0.85:
            return ComplianceLevel.LOW_RISK
        elif score >= 0.70:
            return ComplianceLevel.MEDIUM_RISK
        elif score >= 0.50:
            return ComplianceLevel.HIGH_RISK
        else:
            return ComplianceLevel.CRITICAL
            
    def _score_to_compliance_level(self, score: float) -> ComplianceLevel:
        """Convert score to compliance level"""
        return self._determine_compliance_level(score)
        
    def _generate_compliance_recommendations(self, 
                                           compliance_checks: List[ComplianceCheck], 
                                           detection_analysis: DetectionAnalysis) -> List[str]:
        """Generate comprehensive compliance recommendations"""
        
        recommendations = []
        
        # Collect recommendations from compliance checks
        for check in compliance_checks:
            recommendations.extend(check.recommendations)
            
        # Add detection analysis recommendations
        recommendations.extend(detection_analysis.recommendations)
        
        # Add general recommendations based on overall status
        high_risk_checks = [c for c in compliance_checks if c.compliance_level in [ComplianceLevel.HIGH_RISK, ComplianceLevel.CRITICAL]]
        
        if high_risk_checks:
            recommendations.append("Immediate action required on high-risk compliance issues")
            
        if detection_analysis.detection_risk in [DetectionRisk.HIGH, DetectionRisk.VERY_HIGH]:
            recommendations.append("Implement stronger anti-detection measures")
            
        # Remove duplicates while preserving order
        seen = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec not in seen:
                seen.add(rec)
                unique_recommendations.append(rec)
                
        return unique_recommendations
        
    async def batch_validate_compliance(self, 
                                      content_batch: List[Dict[str, Any]],
                                      creator_personas: List[CreatorPersona]) -> List[PlatformValidationResult]:
        """Batch validate compliance for multiple content items"""
        
        logger.info(f"Batch validating compliance for {len(content_batch)} items")
        
        tasks = []
        for i, content_data in enumerate(content_batch):
            persona = creator_personas[i % len(creator_personas)]  # Cycle through personas
            task = self.validate_content_compliance(content_data, persona)
            tasks.append(task)
            
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        valid_results = [r for r in results if isinstance(r, PlatformValidationResult)]
        
        return valid_results
        
    def get_compliance_statistics(self, 
                                results: List[PlatformValidationResult]) -> Dict[str, Any]:
        """Get comprehensive compliance statistics"""
        
        if not results:
            return {"error": "No results provided"}
            
        stats = {
            "total_validations": len(results),
            "average_compliance_score": np.mean([r.compliance_score for r in results]),
            "average_authenticity_score": np.mean([r.authenticity_score for r in results]),
            "compliance_distribution": {},
            "detection_risk_distribution": {},
            "common_issues": {},
            "recommendations_frequency": {}
        }
        
        # Analyze compliance distribution
        for result in results:
            level = result.overall_compliance.value
            stats["compliance_distribution"][level] = stats["compliance_distribution"].get(level, 0) + 1
            
            risk = result.overall_detection_risk.value
            stats["detection_risk_distribution"][risk] = stats["detection_risk_distribution"].get(risk, 0) + 1
            
        # Analyze common issues
        all_checks = []
        for result in results:
            all_checks.extend(result.compliance_checks)
            
        for check in all_checks:
            rule = check.rule.value
            if check.compliance_level in [ComplianceLevel.HIGH_RISK, ComplianceLevel.CRITICAL]:
                stats["common_issues"][rule] = stats["common_issues"].get(rule, 0) + 1
                
        # Analyze recommendation frequency
        all_recommendations = []
        for result in results:
            all_recommendations.extend(result.recommendations)
            
        for rec in all_recommendations:
            stats["recommendations_frequency"][rec] = stats["recommendations_frequency"].get(rec, 0) + 1
            
        return stats
        
    async def optimize_for_scale(self, target_videos_per_day: int = 1000) -> Dict[str, Any]:
        """Optimize compliance validation for high-scale processing"""
        
        optimization_results = {
            "target_scale": target_videos_per_day,
            "optimizations": [],
            "performance_estimates": {},
            "resource_requirements": {}
        }
        
        # Batch processing optimization
        if target_videos_per_day > 100:
            optimization_results["optimizations"].append("batch_compliance_validation")
            
        # Caching optimization
        if target_videos_per_day > 500:
            optimization_results["optimizations"].append("compliance_rule_caching")
            optimization_results["optimizations"].append("detection_pattern_caching")
            
        # Parallel processing
        if target_videos_per_day > 1000:
            optimization_results["optimizations"].append("parallel_validation_workers")
            optimization_results["optimizations"].append("distributed_compliance_checking")
            
        # Performance estimates
        validation_time_per_video = 2.0  # seconds
        total_validation_time = target_videos_per_day * validation_time_per_video
        
        optimization_results["performance_estimates"] = {
            "validation_time_per_video_seconds": validation_time_per_video,
            "total_daily_validation_time_hours": total_validation_time / 3600,
            "required_parallel_workers": max(4, int(total_validation_time / (24 * 3600) * 10)),
            "estimated_cpu_usage_percent": min(80, target_videos_per_day / 100 * 5)
        }
        
        # Resource requirements
        optimization_results["resource_requirements"] = {
            "memory_gb": max(8, target_videos_per_day / 100),
            "cpu_cores": max(4, target_videos_per_day / 250),
            "storage_gb": max(50, target_videos_per_day / 20),  # For caching
            "network_bandwidth_mbps": max(100, target_videos_per_day / 10)
        }
        
        return optimization_results
