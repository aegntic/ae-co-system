/*!
 * DailyDoco Pro - Elite Video Processing Library
 * 
 * Advanced video analysis, processing, and optimization with ultra-tier performance
 * Sophisticated temporal analysis and multi-point video insights
 */

pub mod video_analyzer;

// Re-export main interfaces
pub use video_analyzer::{
    VideoAnalyzer, VideoAnalysisConfig, VideoAnalysisResult,
    ProcessedVideo, VideoSegment, HookAnalysisResult,
    ThreeSecondHookAnalysis, TenSecondEngagementAnalysis, ThirtySecondRetentionAnalysis,
    EngagementAnalysisResult, EngagementValley, EngagementPeak,
    OptimizationRecommendation, VideoOptimizationType,
};

// Common types used across video processing modules
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Video processing result type
pub type VideoProcessingResult<T> = std::result::Result<T, VideoProcessingError>;

/// Video processing error types
#[derive(Debug, thiserror::Error)]
pub enum VideoProcessingError {
    #[error("Video analysis failed: {0}")]
    AnalysisError(String),
    
    #[error("Video processing failed: {0}")]
    ProcessingError(String),
    
    #[error("Invalid video data: {0}")]
    InvalidVideoData(String),
    
    #[error("Optimization failed: {0}")]
    OptimizationError(String),
    
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
}

/// Video quality metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoQualityMetrics {
    pub visual_quality: f32,
    pub audio_quality: f32,
    pub engagement_quality: f32,
    pub technical_quality: f32,
    pub overall_quality: f32,
}

/// Video processing metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoProcessingMetadata {
    pub processing_timestamp: DateTime<Utc>,
    pub processing_time_ms: u64,
    pub processor_version: String,
    pub analysis_depth: AnalysisDepth,
    pub quality_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnalysisDepth {
    Basic,
    Standard,
    Advanced,
    Ultra,
}

/// Video resolution types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoResolution {
    pub width: u32,
    pub height: u32,
    pub aspect_ratio: f32,
}

/// Audio segment information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioSegment {
    pub segment_id: Uuid,
    pub start_time: f32,
    pub end_time: f32,
    pub audio_quality: f32,
    pub volume_level: f32,
    pub frequency_analysis: FrequencyAnalysis,
    pub speech_clarity: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrequencyAnalysis {
    pub low_frequency_energy: f32,
    pub mid_frequency_energy: f32,
    pub high_frequency_energy: f32,
    pub frequency_balance: f32,
}

/// Video visual features
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoVisualFeatures {
    pub average_brightness: f32,
    pub contrast_ratio: f32,
    pub color_saturation: f32,
    pub visual_complexity: f32,
    pub motion_intensity: f32,
    pub scene_changes: u32,
}

/// Video metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoMetadata {
    pub title: Option<String>,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub category: Option<String>,
    pub language: Option<String>,
    pub creation_timestamp: DateTime<Utc>,
    pub file_size_bytes: u64,
    pub format: String,
}

/// Engagement factor types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngagementFactor {
    pub factor_type: EngagementFactorType,
    pub strength: f32,
    pub confidence: f32,
    pub timestamp: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EngagementFactorType {
    VisualHook,
    AudioHook,
    InformationDensity,
    EmotionalTrigger,
    InteractionPrompt,
    CuriosityGap,
    SocialProof,
    Urgency,
}

/// Drop-off point analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DropOffPoint {
    pub timestamp: f32,
    pub severity: f32,
    pub contributing_factors: Vec<String>,
    pub recovery_strategies: Vec<String>,
    pub audience_impact: f32,
}

/// Implementation step for optimization recommendations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImplementationStep {
    pub step_number: u32,
    pub description: String,
    pub estimated_effort: f32,
    pub required_tools: Vec<String>,
    pub success_criteria: Vec<String>,
}

/// Success metric for video optimization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuccessMetric {
    pub metric_name: String,
    pub current_value: f32,
    pub target_value: f32,
    pub measurement_method: String,
    pub importance: f32,
}

/// A/B testing suggestion for video optimization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ABTestingSuggestion {
    pub test_name: String,
    pub test_description: String,
    pub variants: Vec<String>,
    pub expected_impact: f32,
    pub test_duration_days: u32,
}

/// Priority levels for recommendations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
    Ultra,
}

// Default implementations

impl Default for VideoQualityMetrics {
    fn default() -> Self {
        Self {
            visual_quality: 0.8,
            audio_quality: 0.8,
            engagement_quality: 0.7,
            technical_quality: 0.85,
            overall_quality: 0.78,
        }
    }
}

impl Default for VideoResolution {
    fn default() -> Self {
        Self {
            width: 1920,
            height: 1080,
            aspect_ratio: 16.0 / 9.0,
        }
    }
}

impl Default for FrequencyAnalysis {
    fn default() -> Self {
        Self {
            low_frequency_energy: 0.3,
            mid_frequency_energy: 0.5,
            high_frequency_energy: 0.2,
            frequency_balance: 0.8,
        }
    }
}

impl Default for VideoVisualFeatures {
    fn default() -> Self {
        Self {
            average_brightness: 0.6,
            contrast_ratio: 0.7,
            color_saturation: 0.8,
            visual_complexity: 0.5,
            motion_intensity: 0.4,
            scene_changes: 10,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_video_quality_metrics() {
        let metrics = VideoQualityMetrics::default();
        assert_eq!(metrics.visual_quality, 0.8);
        assert_eq!(metrics.audio_quality, 0.8);
        assert!(metrics.overall_quality > 0.7);
    }
    
    #[test]
    fn test_video_resolution() {
        let resolution = VideoResolution::default();
        assert_eq!(resolution.width, 1920);
        assert_eq!(resolution.height, 1080);
        assert!((resolution.aspect_ratio - 16.0/9.0).abs() < 0.01);
    }
    
    #[test]
    fn test_engagement_factor_types() {
        let factor = EngagementFactor {
            factor_type: EngagementFactorType::VisualHook,
            strength: 0.8,
            confidence: 0.9,
            timestamp: 5.0,
        };
        
        assert!(matches!(factor.factor_type, EngagementFactorType::VisualHook));
        assert_eq!(factor.strength, 0.8);
    }
    
    #[test]
    fn test_priority_levels() {
        let priority = Priority::Ultra;
        assert!(matches!(priority, Priority::Ultra));
    }
}