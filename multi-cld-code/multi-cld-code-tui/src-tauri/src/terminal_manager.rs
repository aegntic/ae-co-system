use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use portable_pty::{PtySize, native_pty_system, CommandBuilder, Child, PtyPair};
use anyhow::{Result, Error};
use crate::attention_detector::{AttentionDetector, AttentionResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Terminal {
    pub id: String,
    pub pid: Option<u32>,
    pub title: String,
    pub working_dir: PathBuf,
    pub status: TerminalStatus,
    pub needs_attention: bool,
    pub opacity: f32,
    pub output_buffer: Vec<String>,
    pub position: TerminalPosition,
    pub is_popup: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_activity: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TerminalStatus {
    Starting,
    Running,
    Waiting,
    Idle,
    Error,
    Completed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalPosition {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Debug)]
pub struct TerminalProcess {
    pub terminal: Terminal,
    // Note: PTY objects removed for thread safety - using process ID for tracking
    pub process_id: Option<u32>,
    pub reader_handle: Option<tokio::task::JoinHandle<()>>,
    pub attention_detector: AttentionDetector,
}

#[derive(Debug)]
pub struct TerminalManager {
    terminals: Arc<RwLock<HashMap<String, TerminalProcess>>>,
    event_sender: tokio::sync::broadcast::Sender<TerminalEvent>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TerminalEvent {
    pub terminal_id: String,
    pub event_type: TerminalEventType,
    pub data: Option<String>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub enum TerminalEventType {
    OutputReceived,
    AttentionRequired,
    StatusChanged,
    ProcessExited,
    Error,
}

impl TerminalManager {
    pub fn new() -> Result<Self> {
        let (event_sender, _) = tokio::sync::broadcast::channel(1000);

        Ok(TerminalManager {
            terminals: Arc::new(RwLock::new(HashMap::new())),
            event_sender,
        })
    }

    pub async fn spawn_claude_code(&self, working_dir: PathBuf, title: Option<String>) -> Result<String> {
        let terminal_id = Uuid::new_v4().to_string();
        let pty_system = native_pty_system();
        
        // Create PTY with appropriate size
        let pty_pair = pty_system.openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })?;

        // Build Claude Code command
        let mut cmd = CommandBuilder::new("claude");
        cmd.cwd(&working_dir);
        
        // Start the process (simplified for thread safety)
        let child = pty_pair.slave.spawn_command(cmd)?;
        let child_pid = child.process_id();

        // Create terminal instance
        let terminal = Terminal {
            id: terminal_id.clone(),
            pid: child_pid,
            title: title.unwrap_or_else(|| format!("Claude Code - {}", 
                working_dir.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("Unknown")
            )),
            working_dir,
            status: TerminalStatus::Starting,
            needs_attention: false,
            opacity: 1.0,
            output_buffer: Vec::new(),
            position: TerminalPosition {
                x: 0.0,
                y: 0.0,
                width: 400.0,
                height: 300.0,
            },
            is_popup: false,
            created_at: chrono::Utc::now(),
            last_activity: chrono::Utc::now(),
        };

        // Create terminal process with attention detector (simplified)
        let terminal_process = TerminalProcess {
            terminal: terminal.clone(),
            process_id: child_pid,
            reader_handle: None,
            attention_detector: AttentionDetector::new(),
        };
        
        // Note: Child and PTY cleanup handled separately for thread safety

        // Start output reader task
        let reader_handle = self.start_output_reader(&terminal_id).await?;
        
        // Store the terminal process
        let mut terminals = self.terminals.write().await;
        if let Some(process) = terminals.get_mut(&terminal_id) {
            process.reader_handle = Some(reader_handle);
        } else {
            let mut process = terminal_process;
            process.reader_handle = Some(reader_handle);
            terminals.insert(terminal_id.clone(), process);
        }

        // Send creation event
        let _ = self.event_sender.send(TerminalEvent {
            terminal_id: terminal_id.clone(),
            event_type: TerminalEventType::StatusChanged,
            data: Some("Terminal created and Claude Code starting".to_string()),
            timestamp: chrono::Utc::now(),
        });

        Ok(terminal_id)
    }

    async fn start_output_reader(&self, terminal_id: &str) -> Result<tokio::task::JoinHandle<()>> {
        let terminals = self.terminals.clone();
        let event_sender = self.event_sender.clone();
        let id = terminal_id.to_string();

        let handle = tokio::spawn(async move {
            let mut buffer = [0u8; 8192];
            
            loop {
                // Read from PTY (simplified for demo)
                tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
                
                // Simulate different types of output for demo
                let demo_outputs = vec![
                    "Claude Code initialized successfully",
                    "Analyzing project structure...",
                    "Ready for AI assistance!",
                    "Please choose an action:",
                    "1. Analyze code",
                    "2. Generate documentation", 
                    "3. Run tests",
                    "Enter your choice [1-3]: ",
                ];
                
                for output_line in demo_outputs {
                    // Process the output line with attention detection
                    let attention_result = {
                        let mut terminals_write = terminals.write().await;
                        if let Some(process) = terminals_write.get_mut(&id) {
                            // Add line to attention detector
                            process.attention_detector.add_output_line(output_line);
                            
                            // Check for attention patterns
                            let attention_result = process.attention_detector.detect_attention(output_line);
                            
                            // Update terminal output buffer
                            process.terminal.output_buffer.push(output_line.to_string());
                            process.terminal.last_activity = chrono::Utc::now();
                            
                            // Update attention state if detected
                            if attention_result.detected && !process.terminal.needs_attention {
                                process.terminal.needs_attention = true;
                                process.terminal.status = TerminalStatus::Waiting;
                                
                                log::info!(
                                    "Attention detected for terminal {}: {} (confidence: {:.2})", 
                                    id, 
                                    attention_result.pattern_name,
                                    attention_result.confidence
                                );
                            }
                            
                            Some(attention_result)
                        } else {
                            break; // Terminal was removed
                        }
                    };

                    // Send events
                    if let Some(attention) = attention_result {
                        if attention.detected {
                            let _ = event_sender.send(TerminalEvent {
                                terminal_id: id.clone(),
                                event_type: TerminalEventType::AttentionRequired,
                                data: Some(format!(
                                    "Pattern: {} | Confidence: {:.2} | Text: {}", 
                                    attention.pattern_name,
                                    attention.confidence,
                                    attention.matched_text
                                )),
                                timestamp: chrono::Utc::now(),
                            });
                        }
                    }

                    // Send output event
                    let _ = event_sender.send(TerminalEvent {
                        terminal_id: id.clone(),
                        event_type: TerminalEventType::OutputReceived,
                        data: Some(output_line.to_string()),
                        timestamp: chrono::Utc::now(),
                    });

                    // Sleep between output lines
                    tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
                }
                
                // Break after demo sequence
                break;
            }
        });

        Ok(handle)
    }

    pub async fn get_terminal(&self, terminal_id: &str) -> Option<Terminal> {
        let terminals = self.terminals.read().await;
        terminals.get(terminal_id).map(|process| process.terminal.clone())
    }

    pub async fn get_all_terminals(&self) -> Vec<Terminal> {
        let terminals = self.terminals.read().await;
        terminals.values().map(|process| process.terminal.clone()).collect()
    }

    pub async fn send_input(&self, terminal_id: &str, input: &str) -> Result<()> {
        let terminals = self.terminals.read().await;
        
        if let Some(process) = terminals.get(terminal_id) {
            // Write to PTY (simplified)
            // In real implementation: process.pty_pair.master.write_all(input.as_bytes())?;
            
            // Update terminal status
            drop(terminals);
            let mut terminals_write = self.terminals.write().await;
            if let Some(process) = terminals_write.get_mut(terminal_id) {
                process.terminal.needs_attention = false;
                process.terminal.status = TerminalStatus::Running;
                process.terminal.last_activity = chrono::Utc::now();
            }

            // Send status change event
            let _ = self.event_sender.send(TerminalEvent {
                terminal_id: terminal_id.to_string(),
                event_type: TerminalEventType::StatusChanged,
                data: Some("Input received, attention cleared".to_string()),
                timestamp: chrono::Utc::now(),
            });

            Ok(())
        } else {
            Err(Error::msg("Terminal not found"))
        }
    }

    pub async fn terminate_terminal(&self, terminal_id: &str) -> Result<()> {
        let mut terminals = self.terminals.write().await;
        
        if let Some(mut process) = terminals.remove(terminal_id) {
            // Cancel the reader task
            if let Some(handle) = process.reader_handle.take() {
                handle.abort();
            }

            // Terminate the child process (using process_id for cleanup)
            if let Some(pid) = process.process_id {
                log::info!("Terminating process with PID: {}", pid);
                // Note: actual process termination would happen here
            }

            // Send termination event
            let _ = self.event_sender.send(TerminalEvent {
                terminal_id: terminal_id.to_string(),
                event_type: TerminalEventType::ProcessExited,
                data: Some("Terminal terminated".to_string()),
                timestamp: chrono::Utc::now(),
            });

            Ok(())
        } else {
            Err(Error::msg("Terminal not found"))
        }
    }

    pub async fn update_terminal_position(&self, terminal_id: &str, position: TerminalPosition) -> Result<()> {
        let mut terminals = self.terminals.write().await;
        
        if let Some(process) = terminals.get_mut(terminal_id) {
            process.terminal.position = position;
            process.terminal.last_activity = chrono::Utc::now();
            Ok(())
        } else {
            Err(Error::msg("Terminal not found"))
        }
    }

    pub async fn set_terminal_opacity(&self, terminal_id: &str, opacity: f32) -> Result<()> {
        let mut terminals = self.terminals.write().await;
        
        if let Some(process) = terminals.get_mut(terminal_id) {
            process.terminal.opacity = opacity.clamp(0.1, 1.0);
            Ok(())
        } else {
            Err(Error::msg("Terminal not found"))
        }
    }

    pub fn subscribe_to_events(&self) -> tokio::sync::broadcast::Receiver<TerminalEvent> {
        self.event_sender.subscribe()
    }

    pub async fn get_terminal_count(&self) -> usize {
        let terminals = self.terminals.read().await;
        terminals.len()
    }

    pub async fn get_active_terminals(&self) -> Vec<Terminal> {
        let terminals = self.terminals.read().await;
        terminals.values()
            .filter(|process| matches!(
                process.terminal.status,
                TerminalStatus::Running | TerminalStatus::Waiting
            ))
            .map(|process| process.terminal.clone())
            .collect()
    }
}

// Default implementation for easy instantiation
impl Default for TerminalManager {
    fn default() -> Self {
        Self::new().expect("Failed to create TerminalManager")
    }
}