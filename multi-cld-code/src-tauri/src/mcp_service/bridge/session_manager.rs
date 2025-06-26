/// Bridge Session Manager for CCTM Phase 2C.4
/// 
/// Manages conversational context and session state for AI interactions in terminals.
/// Enables multi-turn conversations with context awareness and history tracking.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use anyhow::Result;
use chrono::{DateTime, Utc};

use super::{AiCommandResponse, AiInteraction, AiResponseType, AiSession};

/// Manages AI conversation sessions across terminals
#[derive(Debug)]
pub struct BridgeSessionManager {
    /// Active sessions by terminal ID
    sessions: Arc<RwLock<HashMap<String, TerminalSession>>>,
    
    /// Session configuration
    config: SessionConfig,
}

impl BridgeSessionManager {
    /// Create a new bridge session manager
    pub fn new() -> Self {
        let config = SessionConfig::default();
        
        log::debug!("BridgeSessionManager initialized with {} max history per session", 
                   config.max_history_per_session);
        
        BridgeSessionManager {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            config,
        }
    }
    
    /// Update session context after a command interaction
    pub async fn update_session_context(
        &self,
        terminal_id: &str,
        command: &str,
        response: &AiCommandResponse,
    ) -> Result<()> {
        let mut sessions = self.sessions.write().await;
        
        let session = sessions.entry(terminal_id.to_string()).or_insert_with(|| {
            TerminalSession::new(terminal_id.to_string())
        });
        
        // Create interaction record
        let interaction = AiInteraction {
            timestamp: Utc::now(),
            command: command.to_string(),
            response_type: response.response_type.clone(),
            execution_time_ms: 0, // TODO: Add timing
        };
        
        // Add to history
        session.add_interaction(interaction, &self.config);
        
        // Update session activity
        session.last_activity = Utc::now();
        session.interaction_count += 1;
        
        log::debug!("Updated session context for terminal {} (total interactions: {})", 
                   terminal_id, session.interaction_count);
        
        Ok(())
    }
    
    /// Get session history for a terminal
    pub async fn get_session_history(&self, terminal_id: &str) -> Vec<AiInteraction> {
        let sessions = self.sessions.read().await;
        
        sessions.get(terminal_id)
            .map(|session| session.history.clone())
            .unwrap_or_default()
    }
    
    /// Get current session for a terminal
    pub async fn get_session(&self, terminal_id: &str) -> Option<AiSession> {
        let sessions = self.sessions.read().await;
        
        sessions.get(terminal_id).map(|session| AiSession {
            terminal_id: session.terminal_id.clone(),
            started_at: session.started_at,
            last_activity: session.last_activity,
            interaction_count: session.interaction_count,
        })
    }
    
    /// Clear session for a terminal
    pub async fn clear_session(&self, terminal_id: &str) -> Result<()> {
        let mut sessions = self.sessions.write().await;
        
        if let Some(removed_session) = sessions.remove(terminal_id) {
            log::info!("Cleared AI session for terminal {} ({} interactions)", 
                      terminal_id, removed_session.interaction_count);
        }
        
        Ok(())
    }
    
    /// Get context from recent interactions for better AI responses
    pub async fn get_conversation_context(&self, terminal_id: &str, max_context_interactions: usize) -> ConversationContext {
        let sessions = self.sessions.read().await;
        
        if let Some(session) = sessions.get(terminal_id) {
            let recent_interactions = session.history
                .iter()
                .rev()
                .take(max_context_interactions)
                .cloned()
                .collect::<Vec<_>>()
                .into_iter()
                .rev()
                .collect();
            
            ConversationContext {
                terminal_id: terminal_id.to_string(),
                recent_interactions,
                session_duration: session.session_duration(),
                total_interactions: session.interaction_count,
                common_patterns: self.analyze_interaction_patterns(&session.history),
            }
        } else {
            ConversationContext::empty(terminal_id)
        }
    }
    
    /// Check if a terminal has an active session
    pub async fn has_active_session(&self, terminal_id: &str) -> bool {
        let sessions = self.sessions.read().await;
        sessions.contains_key(terminal_id)
    }
    
    /// Get session statistics
    pub async fn get_session_statistics(&self) -> SessionStatistics {
        let sessions = self.sessions.read().await;
        
        let active_sessions = sessions.len();
        let total_interactions = sessions.values()
            .map(|s| s.interaction_count)
            .sum();
        
        let avg_interactions_per_session = if active_sessions > 0 {
            total_interactions as f64 / active_sessions as f64
        } else {
            0.0
        };
        
        let longest_session = sessions.values()
            .map(|s| s.session_duration().num_minutes())
            .max()
            .unwrap_or(0);
        
        SessionStatistics {
            active_sessions,
            total_interactions,
            avg_interactions_per_session,
            longest_session_minutes: longest_session,
            last_updated: Utc::now(),
        }
    }
    
    /// Cleanup old inactive sessions
    pub async fn cleanup_inactive_sessions(&self) -> Result<usize> {
        let mut sessions = self.sessions.write().await;
        let before_count = sessions.len();
        
        let cutoff_time = Utc::now() - chrono::Duration::hours(self.config.session_timeout_hours as i64);
        
        sessions.retain(|_, session| session.last_activity > cutoff_time);
        
        let cleaned_count = before_count - sessions.len();
        
        if cleaned_count > 0 {
            log::info!("Cleaned up {} inactive AI sessions", cleaned_count);
        }
        
        Ok(cleaned_count)
    }
    
    /// Export session data for analysis
    pub async fn export_session_data(&self, terminal_id: &str) -> Option<SessionExport> {
        let sessions = self.sessions.read().await;
        
        sessions.get(terminal_id).map(|session| SessionExport {
            terminal_id: session.terminal_id.clone(),
            started_at: session.started_at,
            last_activity: session.last_activity,
            interaction_count: session.interaction_count,
            history: session.history.clone(),
            session_duration_minutes: session.session_duration().num_minutes(),
        })
    }
    
    // Private helper methods
    
    /// Analyze patterns in interaction history
    fn analyze_interaction_patterns(&self, history: &[AiInteraction]) -> Vec<InteractionPattern> {
        let mut patterns = Vec::new();
        
        // Analyze command frequency
        let mut command_counts: HashMap<String, usize> = HashMap::new();
        for interaction in history {
            let command_type = self.extract_command_type(&interaction.command);
            *command_counts.entry(command_type).or_insert(0) += 1;
        }
        
        // Find most common commands
        let mut sorted_commands: Vec<_> = command_counts.into_iter().collect();
        sorted_commands.sort_by(|a, b| b.1.cmp(&a.1));
        
        for (command_type, count) in sorted_commands.into_iter().take(3) {
            patterns.push(InteractionPattern {
                pattern_type: "frequent_command".to_string(),
                value: command_type,
                frequency: count,
                confidence: count as f64 / history.len() as f64,
            });
        }
        
        // Analyze error patterns
        let error_count = history.iter()
            .filter(|i| i.response_type == AiResponseType::Error)
            .count();
        
        if error_count > 0 {
            patterns.push(InteractionPattern {
                pattern_type: "error_frequency".to_string(),
                value: "errors".to_string(),
                frequency: error_count,
                confidence: error_count as f64 / history.len() as f64,
            });
        }
        
        patterns
    }
    
    /// Extract command type from full command
    fn extract_command_type(&self, command: &str) -> String {
        let normalized = command.trim().to_lowercase();
        
        if normalized.contains("analyz") {
            "analyze".to_string()
        } else if normalized.contains("test") {
            "test".to_string()
        } else if normalized.contains("explain") || normalized.contains("help") {
            "explain".to_string()
        } else if normalized.contains("suggest") || normalized.contains("improve") {
            "suggest".to_string()
        } else if normalized.contains("doc") {
            "document".to_string()
        } else {
            "other".to_string()
        }
    }
}

/// Terminal session data
#[derive(Debug, Clone)]
struct TerminalSession {
    terminal_id: String,
    started_at: DateTime<Utc>,
    last_activity: DateTime<Utc>,
    interaction_count: usize,
    history: Vec<AiInteraction>,
}

impl TerminalSession {
    fn new(terminal_id: String) -> Self {
        let now = Utc::now();
        
        TerminalSession {
            terminal_id,
            started_at: now,
            last_activity: now,
            interaction_count: 0,
            history: Vec::new(),
        }
    }
    
    fn add_interaction(&mut self, interaction: AiInteraction, config: &SessionConfig) {
        self.history.push(interaction);
        
        // Trim history if it exceeds maximum
        if self.history.len() > config.max_history_per_session {
            let excess = self.history.len() - config.max_history_per_session;
            self.history.drain(0..excess);
        }
    }
    
    fn session_duration(&self) -> chrono::Duration {
        self.last_activity - self.started_at
    }
}

/// Session configuration
#[derive(Debug, Clone)]
struct SessionConfig {
    max_history_per_session: usize,
    session_timeout_hours: usize,
}

impl Default for SessionConfig {
    fn default() -> Self {
        SessionConfig {
            max_history_per_session: 50,  // Keep last 50 interactions
            session_timeout_hours: 24,    // Clean up after 24 hours
        }
    }
}

/// Conversation context for enhanced AI responses
#[derive(Debug, Clone)]
pub struct ConversationContext {
    pub terminal_id: String,
    pub recent_interactions: Vec<AiInteraction>,
    pub session_duration: chrono::Duration,
    pub total_interactions: usize,
    pub common_patterns: Vec<InteractionPattern>,
}

impl ConversationContext {
    fn empty(terminal_id: &str) -> Self {
        ConversationContext {
            terminal_id: terminal_id.to_string(),
            recent_interactions: Vec::new(),
            session_duration: chrono::Duration::zero(),
            total_interactions: 0,
            common_patterns: Vec::new(),
        }
    }
}

/// Interaction pattern analysis
#[derive(Debug, Clone)]
pub struct InteractionPattern {
    pub pattern_type: String,
    pub value: String,
    pub frequency: usize,
    pub confidence: f64,
}

/// Session statistics
#[derive(Debug, Clone)]
pub struct SessionStatistics {
    pub active_sessions: usize,
    pub total_interactions: usize,
    pub avg_interactions_per_session: f64,
    pub longest_session_minutes: i64,
    pub last_updated: DateTime<Utc>,
}

/// Session export data
#[derive(Debug, Clone)]
pub struct SessionExport {
    pub terminal_id: String,
    pub started_at: DateTime<Utc>,
    pub last_activity: DateTime<Utc>,
    pub interaction_count: usize,
    pub history: Vec<AiInteraction>,
    pub session_duration_minutes: i64,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_session_manager_creation() {
        let manager = BridgeSessionManager::new();
        let stats = manager.get_session_statistics().await;
        assert_eq!(stats.active_sessions, 0);
    }
    
    #[tokio::test]
    async fn test_session_context_update() {
        let manager = BridgeSessionManager::new();
        
        let response = AiCommandResponse {
            response_type: AiResponseType::Success,
            content: "Test response".to_string(),
            suggestions: vec![],
            execution_id: Some("test-id".to_string()),
        };
        
        manager.update_session_context("terminal1", "ai test command", &response).await.unwrap();
        
        let history = manager.get_session_history("terminal1").await;
        assert_eq!(history.len(), 1);
        assert_eq!(history[0].command, "ai test command");
    }
    
    #[tokio::test]
    async fn test_session_retrieval() {
        let manager = BridgeSessionManager::new();
        
        // Update session to create it
        let response = AiCommandResponse {
            response_type: AiResponseType::Success,
            content: "Test".to_string(),
            suggestions: vec![],
            execution_id: None,
        };
        
        manager.update_session_context("terminal1", "test", &response).await.unwrap();
        
        // Check session exists
        assert!(manager.has_active_session("terminal1").await);
        
        let session = manager.get_session("terminal1").await;
        assert!(session.is_some());
        assert_eq!(session.unwrap().interaction_count, 1);
    }
    
    #[tokio::test]
    async fn test_conversation_context() {
        let manager = BridgeSessionManager::new();
        
        // Add multiple interactions
        let response = AiCommandResponse {
            response_type: AiResponseType::Success,
            content: "Test".to_string(),
            suggestions: vec![],
            execution_id: None,
        };
        
        manager.update_session_context("terminal1", "ae analyze code", &response).await.unwrap();
        manager.update_session_context("terminal1", "ai run tests", &response).await.unwrap();
        
        let context = manager.get_conversation_context("terminal1", 5).await;
        assert_eq!(context.recent_interactions.len(), 2);
        assert_eq!(context.total_interactions, 2);
    }
    
    #[tokio::test]
    async fn test_session_cleanup() {
        let manager = BridgeSessionManager::new();
        
        // Create a session
        let response = AiCommandResponse {
            response_type: AiResponseType::Success,
            content: "Test".to_string(),
            suggestions: vec![],
            execution_id: None,
        };
        
        manager.update_session_context("terminal1", "test", &response).await.unwrap();
        
        // Clear the session
        manager.clear_session("terminal1").await.unwrap();
        
        // Check session is gone
        assert!(!manager.has_active_session("terminal1").await);
    }
    
    #[tokio::test]
    async fn test_session_statistics() {
        let manager = BridgeSessionManager::new();
        
        let response = AiCommandResponse {
            response_type: AiResponseType::Success,
            content: "Test".to_string(),
            suggestions: vec![],
            execution_id: None,
        };
        
        // Create multiple sessions
        manager.update_session_context("terminal1", "test1", &response).await.unwrap();
        manager.update_session_context("terminal2", "test2", &response).await.unwrap();
        manager.update_session_context("terminal1", "test3", &response).await.unwrap();
        
        let stats = manager.get_session_statistics().await;
        assert_eq!(stats.active_sessions, 2);
        assert_eq!(stats.total_interactions, 3);
        assert_eq!(stats.avg_interactions_per_session, 1.5);
    }
}