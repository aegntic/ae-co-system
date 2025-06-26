/*
 * LEARNING MODULE - Continuous AI Learning System
 * 
 * Enables the AI to learn and adapt from every interaction,
 * building expertise and improving assistance over time.
 */

use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use anyhow::Result;
use chrono::{DateTime, Utc, Duration};

use super::{InteractionType, InteractionContext};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContinuousLearning {
    /// Learning models for different domains
    learning_models: HashMap<LearningDomain, LearningModel>,
    
    /// Recent learning insights
    recent_insights: Vec<LearningInsight>,
    
    /// Learning effectiveness metrics
    effectiveness_metrics: LearningMetrics,
    
    /// Learning configuration
    config: LearningConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningModel {
    /// Domain this model specializes in
    domain: LearningDomain,
    
    /// Knowledge base for this domain
    knowledge_base: DomainKnowledge,
    
    /// Pattern recognition system
    pattern_recognition: PatternRecognition,
    
    /// Adaptation mechanisms
    adaptation_engine: AdaptationEngine,
    
    /// Performance tracking
    performance_metrics: PerformanceMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize, Hash, Eq, PartialEq)]
pub enum LearningDomain {
    CodeAssistance,
    EmotionalSupport,
    ProjectManagement,
    TechnicalExplanation,
    CreativeCollaboration,
    ProblemSolving,
    UserPreferences,
    ContextualAdaptation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningInsight {
    pub insight_id: String,
    pub domain: LearningDomain,
    pub description: String,
    pub confidence: f64,
    pub relevance: f64,
    pub learned_from: LearningSources,
    pub validation_status: ValidationStatus,
    pub applications: Vec<InsightApplication>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainKnowledge {
    /// Core concepts and relationships
    concepts: HashMap<String, Concept>,
    
    /// Successful interaction patterns
    success_patterns: Vec<SuccessPattern>,
    
    /// Common failure modes and how to avoid them
    failure_patterns: Vec<FailurePattern>,
    
    /// Context-specific adaptations
    contextual_knowledge: HashMap<String, ContextualKnowledge>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternRecognition {
    /// Detected patterns from interactions
    detected_patterns: Vec<DetectedPattern>,
    
    /// Pattern matching algorithms
    matching_algorithms: Vec<MatchingAlgorithm>,
    
    /// Pattern confidence scoring
    confidence_scoring: ConfidenceScoring,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdaptationEngine {
    /// Adaptation strategies
    strategies: Vec<AdaptationStrategy>,
    
    /// Real-time adaptation triggers
    triggers: Vec<AdaptationTrigger>,
    
    /// Adaptation effectiveness tracking
    effectiveness_tracking: EffectivenessTracking,
}

impl ContinuousLearning {
    /// Create a new continuous learning system
    pub async fn new() -> Result<Self> {
        log::info!("🎓 Initializing continuous learning system...");
        
        let mut learning_models = HashMap::new();
        
        // Initialize learning models for each domain
        for domain in [
            LearningDomain::CodeAssistance,
            LearningDomain::EmotionalSupport,
            LearningDomain::ProjectManagement,
            LearningDomain::TechnicalExplanation,
            LearningDomain::CreativeCollaboration,
            LearningDomain::ProblemSolving,
            LearningDomain::UserPreferences,
            LearningDomain::ContextualAdaptation,
        ] {
            learning_models.insert(domain.clone(), LearningModel::new(domain).await?);
        }
        
        Ok(ContinuousLearning {
            learning_models,
            recent_insights: Vec::new(),
            effectiveness_metrics: LearningMetrics::default(),
            config: LearningConfig::default(),
        })
    }
    
    /// Process an interaction for learning
    pub async fn process_interaction(
        &mut self,
        developer_id: &str,
        interaction_type: &InteractionType,
        context: &InteractionContext,
    ) -> Result<()> {
        log::debug!("🎓 Processing interaction for learning: {:?}", interaction_type);
        
        // Determine primary learning domain
        let primary_domain = self.classify_interaction_domain(interaction_type).await;
        
        // Process interaction in relevant learning models
        if let Some(model) = self.learning_models.get_mut(&primary_domain) {
            model.process_interaction(developer_id, interaction_type, context).await?;
        }
        
        // Cross-domain learning
        self.process_cross_domain_learning(interaction_type, context).await?;
        
        // Generate new insights
        let insights = self.generate_insights_from_interaction(interaction_type, context).await?;
        self.recent_insights.extend(insights);
        
        // Update effectiveness metrics
        self.update_effectiveness_metrics(context).await;
        
        // Trigger adaptations if needed
        self.evaluate_adaptation_triggers().await?;
        
        Ok(())
    }
    
    /// Get recent learning insights for a developer
    pub async fn get_recent_insights(&self, developer_id: &str) -> Result<Vec<String>> {
        log::debug!("🎓 Retrieving recent insights for developer: {}", developer_id);
        
        let mut insights = Vec::new();
        
        // Get insights from the last 7 days
        let one_week_ago = Utc::now() - Duration::days(7);
        
        for insight in &self.recent_insights {
            if insight.created_at > one_week_ago && insight.validation_status == ValidationStatus::Validated {
                insights.push(insight.description.clone());
            }
        }
        
        // Limit to most relevant insights
        insights.truncate(5);
        
        Ok(insights)
    }
    
    /// Apply learning to improve future interactions
    pub async fn apply_learning_to_response(
        &self,
        interaction_type: &InteractionType,
        context: &InteractionContext,
        base_response: &str,
    ) -> Result<String> {
        let domain = self.classify_interaction_domain(interaction_type).await;
        
        if let Some(model) = self.learning_models.get(&domain) {
            let enhanced_response = model.enhance_response_with_learning(base_response, context).await?;
            Ok(enhanced_response)
        } else {
            Ok(base_response.to_string())
        }
    }
    
    /// Get learning effectiveness summary
    pub async fn get_learning_effectiveness(&self) -> LearningEffectivenessSummary {
        LearningEffectivenessSummary {
            overall_effectiveness: self.effectiveness_metrics.overall_effectiveness,
            domain_effectiveness: self.get_domain_effectiveness_scores().await,
            recent_improvements: self.get_recent_improvements().await,
            learning_velocity: self.calculate_learning_velocity().await,
            adaptation_success_rate: self.effectiveness_metrics.adaptation_success_rate,
        }
    }
    
    /// Validate and consolidate learning insights
    pub async fn consolidate_learning(&mut self) -> Result<()> {
        log::info!("🎓 Consolidating learning insights...");
        
        // Validate recent insights
        self.validate_insights().await?;
        
        // Merge similar insights
        self.merge_similar_insights().await?;
        
        // Update domain knowledge bases
        self.update_domain_knowledge().await?;
        
        // Clean up old, invalidated insights
        self.cleanup_insights().await;
        
        Ok(())
    }
    
    // Private implementation methods
    
    async fn classify_interaction_domain(&self, interaction_type: &InteractionType) -> LearningDomain {
        match interaction_type {
            InteractionType::CodeQuestion | InteractionType::DeepCodeDiscussion => LearningDomain::CodeAssistance,
            InteractionType::EmotionalSupport => LearningDomain::EmotionalSupport,
            InteractionType::CreativeCollaboration => LearningDomain::CreativeCollaboration,
            InteractionType::ProblemSolving => LearningDomain::ProblemSolving,
            InteractionType::LearningSession => LearningDomain::TechnicalExplanation,
            _ => LearningDomain::ContextualAdaptation,
        }
    }
    
    async fn process_cross_domain_learning(
        &mut self,
        interaction_type: &InteractionType,
        context: &InteractionContext,
    ) -> Result<()> {
        // Learn patterns that apply across domains
        if context.interaction_satisfaction > 0.8 {
            // High satisfaction - learn from this success
            let success_pattern = SuccessPattern {
                pattern_name: format!("{:?}_success_pattern", interaction_type),
                context_indicators: self.extract_context_indicators(context).await,
                success_factors: self.identify_success_factors(context).await,
                applicability_score: 0.8,
                validation_count: 1,
            };
            
            // Apply to relevant domains
            for (_, model) in &mut self.learning_models {
                model.knowledge_base.success_patterns.push(success_pattern.clone());
            }
        }
        
        Ok(())
    }
    
    async fn generate_insights_from_interaction(
        &self,
        interaction_type: &InteractionType,
        context: &InteractionContext,
    ) -> Result<Vec<LearningInsight>> {
        let mut insights = Vec::new();
        
        // Generate context-based insights
        if context.focus_duration_minutes > 45.0 && context.interaction_satisfaction > 0.7 {
            insights.push(LearningInsight {
                insight_id: uuid::Uuid::new_v4().to_string(),
                domain: LearningDomain::ContextualAdaptation,
                description: "Long focus sessions with high satisfaction indicate optimal engagement".to_string(),
                confidence: 0.8,
                relevance: 0.9,
                learned_from: LearningSources::InteractionPattern,
                validation_status: ValidationStatus::Pending,
                applications: Vec::new(),
                created_at: Utc::now(),
            });
        }
        
        // Generate domain-specific insights
        match interaction_type {
            InteractionType::CodeQuestion => {
                if context.code_complexity_level > 0.8 && context.interaction_satisfaction > 0.6 {
                    insights.push(LearningInsight {
                        insight_id: uuid::Uuid::new_v4().to_string(),
                        domain: LearningDomain::CodeAssistance,
                        description: "Complex code questions benefit from structured explanations".to_string(),
                        confidence: 0.7,
                        relevance: 0.8,
                        learned_from: LearningSources::OutcomeAnalysis,
                        validation_status: ValidationStatus::Pending,
                        applications: Vec::new(),
                        created_at: Utc::now(),
                    });
                }
            }
            _ => {}
        }
        
        Ok(insights)
    }
    
    async fn update_effectiveness_metrics(&mut self, context: &InteractionContext) {
        // Update overall effectiveness based on satisfaction
        let weight = 0.05; // Small incremental updates
        self.effectiveness_metrics.overall_effectiveness = 
            self.effectiveness_metrics.overall_effectiveness * (1.0 - weight) + 
            context.interaction_satisfaction * weight;
        
        // Update learning rate
        if context.interaction_satisfaction > 0.7 {
            self.effectiveness_metrics.learning_rate *= 1.01;
        } else if context.interaction_satisfaction < 0.4 {
            self.effectiveness_metrics.learning_rate *= 0.99;
        }
        
        // Update total interactions
        self.effectiveness_metrics.total_interactions += 1;
    }
    
    async fn evaluate_adaptation_triggers(&mut self) -> Result<()> {
        // Check if any adaptation triggers are met
        for (domain, model) in &mut self.learning_models {
            if model.should_trigger_adaptation().await {
                log::info!("🎓 Triggering adaptation for domain: {:?}", domain);
                model.trigger_adaptation().await?;
            }
        }
        
        Ok(())
    }
    
    async fn validate_insights(&mut self) -> Result<()> {
        for insight in &mut self.recent_insights {
            if insight.validation_status == ValidationStatus::Pending {
                // Simple validation based on confidence and applications
                if insight.confidence > 0.7 && insight.applications.len() > 2 {
                    insight.validation_status = ValidationStatus::Validated;
                } else if insight.created_at < Utc::now() - Duration::days(30) {
                    insight.validation_status = ValidationStatus::Expired;
                }
            }
        }
        
        Ok(())
    }
    
    async fn merge_similar_insights(&mut self) -> Result<()> {
        // Simple merging logic - in practice this would be more sophisticated
        let mut merged_insights = Vec::new();
        let mut processed_indices = std::collections::HashSet::new();
        
        for (i, insight) in self.recent_insights.iter().enumerate() {
            if processed_indices.contains(&i) {
                continue;
            }
            
            let mut similar_insights = vec![insight.clone()];
            
            // Find similar insights
            for (j, other_insight) in self.recent_insights.iter().enumerate().skip(i + 1) {
                if self.are_insights_similar(insight, other_insight).await {
                    similar_insights.push(other_insight.clone());
                    processed_indices.insert(j);
                }
            }
            
            // Merge if multiple similar insights found
            if similar_insights.len() > 1 {
                let merged = self.merge_insight_group(similar_insights).await;
                merged_insights.push(merged);
            } else {
                merged_insights.push(insight.clone());
            }
            
            processed_indices.insert(i);
        }
        
        self.recent_insights = merged_insights;
        Ok(())
    }
    
    async fn update_domain_knowledge(&mut self) -> Result<()> {
        // Update domain knowledge bases with validated insights
        for insight in &self.recent_insights {
            if insight.validation_status == ValidationStatus::Validated {
                if let Some(model) = self.learning_models.get_mut(&insight.domain) {
                    model.integrate_insight(insight).await?;
                }
            }
        }
        
        Ok(())
    }
    
    async fn cleanup_insights(&mut self) {
        // Remove old and invalid insights
        let cutoff_date = Utc::now() - Duration::days(self.config.insight_retention_days as i64);
        
        self.recent_insights.retain(|insight| {
            insight.created_at > cutoff_date && 
            insight.validation_status != ValidationStatus::Invalid
        });
    }
    
    async fn get_domain_effectiveness_scores(&self) -> HashMap<LearningDomain, f64> {
        let mut scores = HashMap::new();
        
        for (domain, model) in &self.learning_models {
            scores.insert(domain.clone(), model.performance_metrics.effectiveness_score);
        }
        
        scores
    }
    
    async fn get_recent_improvements(&self) -> Vec<ImprovementSummary> {
        // Return recent improvements from all domains
        let mut improvements = Vec::new();
        
        for (domain, model) in &self.learning_models {
            if let Some(improvement) = model.get_recent_improvement().await {
                improvements.push(ImprovementSummary {
                    domain: domain.clone(),
                    description: improvement,
                    impact_score: model.performance_metrics.improvement_rate,
                });
            }
        }
        
        improvements
    }
    
    async fn calculate_learning_velocity(&self) -> f64 {
        // Calculate how fast the system is learning
        let recent_insights_count = self.recent_insights.iter()
            .filter(|i| i.created_at > Utc::now() - Duration::days(7))
            .count();
        
        recent_insights_count as f64 / 7.0 // Insights per day
    }
    
    async fn extract_context_indicators(&self, context: &InteractionContext) -> Vec<String> {
        let mut indicators = Vec::new();
        
        if context.focus_duration_minutes > 30.0 {
            indicators.push("long_focus_session".to_string());
        }
        if context.code_complexity_level > 0.7 {
            indicators.push("high_complexity".to_string());
        }
        if context.interaction_satisfaction > 0.8 {
            indicators.push("high_satisfaction".to_string());
        }
        
        indicators
    }
    
    async fn identify_success_factors(&self, context: &InteractionContext) -> Vec<String> {
        let mut factors = Vec::new();
        
        if context.interaction_satisfaction > 0.8 {
            factors.push("clear_communication".to_string());
            factors.push("appropriate_detail_level".to_string());
        }
        
        factors
    }
    
    async fn are_insights_similar(&self, insight1: &LearningInsight, insight2: &LearningInsight) -> bool {
        insight1.domain == insight2.domain && 
        insight1.description.len() > 10 &&
        insight2.description.len() > 10 &&
        self.calculate_text_similarity(&insight1.description, &insight2.description) > 0.8
    }
    
    fn calculate_text_similarity(&self, text1: &str, text2: &str) -> f64 {
        // Simple similarity calculation - could be much more sophisticated
        let words1: std::collections::HashSet<&str> = text1.split_whitespace().collect();
        let words2: std::collections::HashSet<&str> = text2.split_whitespace().collect();
        
        let intersection_size = words1.intersection(&words2).count() as f64;
        let union_size = words1.union(&words2).count() as f64;
        
        if union_size > 0.0 {
            intersection_size / union_size
        } else {
            0.0
        }
    }
    
    async fn merge_insight_group(&self, insights: Vec<LearningInsight>) -> LearningInsight {
        let first = &insights[0];
        let avg_confidence = insights.iter().map(|i| i.confidence).sum::<f64>() / insights.len() as f64;
        let avg_relevance = insights.iter().map(|i| i.relevance).sum::<f64>() / insights.len() as f64;
        
        LearningInsight {
            insight_id: uuid::Uuid::new_v4().to_string(),
            domain: first.domain.clone(),
            description: format!("Merged insight: {} (from {} similar insights)", 
                               first.description, insights.len()),
            confidence: avg_confidence,
            relevance: avg_relevance,
            learned_from: first.learned_from.clone(),
            validation_status: ValidationStatus::Validated,
            applications: insights.into_iter().flat_map(|i| i.applications).collect(),
            created_at: Utc::now(),
        }
    }
}

// Supporting types and implementations

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LearningSources {
    InteractionPattern,
    OutcomeAnalysis,
    UserFeedback,
    PerformanceMetric,
    CrossDomainTransfer,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ValidationStatus {
    Pending,
    Validated,
    Invalid,
    Expired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InsightApplication {
    pub applied_at: DateTime<Utc>,
    pub context: String,
    pub effectiveness: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningMetrics {
    pub overall_effectiveness: f64,
    pub learning_rate: f64,
    pub adaptation_success_rate: f64,
    pub total_interactions: u64,
    pub insights_generated: u64,
    pub insights_validated: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningConfig {
    pub insight_retention_days: u32,
    pub validation_threshold: f64,
    pub adaptation_sensitivity: f64,
    pub cross_domain_learning_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningEffectivenessSummary {
    pub overall_effectiveness: f64,
    pub domain_effectiveness: HashMap<LearningDomain, f64>,
    pub recent_improvements: Vec<ImprovementSummary>,
    pub learning_velocity: f64,
    pub adaptation_success_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImprovementSummary {
    pub domain: LearningDomain,
    pub description: String,
    pub impact_score: f64,
}

// Additional supporting types for completeness

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Concept {
    pub name: String,
    pub relationships: Vec<String>,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuccessPattern {
    pub pattern_name: String,
    pub context_indicators: Vec<String>,
    pub success_factors: Vec<String>,
    pub applicability_score: f64,
    pub validation_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailurePattern {
    pub pattern_name: String,
    pub failure_indicators: Vec<String>,
    pub avoidance_strategies: Vec<String>,
    pub severity_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextualKnowledge {
    pub context_type: String,
    pub specific_adaptations: Vec<String>,
    pub effectiveness_scores: HashMap<String, f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedPattern {
    pub pattern_id: String,
    pub pattern_type: String,
    pub detection_confidence: f64,
    pub occurrences: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchingAlgorithm {
    pub algorithm_name: String,
    pub accuracy_score: f64,
    pub processing_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfidenceScoring {
    pub scoring_method: String,
    pub threshold_values: HashMap<String, f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdaptationStrategy {
    pub strategy_name: String,
    pub trigger_conditions: Vec<String>,
    pub adaptation_actions: Vec<String>,
    pub success_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdaptationTrigger {
    pub trigger_name: String,
    pub condition_threshold: f64,
    pub current_value: f64,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EffectivenessTracking {
    pub before_adaptation_score: f64,
    pub after_adaptation_score: f64,
    pub improvement_delta: f64,
    pub adaptation_timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub effectiveness_score: f64,
    pub improvement_rate: f64,
    pub adaptation_frequency: f64,
    pub learning_stability: f64,
}

impl LearningModel {
    async fn new(domain: LearningDomain) -> Result<Self> {
        Ok(LearningModel {
            domain,
            knowledge_base: DomainKnowledge::default(),
            pattern_recognition: PatternRecognition::default(),
            adaptation_engine: AdaptationEngine::default(),
            performance_metrics: PerformanceMetrics::default(),
        })
    }
    
    async fn process_interaction(
        &mut self,
        _developer_id: &str,
        _interaction_type: &InteractionType,
        context: &InteractionContext,
    ) -> Result<()> {
        // Update performance metrics
        self.performance_metrics.effectiveness_score = 
            (self.performance_metrics.effectiveness_score * 0.95) + 
            (context.interaction_satisfaction * 0.05);
        
        Ok(())
    }
    
    async fn enhance_response_with_learning(
        &self,
        base_response: &str,
        _context: &InteractionContext,
    ) -> Result<String> {
        // Apply domain-specific learning enhancements
        Ok(format!("{} [Enhanced with {} learning]", base_response, self.domain_name()))
    }
    
    async fn should_trigger_adaptation(&self) -> bool {
        self.performance_metrics.effectiveness_score < 0.6
    }
    
    async fn trigger_adaptation(&mut self) -> Result<()> {
        log::info!("🎓 Triggering adaptation for domain: {:?}", self.domain);
        self.performance_metrics.adaptation_frequency += 1.0;
        Ok(())
    }
    
    async fn integrate_insight(&mut self, insight: &LearningInsight) -> Result<()> {
        // Integrate validated insight into domain knowledge
        let concept = Concept {
            name: insight.description.clone(),
            relationships: Vec::new(),
            confidence: insight.confidence,
        };
        
        self.knowledge_base.concepts.insert(insight.insight_id.clone(), concept);
        Ok(())
    }
    
    async fn get_recent_improvement(&self) -> Option<String> {
        if self.performance_metrics.improvement_rate > 0.05 {
            Some(format!("Improved effectiveness by {:.1}% in {:?} domain", 
                        self.performance_metrics.improvement_rate * 100.0, 
                        self.domain))
        } else {
            None
        }
    }
    
    fn domain_name(&self) -> &str {
        match self.domain {
            LearningDomain::CodeAssistance => "code assistance",
            LearningDomain::EmotionalSupport => "emotional support",
            LearningDomain::ProjectManagement => "project management",
            LearningDomain::TechnicalExplanation => "technical explanation",
            LearningDomain::CreativeCollaboration => "creative collaboration",
            LearningDomain::ProblemSolving => "problem solving",
            LearningDomain::UserPreferences => "user preferences",
            LearningDomain::ContextualAdaptation => "contextual adaptation",
        }
    }
}

impl Default for LearningMetrics {
    fn default() -> Self {
        Self {
            overall_effectiveness: 0.5,
            learning_rate: 1.0,
            adaptation_success_rate: 0.7,
            total_interactions: 0,
            insights_generated: 0,
            insights_validated: 0,
        }
    }
}

impl Default for LearningConfig {
    fn default() -> Self {
        Self {
            insight_retention_days: 90,
            validation_threshold: 0.7,
            adaptation_sensitivity: 0.1,
            cross_domain_learning_enabled: true,
        }
    }
}

impl Default for DomainKnowledge {
    fn default() -> Self {
        Self {
            concepts: HashMap::new(),
            success_patterns: Vec::new(),
            failure_patterns: Vec::new(),
            contextual_knowledge: HashMap::new(),
        }
    }
}

impl Default for PatternRecognition {
    fn default() -> Self {
        Self {
            detected_patterns: Vec::new(),
            matching_algorithms: Vec::new(),
            confidence_scoring: ConfidenceScoring {
                scoring_method: "weighted_average".to_string(),
                threshold_values: HashMap::new(),
            },
        }
    }
}

impl Default for AdaptationEngine {
    fn default() -> Self {
        Self {
            strategies: Vec::new(),
            triggers: Vec::new(),
            effectiveness_tracking: EffectivenessTracking {
                before_adaptation_score: 0.0,
                after_adaptation_score: 0.0,
                improvement_delta: 0.0,
                adaptation_timestamp: Utc::now(),
            },
        }
    }
}

impl Default for PerformanceMetrics {
    fn default() -> Self {
        Self {
            effectiveness_score: 0.5,
            improvement_rate: 0.0,
            adaptation_frequency: 0.0,
            learning_stability: 0.8,
        }
    }
}