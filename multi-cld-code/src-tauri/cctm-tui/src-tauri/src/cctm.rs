/// CCTM Application Logic
/// 
/// Core application state and business logic for the TUI version

use std::collections::VecDeque;
use color_eyre::eyre::Result;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, PartialEq)]
pub enum CctmState {
    TerminalList,
    TerminalView,
    AiInput,
    McpView,
    ProjectView,
}

#[derive(Debug, Clone)]
pub struct TerminalTab {
    pub id: String,
    pub title: String,
    pub status: String,
    pub output: String,
    pub working_dir: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct AiMessage {
    pub content: String,
    pub is_user: bool,
    pub timestamp: String,
}

#[derive(Debug, Clone)]
pub struct AiCommand {
    pub command: String,
    pub context: String,
}

#[derive(Debug, Clone)]
pub struct McpServer {
    pub name: String,
    pub status: String,
    pub capabilities: Vec<McpCapability>,
    pub memory_usage: u64,
}

#[derive(Debug, Clone)]
pub struct McpCapability {
    pub name: String,
    pub description: String,
    pub tool_type: String,
}

#[derive(Debug, Clone)]
pub struct ProjectInfo {
    pub name: String,
    pub path: String,
    pub project_type: String,
    pub detected_at: DateTime<Utc>,
}

pub struct CctmApp {
    // UI state
    current_tab: usize,
    current_state: CctmState,
    error_message: Option<String>,
    
    // Terminal management
    terminals: Vec<TerminalTab>,
    selected_terminal: usize,
    scroll_offset: u16,
    
    // AI conversation
    ai_messages: VecDeque<AiMessage>,
    ai_input: String,
    
    // MCP integration
    mcp_servers: Vec<McpServer>,
    
    // Project detection
    current_project: Option<ProjectInfo>,
}

impl CctmApp {
    pub fn new() -> Self {
        let mut app = CctmApp {
            current_tab: 0,
            current_state: CctmState::TerminalList,
            error_message: None,
            terminals: Vec::new(),
            selected_terminal: 0,
            scroll_offset: 0,
            ai_messages: VecDeque::new(),
            ai_input: String::new(),
            mcp_servers: Vec::new(),
            current_project: None,
        };
        
        // Initialize with demo data
        app.initialize_demo_data();
        app
    }
    
    fn initialize_demo_data(&mut self) {
        // Add some demo terminals
        self.terminals.push(TerminalTab {
            id: "terminal-1".to_string(),
            title: "Main Terminal".to_string(),
            status: "Running".to_string(),
            output: "Welcome to CCTM TUI!\n\n{ae} CCTM (Claude Code Terminal Manager) - TUI Edition\nA revolutionary AI-human co-creation tool.\n\n$ cargo run\nCompiling cctm-tui v0.1.0\n   Finished dev profile [unoptimized + debuginfo] target(s) in 2.14s\n    Running `target/debug/cctm-tui`\n\nCCTM TUI is now running...\n\nPress '/' to start an AE command\nPress Ctrl+N to create a new terminal\nPress Tab to switch between sections\nPress Q to quit\n\n$".to_string(),
            working_dir: "/home/tabs/ae-co-system/multi-cld-code-tui".to_string(),
            created_at: Utc::now(),
        });
        
        self.terminals.push(TerminalTab {
            id: "terminal-2".to_string(),
            title: "Claude Code Session".to_string(),
            status: "Running".to_string(),
            output: "$ claude code\n\nClaude Code CLI (Version 0.7.1)\nSigned in as: user@example.com\n\nCurrently in: /home/tabs/ae-co-system/multi-cld-code-tui\nProject type: Rust (Cargo)\n\nAvailable commands:\n- Analyze code structure\n- Generate documentation\n- Review code quality\n- Run tests\n- Suggest improvements\n\nType 'help' for more commands\n\n►".to_string(),
            working_dir: "/home/tabs/ae-co-system/multi-cld-code-tui".to_string(),
            created_at: Utc::now(),
        });
        
        // Add demo AI messages
        self.ai_messages.push_back(AiMessage {
            content: "Welcome to the AE Assistant! I can help you with code analysis, terminal management, and MCP tool integration.".to_string(),
            is_user: false,
            timestamp: "12:30".to_string(),
        });
        
        self.ai_messages.push_back(AiMessage {
            content: "ae analyze code".to_string(),
            is_user: true,
            timestamp: "12:31".to_string(),
        });
        
        self.ai_messages.push_back(AiMessage {
            content: "I can see you're working on a Rust TUI application for CCTM. The code structure looks excellent! Here are some observations:\n\n• Well-organized modular architecture\n• Good separation of concerns between UI and logic\n• Proper error handling with color-eyre\n• Clean ratatui implementation\n\nWould you like me to analyze any specific aspects?".to_string(),
            is_user: false,
            timestamp: "12:31".to_string(),
        });
        
        // Add demo MCP servers
        self.mcp_servers.push(McpServer {
            name: "Desktop Commander".to_string(),
            status: "Running".to_string(),
            capabilities: vec![
                McpCapability {
                    name: "read_file".to_string(),
                    description: "Read file contents with optional offset/length".to_string(),
                    tool_type: "file_system".to_string(),
                },
                McpCapability {
                    name: "write_file".to_string(),
                    description: "Write or append to files".to_string(),
                    tool_type: "file_system".to_string(),
                },
                McpCapability {
                    name: "execute_command".to_string(),
                    description: "Execute terminal commands".to_string(),
                    tool_type: "system".to_string(),
                },
            ],
            memory_usage: 45,
        });
        
        self.mcp_servers.push(McpServer {
            name: "Notion API".to_string(),
            status: "Connected".to_string(),
            capabilities: vec![
                McpCapability {
                    name: "get_user".to_string(),
                    description: "Retrieve user information".to_string(),
                    tool_type: "api".to_string(),
                },
                McpCapability {
                    name: "post_page".to_string(),
                    description: "Create new pages".to_string(),
                    tool_type: "api".to_string(),
                },
                McpCapability {
                    name: "search".to_string(),
                    description: "Search content by title".to_string(),
                    tool_type: "api".to_string(),
                },
            ],
            memory_usage: 23,
        });
        
        self.mcp_servers.push(McpServer {
            name: "Docker".to_string(),
            status: "Starting".to_string(),
            capabilities: vec![
                McpCapability {
                    name: "list_containers".to_string(),
                    description: "List all Docker containers".to_string(),
                    tool_type: "container".to_string(),
                },
                McpCapability {
                    name: "run_container".to_string(),
                    description: "Run container with configuration".to_string(),
                    tool_type: "container".to_string(),
                },
            ],
            memory_usage: 67,
        });
        
        // Set current project
        self.current_project = Some(ProjectInfo {
            name: "CCTM TUI".to_string(),
            path: "/home/tabs/ae-co-system/multi-cld-code-tui".to_string(),
            project_type: "Rust (Cargo)".to_string(),
            detected_at: Utc::now(),
        });
    }
    
    // Tab management
    pub fn get_current_tab(&self) -> usize {
        self.current_tab
    }
    
    pub fn next_tab(&mut self) {
        self.current_tab = (self.current_tab + 1) % 4;
        self.current_state = match self.current_tab {
            0 => CctmState::TerminalList,
            1 => CctmState::AiInput,
            2 => CctmState::McpView,
            3 => CctmState::ProjectView,
            _ => CctmState::TerminalList,
        };
    }
    
    pub fn previous_tab(&mut self) {
        self.current_tab = if self.current_tab == 0 { 3 } else { self.current_tab - 1 };
        self.current_state = match self.current_tab {
            0 => CctmState::TerminalList,
            1 => CctmState::AiInput,
            2 => CctmState::McpView,
            3 => CctmState::ProjectView,
            _ => CctmState::TerminalList,
        };
    }
    
    // State management
    pub fn get_current_state(&self) -> CctmState {
        self.current_state.clone()
    }
    
    pub fn enter_ai_mode(&mut self) {
        self.current_state = CctmState::AiInput;
        self.current_tab = 1;
    }
    
    pub fn exit_current_mode(&mut self) {
        self.current_state = match self.current_tab {
            0 => CctmState::TerminalList,
            1 => CctmState::AiInput,
            2 => CctmState::McpView,
            3 => CctmState::ProjectView,
            _ => CctmState::TerminalList,
        };
        
        // Clear AI input if exiting AI mode
        if self.current_state != CctmState::AiInput {
            self.ai_input.clear();
        }
    }
    
    // Error handling
    pub fn set_error(&mut self, error: String) {
        self.error_message = Some(error);
    }
    
    pub fn get_error(&self) -> Option<&str> {
        self.error_message.as_deref()
    }
    
    pub fn clear_error(&mut self) {
        self.error_message = None;
    }
    
    // Terminal management
    pub fn get_terminals(&self) -> &[TerminalTab] {
        &self.terminals
    }
    
    pub fn get_selected_terminal(&self) -> usize {
        self.selected_terminal
    }
    
    pub fn get_current_terminal(&self) -> Option<&TerminalTab> {
        self.terminals.get(self.selected_terminal)
    }
    
    pub fn spawn_new_terminal(&mut self) -> Result<()> {
        let new_id = format!("terminal-{}", self.terminals.len() + 1);
        let new_terminal = TerminalTab {
            id: new_id.clone(),
            title: format!("Terminal {}", self.terminals.len() + 1),
            status: "Starting".to_string(),
            output: format!("$ Starting new terminal session...\n\nTerminal ID: {}\nWorking directory: /home/tabs/ae-co-system/multi-cld-code-tui\nShell: /bin/bash\n\nInitializing...\n\n$", new_id),
            working_dir: "/home/tabs/ae-co-system/multi-cld-code-tui".to_string(),
            created_at: Utc::now(),
        };
        
        self.terminals.push(new_terminal);
        self.selected_terminal = self.terminals.len() - 1;
        
        // Simulate terminal starting
        if let Some(terminal) = self.terminals.last_mut() {
            terminal.status = "Running".to_string();
        }
        
        Ok(())
    }
    
    pub fn close_current_terminal(&mut self) -> Result<()> {
        if !self.terminals.is_empty() && self.selected_terminal < self.terminals.len() {
            self.terminals.remove(self.selected_terminal);
            
            if self.selected_terminal >= self.terminals.len() && !self.terminals.is_empty() {
                self.selected_terminal = self.terminals.len() - 1;
            } else if self.terminals.is_empty() {
                self.selected_terminal = 0;
            }
        }
        Ok(())
    }
    
    pub fn enter_terminal(&mut self) -> Result<()> {
        if self.selected_terminal < self.terminals.len() {
            self.current_state = CctmState::TerminalView;
        }
        Ok(())
    }
    
    // Scrolling
    pub fn scroll_up(&mut self) {
        if self.scroll_offset > 0 {
            self.scroll_offset -= 1;
        }
    }
    
    pub fn scroll_down(&mut self) {
        self.scroll_offset += 1;
    }
    
    pub fn get_scroll_offset(&self) -> u16 {
        self.scroll_offset
    }
    
    // AI interaction
    pub fn get_ai_messages(&self) -> &VecDeque<AiMessage> {
        &self.ai_messages
    }
    
    pub fn get_ai_input(&self) -> &str {
        &self.ai_input
    }
    
    pub fn add_to_ai_input(&mut self, c: char) {
        self.ai_input.push(c);
    }
    
    pub fn backspace_ai_input(&mut self) {
        self.ai_input.pop();
    }
    
    pub fn execute_ai_command(&mut self) -> Result<()> {
        if !self.ai_input.trim().is_empty() {
            // Add user message
            self.ai_messages.push_back(AiMessage {
                content: self.ai_input.clone(),
                is_user: true,
                timestamp: chrono::Utc::now().format("%H:%M").to_string(),
            });
            
            // Generate AI response based on command
            let response = self.generate_ai_response(&self.ai_input);
            
            self.ai_messages.push_back(AiMessage {
                content: response,
                is_user: false,
                timestamp: chrono::Utc::now().format("%H:%M").to_string(),
            });
            
            // Keep only last 50 messages to prevent memory bloat
            while self.ai_messages.len() > 50 {
                self.ai_messages.pop_front();
            }
            
            // Clear input
            self.ai_input.clear();
        }
        Ok(())
    }
    
    fn generate_ai_response(&self, command: &str) -> String {
        let cmd = command.trim().to_lowercase();
        
        if cmd.starts_with("ae ") || cmd.starts_with("ae:") {
            let ae_command = if cmd.starts_with("ae ") {
                &cmd[3..]
            } else {
                &cmd[3..]
            };
            
            match ae_command {
                "help" => {
                    "Available AE commands:\n\n• ae analyze code - Analyze the current codebase\n• ae run tests - Execute project tests\n• ae suggest improvements - Get code improvement suggestions\n• ae explain error - Explain the last error\n• ae generate docs - Generate documentation\n• ae status - Show project status\n• ae terminals - List active terminals\n• ae mcp servers - Show MCP server status\n\nYou can also use natural language like 'explain this function' or 'run the build'".to_string()
                }
                cmd if cmd.contains("analyz") => {
                    "📊 Code Analysis Results:\n\n✓ Project structure: Well-organized Rust TUI application\n✓ Dependencies: Clean with ratatui, crossterm, color-eyre\n✓ Architecture: Modular design with good separation\n✓ Error handling: Proper Result types and error propagation\n✓ Performance: Efficient rendering and state management\n\n🎯 Recommendations:\n• Consider adding unit tests for the CCTM logic\n• Add configuration file support\n• Implement terminal persistence\n• Add keyboard shortcuts customization".to_string()
                }
                cmd if cmd.contains("test") => {
                    "🧪 Running tests...\n\n$ cargo test\n   Compiling cctm-tui v0.1.0\n    Finished test profile\n     Running unittests src/main.rs\n\nrunning 0 tests\n\ntest result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out\n\n✅ All tests passed!\n\nNote: Consider adding tests for:\n• Terminal management logic\n• AI command parsing\n• MCP server integration\n• Project detection".to_string()
                }
                cmd if cmd.contains("terminal") => {
                    format!("📟 Active Terminals ({}):\n\n{}", 
                        self.terminals.len(),
                        self.terminals.iter().enumerate().map(|(i, t)| {
                            format!("{}. {} ({}) - {}", i + 1, t.title, t.status, t.working_dir)
                        }).collect::<Vec<_>>().join("\n")
                    )
                }
                cmd if cmd.contains("server") || cmd.contains("mcp") => {
                    format!("🔧 MCP Servers ({}):\n\n{}", 
                        self.mcp_servers.len(),
                        self.mcp_servers.iter().map(|s| {
                            format!("• {} ({}) - {} tools, {}MB", s.name, s.status, s.capabilities.len(), s.memory_usage)
                        }).collect::<Vec<_>>().join("\n")
                    )
                }
                cmd if cmd.contains("status") => {
                    format!("📈 CCTM Status:\n\n• Terminals: {} active\n• MCP Servers: {} connected\n• Current Project: {}\n• Memory Usage: ~140MB\n• Uptime: 00:05:23\n\n🚀 All systems operational!", 
                        self.terminals.len(), 
                        self.mcp_servers.iter().filter(|s| s.status == "Running" || s.status == "Connected").count(),
                        self.current_project.as_ref().map(|p| p.name.as_str()).unwrap_or("None")
                    )
                }
                cmd if cmd.contains("improve") => {
                    "💡 Improvement Suggestions:\n\n🔥 High Priority:\n• Add real terminal PTY integration\n• Implement actual MCP server communication\n• Add file system watching\n• Create project templates\n\n⚡ Medium Priority:\n• Add themes and customization\n• Implement session persistence\n• Add terminal splitting\n• Create plugin system\n\n✨ Nice to Have:\n• Add mouse support\n• Implement search functionality\n• Add export/import features\n• Create documentation generator".to_string()
                }
                _ => {
                    format!("I understand you want to: '{}'\n\nThis is a demo TUI, but in the full version I would:\n• Parse your command using the MCP bridge\n• Execute the appropriate tools\n• Provide intelligent responses\n• Learn from your patterns\n\nTry 'ae help' for available commands!", ae_command)
                }
            }
        } else {
            // Handle natural language commands
            if cmd.contains("hello") || cmd.contains("hi") {
                "Hello! I'm the AE Assistant. I can help you manage terminals, analyze code, and work with MCP tools. Try typing 'ae help' to see what I can do!".to_string()
            } else if cmd.contains("quit") || cmd.contains("exit") {
                "To quit CCTM TUI, press 'Q' or 'Ctrl+C'. Your work will be saved automatically.".to_string()
            } else {
                format!("I heard: '{}'\n\nI'm a demo AI assistant. For full functionality, use AE commands like:\n• ae analyze code\n• ae run tests\n• ae help\n\nOr try natural language like 'analyze this project' or 'show me the terminals'", command)
            }
        }
    }
    
    // MCP integration
    pub fn get_mcp_servers(&self) -> &[McpServer] {
        &self.mcp_servers
    }
    
    // Project management
    pub fn get_current_project(&self) -> Option<&ProjectInfo> {
        self.current_project.as_ref()
    }
}

impl Default for CctmApp {
    fn default() -> Self {
        Self::new()
    }
}