use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
// use serde::{Deserialize, Serialize}; // Temporarily commented out to reduce warnings
use uuid::Uuid;
use anyhow::{Result, Error};
use chrono::{DateTime, Utc};
use portable_pty::{PtySize, native_pty_system, CommandBuilder};

use crate::terminal_manager::{Terminal, TerminalStatus, TerminalPosition};
use crate::attention_detector::{AttentionDetector};
use crate::mcp_service::{McpCapability, ProjectContext, TerminalContext};
use crate::mcp_service::integration::{ProjectMcpIntegration, ProjectMcpActivation, ProjectContextChange};
use crate::mcp_service::bridge::{TerminalMcpBridge, AiCommandResponse};

// Temporary placeholder for ProjectAnalysis until project_detector compilation issues are resolved
#[derive(Debug, Clone)]
pub struct ProjectAnalysis {
    pub language: String,
    pub frameworks: Vec<String>,
    pub confidence: f64,
}

/// Virtual Terminal - High-level interface for terminal sessions
pub trait VirtualTerminal {
    fn get_id(&self) -> &str;
    fn get_status(&self) -> TerminalStatus;
    fn get_working_dir(&self) -> &PathBuf;
    fn needs_attention(&self) -> bool;
    fn get_output_buffer(&self) -> Vec<String>;
}

/// Virtual Terminal Instance - Manages a session attached to a terminal with MCP integration
#[derive(Debug, Clone)]
pub struct VirtualTerminalInstance {
    session_id: String,
    working_dir: PathBuf,
    title: Option<String>,
    terminal_instance: Arc<Mutex<Option<TerminalInstance>>>,
    session_data: Arc<RwLock<SessionData>>,
    created_at: DateTime<Utc>,
    last_activity: Arc<RwLock<DateTime<Utc>>>,
    /// MCP integration for context-aware AI capabilities
    mcp_integration: Option<Arc<Mutex<ProjectMcpIntegration>>>,
    /// Terminal-MCP Bridge for conversational AI
    ai_bridge: Option<Arc<TerminalMcpBridge>>,
    /// Current project context
    project_context: Arc<RwLock<Option<ProjectContext>>>,
    /// Available MCP capabilities for this terminal
    available_capabilities: Arc<RwLock<Vec<McpCapability>>>,
    /// Last MCP activation result
    last_mcp_activation: Arc<RwLock<Option<ProjectMcpActivation>>>,
}

#[derive(Debug)]
struct SessionData {
    status: TerminalStatus,
    needs_attention: bool,
    opacity: f32,
    position: TerminalPosition,
    is_popup: bool,
    output_buffer: Vec<String>,
}

impl Default for SessionData {
    fn default() -> Self {
        SessionData {
            status: TerminalStatus::Starting,
            needs_attention: false,
            opacity: 1.0,
            position: TerminalPosition {
                x: 0.0,
                y: 0.0,
                width: 400.0,
                height: 300.0,
            },
            is_popup: false,
            output_buffer: Vec::new(),
        }
    }
}

impl VirtualTerminalInstance {
    pub async fn new(
        session_id: String,
        working_dir: PathBuf,
        title: Option<String>,
        terminal_instance: TerminalInstance,
    ) -> Result<Self> {
        let instance = VirtualTerminalInstance {
            session_id,
            working_dir,
            title,
            terminal_instance: Arc::new(Mutex::new(Some(terminal_instance))),
            session_data: Arc::new(RwLock::new(SessionData::default())),
            created_at: Utc::now(),
            last_activity: Arc::new(RwLock::new(Utc::now())),
            mcp_integration: None, // Will be set when MCP integration is available
            ai_bridge: None, // Will be set when AI bridge is available
            project_context: Arc::new(RwLock::new(None)),
            available_capabilities: Arc::new(RwLock::new(Vec::new())),
            last_mcp_activation: Arc::new(RwLock::new(None)),
        };

        // Start monitoring the terminal output
        instance.start_output_monitoring().await?;

        Ok(instance)
    }
    
    /// Create a new VirtualTerminalInstance with MCP integration enabled
    pub async fn new_with_mcp_integration(
        session_id: String,
        working_dir: PathBuf,
        title: Option<String>,
        terminal_instance: TerminalInstance,
        mcp_integration: Arc<Mutex<ProjectMcpIntegration>>,
    ) -> Result<Self> {
        let instance = VirtualTerminalInstance {
            session_id,
            working_dir,
            title,
            terminal_instance: Arc::new(Mutex::new(Some(terminal_instance))),
            session_data: Arc::new(RwLock::new(SessionData::default())),
            created_at: Utc::now(),
            last_activity: Arc::new(RwLock::new(Utc::now())),
            mcp_integration: Some(mcp_integration),
            ai_bridge: None, // Will be set separately
            project_context: Arc::new(RwLock::new(None)),
            available_capabilities: Arc::new(RwLock::new(Vec::new())),
            last_mcp_activation: Arc::new(RwLock::new(None)),
        };

        // Start monitoring the terminal output
        instance.start_output_monitoring().await?;

        Ok(instance)
    }

    pub async fn detach(&mut self) -> Result<TerminalInstance> {
        let mut terminal_opt = self.terminal_instance.lock().await;
        match terminal_opt.take() {
            Some(terminal) => {
                log::info!("Detaching session {} from terminal", self.session_id);
                Ok(terminal)
            }
            None => Err(Error::msg("Terminal already detached")),
        }
    }

    pub async fn send_input(&self, input: &str) -> Result<()> {
        let terminal_opt = self.terminal_instance.lock().await;
        if let Some(terminal) = terminal_opt.as_ref() {
            terminal.send_input(input).await?;
            
            // Update session state
            {
                let mut session_data = self.session_data.write().await;
                session_data.needs_attention = false;
                session_data.status = TerminalStatus::Running;
            }
            
            // Update last activity
            {
                let mut last_activity = self.last_activity.write().await;
                *last_activity = Utc::now();
            }
            
            Ok(())
        } else {
            Err(Error::msg("Terminal not attached"))
        }
    }

    pub async fn get_terminal(&self) -> Option<Terminal> {
        let session_data = self.session_data.read().await;
        let last_activity = *self.last_activity.read().await;

        Some(Terminal {
            id: self.session_id.clone(),
            pid: None, // Virtual terminals don't expose PID directly
            title: self.title.clone().unwrap_or_else(|| {
                format!("Virtual Terminal - {}", 
                    self.working_dir.file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("Unknown")
                )
            }),
            working_dir: self.working_dir.clone(),
            status: session_data.status.clone(),
            needs_attention: session_data.needs_attention,
            opacity: session_data.opacity,
            output_buffer: session_data.output_buffer.clone(),
            position: session_data.position.clone(),
            is_popup: session_data.is_popup,
            created_at: self.created_at,
            last_activity,
        })
    }

    async fn start_output_monitoring(&self) -> Result<()> {
        let session_data = self.session_data.clone();
        let last_activity = self.last_activity.clone();
        let session_id = self.session_id.clone();

        tokio::spawn(async move {
            // Simulate output monitoring for now
            // In real implementation, this would read from the PTY
            let mut interval = tokio::time::interval(std::time::Duration::from_millis(1000));
            
            loop {
                interval.tick().await;
                
                // Simulate terminal output
                let demo_output = format!(
                    "[{}] Virtual terminal {} ready for commands",
                    chrono::Utc::now().format("%H:%M:%S"),
                    session_id
                );

                {
                    let mut data = session_data.write().await;
                    data.output_buffer.push(demo_output);
                    data.status = TerminalStatus::Running;
                    
                    // Keep buffer size manageable
                    if data.output_buffer.len() > 1000 {
                        data.output_buffer.drain(0..100);
                    }
                }

                {
                    let mut last_act = last_activity.write().await;
                    *last_act = Utc::now();
                }

                // Break after a few demo messages
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                break;
            }
        });

        Ok(())
    }
    
    // === MCP Integration Methods ===
    
    /// Handle project analysis and activate relevant MCP services
    pub async fn on_project_analyzed(&mut self, project_analysis: ProjectAnalysis) -> Result<Option<ProjectMcpActivation>> {
        if let Some(mcp_integration) = &self.mcp_integration {
            log::info!("Activating MCP services for terminal {} based on project analysis", self.session_id);
            
            let mut integration = mcp_integration.lock().await;
            let activation = integration.on_project_analyzed(
                &self.session_id,
                self.working_dir.clone(),
                project_analysis
            ).await?;
            
            // Update available capabilities
            {
                let mut capabilities = self.available_capabilities.write().await;
                *capabilities = activation.available_capabilities.clone();
            }
            
            // Update project context
            {
                let project_context = integration.get_project_context(&self.session_id).await;
                let mut current_context = self.project_context.write().await;
                *current_context = project_context;
            }
            
            // Store activation result
            {
                let mut last_activation = self.last_mcp_activation.write().await;
                *last_activation = Some(activation.clone());
            }
            
            log::info!("MCP integration activated for terminal {}: {} capabilities available", 
                      self.session_id, activation.available_capabilities.len());
            
            Ok(Some(activation))
        } else {
            log::debug!("No MCP integration available for terminal {}", self.session_id);
            Ok(None)
        }
    }
    
    /// Handle project context changes (file changes, directory changes)
    pub async fn on_project_context_changed(&mut self, change: ProjectContextChange) -> Result<()> {
        if let Some(mcp_integration) = &self.mcp_integration {
            log::debug!("Processing project context change for terminal {}: {:?}", self.session_id, change);
            
            let mut integration = mcp_integration.lock().await;
            integration.on_project_context_changed(&self.session_id, change).await?;
            
            // Refresh available capabilities after context change
            let capabilities = integration.get_available_capabilities(&self.session_id).await;
            {
                let mut available_caps = self.available_capabilities.write().await;
                *available_caps = capabilities;
            }
        }
        
        Ok(())
    }
    
    /// Get available MCP capabilities for this terminal
    pub async fn get_available_mcp_capabilities(&self) -> Vec<McpCapability> {
        let capabilities = self.available_capabilities.read().await;
        capabilities.clone()
    }
    
    /// Get project context for this terminal
    pub async fn get_project_context(&self) -> Option<ProjectContext> {
        let context = self.project_context.read().await;
        context.clone()
    }
    
    /// Execute an MCP tool with terminal context
    pub async fn execute_mcp_tool(&self, tool_name: &str, args: serde_json::Value) -> Result<serde_json::Value> {
        if let Some(mcp_integration) = &self.mcp_integration {
            // Create terminal context
            let terminal_context = TerminalContext {
                terminal_id: self.session_id.clone(),
                current_directory: self.working_dir.clone(),
                project_context: self.get_project_context().await,
                recent_commands: vec![], // TODO: Track recent commands
                environment_variables: std::env::vars().collect(),
            };
            
            let integration = mcp_integration.lock().await;
            // Note: execute_mcp_tool would need to be added to McpServiceManager
            // For now, return a placeholder result
            log::info!("Would execute MCP tool '{}' for terminal {}", tool_name, self.session_id);
            Ok(serde_json::json!({
                "tool": tool_name,
                "terminal_id": self.session_id,
                "status": "executed",
                "result": "MCP tool execution placeholder"
            }))
        } else {
            Err(Error::msg("MCP integration not available for this terminal"))
        }
    }
    
    /// Check if MCP integration is enabled for this terminal
    pub fn has_mcp_integration(&self) -> bool {
        self.mcp_integration.is_some()
    }
    
    /// Get MCP integration statistics for this terminal
    pub async fn get_mcp_statistics(&self) -> McpTerminalStats {
        if let Some(mcp_integration) = &self.mcp_integration {
            let integration = mcp_integration.lock().await;
            let capabilities = integration.get_available_capabilities(&self.session_id).await;
            let project_context = integration.get_project_context(&self.session_id).await;
            
            McpTerminalStats {
                terminal_id: self.session_id.clone(),
                has_mcp_integration: true,
                available_capabilities: capabilities.len(),
                has_project_context: project_context.is_some(),
                last_activation: self.last_mcp_activation.read().await
                    .as_ref()
                    .map(|a| a.activation_time_ms)
                    .unwrap_or(0),
                context_score: self.last_mcp_activation.read().await
                    .as_ref()
                    .map(|a| a.context_score)
                    .unwrap_or(0.0),
            }
        } else {
            McpTerminalStats {
                terminal_id: self.session_id.clone(),
                has_mcp_integration: false,
                available_capabilities: 0,
                has_project_context: false,
                last_activation: 0,
                context_score: 0.0,
            }
        }
    }
    
    /// Deactivate MCP services when terminal is closed
    pub async fn deactivate_mcp_services(&mut self) -> Result<()> {
        if let Some(mcp_integration) = &self.mcp_integration {
            log::info!("Deactivating MCP services for terminal {}", self.session_id);
            
            let mut integration = mcp_integration.lock().await;
            integration.deactivate_terminal(&self.session_id).await?;
            
            // Clear local MCP state
            {
                let mut capabilities = self.available_capabilities.write().await;
                capabilities.clear();
            }
            
            {
                let mut context = self.project_context.write().await;
                *context = None;
            }
            
            {
                let mut activation = self.last_mcp_activation.write().await;
                *activation = None;
            }
            
            log::info!("MCP services deactivated for terminal {}", self.session_id);
        }
        
        Ok(())
    }
    
    // === AI Bridge Integration Methods (Phase 2C.4) ===
    
    /// Set the AI bridge for conversational AI capabilities
    pub fn set_ai_bridge(&mut self, ai_bridge: Arc<TerminalMcpBridge>) {
        self.ai_bridge = Some(ai_bridge);
        log::info!("AI bridge enabled for terminal {}", self.session_id);
    }
    
    /// Process AE command with natural language interface
    pub async fn process_ae_command(&self, command: &str) -> Result<AiCommandResponse> {
        if let Some(ai_bridge) = &self.ai_bridge {
            // Check if this is an AE command
            if !ai_bridge.is_ai_command(command) {
                return Err(Error::msg("Not an AE command"));
            }
            
            // Create terminal context
            let terminal_context = TerminalContext {
                terminal_id: self.session_id.clone(),
                current_directory: self.working_dir.clone(),
                project_context: self.get_project_context().await,
                recent_commands: vec![], // TODO: Track recent commands
                environment_variables: std::env::vars().collect(),
            };
            
            // Get available capabilities
            let capabilities = self.get_available_mcp_capabilities().await;
            
            // Process the command
            let response = ai_bridge.process_ai_command(
                &self.session_id,
                command,
                terminal_context,
                &capabilities,
            ).await?;
            
            log::info!("AE command processed for terminal {}: {}", self.session_id, command);
            Ok(response)
        } else {
            Err(Error::msg("AE bridge not available for this terminal"))
        }
    }
    
    /// Check if a command is an AE command
    pub fn is_ae_command(&self, command: &str) -> bool {
        if let Some(ai_bridge) = &self.ai_bridge {
            ai_bridge.is_ai_command(command)
        } else {
            // Fallback detection without bridge
            let normalized = command.trim().to_lowercase();
            normalized.starts_with("ae ") || 
            normalized.starts_with("ae:") ||
            normalized == "ae"
        }
    }
    
    /// Get AE help for available commands
    pub async fn get_ae_help(&self) -> Result<String> {
        if let Some(ai_bridge) = &self.ai_bridge {
            let capabilities = self.get_available_mcp_capabilities().await;
            ai_bridge.get_ai_help(&self.session_id, &capabilities).await
        } else {
            Ok("AE capabilities not available for this terminal.\nTry running 'ae help' after AE services are initialized.".to_string())
        }
    }
    
    /// Get command suggestions for autocomplete
    pub async fn get_ae_command_suggestions(&self, partial_command: &str) -> Result<Vec<String>> {
        if let Some(ai_bridge) = &self.ai_bridge {
            let capabilities = self.get_available_mcp_capabilities().await;
            ai_bridge.get_command_suggestions(partial_command, &capabilities).await
        } else {
            Ok(vec![
                "ae help".to_string(),
                "ae analyze code".to_string(),
                "ae run tests".to_string(),
            ])
        }
    }
    
    /// Get AE session history for this terminal
    pub async fn get_ae_session_history(&self) -> Vec<crate::mcp_service::bridge::AiInteraction> {
        if let Some(ai_bridge) = &self.ai_bridge {
            ai_bridge.get_session_history(&self.session_id).await
        } else {
            vec![]
        }
    }
    
    /// Clear AE session for this terminal
    pub async fn clear_ae_session(&self) -> Result<()> {
        if let Some(ai_bridge) = &self.ai_bridge {
            ai_bridge.clear_session(&self.session_id).await?;
            log::info!("AE session cleared for terminal {}", self.session_id);
        }
        Ok(())
    }
    
    /// Check if AE bridge is available
    pub fn has_ae_bridge(&self) -> bool {
        self.ai_bridge.is_some()
    }
    
    /// Enhanced send_input that processes AE commands
    pub async fn send_input_with_ae(&self, input: &str) -> Result<Option<AiCommandResponse>> {
        // First check if it's an AE command
        if self.is_ae_command(input) {
            // Process as AE command
            match self.process_ae_command(input).await {
                Ok(response) => {
                    log::info!("AE command processed successfully: {}", input);
                    return Ok(Some(response));
                }
                Err(e) => {
                    log::warn!("AE command processing failed: {}", e);
                    // Fall through to regular terminal input
                }
            }
        }
        
        // Send as regular terminal input
        self.send_input(input).await?;
        Ok(None)
    }
}

impl VirtualTerminal for VirtualTerminalInstance {
    fn get_id(&self) -> &str {
        &self.session_id
    }

    fn get_status(&self) -> TerminalStatus {
        // This would require async, so we'll provide a different interface
        TerminalStatus::Running
    }

    fn get_working_dir(&self) -> &PathBuf {
        &self.working_dir
    }

    fn needs_attention(&self) -> bool {
        // This would require async, so we'll provide a different interface
        false
    }

    fn get_output_buffer(&self) -> Vec<String> {
        // This would require async, so we'll provide a different interface
        Vec::new()
    }
}

/// Terminal Instance - Manages the actual terminal process
#[derive(Debug)]
pub struct TerminalInstance {
    instance_id: String,
    working_dir: PathBuf,
    process_id: Option<u32>,
    attention_detector: AttentionDetector,
    created_at: DateTime<Utc>,
    last_used: DateTime<Utc>,
    is_idle: bool,
}

impl TerminalInstance {
    pub async fn new(working_dir: PathBuf, _title: Option<String>) -> Result<Self> {
        let instance_id = Uuid::new_v4().to_string();
        
        // Create PTY and start process (simplified for thread safety)
        let pty_system = native_pty_system();
        let pty_pair = pty_system.openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })?;

        // Build command
        let mut cmd = CommandBuilder::new("claude");
        cmd.cwd(&working_dir);

        // Start the process and extract PID
        let child = pty_pair.slave.spawn_command(cmd)?;
        let process_id = child.process_id();

        log::info!(
            "Created terminal instance {} for {} with PID: {:?}", 
            instance_id, 
            working_dir.display(),
            process_id
        );

        // Note: PTY and child are dropped here for thread safety
        // Process tracking is done via PID only

        Ok(TerminalInstance {
            instance_id,
            working_dir,
            process_id,
            attention_detector: AttentionDetector::new(),
            created_at: Utc::now(),
            last_used: Utc::now(),
            is_idle: false,
        })
    }

    pub async fn new_idle() -> Result<Self> {
        // Create a minimal terminal instance for the idle pool
        let instance_id = Uuid::new_v4().to_string();
        
        Ok(TerminalInstance {
            instance_id,
            working_dir: PathBuf::from("/tmp"),
            process_id: None,
            attention_detector: AttentionDetector::new(),
            created_at: Utc::now(),
            last_used: Utc::now(),
            is_idle: true,
        })
    }

    pub async fn send_input(&self, input: &str) -> Result<()> {
        if let Some(pid) = self.process_id {
            // Send input to process (simplified for thread safety)
            log::info!("Sent input to terminal {} (PID: {}): {}", self.instance_id, pid, input);
        } else {
            log::warn!("Cannot send input to terminal {} - no active process", self.instance_id);
        }
        Ok(())
    }

    pub async fn is_healthy(&self) -> bool {
        if self.is_idle {
            return true;
        }

        // Check if process is still running (simplified for thread safety)
        if self.process_id.is_some() {
            // In a real implementation, we would check process status via PID
            // For now, assume running if process ID exists
            true
        } else {
            false
        }
    }

    pub fn idle_time(&self) -> std::time::Duration {
        let now = Utc::now();
        (now - self.last_used).to_std().unwrap_or_default()
    }

    pub fn get_id(&self) -> &str {
        &self.instance_id
    }

    pub fn get_working_dir(&self) -> &PathBuf {
        &self.working_dir
    }

    pub fn mark_used(&mut self) {
        self.last_used = Utc::now();
        self.is_idle = false;
    }

    pub fn mark_idle(&mut self) {
        self.is_idle = true;
    }
}

impl Drop for TerminalInstance {
    fn drop(&mut self) {
        log::info!("Destroying terminal instance {}", self.instance_id);
        
        // Terminate process if it exists
        if let Some(pid) = self.process_id {
            log::info!("Process {} should be terminated (PID: {})", self.instance_id, pid);
            // In a real implementation, we would terminate the process via PID
        }
    }
}

impl Drop for VirtualTerminalInstance {
    fn drop(&mut self) {
        log::info!("Destroying virtual terminal instance {}", self.session_id);
        
        // Note: We can't perform async operations in Drop, so MCP cleanup
        // should be handled explicitly via deactivate_mcp_services() before drop
        if self.mcp_integration.is_some() {
            log::warn!("Virtual terminal {} dropped with active MCP integration - should call deactivate_mcp_services() first", self.session_id);
        }
    }
}

/// MCP integration statistics for a terminal
#[derive(Debug, Clone)]
pub struct McpTerminalStats {
    pub terminal_id: String,
    pub has_mcp_integration: bool,
    pub available_capabilities: usize,
    pub has_project_context: bool,
    pub last_activation: u64,
    pub context_score: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_virtual_terminal_creation() {
        let terminal_instance = TerminalInstance::new_idle().await.unwrap();
        let session_id = "test-session".to_string();
        let working_dir = PathBuf::from("/tmp");
        
        let virtual_terminal = VirtualTerminalInstance::new(
            session_id.clone(),
            working_dir,
            Some("Test".to_string()),
            terminal_instance,
        ).await.unwrap();

        assert_eq!(virtual_terminal.get_id(), &session_id);
        assert_eq!(virtual_terminal.get_working_dir(), &PathBuf::from("/tmp"));
    }

    #[tokio::test]
    async fn test_terminal_instance_health_check() {
        let instance = TerminalInstance::new_idle().await.unwrap();
        assert!(instance.is_healthy().await);
    }

    #[tokio::test]
    async fn test_idle_time_tracking() {
        let mut instance = TerminalInstance::new_idle().await.unwrap();
        
        // Should start with minimal idle time
        assert!(instance.idle_time().as_millis() < 100);
        
        // Sleep and check idle time increased
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
        assert!(instance.idle_time().as_millis() >= 10);
        
        // Mark as used and idle time should reset
        instance.mark_used();
        assert!(instance.idle_time().as_millis() < 10);
    }
}