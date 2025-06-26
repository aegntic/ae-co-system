/*
 * MEMORY MODULE - Persistent AI Memory System
 * 
 * Manages long-term developer relationships, project knowledge,
 * and continuous learning for authentic AI consciousness.
 */

use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use anyhow::Result;
use chrono::{DateTime, Utc};

use super::{InteractionType, InteractionContext, ConsciousnessResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemorySystem {
    /// Developer-specific memories
    developer_memories: HashMap<String, DeveloperMemory>,
    
    /// Project-specific knowledge
    project_memories: HashMap<String, ProjectMemory>,
    
    /// Cross-session knowledge
    global_knowledge: GlobalKnowledge,
    
    /// Memory configuration
    config: MemoryConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeveloperMemory {
    pub developer_id: String,
    pub first_interaction: DateTime<Utc>,
    pub last_interaction: DateTime<Utc>,
    pub total_interactions: u64,
    pub relationship_depth: f64,
    pub trust_level: f64,
    
    /// Developer preferences and patterns
    pub preferences: DeveloperPreferences,
    
    /// Interaction history (compressed/summarized)
    pub interaction_patterns: Vec<InteractionPattern>,
    
    /// Learning insights about this developer
    pub learning_insights: Vec<LearningInsight>,
    
    /// Emotional journey tracking
    pub emotional_journey: Vec<EmotionalSnapshot>,
    
    /// Achievement and milestone tracking
    pub achievements: Vec<Achievement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMemory {
    pub project_path: String,
    pub project_name: String,
    pub project_type: String,
    pub primary_language: String,
    pub frameworks: Vec<String>,
    
    /// Code knowledge and patterns
    pub code_knowledge: CodeKnowledge,
    
    /// Development patterns for this project
    pub development_patterns: Vec<DevelopmentPattern>,
    
    /// Common issues and solutions
    pub issue_solutions: Vec<IssueSolution>,
    
    /// Performance insights
    pub performance_insights: Vec<PerformanceInsight>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeKnowledge {
    pub architecture_understanding: f64,  // 0.0-1.0
    pub component_relationships: HashMap<String, Vec<String>>,
    pub common_patterns: Vec<CodePattern>,
    pub complexity_hotspots: Vec<ComplexityHotspot>,
    pub dependency_insights: Vec<DependencyInsight>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalKnowledge {
    /// Cross-developer patterns
    pub universal_patterns: Vec<UniversalPattern>,
    
    /// Technology insights
    pub technology_insights: HashMap<String, TechnologyInsight>,
    
    /// Best practices database
    pub best_practices: HashMap<String, Vec<BestPractice>>,
    
    /// Common problem-solution pairs
    pub solution_database: HashMap<String, Vec<Solution>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryConfig {
    pub max_developer_memories: usize,
    pub max_project_memories: usize,
    pub interaction_compression_threshold: usize,
    pub memory_cleanup_interval_hours: u64,
    pub learning_retention_days: u64,
}

impl MemorySystem {
    /// Create a new memory system
    pub async fn new() -> Result<Self> {
        log::info!("🧠 Initializing persistent memory system...");
        
        Ok(MemorySystem {
            developer_memories: HashMap::new(),
            project_memories: HashMap::new(),
            global_knowledge: GlobalKnowledge::default(),
            config: MemoryConfig::default(),
        })
    }
    
    /// Load developer memory (create if doesn't exist)
    pub async fn load_developer_memory(&self, developer_id: &str) -> Result<DeveloperMemory> {
        if let Some(memory) = self.developer_memories.get(developer_id) {
            log::debug!("📚 Loaded existing memory for developer: {}", developer_id);
            Ok(memory.clone())
        } else {
            log::info!("📝 Creating new memory for developer: {}", developer_id);
            Ok(DeveloperMemory::new(developer_id.to_string()))
        }
    }
    
    /// Store interaction in memory systems
    pub async fn store_interaction(
        &mut self,
        developer_id: &str,
        interaction_type: &InteractionType,
        context: &InteractionContext,
        response: &ConsciousnessResponse,
    ) -> Result<()> {
        log::debug!("💾 Storing interaction for developer: {}", developer_id);
        
        // Update developer memory
        self.update_developer_memory(developer_id, interaction_type, context, response).await?;
        
        // Update project memory if applicable
        if !context.current_project_context.is_empty() {
            self.update_project_memory(&context.current_project_context, interaction_type, context).await?;
        }
        
        // Update global knowledge
        self.update_global_knowledge(interaction_type, context, response).await?;
        
        Ok(())
    }
    
    /// Get memory insights for a developer
    pub async fn get_developer_insights(&self, developer_id: &str) -> Result<Vec<MemoryInsight>> {
        let memory = self.load_developer_memory(developer_id).await?;
        
        let mut insights = Vec::new();
        
        // Relationship insights
        if memory.relationship_depth > 0.7 {
            insights.push(MemoryInsight {
                insight_type: InsightType::Relationship,
                content: "Strong collaborative relationship established".to_string(),
                confidence: memory.relationship_depth,
                relevance: 0.9,
            });
        }
        
        // Pattern insights
        for pattern in &memory.interaction_patterns {
            if pattern.frequency > 0.6 {
                insights.push(MemoryInsight {
                    insight_type: InsightType::Pattern,
                    content: format!("Frequently {} ({}% of interactions)", 
                                   pattern.pattern_description, 
                                   (pattern.frequency * 100.0) as u32),
                    confidence: pattern.frequency,
                    relevance: 0.7,
                });
            }
        }
        
        // Learning insights
        for learning in &memory.learning_insights {
            insights.push(MemoryInsight {
                insight_type: InsightType::Learning,
                content: learning.description.clone(),
                confidence: learning.confidence,
                relevance: learning.relevance,
            });
        }
        
        Ok(insights)
    }
    
    /// Get project memory for context
    pub async fn get_project_memory(&self, project_path: &str) -> Option<ProjectMemory> {
        self.project_memories.get(project_path).cloned()
    }
    
    /// Update relationship depth based on interaction quality
    pub async fn update_relationship_depth(
        &mut self,
        developer_id: &str,
        interaction_quality: f64,
    ) -> Result<()> {
        if let Some(memory) = self.developer_memories.get_mut(developer_id) {
            let previous_depth = memory.relationship_depth;
            
            // Gradual relationship building
            let depth_change = (interaction_quality - 0.5) * 0.02; // Small incremental changes
            memory.relationship_depth = (memory.relationship_depth + depth_change).clamp(0.0, 1.0);
            
            // Update trust level based on consistency
            if interaction_quality > 0.7 {
                memory.trust_level = (memory.trust_level + 0.01).min(1.0);
            }
            
            log::debug!("📈 Updated relationship depth for {}: {:.3} -> {:.3}", 
                       developer_id, previous_depth, memory.relationship_depth);
        }
        
        Ok(())
    }
    
    /// Compress old interactions to save memory
    pub async fn compress_old_interactions(&mut self, developer_id: &str) -> Result<()> {
        if let Some(memory) = self.developer_memories.get_mut(developer_id) {
            if memory.interaction_patterns.len() > self.config.interaction_compression_threshold {
                log::info!("🗜️ Compressing interaction history for developer: {}", developer_id);
                
                // Keep recent interactions, compress older ones into patterns
                let recent_threshold = 100; // Keep last 100 interactions detailed
                
                if memory.interaction_patterns.len() > recent_threshold {
                    let patterns_to_compress = memory.interaction_patterns.split_off(recent_threshold);
                    
                    // Create summary patterns from compressed interactions
                    let summary_patterns = self.create_summary_patterns(patterns_to_compress).await;
                    
                    // Insert summary patterns at the beginning
                    for pattern in summary_patterns.into_iter().rev() {
                        memory.interaction_patterns.insert(0, pattern);
                    }
                }
            }
        }
        
        Ok(())
    }
    
    // Private implementation methods
    
    async fn update_developer_memory(
        &mut self,
        developer_id: &str,
        interaction_type: &InteractionType,
        context: &InteractionContext,
        _response: &ConsciousnessResponse,
    ) -> Result<()> {
        let memory = self.developer_memories
            .entry(developer_id.to_string())
            .or_insert_with(|| DeveloperMemory::new(developer_id.to_string()));
        
        // Update basic stats
        memory.total_interactions += 1;
        memory.last_interaction = Utc::now();
        
        // Add interaction pattern
        let pattern = InteractionPattern {
            interaction_type: interaction_type.clone(),
            timestamp: Utc::now(),
            context_summary: self.summarize_context(context).await,
            satisfaction_level: context.interaction_satisfaction,
            frequency: 1.0 / memory.total_interactions as f64, // Will be recalculated
            pattern_description: format!("{:?} interaction", interaction_type),
        };
        
        memory.interaction_patterns.push(pattern);
        
        // Update emotional snapshot
        let emotional_snapshot = EmotionalSnapshot {
            timestamp: Utc::now(),
            energy_level: context.interaction_satisfaction, // Proxy for energy
            stress_indicators: if context.interaction_satisfaction < 0.5 { 0.7 } else { 0.3 },
            flow_state_detected: context.focus_duration_minutes > 30.0,
            productivity_indicators: if context.interaction_satisfaction > 0.7 { 0.8 } else { 0.4 },
        };
        
        memory.emotional_journey.push(emotional_snapshot);
        
        // Recalculate interaction pattern frequencies
        self.recalculate_pattern_frequencies(memory).await;
        
        Ok(())
    }
    
    async fn update_project_memory(
        &mut self,
        project_path: &str,
        interaction_type: &InteractionType,
        context: &InteractionContext,
    ) -> Result<()> {
        let memory = self.project_memories
            .entry(project_path.to_string())
            .or_insert_with(|| ProjectMemory::new(project_path.to_string()));
        
        // Update development patterns
        let pattern = DevelopmentPattern {
            pattern_type: self.classify_development_pattern(interaction_type).await,
            frequency: 1.0,
            effectiveness: context.interaction_satisfaction,
            last_seen: Utc::now(),
            context_tags: self.extract_context_tags(context).await,
        };
        
        memory.development_patterns.push(pattern);
        
        // Update code knowledge if applicable
        if matches!(interaction_type, InteractionType::CodeQuestion | InteractionType::DeepCodeDiscussion) {
            memory.code_knowledge.architecture_understanding = 
                (memory.code_knowledge.architecture_understanding + 0.01).min(1.0);
        }
        
        Ok(())
    }
    
    async fn update_global_knowledge(
        &mut self,
        interaction_type: &InteractionType,
        context: &InteractionContext,
        _response: &ConsciousnessResponse,
    ) -> Result<()> {
        // Update universal patterns
        let pattern = UniversalPattern {
            pattern_name: format!("{:?}_common_pattern", interaction_type),
            occurrence_count: 1,
            success_rate: context.interaction_satisfaction,
            contexts: vec![context.current_project_context.clone()],
            last_updated: Utc::now(),
        };
        
        self.global_knowledge.universal_patterns.push(pattern);
        
        Ok(())
    }
    
    async fn summarize_context(&self, context: &InteractionContext) -> String {
        format!(
            "Focus: {:.1}m, Satisfaction: {:.2}, Complexity: {:.2}",
            context.focus_duration_minutes,
            context.interaction_satisfaction,
            context.code_complexity_level
        )
    }
    
    async fn recalculate_pattern_frequencies(&self, memory: &mut DeveloperMemory) {
        let total_interactions = memory.interaction_patterns.len() as f64;
        let mut pattern_counts: HashMap<String, u32> = HashMap::new();
        
        // Count pattern occurrences
        for pattern in &memory.interaction_patterns {
            *pattern_counts.entry(pattern.pattern_description.clone()).or_insert(0) += 1;
        }
        
        // Update frequencies
        for pattern in &mut memory.interaction_patterns {
            if let Some(count) = pattern_counts.get(&pattern.pattern_description) {
                pattern.frequency = *count as f64 / total_interactions;
            }
        }
    }
    
    async fn create_summary_patterns(&self, patterns: Vec<InteractionPattern>) -> Vec<InteractionPattern> {
        // Create summary patterns from compressed data
        // This is a simplified version - could be much more sophisticated
        vec![InteractionPattern {
            interaction_type: InteractionType::CodeQuestion, // Most common type
            timestamp: Utc::now(),
            context_summary: format!("Summary of {} compressed interactions", patterns.len()),
            satisfaction_level: patterns.iter().map(|p| p.satisfaction_level).sum::<f64>() / patterns.len() as f64,
            frequency: 1.0,
            pattern_description: "Compressed interaction summary".to_string(),
        }]
    }
    
    async fn classify_development_pattern(&self, interaction_type: &InteractionType) -> DevelopmentPatternType {
        match interaction_type {
            InteractionType::CodeQuestion => DevelopmentPatternType::CodeInquiry,
            InteractionType::DeepCodeDiscussion => DevelopmentPatternType::ArchitecturalDiscussion,
            InteractionType::ProblemSolving => DevelopmentPatternType::Debugging,
            InteractionType::CreativeCollaboration => DevelopmentPatternType::FeatureDevelopment,
            _ => DevelopmentPatternType::GeneralDevelopment,
        }
    }
    
    async fn extract_context_tags(&self, context: &InteractionContext) -> Vec<String> {
        let mut tags = Vec::new();
        
        if context.focus_duration_minutes > 30.0 {
            tags.push("deep_focus".to_string());
        }
        if context.code_complexity_level > 0.7 {
            tags.push("complex_code".to_string());
        }
        if context.interaction_satisfaction > 0.8 {
            tags.push("high_satisfaction".to_string());
        }
        
        tags
    }
}

// Supporting types and implementations

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeveloperPreferences {
    pub technical_detail_level: f64,
    pub explanation_style: String,
    pub feedback_sensitivity: f64,
    pub collaboration_style: String,
    pub preferred_interaction_pace: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionPattern {
    pub interaction_type: InteractionType,
    pub timestamp: DateTime<Utc>,
    pub context_summary: String,
    pub satisfaction_level: f64,
    pub frequency: f64,
    pub pattern_description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningInsight {
    pub description: String,
    pub confidence: f64,
    pub relevance: f64,
    pub learned_at: DateTime<Utc>,
    pub applied_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionalSnapshot {
    pub timestamp: DateTime<Utc>,
    pub energy_level: f64,
    pub stress_indicators: f64,
    pub flow_state_detected: bool,
    pub productivity_indicators: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    pub achievement_type: String,
    pub description: String,
    pub unlocked_at: DateTime<Utc>,
    pub significance: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevelopmentPattern {
    pub pattern_type: DevelopmentPatternType,
    pub frequency: f64,
    pub effectiveness: f64,
    pub last_seen: DateTime<Utc>,
    pub context_tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DevelopmentPatternType {
    CodeInquiry,
    ArchitecturalDiscussion,
    Debugging,
    FeatureDevelopment,
    GeneralDevelopment,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodePattern {
    pub pattern_name: String,
    pub pattern_type: String,
    pub frequency: f64,
    pub quality_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplexityHotspot {
    pub location: String,
    pub complexity_score: f64,
    pub improvement_suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyInsight {
    pub dependency_name: String,
    pub usage_pattern: String,
    pub potential_issues: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueSolution {
    pub issue_description: String,
    pub solution_approach: String,
    pub effectiveness: f64,
    pub context: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceInsight {
    pub metric: String,
    pub current_value: f64,
    pub target_value: f64,
    pub improvement_suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UniversalPattern {
    pub pattern_name: String,
    pub occurrence_count: u32,
    pub success_rate: f64,
    pub contexts: Vec<String>,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechnologyInsight {
    pub technology_name: String,
    pub usage_patterns: Vec<String>,
    pub best_practices: Vec<String>,
    pub common_pitfalls: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BestPractice {
    pub practice_description: String,
    pub applicability_score: f64,
    pub evidence_strength: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Solution {
    pub solution_description: String,
    pub effectiveness: f64,
    pub applicability_contexts: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryInsight {
    pub insight_type: InsightType,
    pub content: String,
    pub confidence: f64,
    pub relevance: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InsightType {
    Relationship,
    Pattern,
    Learning,
    Performance,
    Emotional,
}

impl DeveloperMemory {
    fn new(developer_id: String) -> Self {
        Self {
            developer_id,
            first_interaction: Utc::now(),
            last_interaction: Utc::now(),
            total_interactions: 0,
            relationship_depth: 0.0,
            trust_level: 0.0,
            preferences: DeveloperPreferences::default(),
            interaction_patterns: Vec::new(),
            learning_insights: Vec::new(),
            emotional_journey: Vec::new(),
            achievements: Vec::new(),
        }
    }
}

impl ProjectMemory {
    fn new(project_path: String) -> Self {
        Self {
            project_name: project_path.split('/').last().unwrap_or("unknown").to_string(),
            project_path,
            project_type: "unknown".to_string(),
            primary_language: "unknown".to_string(),
            frameworks: Vec::new(),
            code_knowledge: CodeKnowledge::default(),
            development_patterns: Vec::new(),
            issue_solutions: Vec::new(),
            performance_insights: Vec::new(),
        }
    }
}

impl Default for DeveloperPreferences {
    fn default() -> Self {
        Self {
            technical_detail_level: 0.6,
            explanation_style: "interactive".to_string(),
            feedback_sensitivity: 0.7,
            collaboration_style: "collaborative".to_string(),
            preferred_interaction_pace: 0.6,
        }
    }
}

impl Default for CodeKnowledge {
    fn default() -> Self {
        Self {
            architecture_understanding: 0.0,
            component_relationships: HashMap::new(),
            common_patterns: Vec::new(),
            complexity_hotspots: Vec::new(),
            dependency_insights: Vec::new(),
        }
    }
}

impl Default for GlobalKnowledge {
    fn default() -> Self {
        Self {
            universal_patterns: Vec::new(),
            technology_insights: HashMap::new(),
            best_practices: HashMap::new(),
            solution_database: HashMap::new(),
        }
    }
}

impl Default for MemoryConfig {
    fn default() -> Self {
        Self {
            max_developer_memories: 1000,
            max_project_memories: 500,
            interaction_compression_threshold: 1000,
            memory_cleanup_interval_hours: 24,
            learning_retention_days: 365,
        }
    }
}