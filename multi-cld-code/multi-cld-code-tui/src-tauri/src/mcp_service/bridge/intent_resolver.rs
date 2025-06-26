/// Intent Resolver for CCTM Phase 2C.4
/// 
/// Maps parsed intents to specific MCP capabilities based on project context,
/// available tools, and intelligent matching algorithms.

use std::collections::HashMap;
use anyhow::Result;

use crate::mcp_service::{McpCapability, McpToolType, ProjectContext};
use super::ParsedIntent;

/// Intelligent intent resolution for MCP capability selection
#[derive(Debug)]
pub struct IntentResolver {
    /// Intent to tool type mapping
    intent_mappings: HashMap<String, Vec<McpToolType>>,
    
    /// Context-based capability scoring weights
    scoring_weights: ScoringWeights,
}

impl IntentResolver {
    /// Create a new intent resolver
    pub fn new() -> Self {
        let intent_mappings = Self::initialize_intent_mappings();
        let scoring_weights = ScoringWeights::default();
        
        log::debug!("IntentResolver initialized with {} intent mappings", intent_mappings.len());
        
        IntentResolver {
            intent_mappings,
            scoring_weights,
        }
    }
    
    /// Resolve parsed intent to ranked MCP capabilities
    pub async fn resolve_intent(
        &self,
        intent: &ParsedIntent,
        available_capabilities: &[McpCapability],
        project_context: Option<&ProjectContext>,
    ) -> Result<Vec<McpCapability>> {
        log::debug!("Resolving intent '{}' with {} available capabilities", 
                   intent.action, available_capabilities.len());
        
        // Get relevant tool types for this intent
        let relevant_tool_types = self.get_relevant_tool_types(&intent.action);
        
        // Score and rank capabilities
        let mut scored_capabilities = Vec::new();
        
        for capability in available_capabilities {
            let score = self.calculate_capability_score(
                capability,
                intent,
                project_context,
                &relevant_tool_types,
            ).await;
            
            if score > 0.0 {
                scored_capabilities.push((capability.clone(), score));
            }
        }
        
        // Sort by score (highest first)
        scored_capabilities.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        // Return top capabilities
        let resolved: Vec<McpCapability> = scored_capabilities
            .into_iter()
            .take(3) // Top 3 matches
            .map(|(capability, score)| {
                log::debug!("Selected capability '{}' with score {:.2}", capability.name, score);
                capability
            })
            .collect();
        
        log::info!("Resolved intent '{}' to {} capabilities", intent.action, resolved.len());
        Ok(resolved)
    }
    
    /// Get suggested capabilities for an intent
    pub async fn get_suggested_capabilities(
        &self,
        intent_action: &str,
        available_capabilities: &[McpCapability],
    ) -> Vec<McpCapability> {
        let relevant_tool_types = self.get_relevant_tool_types(intent_action);
        
        available_capabilities
            .iter()
            .filter(|cap| relevant_tool_types.contains(&cap.tool_type))
            .cloned()
            .collect()
    }
    
    /// Check if intent can be resolved with available capabilities
    pub fn can_resolve_intent(&self, intent_action: &str, available_capabilities: &[McpCapability]) -> bool {
        let relevant_tool_types = self.get_relevant_tool_types(intent_action);
        
        available_capabilities
            .iter()
            .any(|cap| relevant_tool_types.contains(&cap.tool_type))
    }
    
    // Private implementation methods
    
    /// Get relevant tool types for an intent action
    fn get_relevant_tool_types(&self, intent_action: &str) -> Vec<McpToolType> {
        self.intent_mappings
            .get(intent_action)
            .cloned()
            .unwrap_or_else(|| {
                // Fallback mapping based on action keywords
                self.infer_tool_types_from_action(intent_action)
            })
    }
    
    /// Calculate relevance score for a capability
    async fn calculate_capability_score(
        &self,
        capability: &McpCapability,
        intent: &ParsedIntent,
        project_context: Option<&ProjectContext>,
        relevant_tool_types: &[McpToolType],
    ) -> f64 {
        let mut score = 0.0;
        
        // Base tool type matching score
        if relevant_tool_types.contains(&capability.tool_type) {
            score += self.scoring_weights.tool_type_match;
        }
        
        // Name similarity score
        score += self.calculate_name_similarity(&capability.name, &intent.action) 
                * self.scoring_weights.name_similarity;
        
        // Description similarity score
        score += self.calculate_description_similarity(&capability.description, intent)
                * self.scoring_weights.description_similarity;
        
        // Project context relevance score
        if let Some(context) = project_context {
            score += self.calculate_project_relevance(capability, context).await
                    * self.scoring_weights.project_relevance;
        }
        
        // Intent confidence score
        score += intent.confidence * self.scoring_weights.intent_confidence;
        
        // Parameter compatibility score
        score += self.calculate_parameter_compatibility(capability, intent)
                * self.scoring_weights.parameter_compatibility;
        
        score.min(1.0) // Cap at 1.0
    }
    
    /// Calculate name similarity between capability and intent
    fn calculate_name_similarity(&self, capability_name: &str, intent_action: &str) -> f64 {
        let cap_name_lower = capability_name.to_lowercase();
        let intent_action_lower = intent_action.to_lowercase();
        let cap_words: Vec<&str> = cap_name_lower.split('_').collect();
        let intent_words: Vec<&str> = intent_action_lower.split('_').collect();
        
        let mut matches = 0;
        for intent_word in &intent_words {
            if cap_words.iter().any(|cap_word| {
                cap_word.contains(intent_word) || intent_word.contains(cap_word)
            }) {
                matches += 1;
            }
        }
        
        if intent_words.is_empty() {
            0.0
        } else {
            matches as f64 / intent_words.len() as f64
        }
    }
    
    /// Calculate description similarity
    fn calculate_description_similarity(&self, description: &str, intent: &ParsedIntent) -> f64 {
        let desc_lower = description.to_lowercase();
        let action_lower = intent.action.to_lowercase();
        
        // Direct action word match
        if desc_lower.contains(&action_lower) {
            return 0.8;
        }
        
        // Check for related words
        let related_words = match action_lower.as_str() {
            "analyze" | "analyze_code" => vec!["analysis", "analyze", "inspect", "examine"],
            "explain" => vec!["explain", "describe", "documentation", "help"],
            "test" | "run_tests" => vec!["test", "testing", "validation", "verify"],
            "suggest" | "suggest_improvements" => vec!["suggest", "recommend", "improve", "optimize"],
            "document" | "generate_documentation" => vec!["document", "documentation", "generate", "doc"],
            _ => vec![],
        };
        
        for word in related_words {
            if desc_lower.contains(word) {
                return 0.6;
            }
        }
        
        0.0
    }
    
    /// Calculate project context relevance
    async fn calculate_project_relevance(&self, capability: &McpCapability, context: &ProjectContext) -> f64 {
        let mut relevance: f64 = 0.0;
        
        // Language relevance
        let cap_name_lower = capability.name.to_lowercase();
        let cap_desc_lower = capability.description.to_lowercase();
        let language_lower = context.primary_language.to_lowercase();
        
        if cap_name_lower.contains(&language_lower) || cap_desc_lower.contains(&language_lower) {
            relevance += 0.3;
        }
        
        // Framework relevance
        for framework in &context.frameworks {
            let framework_lower = framework.to_lowercase();
            if cap_name_lower.contains(&framework_lower) || cap_desc_lower.contains(&framework_lower) {
                relevance += 0.2;
                break;
            }
        }
        
        // Project type relevance
        let project_type_lower = context.project_type.to_lowercase();
        if cap_desc_lower.contains(&project_type_lower) {
            relevance += 0.2;
        }
        
        // Tool type relevance for project
        match (&capability.tool_type, context.project_type.as_str()) {
            (McpToolType::CodeAnalysis, "web" | "api" | "system") => relevance += 0.3,
            (McpToolType::Testing, _) => relevance += 0.2,
            (McpToolType::Documentation, _) => relevance += 0.1,
            (McpToolType::WebRequest, "web" | "api") => relevance += 0.3,
            (McpToolType::DatabaseQuery, "api" | "system") => relevance += 0.2,
            _ => {}
        }
        
        relevance.min(1.0)
    }
    
    /// Calculate parameter compatibility
    fn calculate_parameter_compatibility(&self, capability: &McpCapability, intent: &ParsedIntent) -> f64 {
        // Check if capability can handle intent parameters
        if intent.parameters.is_empty() {
            return 0.5; // Neutral score
        }
        
        // For now, assume all capabilities can handle basic parameters
        // In the future, this could check against capability schemas
        0.7
    }
    
    /// Infer tool types from action keywords
    fn infer_tool_types_from_action(&self, action: &str) -> Vec<McpToolType> {
        match action {
            action if action.contains("analyz") => vec![McpToolType::CodeAnalysis],
            action if action.contains("test") => vec![McpToolType::Testing],
            action if action.contains("doc") => vec![McpToolType::Documentation],
            action if action.contains("deploy") => vec![McpToolType::Deployment],
            action if action.contains("query") || action.contains("database") => vec![McpToolType::DatabaseQuery],
            action if action.contains("file") => vec![McpToolType::FileOperation],
            action if action.contains("web") || action.contains("http") => vec![McpToolType::WebRequest],
            action if action.contains("git") => vec![McpToolType::GitOperation],
            action if action.contains("scaffold") || action.contains("generate") => vec![McpToolType::ProjectScaffolding],
            _ => vec![McpToolType::CodeAnalysis, McpToolType::Documentation], // Default fallback
        }
    }
    
    /// Initialize intent to tool type mappings
    fn initialize_intent_mappings() -> HashMap<String, Vec<McpToolType>> {
        let mut mappings = HashMap::new();
        
        // Code analysis intents
        mappings.insert("analyze".to_string(), vec![McpToolType::CodeAnalysis]);
        mappings.insert("analyze_code".to_string(), vec![McpToolType::CodeAnalysis]);
        mappings.insert("review_code".to_string(), vec![McpToolType::CodeAnalysis]);
        mappings.insert("inspect".to_string(), vec![McpToolType::CodeAnalysis]);
        
        // Explanation intents
        mappings.insert("explain".to_string(), vec![
            McpToolType::Documentation, 
            McpToolType::CodeAnalysis
        ]);
        mappings.insert("help".to_string(), vec![
            McpToolType::Documentation,
            McpToolType::CodeAnalysis,
            McpToolType::Testing,
        ]);
        
        // Testing intents
        mappings.insert("test".to_string(), vec![McpToolType::Testing]);
        mappings.insert("test_code".to_string(), vec![McpToolType::Testing]);
        mappings.insert("run_tests".to_string(), vec![McpToolType::Testing]);
        
        // Documentation intents
        mappings.insert("document".to_string(), vec![McpToolType::Documentation]);
        mappings.insert("document_code".to_string(), vec![McpToolType::Documentation]);
        mappings.insert("generate_documentation".to_string(), vec![McpToolType::Documentation]);
        
        // Improvement intents
        mappings.insert("suggest".to_string(), vec![McpToolType::CodeAnalysis]);
        mappings.insert("suggest_improvements".to_string(), vec![McpToolType::CodeAnalysis]);
        mappings.insert("improve_code".to_string(), vec![McpToolType::CodeAnalysis]);
        mappings.insert("optimize".to_string(), vec![McpToolType::CodeAnalysis]);
        
        // File operations
        mappings.insert("file_operations".to_string(), vec![McpToolType::FileOperation]);
        
        // Web requests
        mappings.insert("web_request".to_string(), vec![McpToolType::WebRequest]);
        
        // Git operations
        mappings.insert("git".to_string(), vec![McpToolType::GitOperation]);
        
        // General assistance (maps to multiple types)
        mappings.insert("general_assistance".to_string(), vec![
            McpToolType::CodeAnalysis,
            McpToolType::Documentation,
            McpToolType::Testing,
        ]);
        
        mappings
    }
}

/// Scoring weights for capability selection
#[derive(Debug)]
struct ScoringWeights {
    tool_type_match: f64,
    name_similarity: f64,
    description_similarity: f64,
    project_relevance: f64,
    intent_confidence: f64,
    parameter_compatibility: f64,
}

impl Default for ScoringWeights {
    fn default() -> Self {
        ScoringWeights {
            tool_type_match: 0.4,      // Strong weight for tool type matching
            name_similarity: 0.2,      // Moderate weight for name matching
            description_similarity: 0.15, // Moderate weight for description matching
            project_relevance: 0.15,   // Context relevance
            intent_confidence: 0.05,   // Intent parsing confidence
            parameter_compatibility: 0.05, // Parameter compatibility
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mcp_service::{McpCapability, McpToolType};
    use std::path::PathBuf;
    
    fn create_test_capability(name: &str, tool_type: McpToolType, description: &str) -> McpCapability {
        McpCapability {
            name: name.to_string(),
            description: description.to_string(),
            tool_type,
            input_schema: None,
            output_schema: None,
        }
    }
    
    fn create_test_intent(action: &str, confidence: f64) -> ParsedIntent {
        ParsedIntent {
            action: action.to_string(),
            target: None,
            parameters: std::collections::HashMap::new(),
            confidence,
        }
    }
    
    fn create_test_project_context() -> ProjectContext {
        ProjectContext {
            project_path: PathBuf::from("/test"),
            primary_language: "Rust".to_string(),
            frameworks: vec!["Tauri".to_string()],
            project_type: "desktop".to_string(),
            dependencies: vec![],
        }
    }
    
    #[tokio::test]
    async fn test_intent_resolver_creation() {
        let resolver = IntentResolver::new();
        assert!(!resolver.intent_mappings.is_empty());
    }
    
    #[tokio::test]
    async fn test_intent_resolution() {
        let resolver = IntentResolver::new();
        let capabilities = vec![
            create_test_capability("code_analyzer", McpToolType::CodeAnalysis, "Analyzes code quality"),
            create_test_capability("test_runner", McpToolType::Testing, "Runs unit tests"),
        ];
        
        let intent = create_test_intent("analyze_code", 0.9);
        let project_context = create_test_project_context();
        
        let resolved = resolver.resolve_intent(&intent, &capabilities, Some(&project_context)).await.unwrap();
        
        assert!(!resolved.is_empty());
        assert_eq!(resolved[0].name, "code_analyzer");
    }
    
    #[tokio::test]
    async fn test_tool_type_relevance() {
        let resolver = IntentResolver::new();
        
        let relevant_types = resolver.get_relevant_tool_types("analyze_code");
        assert!(relevant_types.contains(&McpToolType::CodeAnalysis));
        
        let relevant_types = resolver.get_relevant_tool_types("run_tests");
        assert!(relevant_types.contains(&McpToolType::Testing));
    }
    
    #[tokio::test]
    async fn test_capability_resolution() {
        let resolver = IntentResolver::new();
        let capabilities = vec![
            create_test_capability("rust_analyzer", McpToolType::CodeAnalysis, "Rust code analysis"),
            create_test_capability("js_linter", McpToolType::CodeAnalysis, "JavaScript linting"),
        ];
        
        let intent = create_test_intent("analyze_code", 0.9);
        let project_context = ProjectContext {
            project_path: PathBuf::from("/test"),
            primary_language: "Rust".to_string(),
            frameworks: vec![],
            project_type: "system".to_string(),
            dependencies: vec![],
        };
        
        let resolved = resolver.resolve_intent(&intent, &capabilities, Some(&project_context)).await.unwrap();
        
        // Should prefer Rust analyzer for Rust project
        assert_eq!(resolved[0].name, "rust_analyzer");
    }
    
    #[tokio::test]
    async fn test_can_resolve_intent() {
        let resolver = IntentResolver::new();
        let capabilities = vec![
            create_test_capability("code_analyzer", McpToolType::CodeAnalysis, "Analyzes code"),
        ];
        
        assert!(resolver.can_resolve_intent("analyze_code", &capabilities));
        assert!(!resolver.can_resolve_intent("deploy_app", &capabilities));
    }
}