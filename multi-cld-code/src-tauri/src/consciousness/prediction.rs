/*
 * PREDICTION MODULE - Predictive AI Engine
 * 
 * Provides proactive assistance through predictive capabilities,
 * anticipating developer needs and preventing problems before they occur.
 */

use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use anyhow::Result;
use chrono::{DateTime, Utc, Duration};

use super::{InteractionType, InteractionContext, Prediction, PredictionType, ConsciousnessState};
// use crate::mcp_service::memory::DeveloperMemory;
use super::memory::DeveloperMemory;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PredictiveEngine {
    /// Prediction models for different types
    prediction_models: HashMap<PredictionType, PredictionModel>,
    
    /// Active predictions being tracked
    active_predictions: Vec<ActivePrediction>,
    
    /// Prediction performance metrics
    performance_metrics: PredictionMetrics,
    
    /// Historical prediction accuracy
    accuracy_history: Vec<AccuracyRecord>,
    
    /// Configuration settings
    config: PredictionConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PredictionModel {
    /// Type of predictions this model handles
    prediction_type: PredictionType,
    
    /// Feature extractors for this prediction type
    feature_extractors: Vec<FeatureExtractor>,
    
    /// Pattern matching algorithms
    pattern_matchers: Vec<PatternMatcher>,
    
    /// Confidence scoring system
    confidence_scorer: ConfidenceScorer,
    
    /// Model performance metrics
    model_metrics: ModelMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivePrediction {
    pub prediction: Prediction,
    pub created_at: DateTime<Utc>,
    pub last_updated: DateTime<Utc>,
    pub validation_deadline: DateTime<Utc>,
    pub monitoring_context: MonitoringContext,
    pub validation_status: PredictionValidationStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PredictionMetrics {
    pub overall_accuracy: f64,
    pub predictions_made: u64,
    pub predictions_validated: u64,
    pub false_positive_rate: f64,
    pub false_negative_rate: f64,
    pub average_confidence: f64,
    pub proactive_interventions: u64,
    pub successful_interventions: u64,
}

impl PredictiveEngine {
    /// Create a new predictive engine
    pub async fn new() -> Result<Self> {
        log::info!("🔮 Initializing predictive AI engine...");
        
        let mut prediction_models = HashMap::new();
        
        // Initialize prediction models for each type
        for prediction_type in [
            PredictionType::NextCommand,
            PredictionType::PotentialBug,
            PredictionType::PerformanceIssue,
            PredictionType::UserNeed,
            PredictionType::FlowStateBreak,
            PredictionType::FrustrationPoint,
            PredictionType::LearningOpportunity,
        ] {
            prediction_models.insert(
                prediction_type.clone(), 
                PredictionModel::new(prediction_type).await?
            );
        }
        
        Ok(PredictiveEngine {
            prediction_models,
            active_predictions: Vec::new(),
            performance_metrics: PredictionMetrics::default(),
            accuracy_history: Vec::new(),
            config: PredictionConfig::default(),
        })
    }
    
    /// Initialize predictions for a new session
    pub async fn initialize_predictions(
        &self,
        developer_memory: &DeveloperMemory,
    ) -> Result<Vec<Prediction>> {
        log::info!("🔮 Initializing predictions for developer session");
        
        let mut predictions = Vec::new();
        
        // Predict likely next commands based on patterns
        let next_command_predictions = self.predict_next_commands(developer_memory).await?;
        predictions.extend(next_command_predictions);
        
        // Predict potential workflow issues
        let workflow_predictions = self.predict_workflow_issues(developer_memory).await?;
        predictions.extend(workflow_predictions);
        
        // Predict learning opportunities
        let learning_predictions = self.predict_learning_opportunities(developer_memory).await?;
        predictions.extend(learning_predictions);
        
        // Predict flow state risks
        let flow_predictions = self.predict_flow_state_risks(developer_memory).await?;
        predictions.extend(flow_predictions);
        
        log::info!("✅ Generated {} initial predictions", predictions.len());
        Ok(predictions)
    }
    
    /// Update predictions based on new interaction
    pub async fn update_predictions(
        &mut self,
        current_predictions: &[Prediction],
        interaction_type: &InteractionType,
        context: &InteractionContext,
    ) -> Result<Vec<Prediction>> {
        log::debug!("🔮 Updating predictions based on interaction: {:?}", interaction_type);
        
        // Validate existing predictions
        self.validate_predictions(current_predictions, interaction_type, context).await?;
        
        // Generate new predictions based on current context
        let mut updated_predictions = Vec::new();
        
        // Contextual next action predictions
        let next_actions = self.predict_immediate_next_actions(interaction_type, context).await?;
        updated_predictions.extend(next_actions);
        
        // Detect potential issues early
        let issue_predictions = self.predict_potential_issues(context).await?;
        updated_predictions.extend(issue_predictions);
        
        // Predict user needs
        let need_predictions = self.predict_user_needs(context).await?;
        updated_predictions.extend(need_predictions);
        
        // Update prediction performance metrics
        self.update_performance_metrics().await;
        
        // Keep only the most relevant predictions
        self.prioritize_predictions(&mut updated_predictions).await;
        
        Ok(updated_predictions)
    }
    
    /// Generate predictions for flow state preservation
    pub async fn generate_flow_preservation_predictions(
        &self,
        consciousness_state: &ConsciousnessState,
    ) -> Result<Vec<Prediction>> {
        log::info!("🌊 Generating flow state preservation predictions");
        
        let mut predictions = Vec::new();
        
        // Predict interruption risks
        if consciousness_state.flow_state_detected {
            predictions.push(Prediction {
                id: uuid::Uuid::new_v4().to_string(),
                prediction_type: PredictionType::FlowStateBreak,
                confidence: 0.8,
                predicted_action: "potential_interruption_risk".to_string(),
                reasoning: "Flow state detected - high risk of interruption breaking concentration".to_string(),
                time_horizon_seconds: 300, // 5 minutes
            });
        }
        
        // Predict optimal break timing
        if consciousness_state.emotional_state.energy_level < 0.4 {
            predictions.push(Prediction {
                id: uuid::Uuid::new_v4().to_string(),
                prediction_type: PredictionType::UserNeed,
                confidence: 0.7,
                predicted_action: "suggest_break".to_string(),
                reasoning: "Low energy levels detected - break recommendation imminent".to_string(),
                time_horizon_seconds: 600, // 10 minutes
            });
        }
        
        // Predict focus enhancement opportunities
        if consciousness_state.emotional_state.creativity_level > 0.8 {
            predictions.push(Prediction {
                id: uuid::Uuid::new_v4().to_string(),
                prediction_type: PredictionType::LearningOpportunity,
                confidence: 0.9,
                predicted_action: "creative_enhancement".to_string(),
                reasoning: "High creativity detected - optimal time for innovative tasks".to_string(),
                time_horizon_seconds: 1800, // 30 minutes
            });
        }
        
        Ok(predictions)
    }
    
    /// Get prediction accuracy statistics
    pub async fn get_prediction_accuracy(&self) -> PredictionAccuracySummary {
        PredictionAccuracySummary {
            overall_accuracy: self.performance_metrics.overall_accuracy,
            type_specific_accuracy: self.get_type_specific_accuracy().await,
            recent_performance: self.get_recent_performance().await,
            improvement_trends: self.get_improvement_trends().await,
            false_positive_rate: self.performance_metrics.false_positive_rate,
            false_negative_rate: self.performance_metrics.false_negative_rate,
        }
    }
    
    /// Proactively suggest actions based on predictions
    pub async fn suggest_proactive_actions(
        &self,
        predictions: &[Prediction],
        context: &InteractionContext,
    ) -> Result<Vec<ProactiveAction>> {
        let mut actions = Vec::new();
        
        for prediction in predictions {
            if prediction.confidence > self.config.action_suggestion_threshold {
                let action = self.generate_proactive_action(prediction, context).await?;
                if let Some(action) = action {
                    actions.push(action);
                }
            }
        }
        
        // Sort by urgency and impact
        actions.sort_by(|a, b| {
            (b.urgency_score * b.impact_score)
                .partial_cmp(&(a.urgency_score * a.impact_score))
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        
        // Limit to most critical actions
        actions.truncate(self.config.max_proactive_actions);
        
        Ok(actions)
    }
    
    // Private implementation methods
    
    async fn predict_next_commands(&self, developer_memory: &DeveloperMemory) -> Result<Vec<Prediction>> {
        let mut predictions = Vec::new();
        
        // Analyze interaction patterns to predict next likely commands
        for pattern in &developer_memory.interaction_patterns {
            if pattern.frequency > 0.3 {
                predictions.push(Prediction {
                    id: uuid::Uuid::new_v4().to_string(),
                    prediction_type: PredictionType::NextCommand,
                    confidence: pattern.frequency * 0.8,
                    predicted_action: format!("repeat_{}", pattern.pattern_description),
                    reasoning: format!("Pattern occurs {:.1}% of interactions", pattern.frequency * 100.0),
                    time_horizon_seconds: 120, // 2 minutes
                });
            }
        }
        
        Ok(predictions)
    }
    
    async fn predict_workflow_issues(&self, developer_memory: &DeveloperMemory) -> Result<Vec<Prediction>> {
        let mut predictions = Vec::new();
        
        // Predict based on emotional journey patterns
        let recent_stress_trend = self.calculate_stress_trend(developer_memory).await;
        
        if recent_stress_trend > 0.7 {
            predictions.push(Prediction {
                id: uuid::Uuid::new_v4().to_string(),
                prediction_type: PredictionType::FrustrationPoint,
                confidence: 0.8,
                predicted_action: "frustration_escalation".to_string(),
                reasoning: "Rising stress indicators suggest approaching frustration point".to_string(),
                time_horizon_seconds: 900, // 15 minutes
            });
        }
        
        Ok(predictions)
    }
    
    async fn predict_learning_opportunities(&self, developer_memory: &DeveloperMemory) -> Result<Vec<Prediction>> {
        let mut predictions = Vec::new();
        
        // Look for knowledge gaps in recent interactions
        if developer_memory.total_interactions > 50 {
            for insight in &developer_memory.learning_insights {
                if insight.confidence > 0.8 && insight.relevance > 0.7 {
                    predictions.push(Prediction {
                        id: uuid::Uuid::new_v4().to_string(),
                        prediction_type: PredictionType::LearningOpportunity,
                        confidence: insight.confidence,
                        predicted_action: "knowledge_expansion".to_string(),
                        reasoning: format!("Learning opportunity: {}", insight.description),
                        time_horizon_seconds: 3600, // 1 hour
                    });
                }
            }
        }
        
        Ok(predictions)
    }
    
    async fn predict_flow_state_risks(&self, developer_memory: &DeveloperMemory) -> Result<Vec<Prediction>> {
        let mut predictions = Vec::new();
        
        // Analyze flow state patterns
        let flow_disruption_risk = self.calculate_flow_disruption_risk(developer_memory).await;
        
        if flow_disruption_risk > 0.6 {
            predictions.push(Prediction {
                id: uuid::Uuid::new_v4().to_string(),
                prediction_type: PredictionType::FlowStateBreak,
                confidence: flow_disruption_risk,
                predicted_action: "flow_preservation_needed".to_string(),
                reasoning: "Historical patterns suggest flow state vulnerability".to_string(),
                time_horizon_seconds: 1800, // 30 minutes
            });
        }
        
        Ok(predictions)
    }
    
    async fn predict_immediate_next_actions(
        &self,
        interaction_type: &InteractionType,
        context: &InteractionContext,
    ) -> Result<Vec<Prediction>> {
        let mut predictions = Vec::new();
        
        match interaction_type {
            InteractionType::CodeQuestion => {
                if context.code_complexity_level > 0.7 {
                    predictions.push(Prediction {
                        id: uuid::Uuid::new_v4().to_string(),
                        prediction_type: PredictionType::NextCommand,
                        confidence: 0.7,
                        predicted_action: "follow_up_explanation".to_string(),
                        reasoning: "Complex code questions typically require follow-up clarification".to_string(),
                        time_horizon_seconds: 300, // 5 minutes
                    });
                }
            }
            InteractionType::ProblemSolving => {
                predictions.push(Prediction {
                    id: uuid::Uuid::new_v4().to_string(),
                    prediction_type: PredictionType::UserNeed,
                    confidence: 0.8,
                    predicted_action: "validation_request".to_string(),
                    reasoning: "Problem-solving sessions often need solution validation".to_string(),
                    time_horizon_seconds: 600, // 10 minutes
                });
            }
            _ => {}
        }
        
        Ok(predictions)
    }
    
    async fn predict_potential_issues(&self, context: &InteractionContext) -> Result<Vec<Prediction>> {
        let mut predictions = Vec::new();
        
        // Performance issue prediction
        if context.code_complexity_level > 0.8 && context.focus_duration_minutes > 60.0 {
            predictions.push(Prediction {
                id: uuid::Uuid::new_v4().to_string(),
                prediction_type: PredictionType::PerformanceIssue,
                confidence: 0.6,
                predicted_action: "performance_degradation".to_string(),
                reasoning: "Long sessions with complex code often lead to performance issues".to_string(),
                time_horizon_seconds: 1200, // 20 minutes
            });
        }
        
        // Bug prediction
        if context.interaction_satisfaction < 0.4 && context.code_complexity_level > 0.6 {
            predictions.push(Prediction {
                id: uuid::Uuid::new_v4().to_string(),
                prediction_type: PredictionType::PotentialBug,
                confidence: 0.7,
                predicted_action: "bug_introduction_risk".to_string(),
                reasoning: "Low satisfaction with complex code increases bug risk".to_string(),
                time_horizon_seconds: 900, // 15 minutes
            });
        }
        
        Ok(predictions)
    }
    
    async fn predict_user_needs(&self, context: &InteractionContext) -> Result<Vec<Prediction>> {
        let mut predictions = Vec::new();
        
        // Break suggestion
        if context.focus_duration_minutes > 90.0 {
            predictions.push(Prediction {
                id: uuid::Uuid::new_v4().to_string(),
                prediction_type: PredictionType::UserNeed,
                confidence: 0.9,
                predicted_action: "break_suggestion".to_string(),
                reasoning: "Extended focus sessions benefit from breaks".to_string(),
                time_horizon_seconds: 300, // 5 minutes
            });
        }
        
        // Help request
        if context.interaction_satisfaction < 0.3 {
            predictions.push(Prediction {
                id: uuid::Uuid::new_v4().to_string(),
                prediction_type: PredictionType::UserNeed,
                confidence: 0.8,
                predicted_action: "help_request".to_string(),
                reasoning: "Low satisfaction suggests user may need additional assistance".to_string(),
                time_horizon_seconds: 180, // 3 minutes
            });
        }
        
        Ok(predictions)
    }
    
    async fn validate_predictions(
        &mut self,
        predictions: &[Prediction],
        interaction_type: &InteractionType,
        context: &InteractionContext,
    ) -> Result<()> {
        for prediction in predictions {
            let validation_result = self.validate_single_prediction(prediction, interaction_type, context).await;
            self.record_validation_result(prediction, validation_result).await;
        }
        
        Ok(())
    }
    
    async fn validate_single_prediction(
        &self,
        prediction: &Prediction,
        interaction_type: &InteractionType,
        _context: &InteractionContext,
    ) -> PredictionValidationResult {
        // Simple validation logic - in practice this would be much more sophisticated
        match (&prediction.prediction_type, interaction_type) {
            (PredictionType::NextCommand, InteractionType::CodeQuestion) => {
                if prediction.predicted_action.contains("follow_up") {
                    PredictionValidationResult::Correct
                } else {
                    PredictionValidationResult::Incorrect
                }
            }
            (PredictionType::UserNeed, InteractionType::EmotionalSupport) => {
                PredictionValidationResult::Correct
            }
            _ => PredictionValidationResult::Uncertain,
        }
    }
    
    async fn record_validation_result(
        &mut self,
        prediction: &Prediction,
        result: PredictionValidationResult,
    ) {
        match result {
            PredictionValidationResult::Correct => {
                self.performance_metrics.predictions_validated += 1;
                // Update model accuracy
                if let Some(model) = self.prediction_models.get_mut(&prediction.prediction_type) {
                    model.model_metrics.correct_predictions += 1;
                }
            }
            PredictionValidationResult::Incorrect => {
                // Update false positive/negative rates
                self.performance_metrics.false_positive_rate = 
                    (self.performance_metrics.false_positive_rate * 0.95) + 0.05;
            }
            PredictionValidationResult::Uncertain => {
                // No update for uncertain cases
            }
        }
        
        // Record in accuracy history
        self.accuracy_history.push(AccuracyRecord {
            timestamp: Utc::now(),
            prediction_type: prediction.prediction_type.clone(),
            confidence: prediction.confidence,
            result,
        });
        
        // Recalculate overall accuracy
        self.recalculate_overall_accuracy().await;
    }
    
    async fn update_performance_metrics(&mut self) {
        self.performance_metrics.predictions_made += 1;
        
        // Update average confidence
        let total_confidence: f64 = self.active_predictions
            .iter()
            .map(|p| p.prediction.confidence)
            .sum();
        
        if !self.active_predictions.is_empty() {
            self.performance_metrics.average_confidence = 
                total_confidence / self.active_predictions.len() as f64;
        }
    }
    
    async fn prioritize_predictions(&self, predictions: &mut Vec<Prediction>) {
        // Sort by confidence and time sensitivity
        predictions.sort_by(|a, b| {
            let score_a = a.confidence / (a.time_horizon_seconds as f64 / 3600.0); // Confidence per hour
            let score_b = b.confidence / (b.time_horizon_seconds as f64 / 3600.0);
            
            score_b.partial_cmp(&score_a).unwrap_or(std::cmp::Ordering::Equal)
        });
        
        // Keep only top predictions
        predictions.truncate(self.config.max_active_predictions);
    }
    
    async fn generate_proactive_action(
        &self,
        prediction: &Prediction,
        _context: &InteractionContext,
    ) -> Result<Option<ProactiveAction>> {
        match prediction.prediction_type {
            PredictionType::FlowStateBreak => {
                Some(ProactiveAction {
                    action_type: ProactiveActionType::FlowProtection,
                    description: "Enable distraction-free mode to preserve flow state".to_string(),
                    urgency_score: 0.9,
                    impact_score: 0.8,
                    estimated_benefit: "Maintains productivity and reduces context switching".to_string(),
                    implementation_steps: vec![
                        "Minimize notifications".to_string(),
                        "Set focus mode reminder".to_string(),
                        "Prepare break suggestion".to_string(),
                    ],
                })
            }
            PredictionType::UserNeed => {
                if prediction.predicted_action.contains("break") {
                    Some(ProactiveAction {
                        action_type: ProactiveActionType::WellnessIntervention,
                        description: "Suggest optimal break timing".to_string(),
                        urgency_score: 0.7,
                        impact_score: 0.6,
                        estimated_benefit: "Prevents burnout and maintains cognitive performance".to_string(),
                        implementation_steps: vec![
                            "Monitor for natural break point".to_string(),
                            "Suggest brief movement".to_string(),
                            "Offer hydration reminder".to_string(),
                        ],
                    })
                } else {
                    None
                }
            }
            PredictionType::PotentialBug => {
                Some(ProactiveAction {
                    action_type: ProactiveActionType::PreventiveAssistance,
                    description: "Proactive code review suggestion".to_string(),
                    urgency_score: 0.8,
                    impact_score: 0.9,
                    estimated_benefit: "Prevents bugs before they manifest".to_string(),
                    implementation_steps: vec![
                        "Highlight potential issue areas".to_string(),
                        "Suggest testing approach".to_string(),
                        "Offer code review".to_string(),
                    ],
                })
            }
            _ => None,
        }.map(Ok).transpose()
    }
    
    async fn calculate_stress_trend(&self, developer_memory: &DeveloperMemory) -> f64 {
        if developer_memory.emotional_journey.len() < 3 {
            return 0.0;
        }
        
        let recent_snapshots: Vec<_> = developer_memory.emotional_journey
            .iter()
            .rev()
            .take(5)
            .collect();
        
        let stress_levels: Vec<f64> = recent_snapshots
            .iter()
            .map(|snapshot| snapshot.stress_indicators)
            .collect();
        
        // Calculate trend (simple linear regression slope)
        self.calculate_trend(&stress_levels)
    }
    
    async fn calculate_flow_disruption_risk(&self, developer_memory: &DeveloperMemory) -> f64 {
        let recent_flow_breaks = developer_memory.emotional_journey
            .iter()
            .rev()
            .take(10)
            .filter(|snapshot| !snapshot.flow_state_detected)
            .count();
        
        recent_flow_breaks as f64 / 10.0
    }
    
    fn calculate_trend(&self, values: &[f64]) -> f64 {
        if values.len() < 2 {
            return 0.0;
        }
        
        let n = values.len() as f64;
        let x_sum: f64 = (0..values.len()).map(|i| i as f64).sum();
        let y_sum: f64 = values.iter().sum();
        let xy_sum: f64 = values.iter().enumerate().map(|(i, &y)| i as f64 * y).sum();
        let x2_sum: f64 = (0..values.len()).map(|i| (i as f64).powi(2)).sum();
        
        // Slope of linear regression line
        (n * xy_sum - x_sum * y_sum) / (n * x2_sum - x_sum.powi(2))
    }
    
    async fn recalculate_overall_accuracy(&mut self) {
        if self.accuracy_history.is_empty() {
            return;
        }
        
        let recent_records: Vec<_> = self.accuracy_history
            .iter()
            .rev()
            .take(100) // Last 100 predictions
            .collect();
        
        let correct_count = recent_records
            .iter()
            .filter(|record| matches!(record.result, PredictionValidationResult::Correct))
            .count();
        
        self.performance_metrics.overall_accuracy = correct_count as f64 / recent_records.len() as f64;
    }
    
    async fn get_type_specific_accuracy(&self) -> HashMap<PredictionType, f64> {
        let mut accuracies = HashMap::new();
        
        for prediction_type in [
            PredictionType::NextCommand,
            PredictionType::PotentialBug,
            PredictionType::PerformanceIssue,
            PredictionType::UserNeed,
            PredictionType::FlowStateBreak,
            PredictionType::FrustrationPoint,
            PredictionType::LearningOpportunity,
        ] {
            if let Some(model) = self.prediction_models.get(&prediction_type) {
                accuracies.insert(prediction_type, model.model_metrics.accuracy());
            }
        }
        
        accuracies
    }
    
    async fn get_recent_performance(&self) -> f64 {
        // Performance over last 24 hours
        let yesterday = Utc::now() - Duration::days(1);
        
        let recent_records: Vec<_> = self.accuracy_history
            .iter()
            .filter(|record| record.timestamp > yesterday)
            .collect();
        
        if recent_records.is_empty() {
            return 0.5; // Neutral performance
        }
        
        let correct_count = recent_records
            .iter()
            .filter(|record| matches!(record.result, PredictionValidationResult::Correct))
            .count();
        
        correct_count as f64 / recent_records.len() as f64
    }
    
    async fn get_improvement_trends(&self) -> Vec<ImprovementTrend> {
        let mut trends = Vec::new();
        
        for (prediction_type, model) in &self.prediction_models {
            if model.model_metrics.improvement_rate > 0.05 {
                trends.push(ImprovementTrend {
                    prediction_type: prediction_type.clone(),
                    improvement_rate: model.model_metrics.improvement_rate,
                    trend_direction: if model.model_metrics.improvement_rate > 0.0 {
                        TrendDirection::Improving
                    } else {
                        TrendDirection::Declining
                    },
                });
            }
        }
        
        trends
    }
}

// Supporting types and implementations

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureExtractor {
    pub name: String,
    pub extraction_method: String,
    pub importance_weight: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternMatcher {
    pub pattern_type: String,
    pub matching_algorithm: String,
    pub confidence_threshold: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfidenceScorer {
    pub scoring_method: String,
    pub calibration_factor: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelMetrics {
    pub total_predictions: u64,
    pub correct_predictions: u64,
    pub improvement_rate: f64,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringContext {
    pub context_type: String,
    pub monitoring_parameters: HashMap<String, f64>,
    pub validation_criteria: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PredictionValidationStatus {
    Pending,
    Validated,
    Invalidated,
    Expired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PredictionValidationResult {
    Correct,
    Incorrect,
    Uncertain,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccuracyRecord {
    pub timestamp: DateTime<Utc>,
    pub prediction_type: PredictionType,
    pub confidence: f64,
    pub result: PredictionValidationResult,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PredictionConfig {
    pub max_active_predictions: usize,
    pub prediction_horizon_hours: u32,
    pub confidence_threshold: f64,
    pub action_suggestion_threshold: f64,
    pub max_proactive_actions: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PredictionAccuracySummary {
    pub overall_accuracy: f64,
    pub type_specific_accuracy: HashMap<PredictionType, f64>,
    pub recent_performance: f64,
    pub improvement_trends: Vec<ImprovementTrend>,
    pub false_positive_rate: f64,
    pub false_negative_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImprovementTrend {
    pub prediction_type: PredictionType,
    pub improvement_rate: f64,
    pub trend_direction: TrendDirection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TrendDirection {
    Improving,
    Stable,
    Declining,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProactiveAction {
    pub action_type: ProactiveActionType,
    pub description: String,
    pub urgency_score: f64,
    pub impact_score: f64,
    pub estimated_benefit: String,
    pub implementation_steps: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProactiveActionType {
    FlowProtection,
    WellnessIntervention,
    PreventiveAssistance,
    LearningEnhancement,
    PerformanceOptimization,
}

impl PredictionModel {
    async fn new(prediction_type: PredictionType) -> Result<Self> {
        Ok(PredictionModel {
            prediction_type,
            feature_extractors: vec![
                FeatureExtractor {
                    name: "interaction_pattern".to_string(),
                    extraction_method: "frequency_analysis".to_string(),
                    importance_weight: 0.8,
                },
                FeatureExtractor {
                    name: "context_features".to_string(),
                    extraction_method: "statistical_analysis".to_string(),
                    importance_weight: 0.6,
                },
            ],
            pattern_matchers: vec![
                PatternMatcher {
                    pattern_type: "temporal_sequence".to_string(),
                    matching_algorithm: "sliding_window".to_string(),
                    confidence_threshold: 0.7,
                },
            ],
            confidence_scorer: ConfidenceScorer {
                scoring_method: "weighted_average".to_string(),
                calibration_factor: 1.0,
            },
            model_metrics: ModelMetrics::default(),
        })
    }
}

impl ModelMetrics {
    fn accuracy(&self) -> f64 {
        if self.total_predictions == 0 {
            0.5 // Neutral accuracy for new models
        } else {
            self.correct_predictions as f64 / self.total_predictions as f64
        }
    }
}

impl Default for PredictionMetrics {
    fn default() -> Self {
        Self {
            overall_accuracy: 0.5,
            predictions_made: 0,
            predictions_validated: 0,
            false_positive_rate: 0.1,
            false_negative_rate: 0.1,
            average_confidence: 0.6,
            proactive_interventions: 0,
            successful_interventions: 0,
        }
    }
}

impl Default for ModelMetrics {
    fn default() -> Self {
        Self {
            total_predictions: 0,
            correct_predictions: 0,
            improvement_rate: 0.0,
            last_updated: Utc::now(),
        }
    }
}

impl Default for PredictionConfig {
    fn default() -> Self {
        Self {
            max_active_predictions: 10,
            prediction_horizon_hours: 4,
            confidence_threshold: 0.6,
            action_suggestion_threshold: 0.7,
            max_proactive_actions: 3,
        }
    }
}