/// Command Parser for CCTM Phase 2C.4
/// 
/// Transforms natural language commands into structured intents for MCP tool execution.
/// Provides intelligent command interpretation with context awareness.

use std::collections::HashMap;
use anyhow::{Result, Error};
use serde_json;
use regex::Regex;

use crate::mcp_service::McpCapability;
use super::{ParsedIntent};

/// Natural language command parser for AI interactions
#[derive(Debug)]
pub struct CommandParser {
    /// AI command patterns (keyword matching initially)
    ai_patterns: Vec<AiPattern>,
    
    /// Parameter extraction patterns
    parameter_patterns: Vec<ParameterPattern>,
}

impl CommandParser {
    /// Create a new command parser
    pub fn new() -> Result<Self> {
        let ai_patterns = Self::initialize_ai_patterns();
        let parameter_patterns = Self::initialize_parameter_patterns();
        
        log::debug!("CommandParser initialized with {} AI patterns", ai_patterns.len());
        
        Ok(CommandParser {
            ai_patterns,
            parameter_patterns,
        })
    }
    
    /// Check if a command is an AI command
    pub fn is_ai_command(&self, command: &str) -> bool {
        let normalized = command.trim().to_lowercase();
        
        // Direct AE command indicators
        if normalized.starts_with("ae ") || 
           normalized.starts_with("ae:") ||
           normalized == "ae" {
            return true;
        }
        
        // Check for AI pattern matches
        for pattern in &self.ai_patterns {
            if pattern.regex.is_match(&normalized) {
                return true;
            }
        }
        
        false
    }
    
    /// Parse a natural language command into structured intent
    pub async fn parse_command(&self, command: &str) -> Result<ParsedIntent> {
        let normalized = command.trim().to_lowercase();
        
        // Handle direct AE commands (e.g., "ae analyze code")
        if let Some(ae_command) = self.extract_ae_command(&normalized) {
            return self.parse_ae_command(&ae_command).await;
        }
        
        // Handle implicit AI commands (e.g., "analyze this file")
        self.parse_implicit_command(&normalized).await
    }
    
    /// Get command suggestions for autocomplete
    pub async fn get_command_suggestions(
        &self,
        partial_command: &str,
        available_capabilities: &[McpCapability],
    ) -> Result<Vec<String>> {
        let mut suggestions = Vec::new();
        let partial = partial_command.trim().to_lowercase();
        
        // Direct AE command suggestions
        if partial.starts_with("ae") {
            suggestions.extend(self.get_ae_command_suggestions(&partial, available_capabilities));
        }
        
        // Add common AE commands
        if partial.is_empty() || "ae".starts_with(&partial) {
            suggestions.extend_from_slice(&[
                "ae help".to_string(),
                "ae analyze code".to_string(),
                "ae explain error".to_string(),
                "ae suggest improvements".to_string(),
                "ae run tests".to_string(),
                "ae generate docs".to_string(),
            ]);
        }
        
        // Filter and sort suggestions
        suggestions.retain(|s| s.to_lowercase().contains(&partial));
        suggestions.sort();
        suggestions.dedup();
        
        Ok(suggestions.into_iter().take(10).collect())
    }
    
    // Private implementation methods
    
    /// Extract AE command from direct AE invocation
    fn extract_ae_command(&self, normalized: &str) -> Option<String> {
        if normalized.starts_with("ae ") {
            Some(normalized[3..].trim().to_string())
        } else if normalized.starts_with("ae:") {
            Some(normalized[3..].trim().to_string())
        } else if normalized == "ae" {
            Some("help".to_string())
        } else {
            None
        }
    }
    
    /// Parse explicit AE command
    async fn parse_ae_command(&self, ae_command: &str) -> Result<ParsedIntent> {
        // Find matching AI pattern
        for pattern in &self.ai_patterns {
            if let Some(captures) = pattern.regex.captures(ae_command) {
                let mut parameters = HashMap::new();
                
                // Extract pattern-specific parameters
                for (i, group) in captures.iter().enumerate().skip(1) {
                    if let Some(matched) = group {
                        parameters.insert(
                            format!("param_{}", i),
                            serde_json::Value::String(matched.as_str().to_string()),
                        );
                    }
                }
                
                // Extract additional parameters using parameter patterns
                self.extract_parameters(ae_command, &mut parameters);
                
                return Ok(ParsedIntent {
                    action: pattern.action.clone(),
                    target: self.extract_target(ae_command),
                    parameters,
                    confidence: pattern.confidence,
                });
            }
        }
        
        // Fallback parsing for unknown commands
        self.parse_fallback_command(ae_command).await
    }
    
    /// Parse implicit AI command (natural language without "ai" prefix)
    async fn parse_implicit_command(&self, normalized: &str) -> Result<ParsedIntent> {
        // Check for implicit AI patterns
        for pattern in &self.ai_patterns {
            if pattern.implicit && pattern.regex.is_match(normalized) {
                let mut parameters = HashMap::new();
                self.extract_parameters(normalized, &mut parameters);
                
                return Ok(ParsedIntent {
                    action: pattern.action.clone(),
                    target: self.extract_target(normalized),
                    parameters,
                    confidence: pattern.confidence * 0.8, // Lower confidence for implicit
                });
            }
        }
        
        // Default to general assistance
        Ok(ParsedIntent {
            action: "general_assistance".to_string(),
            target: Some(normalized.to_string()),
            parameters: HashMap::new(),
            confidence: 0.3,
        })
    }
    
    /// Fallback parsing for unknown AI commands
    async fn parse_fallback_command(&self, command: &str) -> Result<ParsedIntent> {
        let mut parameters = HashMap::new();
        parameters.insert("original_command".to_string(), serde_json::Value::String(command.to_string()));
        
        // Try to infer action from keywords
        let action = if command.contains("analyz") {
            "analyze"
        } else if command.contains("explain") || command.contains("help") {
            "explain"
        } else if command.contains("test") {
            "test"
        } else if command.contains("doc") {
            "document"
        } else if command.contains("suggest") || command.contains("improve") {
            "suggest"
        } else {
            "general_assistance"
        };
        
        Ok(ParsedIntent {
            action: action.to_string(),
            target: Some(command.to_string()),
            parameters,
            confidence: 0.5,
        })
    }
    
    /// Extract target from command (file, directory, etc.)
    fn extract_target(&self, command: &str) -> Option<String> {
        // Look for file/path patterns
        let file_regex = Regex::new(r"\b[\w\./]+\.(rs|js|ts|py|go|java|cpp|c|h)\b").unwrap();
        if let Some(captures) = file_regex.find(command) {
            return Some(captures.as_str().to_string());
        }
        
        // Look for "this" patterns
        if command.contains("this file") || command.contains("this code") {
            return Some("current_file".to_string());
        }
        
        // Look for directory patterns
        let dir_regex = Regex::new(r"\b[\w\./]+/\b").unwrap();
        if let Some(captures) = dir_regex.find(command) {
            return Some(captures.as_str().to_string());
        }
        
        None
    }
    
    /// Extract parameters using parameter patterns
    fn extract_parameters(&self, command: &str, parameters: &mut HashMap<String, serde_json::Value>) {
        for pattern in &self.parameter_patterns {
            if let Some(captures) = pattern.regex.captures(command) {
                if let Some(value) = captures.get(1) {
                    parameters.insert(
                        pattern.parameter_name.clone(),
                        serde_json::Value::String(value.as_str().to_string()),
                    );
                }
            }
        }
    }
    
    /// Get AE command suggestions
    fn get_ae_command_suggestions(&self, partial: &str, capabilities: &[McpCapability]) -> Vec<String> {
        let mut suggestions = Vec::new();
        
        // Add capability-based suggestions
        for capability in capabilities {
            let suggestion = format!("ae {}", capability.description.to_lowercase());
            if suggestion.contains(partial) {
                suggestions.push(suggestion);
            }
        }
        
        // Add pattern-based suggestions
        for pattern in &self.ai_patterns {
            let suggestion = format!("ae {}", pattern.example);
            if suggestion.contains(partial) {
                suggestions.push(suggestion);
            }
        }
        
        suggestions
    }
    
    /// Initialize AI command patterns
    fn initialize_ai_patterns() -> Vec<AiPattern> {
        vec![
            // Code analysis patterns
            AiPattern {
                regex: Regex::new(r"analyz[e]?\s*(code|file|this)?").unwrap(),
                action: "analyze_code".to_string(),
                confidence: 0.9,
                implicit: true,
                example: "analyze code".to_string(),
            },
            AiPattern {
                regex: Regex::new(r"review\s*(code|file|this)?").unwrap(),
                action: "review_code".to_string(),
                confidence: 0.85,
                implicit: true,
                example: "review code".to_string(),
            },
            
            // Explanation patterns
            AiPattern {
                regex: Regex::new(r"explain\s*(this|error|function|code)?").unwrap(),
                action: "explain".to_string(),
                confidence: 0.9,
                implicit: true,
                example: "explain this".to_string(),
            },
            AiPattern {
                regex: Regex::new(r"what\s*(is|does)\s*this").unwrap(),
                action: "explain".to_string(),
                confidence: 0.8,
                implicit: true,
                example: "what is this".to_string(),
            },
            
            // Testing patterns
            AiPattern {
                regex: Regex::new(r"(run\s+)?tests?").unwrap(),
                action: "run_tests".to_string(),
                confidence: 0.85,
                implicit: true,
                example: "run tests".to_string(),
            },
            AiPattern {
                regex: Regex::new(r"test\s*(this|file|code)?").unwrap(),
                action: "test_code".to_string(),
                confidence: 0.8,
                implicit: true,
                example: "test this".to_string(),
            },
            
            // Documentation patterns
            AiPattern {
                regex: Regex::new(r"(generate\s+)?docs?").unwrap(),
                action: "generate_documentation".to_string(),
                confidence: 0.85,
                implicit: false,
                example: "generate docs".to_string(),
            },
            AiPattern {
                regex: Regex::new(r"document\s*(this|code|function)?").unwrap(),
                action: "document_code".to_string(),
                confidence: 0.8,
                implicit: true,
                example: "document this".to_string(),
            },
            
            // Improvement patterns
            AiPattern {
                regex: Regex::new(r"suggest\s*(improvements?|fixes?)?").unwrap(),
                action: "suggest_improvements".to_string(),
                confidence: 0.85,
                implicit: true,
                example: "suggest improvements".to_string(),
            },
            AiPattern {
                regex: Regex::new(r"improve\s*(this|code|performance)?").unwrap(),
                action: "improve_code".to_string(),
                confidence: 0.8,
                implicit: true,
                example: "improve this".to_string(),
            },
            
            // Help patterns
            AiPattern {
                regex: Regex::new(r"help").unwrap(),
                action: "help".to_string(),
                confidence: 1.0,
                implicit: false,
                example: "help".to_string(),
            },
        ]
    }
    
    /// Initialize parameter extraction patterns
    fn initialize_parameter_patterns() -> Vec<ParameterPattern> {
        vec![
            ParameterPattern {
                regex: Regex::new(r"file\s+([^\s]+)").unwrap(),
                parameter_name: "file_path".to_string(),
            },
            ParameterPattern {
                regex: Regex::new(r"in\s+([^\s]+)").unwrap(),
                parameter_name: "directory".to_string(),
            },
            ParameterPattern {
                regex: Regex::new(r"format\s+([^\s]+)").unwrap(),
                parameter_name: "output_format".to_string(),
            },
            ParameterPattern {
                regex: Regex::new(r"language\s+([^\s]+)").unwrap(),
                parameter_name: "language".to_string(),
            },
        ]
    }
}

/// AI command pattern for intent recognition
#[derive(Debug)]
struct AiPattern {
    regex: Regex,
    action: String,
    confidence: f64,
    implicit: bool, // Can be triggered without "ai" prefix
    example: String,
}

/// Parameter extraction pattern
#[derive(Debug)]
struct ParameterPattern {
    regex: Regex,
    parameter_name: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_command_parser_creation() {
        let parser = CommandParser::new().unwrap();
        assert!(!parser.ai_patterns.is_empty());
    }
    
    #[tokio::test]
    async fn test_ai_command_detection() {
        let parser = CommandParser::new().unwrap();
        
        assert!(parser.is_ai_command("ae help"));
        assert!(parser.is_ai_command("ae analyze code"));
        assert!(parser.is_ai_command("ae: test this"));
        assert!(parser.is_ai_command("analyze this file"));
        assert!(!parser.is_ai_command("ls -la"));
        assert!(!parser.is_ai_command("git status"));
    }
    
    #[tokio::test]
    async fn test_command_parsing() {
        let parser = CommandParser::new().unwrap();
        
        let intent = parser.parse_command("ae analyze code").await.unwrap();
        assert_eq!(intent.action, "analyze_code");
        assert!(intent.confidence > 0.8);
        
        let intent = parser.parse_command("ae help").await.unwrap();
        assert_eq!(intent.action, "help");
        assert_eq!(intent.confidence, 1.0);
    }
    
    #[tokio::test]
    async fn test_implicit_command_parsing() {
        let parser = CommandParser::new().unwrap();
        
        let intent = parser.parse_command("analyze this file").await.unwrap();
        assert_eq!(intent.action, "analyze_code");
        assert!(intent.confidence > 0.6);
        
        let intent = parser.parse_command("run tests").await.unwrap();
        assert_eq!(intent.action, "run_tests");
    }
    
    #[tokio::test]
    async fn test_parameter_extraction() {
        let parser = CommandParser::new().unwrap();
        
        let intent = parser.parse_command("ae analyze file main.rs").await.unwrap();
        assert!(intent.parameters.contains_key("file_path"));
        
        let intent = parser.parse_command("ae test this").await.unwrap();
        assert_eq!(intent.target, Some("current_file".to_string()));
    }
    
    #[tokio::test]
    async fn test_command_suggestions() {
        let parser = CommandParser::new().unwrap();
        let capabilities = vec![];
        
        let suggestions = parser.get_command_suggestions("ae", &capabilities).await.unwrap();
        assert!(!suggestions.is_empty());
        assert!(suggestions.iter().any(|s| s.contains("help")));
    }
}