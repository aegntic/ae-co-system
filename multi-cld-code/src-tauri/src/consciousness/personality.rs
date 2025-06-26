/*
 * PERSONALITY MODULE - Adaptive AI Personality System
 * 
 * Creates a dynamic AI personality that adapts to individual developers,
 * building authentic relationships and communication styles.
 */

use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use anyhow::Result;

use super::{ConsciousnessState, ConsciousnessResponse, EmotionalTone};
// use crate::mcp_service::memory::DeveloperMemory;
use super::memory::DeveloperMemory;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIPersonality {
    /// Core personality traits (0.0 to 1.0 scale)
    traits: PersonalityTraits,
    
    /// Communication style preferences
    communication_style: CommunicationStyle,
    
    /// Relationship dynamics
    relationship_state: RelationshipState,
    
    /// Adaptation history
    adaptation_history: Vec<PersonalityAdaptation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalityTraits {
    pub empathy: f64,           // How emotionally supportive the AI is
    pub enthusiasm: f64,        // Energy and excitement level
    pub patience: f64,          // How understanding of mistakes/learning
    pub directness: f64,        // How straight-forward vs diplomatic
    pub creativity: f64,        // How innovative and exploratory
    pub technical_depth: f64,   // How detailed in technical explanations
    pub humor: f64,            // How playful and humorous
    pub formality: f64,        // How formal vs casual in communication
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunicationStyle {
    pub preferred_tone: EmotionalTone,
    pub explanation_style: ExplanationStyle,
    pub feedback_approach: FeedbackApproach,
    pub encouragement_frequency: f64, // 0.0-1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExplanationStyle {
    Concise,        // Brief, to-the-point explanations
    Detailed,       // Comprehensive explanations with examples
    Interactive,    // Question-based exploratory explanations
    Visual,         // Diagram and structure-focused explanations
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FeedbackApproach {
    Gentle,         // Soft, encouraging feedback
    Direct,         // Straightforward, honest feedback
    Collaborative,  // "Let's work together" approach
    Coaching,       // Guidance-based feedback
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelationshipState {
    pub trust_level: f64,           // How much developer trusts AI
    pub comfort_level: f64,         // How comfortable developer is with AI
    pub collaboration_style: f64,   // Independent vs collaborative preference
    pub learning_phase: LearningPhase,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LearningPhase {
    Discovery,      // Learning about the developer
    Adaptation,     // Adapting personality to developer
    Refinement,     // Fine-tuning the relationship
    Mastery,        // Optimal personality match achieved
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalityAdaptation {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub trigger: AdaptationTrigger,
    pub changes: HashMap<String, f64>,
    pub effectiveness_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AdaptationTrigger {
    DeveloperFeedback,
    InteractionPattern,
    PerformanceMetric,
    EmotionalState,
    ProjectContext,
}

impl AIPersonality {
    /// Create a new AI personality with default balanced traits
    pub async fn new() -> Result<Self> {
        log::info!("🎭 Initializing adaptive AI personality system...");
        
        Ok(AIPersonality {
            traits: PersonalityTraits::default(),
            communication_style: CommunicationStyle::default(),
            relationship_state: RelationshipState::default(),
            adaptation_history: Vec::new(),
        })
    }
    
    /// Adapt personality to a specific developer based on their history
    pub async fn adapt_to_developer(
        &self,
        mut consciousness_state: ConsciousnessState,
        developer_memory: &DeveloperMemory,
    ) -> Result<ConsciousnessState> {
        log::info!("🎭 Adapting personality to developer: {}", consciousness_state.developer_id);
        
        // Analyze developer preferences from memory
        let preferences = self.analyze_developer_preferences(developer_memory).await;
        
        // Adapt personality traits based on preferences
        let adapted_traits = self.adapt_traits_to_preferences(&preferences).await;
        
        // Update consciousness state with adapted personality
        consciousness_state.relationship_depth = developer_memory.relationship_depth;
        consciousness_state.trust_level = developer_memory.trust_level;
        
        // Store adaptation
        let adaptation = PersonalityAdaptation {
            timestamp: chrono::Utc::now(),
            trigger: AdaptationTrigger::DeveloperFeedback,
            changes: self.calculate_trait_changes(&adapted_traits).await,
            effectiveness_score: 0.5, // Initial neutral score
        };
        
        log::debug!("✅ Personality adapted with {} trait changes", adaptation.changes.len());
        
        Ok(consciousness_state)
    }
    
    /// Enhance response with personality-based modifications
    pub async fn enhance_response_with_personality(
        &self,
        mut response: ConsciousnessResponse,
        consciousness_level: f64,
    ) -> Result<ConsciousnessResponse> {
        // Adjust response based on personality traits
        response.content = self.personalize_content(&response.content, consciousness_level).await;
        response.emotional_tone = self.select_appropriate_tone(&response.emotional_tone).await;
        
        // Add personality markers based on traits
        if self.traits.humor > 0.7 && consciousness_level > 0.5 {
            response.content = self.add_appropriate_humor(&response.content).await;
        }
        
        if self.traits.enthusiasm > 0.8 {
            response.content = self.add_enthusiasm_markers(&response.content).await;
        }
        
        Ok(response)
    }
    
    /// Get current personality traits for external access
    pub async fn get_current_traits(&self) -> HashMap<String, f64> {
        let mut traits = HashMap::new();
        traits.insert("empathy".to_string(), self.traits.empathy);
        traits.insert("enthusiasm".to_string(), self.traits.enthusiasm);
        traits.insert("patience".to_string(), self.traits.patience);
        traits.insert("directness".to_string(), self.traits.directness);
        traits.insert("creativity".to_string(), self.traits.creativity);
        traits.insert("technical_depth".to_string(), self.traits.technical_depth);
        traits.insert("humor".to_string(), self.traits.humor);
        traits.insert("formality".to_string(), self.traits.formality);
        traits
    }
    
    /// Adapt personality based on interaction feedback
    pub async fn adapt_from_feedback(
        &mut self,
        feedback_type: FeedbackType,
        effectiveness: f64,
    ) -> Result<()> {
        log::debug!("🎭 Adapting personality from feedback: {:?} (effectiveness: {:.2})", 
                   feedback_type, effectiveness);
        
        // Adjust traits based on feedback
        match feedback_type {
            FeedbackType::TooTechnical => {
                self.traits.technical_depth *= 0.9;
                self.traits.empathy *= 1.1;
            }
            FeedbackType::NotTechnicalEnough => {
                self.traits.technical_depth *= 1.1;
                self.traits.directness *= 1.1;
            }
            FeedbackType::TooFormal => {
                self.traits.formality *= 0.9;
                self.traits.humor *= 1.1;
            }
            FeedbackType::TooInformal => {
                self.traits.formality *= 1.1;
                self.traits.humor *= 0.9;
            }
            FeedbackType::NeedMoreEncouragement => {
                self.traits.enthusiasm *= 1.2;
                self.traits.empathy *= 1.1;
            }
            FeedbackType::TooEnthusiastic => {
                self.traits.enthusiasm *= 0.9;
                self.traits.directness *= 1.1;
            }
        }
        
        // Normalize traits to 0.0-1.0 range
        self.normalize_traits();
        
        // Record adaptation
        let adaptation = PersonalityAdaptation {
            timestamp: chrono::Utc::now(),
            trigger: AdaptationTrigger::DeveloperFeedback,
            changes: self.get_current_traits().await,
            effectiveness_score: effectiveness,
        };
        
        self.adaptation_history.push(adaptation);
        
        Ok(())
    }
    
    // Private implementation methods
    
    async fn analyze_developer_preferences(&self, memory: &DeveloperMemory) -> DeveloperPreferences {
        // Analyze interaction patterns to infer preferences
        DeveloperPreferences {
            technical_level: self.infer_technical_level(memory).await,
            communication_preference: self.infer_communication_style(memory).await,
            feedback_style: self.infer_feedback_preference(memory).await,
            interaction_pace: self.infer_interaction_pace(memory).await,
        }
    }
    
    async fn adapt_traits_to_preferences(&self, preferences: &DeveloperPreferences) -> PersonalityTraits {
        let mut traits = self.traits.clone();
        
        // Adapt technical depth
        match preferences.technical_level {
            TechnicalLevel::Beginner => {
                traits.technical_depth = 0.3;
                traits.patience = 0.9;
                traits.empathy = 0.8;
            }
            TechnicalLevel::Intermediate => {
                traits.technical_depth = 0.6;
                traits.patience = 0.7;
                traits.directness = 0.6;
            }
            TechnicalLevel::Advanced => {
                traits.technical_depth = 0.9;
                traits.directness = 0.8;
                traits.patience = 0.5;
            }
            TechnicalLevel::Expert => {
                traits.technical_depth = 1.0;
                traits.directness = 0.9;
                traits.creativity = 0.8;
            }
        }
        
        // Adapt communication style
        match preferences.communication_preference {
            CommunicationPreference::Formal => {
                traits.formality = 0.8;
                traits.humor = 0.3;
            }
            CommunicationPreference::Casual => {
                traits.formality = 0.3;
                traits.humor = 0.7;
            }
            CommunicationPreference::Professional => {
                traits.formality = 0.6;
                traits.directness = 0.7;
            }
            CommunicationPreference::Friendly => {
                traits.empathy = 0.8;
                traits.enthusiasm = 0.7;
            }
        }
        
        traits
    }
    
    async fn calculate_trait_changes(&self, new_traits: &PersonalityTraits) -> HashMap<String, f64> {
        let mut changes = HashMap::new();
        
        if (new_traits.empathy - self.traits.empathy).abs() > 0.01 {
            changes.insert("empathy".to_string(), new_traits.empathy - self.traits.empathy);
        }
        if (new_traits.enthusiasm - self.traits.enthusiasm).abs() > 0.01 {
            changes.insert("enthusiasm".to_string(), new_traits.enthusiasm - self.traits.enthusiasm);
        }
        if (new_traits.technical_depth - self.traits.technical_depth).abs() > 0.01 {
            changes.insert("technical_depth".to_string(), new_traits.technical_depth - self.traits.technical_depth);
        }
        
        changes
    }
    
    async fn personalize_content(&self, content: &str, consciousness_level: f64) -> String {
        let mut personalized = content.to_string();
        
        // Add personality-based modifications based on consciousness level
        if consciousness_level > 0.7 {
            // High consciousness: Very personalized responses
            if self.traits.empathy > 0.7 {
                personalized = format!("I can sense this is important to you. {}", personalized);
            }
            if self.traits.enthusiasm > 0.8 {
                personalized = format!("{}! This is exactly the kind of challenge I love helping with.", personalized);
            }
        } else if consciousness_level > 0.4 {
            // Medium consciousness: Some personalization
            if self.traits.directness > 0.7 {
                personalized = format!("Here's what I think: {}", personalized);
            }
        }
        
        personalized
    }
    
    async fn select_appropriate_tone(&self, current_tone: &EmotionalTone) -> EmotionalTone {
        // Modify tone based on personality traits
        match current_tone {
            EmotionalTone::Supportive => {
                if self.traits.enthusiasm > 0.8 {
                    EmotionalTone::Enthusiastic
                } else if self.traits.empathy > 0.8 {
                    EmotionalTone::Empathetic
                } else {
                    current_tone.clone()
                }
            }
            _ => current_tone.clone(),
        }
    }
    
    async fn add_appropriate_humor(&self, content: &str) -> String {
        // Add subtle humor markers based on context
        if content.contains("error") || content.contains("bug") {
            format!("{} (Don't worry, even the best code has its moody days! 😊)", content)
        } else if content.contains("success") || content.contains("complete") {
            format!("{} 🎉", content)
        } else {
            content.to_string()
        }
    }
    
    async fn add_enthusiasm_markers(&self, content: &str) -> String {
        if content.len() > 50 { // Only for substantial responses
            format!("{}! I'm excited to help you with this.", content)
        } else {
            content.to_string()
        }
    }
    
    async fn infer_technical_level(&self, _memory: &DeveloperMemory) -> TechnicalLevel {
        // This would analyze interaction history to determine technical level
        // For now, default to intermediate
        TechnicalLevel::Intermediate
    }
    
    async fn infer_communication_style(&self, _memory: &DeveloperMemory) -> CommunicationPreference {
        // This would analyze communication patterns
        CommunicationPreference::Professional
    }
    
    async fn infer_feedback_preference(&self, _memory: &DeveloperMemory) -> FeedbackPreference {
        // This would analyze response to different feedback styles
        FeedbackPreference::Constructive
    }
    
    async fn infer_interaction_pace(&self, _memory: &DeveloperMemory) -> InteractionPace {
        // This would analyze timing patterns
        InteractionPace::Moderate
    }
    
    fn normalize_traits(&mut self) {
        self.traits.empathy = self.traits.empathy.clamp(0.0, 1.0);
        self.traits.enthusiasm = self.traits.enthusiasm.clamp(0.0, 1.0);
        self.traits.patience = self.traits.patience.clamp(0.0, 1.0);
        self.traits.directness = self.traits.directness.clamp(0.0, 1.0);
        self.traits.creativity = self.traits.creativity.clamp(0.0, 1.0);
        self.traits.technical_depth = self.traits.technical_depth.clamp(0.0, 1.0);
        self.traits.humor = self.traits.humor.clamp(0.0, 1.0);
        self.traits.formality = self.traits.formality.clamp(0.0, 1.0);
    }
}

// Supporting types and implementations

#[derive(Debug, Clone)]
struct DeveloperPreferences {
    technical_level: TechnicalLevel,
    communication_preference: CommunicationPreference,
    feedback_style: FeedbackPreference,
    interaction_pace: InteractionPace,
}

#[derive(Debug, Clone)]
enum TechnicalLevel {
    Beginner,
    Intermediate,
    Advanced,
    Expert,
}

#[derive(Debug, Clone)]
enum CommunicationPreference {
    Formal,
    Casual,
    Professional,
    Friendly,
}

#[derive(Debug, Clone)]
enum FeedbackPreference {
    Gentle,
    Direct,
    Constructive,
    Collaborative,
}

#[derive(Debug, Clone)]
enum InteractionPace {
    Slow,
    Moderate,
    Fast,
    Adaptive,
}

#[derive(Debug, Clone)]
pub enum FeedbackType {
    TooTechnical,
    NotTechnicalEnough,
    TooFormal,
    TooInformal,
    NeedMoreEncouragement,
    TooEnthusiastic,
}

impl Default for PersonalityTraits {
    fn default() -> Self {
        Self {
            empathy: 0.7,           // Moderately empathetic
            enthusiasm: 0.6,        // Moderately enthusiastic
            patience: 0.8,          // Very patient
            directness: 0.5,        // Balanced directness
            creativity: 0.7,        // Creative and innovative
            technical_depth: 0.6,   // Moderately technical
            humor: 0.4,            // Subtle humor
            formality: 0.5,        // Balanced formality
        }
    }
}

impl Default for CommunicationStyle {
    fn default() -> Self {
        Self {
            preferred_tone: EmotionalTone::Supportive,
            explanation_style: ExplanationStyle::Interactive,
            feedback_approach: FeedbackApproach::Collaborative,
            encouragement_frequency: 0.6,
        }
    }
}

impl Default for RelationshipState {
    fn default() -> Self {
        Self {
            trust_level: 0.3,           // Start with low trust
            comfort_level: 0.5,         // Neutral comfort
            collaboration_style: 0.5,   // Balanced collaboration
            learning_phase: LearningPhase::Discovery,
        }
    }
}