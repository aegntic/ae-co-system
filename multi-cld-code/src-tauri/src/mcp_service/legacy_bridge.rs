/// MCP Bridge for CCTM Phase 2C.4
/// 
/// Provides the communication layer between CCTM terminals and MCP servers,
/// handling protocol translation, context injection, and tool orchestration

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::{Result, Error};
use serde_json;

use super::{McpServiceConfig, McpCapability, TerminalContext, McpToolType};

/// MCP Bridge - Communication layer between CCTM and MCP servers
#[derive(Debug)]
pub struct McpBridge {
    config: McpServiceConfig,
    /// Map of terminal ID to available capabilities
    terminal_capabilities: Arc<RwLock<HashMap<String, Vec<McpCapability>>>>,
    /// Map of tool name to server ID for routing
    tool_routing: Arc<RwLock<HashMap<String, String>>>,
    /// Active tool executions for tracking
    active_executions: Arc<RwLock<HashMap<String, ToolExecution>>>,
}

impl McpBridge {
    /// Create a new MCP Bridge
    pub fn new(config: McpServiceConfig) -> Result<Self> {
        log::info!("Initializing MCP Bridge...");
        
        Ok(McpBridge {
            config,
            terminal_capabilities: Arc::new(RwLock::new(HashMap::new())),
            tool_routing: Arc::new(RwLock::new(HashMap::new())),
            active_executions: Arc::new(RwLock::new(HashMap::new())),
        })
    }
    
    /// Initialize the bridge
    pub async fn initialize(&self) -> Result<()> {
        log::info!("MCP Bridge initialized successfully");
        Ok(())
    }
    
    /// Get available MCP capabilities for a specific terminal
    pub async fn get_capabilities_for_terminal(&self, terminal_id: &str) -> Vec<McpCapability> {
        let terminal_capabilities = self.terminal_capabilities.read().await;
        terminal_capabilities
            .get(terminal_id)
            .cloned()
            .unwrap_or_default()
    }
    
    /// Register MCP capabilities for a terminal
    pub async fn register_terminal_capabilities(&self, terminal_id: &str, capabilities: Vec<McpCapability>) -> Result<()> {
        log::debug!("Registering {} MCP capabilities for terminal: {}", capabilities.len(), terminal_id);
        
        // Update terminal capabilities
        {
            let mut terminal_capabilities = self.terminal_capabilities.write().await;
            terminal_capabilities.insert(terminal_id.to_string(), capabilities.clone());
        }
        
        // Update tool routing for this terminal's tools
        {
            let mut tool_routing = self.tool_routing.write().await;
            for capability in capabilities {
                // For now, use terminal_id as server_id (simplified routing)
                tool_routing.insert(capability.name, terminal_id.to_string());
            }
        }
        
        Ok(())
    }
    
    /// Unregister terminal capabilities (when terminal closes)
    pub async fn unregister_terminal(&self, terminal_id: &str) -> Result<()> {
        log::debug!("Unregistering MCP capabilities for terminal: {}", terminal_id);
        
        // Remove terminal capabilities
        let removed_capabilities = {
            let mut terminal_capabilities = self.terminal_capabilities.write().await;
            terminal_capabilities.remove(terminal_id)
        };
        
        // Clean up tool routing
        if let Some(capabilities) = removed_capabilities {
            let mut tool_routing = self.tool_routing.write().await;
            for capability in capabilities {
                tool_routing.remove(&capability.name);
            }
        }
        
        Ok(())
    }
    
    /// Execute an MCP tool with context
    pub async fn execute_tool(&self, tool_name: &str, args: serde_json::Value, context: TerminalContext) -> Result<serde_json::Value> {
        log::info!("Executing MCP tool: {} for terminal: {}", tool_name, context.terminal_id);
        
        // Find the server that provides this tool
        let server_id = {
            let tool_routing = self.tool_routing.read().await;
            tool_routing.get(tool_name)
                .ok_or_else(|| Error::msg(format!("Unknown MCP tool: {}", tool_name)))?
                .clone()
        };
        
        // Create execution tracking
        let execution_id = uuid::Uuid::new_v4().to_string();
        let execution = ToolExecution {
            execution_id: execution_id.clone(),
            tool_name: tool_name.to_string(),
            server_id: server_id.clone(),
            terminal_id: context.terminal_id.clone(),
            started_at: chrono::Utc::now(),
            status: ToolExecutionStatus::Running,
        };
        
        {
            let mut active_executions = self.active_executions.write().await;
            active_executions.insert(execution_id.clone(), execution);
        }
        
        // TODO: Implement actual tool execution
        // For now, return a placeholder response
        let result = self.execute_tool_impl(tool_name, args, context).await;
        
        // Update execution status
        {
            let mut active_executions = self.active_executions.write().await;
            if let Some(execution) = active_executions.get_mut(&execution_id) {
                execution.status = match &result {
                    Ok(_) => ToolExecutionStatus::Completed,
                    Err(_) => ToolExecutionStatus::Failed,
                };
            }
        }
        
        result
    }
    
    /// Get all available tools across all terminals
    pub async fn get_all_available_tools(&self) -> Vec<String> {
        let tool_routing = self.tool_routing.read().await;
        tool_routing.keys().cloned().collect()
    }
    
    /// Get tools available for a specific tool type
    pub async fn get_tools_by_type(&self, tool_type: McpToolType) -> Vec<McpCapability> {
        let terminal_capabilities = self.terminal_capabilities.read().await;
        let mut matching_capabilities = Vec::new();
        
        for capabilities in terminal_capabilities.values() {
            for capability in capabilities {
                if std::mem::discriminant(&capability.tool_type) == std::mem::discriminant(&tool_type) {
                    matching_capabilities.push(capability.clone());
                }
            }
        }
        
        matching_capabilities
    }
    
    /// Get execution status for active tool executions
    pub async fn get_active_executions(&self) -> Vec<ToolExecution> {
        let active_executions = self.active_executions.read().await;
        active_executions.values().cloned().collect()
    }
    
    /// Cancel a running tool execution
    pub async fn cancel_execution(&self, execution_id: &str) -> Result<()> {
        log::info!("Cancelling MCP tool execution: {}", execution_id);
        
        let mut active_executions = self.active_executions.write().await;
        if let Some(execution) = active_executions.get_mut(execution_id) {
            execution.status = ToolExecutionStatus::Cancelled;
            // TODO: Implement actual cancellation logic
        }
        
        Ok(())
    }
    
    /// Clean up completed executions
    pub async fn cleanup_completed_executions(&self) -> Result<()> {
        let mut active_executions = self.active_executions.write().await;
        let before_count = active_executions.len();
        
        active_executions.retain(|_, execution| {
            matches!(execution.status, ToolExecutionStatus::Running)
        });
        
        let cleaned_count = before_count - active_executions.len();
        if cleaned_count > 0 {
            log::debug!("Cleaned up {} completed MCP tool executions", cleaned_count);
        }
        
        Ok(())
    }
    
    /// Get bridge statistics
    pub async fn get_bridge_statistics(&self) -> McpBridgeStatistics {
        let terminal_capabilities = self.terminal_capabilities.read().await;
        let tool_routing = self.tool_routing.read().await;
        let active_executions = self.active_executions.read().await;
        
        let total_terminals = terminal_capabilities.len();
        let total_capabilities = terminal_capabilities.values()
            .map(|caps| caps.len())
            .sum();
        let total_tools = tool_routing.len();
        let active_executions_count = active_executions.len();
        
        McpBridgeStatistics {
            total_terminals,
            total_capabilities,
            total_tools,
            active_executions_count,
            last_updated: chrono::Utc::now(),
        }
    }
    
    // Private implementation methods
    
    /// Actual tool execution implementation
    async fn execute_tool_impl(&self, tool_name: &str, args: serde_json::Value, context: TerminalContext) -> Result<serde_json::Value> {
        // TODO: Implement actual MCP protocol communication
        // For now, return a placeholder response based on tool type
        
        let response = match tool_name {
            "code_analysis" => {
                serde_json::json!({
                    "status": "success",
                    "analysis": {
                        "language": "detected",
                        "issues": [],
                        "suggestions": ["Consider adding type hints", "Add unit tests"]
                    },
                    "context": {
                        "directory": context.current_directory,
                        "project_type": "detected_project_type"
                    }
                })
            },
            "documentation" => {
                serde_json::json!({
                    "status": "success",
                    "documentation": {
                        "generated": true,
                        "format": "markdown",
                        "content": "# Generated Documentation\n\nThis is auto-generated documentation."
                    }
                })
            },
            "test_runner" => {
                serde_json::json!({
                    "status": "success",
                    "test_results": {
                        "total": 10,
                        "passed": 8,
                        "failed": 2,
                        "details": "Test execution completed"
                    }
                })
            },
            _ => {
                serde_json::json!({
                    "status": "success",
                    "message": format!("Tool {} executed successfully", tool_name),
                    "args": args,
                    "context": {
                        "terminal_id": context.terminal_id,
                        "directory": context.current_directory
                    }
                })
            }
        };
        
        log::debug!("MCP tool {} executed successfully", tool_name);
        Ok(response)
    }
}

/// Tool execution tracking
#[derive(Debug, Clone)]
pub struct ToolExecution {
    pub execution_id: String,
    pub tool_name: String,
    pub server_id: String,
    pub terminal_id: String,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub status: ToolExecutionStatus,
}

/// Tool execution status
#[derive(Debug, Clone, PartialEq)]
pub enum ToolExecutionStatus {
    Running,
    Completed,
    Failed,
    Cancelled,
}

/// Bridge statistics for monitoring
#[derive(Debug, Clone)]
pub struct McpBridgeStatistics {
    pub total_terminals: usize,
    pub total_capabilities: usize,
    pub total_tools: usize,
    pub active_executions_count: usize,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::mcp_service::{McpServiceConfig, McpCapability, McpToolType};
    use std::path::PathBuf;
    use std::collections::HashMap;
    
    fn create_test_capability(name: &str, tool_type: McpToolType) -> McpCapability {
        McpCapability {
            name: name.to_string(),
            description: format!("Test capability: {}", name),
            tool_type,
            input_schema: None,
            output_schema: None,
        }
    }
    
    fn create_test_context(terminal_id: &str) -> TerminalContext {
        TerminalContext {
            terminal_id: terminal_id.to_string(),
            current_directory: PathBuf::from("/test"),
            project_context: None,
            recent_commands: vec![],
            environment_variables: HashMap::new(),
        }
    }
    
    #[tokio::test]
    async fn test_bridge_creation() {
        let config = McpServiceConfig::default();
        let bridge = McpBridge::new(config).unwrap();
        
        let stats = bridge.get_bridge_statistics().await;
        assert_eq!(stats.total_terminals, 0);
        assert_eq!(stats.total_tools, 0);
    }
    
    #[tokio::test]
    async fn test_bridge_initialization() {
        let config = McpServiceConfig::default();
        let bridge = McpBridge::new(config).unwrap();
        
        bridge.initialize().await.unwrap();
        
        let stats = bridge.get_bridge_statistics().await;
        assert_eq!(stats.total_terminals, 0);
    }
    
    #[tokio::test]
    async fn test_terminal_capabilities_registration() {
        let config = McpServiceConfig::default();
        let bridge = McpBridge::new(config).unwrap();
        
        let capabilities = vec![
            create_test_capability("test_tool", McpToolType::CodeAnalysis),
            create_test_capability("doc_tool", McpToolType::Documentation),
        ];
        
        bridge.register_terminal_capabilities("terminal1", capabilities).await.unwrap();
        
        let terminal_capabilities = bridge.get_capabilities_for_terminal("terminal1").await;
        assert_eq!(terminal_capabilities.len(), 2);
        
        let all_tools = bridge.get_all_available_tools().await;
        assert_eq!(all_tools.len(), 2);
        assert!(all_tools.contains(&"test_tool".to_string()));
        assert!(all_tools.contains(&"doc_tool".to_string()));
    }
    
    #[tokio::test]
    async fn test_tool_execution() {
        let config = McpServiceConfig::default();
        let bridge = McpBridge::new(config).unwrap();
        
        let capabilities = vec![
            create_test_capability("code_analysis", McpToolType::CodeAnalysis),
        ];
        
        bridge.register_terminal_capabilities("terminal1", capabilities).await.unwrap();
        
        let context = create_test_context("terminal1");
        let args = serde_json::json!({"file": "test.rs"});
        
        let result = bridge.execute_tool("code_analysis", args, context).await;
        assert!(result.is_ok());
        
        let response = result.unwrap();
        assert_eq!(response["status"], "success");
    }
    
    #[tokio::test]
    async fn test_terminal_unregistration() {
        let config = McpServiceConfig::default();
        let bridge = McpBridge::new(config).unwrap();
        
        let capabilities = vec![
            create_test_capability("test_tool", McpToolType::CodeAnalysis),
        ];
        
        bridge.register_terminal_capabilities("terminal1", capabilities).await.unwrap();
        
        let stats_before = bridge.get_bridge_statistics().await;
        assert_eq!(stats_before.total_terminals, 1);
        assert_eq!(stats_before.total_tools, 1);
        
        bridge.unregister_terminal("terminal1").await.unwrap();
        
        let stats_after = bridge.get_bridge_statistics().await;
        assert_eq!(stats_after.total_terminals, 0);
        assert_eq!(stats_after.total_tools, 0);
    }
    
    #[tokio::test]
    async fn test_tools_by_type() {
        let config = McpServiceConfig::default();
        let bridge = McpBridge::new(config).unwrap();
        
        let capabilities = vec![
            create_test_capability("analyze1", McpToolType::CodeAnalysis),
            create_test_capability("analyze2", McpToolType::CodeAnalysis),
            create_test_capability("doc1", McpToolType::Documentation),
        ];
        
        bridge.register_terminal_capabilities("terminal1", capabilities).await.unwrap();
        
        let code_analysis_tools = bridge.get_tools_by_type(McpToolType::CodeAnalysis).await;
        assert_eq!(code_analysis_tools.len(), 2);
        
        let documentation_tools = bridge.get_tools_by_type(McpToolType::Documentation).await;
        assert_eq!(documentation_tools.len(), 1);
    }
}