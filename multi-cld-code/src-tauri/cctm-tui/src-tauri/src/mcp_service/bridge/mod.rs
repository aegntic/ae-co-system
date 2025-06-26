/// Terminal-MCP Bridge for CCTM Phase 2C.4
/// 
/// Provides conversational AI interface for seamless MCP tool execution in terminals.
/// Transforms natural language commands into MCP tool calls with intelligent intent parsing.

pub mod command_parser;
pub mod intent_resolver;
pub mod response_formatter;
pub mod session_manager;

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::{Result, Error};
use serde_json;

use crate::mcp_service::{McpCapability, TerminalContext, ProjectContext};
use crate::mcp_service::legacy_bridge;

pub use command_parser::CommandParser;
pub use intent_resolver::IntentResolver;
pub use response_formatter::ResponseFormatter;
pub use session_manager::BridgeSessionManager;

/// Enhanced Terminal-MCP Bridge with conversational AI capabilities
#[derive(Debug)]
pub struct TerminalMcpBridge {
    /// Legacy bridge for actual MCP communication
    legacy_bridge: Arc<legacy_bridge::McpBridge>,
    
    /// Command parsing for natural language intent extraction
    command_parser: CommandParser,
    
    /// Intent resolution for capability matching
    intent_resolver: IntentResolver,
    
    /// Response formatting for terminal display
    response_formatter: ResponseFormatter,
    
    /// Session management for conversation context
    session_manager: BridgeSessionManager,
    
    /// Active AI sessions by terminal ID
    active_sessions: Arc<RwLock<HashMap<String, AiSession>>>,
}

impl TerminalMcpBridge {
    /// Create a new Terminal-MCP Bridge with AI capabilities
    pub fn new(legacy_bridge: Arc<legacy_bridge::McpBridge>) -> Result<Self> {
        log::info!("Initializing Terminal-MCP Bridge with AI capabilities...");
        
        let command_parser = CommandParser::new()?;
        let intent_resolver = IntentResolver::new();
        let response_formatter = ResponseFormatter::new();
        let session_manager = BridgeSessionManager::new();
        
        Ok(TerminalMcpBridge {
            legacy_bridge,
            command_parser,
            intent_resolver,
            response_formatter,
            session_manager,
            active_sessions: Arc::new(RwLock::new(HashMap::new())),
        })
    }
    
    /// Initialize the enhanced bridge
    pub async fn initialize(&self) -> Result<()> {
        log::info!("Terminal-MCP Bridge initialized with AI capabilities");
        Ok(())
    }
    
    /// Process a natural language command and execute appropriate MCP tools
    pub async fn process_ai_command(
        &self,
        terminal_id: &str,
        command: &str,
        context: TerminalContext,
        available_capabilities: &[McpCapability],
    ) -> Result<AiCommandResponse> {
        log::info!("Processing AI command for terminal {}: '{}'", terminal_id, command);
        
        // Parse command to extract intent
        let parsed_intent = self.command_parser.parse_command(command).await?;
        log::debug!("Parsed intent: {:?}", parsed_intent);
        
        // Resolve intent to specific MCP capabilities
        let resolved_capabilities = self.intent_resolver.resolve_intent(
            &parsed_intent,
            available_capabilities,
            context.project_context.as_ref(),
        ).await?;
        
        if resolved_capabilities.is_empty() {
            return Ok(AiCommandResponse {
                response_type: AiResponseType::NoMatchingCapabilities,
                content: format!("No AI tools available for: '{}'", command),
                suggestions: self.generate_suggestions(available_capabilities).await,
                execution_id: None,
            });
        }
        
        // For now, use the best matching capability
        let best_capability = &resolved_capabilities[0];
        
        // Prepare arguments based on intent and context
        let args = self.prepare_tool_arguments(&parsed_intent, &context).await?;
        
        // Execute the MCP tool via legacy bridge
        let execution_result = self.legacy_bridge
            .execute_tool(&best_capability.name, args, context.clone())
            .await;
        
        // Format the response for terminal display
        let formatted_response = match execution_result {
            Ok(result) => {
                let formatted = self.response_formatter.format_success_response(
                    &best_capability.name,
                    &result,
                    &context,
                ).await?;
                
                AiCommandResponse {
                    response_type: AiResponseType::Success,
                    content: formatted,
                    suggestions: vec![],
                    execution_id: Some(uuid::Uuid::new_v4().to_string()),
                }
            }
            Err(e) => {
                let formatted = self.response_formatter.format_error_response(
                    &best_capability.name,
                    &e,
                    &context,
                ).await?;
                
                AiCommandResponse {
                    response_type: AiResponseType::Error,
                    content: formatted,
                    suggestions: self.generate_error_suggestions(&e, available_capabilities).await,
                    execution_id: None,
                }
            }
        };
        
        // Update session context
        self.session_manager.update_session_context(
            terminal_id,
            command,
            &formatted_response,
        ).await?;
        
        log::info!("AI command processed successfully for terminal {}", terminal_id);
        Ok(formatted_response)
    }
    
    /// Check if a command is an AI command (starts with "ai" or similar)
    pub fn is_ai_command(&self, command: &str) -> bool {
        self.command_parser.is_ai_command(command)
    }
    
    /// Get help information for available AI commands
    pub async fn get_ai_help(&self, terminal_id: &str, available_capabilities: &[McpCapability]) -> Result<String> {
        let help_content = self.response_formatter.format_help_response(
            available_capabilities,
            Some(terminal_id),
        ).await?;
        
        Ok(help_content)
    }
    
    /// Get suggestions for a partial command
    pub async fn get_command_suggestions(
        &self,
        partial_command: &str,
        available_capabilities: &[McpCapability],
    ) -> Result<Vec<String>> {
        self.command_parser.get_command_suggestions(partial_command, available_capabilities).await
    }
    
    /// Get session history for a terminal
    pub async fn get_session_history(&self, terminal_id: &str) -> Vec<AiInteraction> {
        self.session_manager.get_session_history(terminal_id).await
    }
    
    /// Clear session context for a terminal
    pub async fn clear_session(&self, terminal_id: &str) -> Result<()> {
        self.session_manager.clear_session(terminal_id).await?;
        
        let mut active_sessions = self.active_sessions.write().await;
        active_sessions.remove(terminal_id);
        
        log::debug!("Cleared AI session for terminal: {}", terminal_id);
        Ok(())
    }
    
    /// Get bridge statistics including AI usage
    pub async fn get_ai_bridge_statistics(&self) -> AiBridgeStatistics {
        let legacy_stats = self.legacy_bridge.get_bridge_statistics().await;
        let active_sessions = self.active_sessions.read().await;
        
        AiBridgeStatistics {
            total_terminals: legacy_stats.total_terminals,
            total_capabilities: legacy_stats.total_capabilities,
            active_ai_sessions: active_sessions.len(),
            total_ai_commands_processed: 0, // TODO: Track this
            last_updated: chrono::Utc::now(),
        }
    }
    
    // Private helper methods
    
    /// Prepare tool arguments based on parsed intent and context
    async fn prepare_tool_arguments(
        &self,
        intent: &ParsedIntent,
        context: &TerminalContext,
    ) -> Result<serde_json::Value> {
        let mut args = serde_json::Map::new();
        
        // Add context information
        args.insert("current_directory".to_string(), 
                   serde_json::Value::String(context.current_directory.to_string_lossy().to_string()));
        
        if let Some(project_context) = &context.project_context {
            args.insert("project_type".to_string(), 
                       serde_json::Value::String(project_context.project_type.clone()));
            args.insert("primary_language".to_string(), 
                       serde_json::Value::String(project_context.primary_language.clone()));
        }
        
        // Add intent-specific arguments
        for (key, value) in &intent.parameters {
            args.insert(key.clone(), value.clone());
        }
        
        Ok(serde_json::Value::Object(args))
    }
    
    /// Generate suggestions for commands
    async fn generate_suggestions(&self, available_capabilities: &[McpCapability]) -> Vec<String> {
        let mut suggestions = Vec::new();
        
        // Add capability-based suggestions
        for capability in available_capabilities.iter().take(3) {
            suggestions.push(format!("ai {}", capability.description.to_lowercase()));
        }
        
        // Add common AI commands
        suggestions.extend_from_slice(&[
            "ae help".to_string(),
            "ae analyze code".to_string(),
            "ai explain error".to_string(),
        ]);
        
        suggestions
    }
    
    /// Generate error-specific suggestions
    async fn generate_error_suggestions(&self, _error: &Error, available_capabilities: &[McpCapability]) -> Vec<String> {
        let mut suggestions = Vec::new();
        
        suggestions.push("ae help".to_string());
        
        if !available_capabilities.is_empty() {
            suggestions.push(format!("Try: ai {}", available_capabilities[0].description.to_lowercase()));
        }
        
        suggestions
    }
}

/// AI command response
#[derive(Debug, Clone)]
pub struct AiCommandResponse {
    pub response_type: AiResponseType,
    pub content: String,
    pub suggestions: Vec<String>,
    pub execution_id: Option<String>,
}

/// AI response types
#[derive(Debug, Clone, PartialEq)]
pub enum AiResponseType {
    Success,
    Error,
    NoMatchingCapabilities,
    Help,
    Suggestion,
}

/// Parsed intent from natural language command
#[derive(Debug, Clone)]
pub struct ParsedIntent {
    pub action: String,
    pub target: Option<String>,
    pub parameters: HashMap<String, serde_json::Value>,
    pub confidence: f64,
}

/// AI session for conversation context
#[derive(Debug, Clone)]
pub struct AiSession {
    pub terminal_id: String,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub last_activity: chrono::DateTime<chrono::Utc>,
    pub interaction_count: usize,
}

/// AI interaction history entry
#[derive(Debug, Clone)]
pub struct AiInteraction {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub command: String,
    pub response_type: AiResponseType,
    pub execution_time_ms: u64,
}

/// Enhanced bridge statistics
#[derive(Debug, Clone)]
pub struct AiBridgeStatistics {
    pub total_terminals: usize,
    pub total_capabilities: usize,
    pub active_ai_sessions: usize,
    pub total_ai_commands_processed: usize,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

/// Default implementation for easy instantiation
impl Default for TerminalMcpBridge {
    fn default() -> Self {
        // This will create a bridge without legacy bridge - used only for testing
        let legacy_bridge = Arc::new(
            legacy_bridge::McpBridge::new(crate::mcp_service::McpServiceConfig::default())
                .expect("Failed to create legacy bridge")
        );
        Self::new(legacy_bridge).expect("Failed to create TerminalMcpBridge")
    }
}