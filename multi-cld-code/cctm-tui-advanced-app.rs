/// CCTM Application Logic - Part 2
/// Application structures and core functionality

#[derive(Debug, Clone)]
struct TerminalTab {
    id: String,
    title: String,
    status: String,
    output: String,
    working_dir: String,
    created_at: String,
}

#[derive(Debug, Clone)]
struct AiMessage {
    content: String,
    is_user: bool,
    timestamp: String,
}

#[derive(Debug, Clone)]
struct McpServer {
    name: String,
    status: String,
    capabilities: Vec<McpCapability>,
    memory_usage: u64,
}

#[derive(Debug, Clone)]
struct McpCapability {
    name: String,
    description: String,
    tool_type: String,
}

#[derive(Debug, Clone)]
struct ProjectInfo {
    name: String,
    path: String,
    project_type: String,
    detected_at: String,
}

struct CctmApp {
    terminals: Vec<TerminalTab>,
    ai_messages: VecDeque<AiMessage>,
    mcp_servers: Vec<McpServer>,
    current_project: Option<ProjectInfo>,
    predictive_engine: PredictiveEngine,
    terminal_mode: TerminalMode,
}

impl CctmApp {
    fn new() -> Self {
        let mut app = CctmApp {
            terminals: Vec::new(),
            ai_messages: VecDeque::new(),
            mcp_servers: Vec::new(),
            current_project: None,
            predictive_engine: PredictiveEngine::new(),
            terminal_mode: TerminalMode::new(),
        };
        
        app.initialize_demo_data();
        app
    }
    
    fn initialize_demo_data(&mut self) {
        // Add demo terminals
        self.terminals.push(TerminalTab {
            id: "terminal-1".to_string(),
            title: "Main Terminal".to_string(),
            status: "Running".to_string(),
            output: "Advanced CCTM TUI with sophisticated terminal control and TTY detection!".to_string(),
            working_dir: "/home/tabs/ae-co-system/multi-cld-code".to_string(),
            created_at: "2025-01-09 12:30".to_string(),
        });
        
        self.terminals.push(TerminalTab {
            id: "terminal-2".to_string(),
            title: "Claude Code Session".to_string(),
            status: "Running".to_string(),
            output: "Production-ready predictive completion with automatic TTY/non-TTY fallback.".to_string(),
            working_dir: "/home/tabs/ae-co-system/multi-cld-code".to_string(),
            created_at: "2025-01-09 12:32".to_string(),
        });
        
        self.terminals.push(TerminalTab {
            id: "terminal-3".to_string(),
            title: "Advanced Terminal Control".to_string(),
            status: "Running".to_string(),
            output: "Sophisticated raw mode with termios, signal handling, and cross-platform support.".to_string(),
            working_dir: "/home/tabs/ae-co-system/multi-cld-code".to_string(),
            created_at: "2025-01-09 12:35".to_string(),
        });
        
        // Add demo AI messages
        self.ai_messages.push_back(AiMessage {
            content: "Welcome to Advanced CCTM TUI! Now with production-grade terminal control and sophisticated fallback handling.".to_string(),
            is_user: false,
            timestamp: "12:30".to_string(),
        });
        
        // Add demo MCP servers
        self.mcp_servers.push(McpServer {
            name: "Desktop Commander".to_string(),
            status: "Running".to_string(),
            capabilities: vec![
                McpCapability {
                    name: "advanced_terminal_control".to_string(),
                    description: "Production-grade terminal management".to_string(),
                    tool_type: "system".to_string(),
                },
                McpCapability {
                    name: "predictive_completion".to_string(),
                    description: "Sophisticated command prediction with learning".to_string(),
                    tool_type: "ai_assistance".to_string(),
                },
            ],
            memory_usage: 58,
        });
        
        self.mcp_servers.push(McpServer {
            name: "TTY Controller".to_string(),
            status: "Connected".to_string(),
            capabilities: vec![
                McpCapability {
                    name: "raw_mode_detection".to_string(),
                    description: "Automatic TTY detection and fallback".to_string(),
                    tool_type: "terminal".to_string(),
                },
            ],
            memory_usage: 32,
        });
        
        // Set current project
        self.current_project = Some(ProjectInfo {
            name: "CCTM - Advanced Terminal Control".to_string(),
            path: "/home/tabs/ae-co-system/multi-cld-code".to_string(),
            project_type: "Rust (Advanced TUI + Termios)".to_string(),
            detected_at: "2025-01-09 12:30".to_string(),
        });
    }
    
    fn run(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        self.show_welcome();
        
        loop {
            match self.handle_input()? {
                InputResult::Command(cmd) => {
                    self.execute_command(&cmd)?;
                }
                InputResult::Quit => {
                    self.show_goodbye();
                    break;
                }
                InputResult::Continue => continue,
            }
            println!();
        }
        
        Ok(())
    }
    
    fn show_welcome(&self) {
        println!("🚀 {}{{ae}} CCTM TUI - Advanced Terminal Control{}", BOLD_TEXT, RESET_COLOR);
        println!("═══════════════════════════════════════════════");
        println!("   {}Production-Ready Predictive Intelligence{}", CYAN_TEXT, RESET_COLOR);
        println!("   {}aegntic.ai | {{ae}} | aegntic.ai | {{ae}}{}", GRAY_TEXT, RESET_COLOR);
        println!("═══════════════════════════════════════════════");
        
        // Show terminal mode status
        let mode_info = match &self.terminal_mode {
            TerminalMode::Raw(_) => format!("{}🟢 Raw Mode Active{} - Character-by-character input", GREEN_TEXT, RESET_COLOR),
            TerminalMode::Line(_) => format!("{}🟡 Line Mode Active{} - Fallback for non-TTY", YELLOW_TEXT, RESET_COLOR),
        };
        println!("   {}", mode_info);
        println!();
        
        println!("📊 CCTM System Status:");
        println!("  • Terminals: {} active", self.terminals.len());
        println!("  • MCP Servers: {} connected", self.mcp_servers.len());
        println!("  • Current Project: {}", 
            self.current_project.as_ref().map(|p| p.name.as_str()).unwrap_or("None"));
        println!();
        
        if self.terminal_mode.is_raw() {
            println!("🎯 Available Commands {}(Tab: complete, ↑↓: navigate, Ctrl+C: exit){}:", GRAY_TEXT, RESET_COLOR);
        } else {
            println!("🎯 Available Commands {}(Line mode - type full commands){}:", GRAY_TEXT, RESET_COLOR);
        }
        
        println!("  1. List terminals");
        println!("  2. Show AI conversation");
        println!("  3. Display MCP servers");
        println!("  4. Project information");
        println!("  5. Execute AE command");
        println!("  q. Quit");
        println!();
    }
    
    fn show_goodbye(&self) {
        println!("{}👋 Thanks for using Advanced CCTM TUI!{}", GREEN_TEXT, RESET_COLOR);
        println!("   {}{{ae}} | aegntic.ai - Sophisticated AI Development Tools{}", GRAY_TEXT, RESET_COLOR);
        
        match &self.terminal_mode {
            TerminalMode::Raw(_) => println!("   {}Raw mode terminal restored successfully{}", GRAY_TEXT, RESET_COLOR),
            TerminalMode::Line(_) => println!("   {}Line mode session completed{}", GRAY_TEXT, RESET_COLOR),
        }
    }
    
    fn handle_input(&mut self) -> Result<InputResult, Box<dyn std::error::Error>> {
        match &mut self.terminal_mode {
            TerminalMode::Raw(raw_terminal) => self.handle_raw_input(raw_terminal),
            TerminalMode::Line(line_terminal) => self.handle_line_input(line_terminal),
        }
    }
    
    fn handle_raw_input(&mut self, raw_terminal: &mut RawTerminal) -> Result<InputResult, Box<dyn std::error::Error>> {
        let mut input = String::new();
        let mut selected_suggestion = 0;
        
        print!("{}CCTM{}> ", BOLD_TEXT, RESET_COLOR);
        io::stdout().flush()?;
        
        loop {
            let suggestions = self.predictive_engine.get_suggestions(&input);
            self.display_suggestions(&input, &suggestions, selected_suggestion);
            
            let ch = raw_terminal.read_char()?;
            
            match ch {
                '\n' | '\r' => {
                    print!("{}", CLEAR_LINE);
                    let command = if !suggestions.is_empty() && input.is_empty() {
                        suggestions[selected_suggestion].text.clone()
                    } else {
                        input.clone()
                    };
                    
                    if !command.is_empty() {
                        self.predictive_engine.record_usage(&command);
                    }
                    
                    println!("{}CCTM{}> {}", BOLD_TEXT, RESET_COLOR, command);
                    return Ok(InputResult::Command(command));
                }
                '\t' => {
                    if !suggestions.is_empty() {
                        input = suggestions[selected_suggestion].text.clone();
                        selected_suggestion = 0;
                    }
                }
                '\x1b' => {
                    // Handle escape sequences (arrow keys)
                    if let Ok('[') = raw_terminal.read_char() {
                        match raw_terminal.read_char()? {
                            'A' => {
                                // Up arrow
                                if !suggestions.is_empty() {
                                    selected_suggestion = if selected_suggestion == 0 {
                                        suggestions.len() - 1
                                    } else {
                                        selected_suggestion - 1
                                    };
                                }
                            }
                            'B' => {
                                // Down arrow
                                if !suggestions.is_empty() {
                                    selected_suggestion = (selected_suggestion + 1) % suggestions.len();
                                }
                            }
                            _ => {}
                        }
                    }
                }
                '\x08' | '\x7f' => {
                    // Backspace
                    if !input.is_empty() {
                        input.pop();
                        selected_suggestion = 0;
                    }
                }
                '\x03' => {
                    // Ctrl+C
                    return Ok(InputResult::Quit);
                }
                c if c.is_ascii_graphic() || c == ' ' => {
                    input.push(c);
                    selected_suggestion = 0;
                }
                _ => {}
            }
        }
    }
    
    fn handle_line_input(&mut self, line_terminal: &mut LineTerminal) -> Result<InputResult, Box<dyn std::error::Error>> {
        print!("{}CCTM{}> ", BOLD_TEXT, RESET_COLOR);
        io::stdout().flush()?;
        
        let input = line_terminal.read_line()?;
        
        if !input.is_empty() {
            self.predictive_engine.record_usage(&input);
        }
        
        Ok(InputResult::Command(input))
    }
    
    fn display_suggestions(&self, input: &str, suggestions: &[Suggestion], selected: usize) {
        print!("{}", CLEAR_LINE);
        print!("{}CCTM{}> {}", BOLD_TEXT, RESET_COLOR, input);
        
        if !suggestions.is_empty() {
            let suggestion = &suggestions[selected];
            if suggestion.text.starts_with(input) && !input.is_empty() {
                let completion = &suggestion.text[input.len()..];
                print!("{}{}{}", GRAY_TEXT, completion, RESET_COLOR);
            }
            
            print!("{}", SAVE_CURSOR);
            println!();
            
            for (i, suggestion) in suggestions.iter().enumerate() {
                let prefix = if i == selected { "▶ " } else { "  " };
                let style = if i == selected { CYAN_TEXT } else { GRAY_TEXT };
                
                println!("{}{}{}{}  {}{}", 
                    style, prefix, suggestion.text, RESET_COLOR,
                    GRAY_TEXT, suggestion.description);
            }
            
            println!("{}  Tab: accept, ↑↓: navigate, Enter: execute, Ctrl+C: exit{}", GRAY_TEXT, RESET_COLOR);
            print!("{}", RESTORE_CURSOR);
        }
        
        io::stdout().flush().unwrap();
    }
    
    fn execute_command(&mut self, command: &str) -> Result<(), Box<dyn std::error::Error>> {
        match command.trim() {
            "1" => self.show_terminals(),
            "2" => self.show_ai_conversation(),
            "3" => self.show_mcp_servers(),
            "4" => self.show_project_info(),
            "5" => self.execute_ae_command_interactive()?,
            "q" | "quit" | "exit" => return Ok(()),
            cmd if cmd.starts_with("ae ") => {
                self.execute_ae_command(&cmd[3..])?;
            }
            "" => return Ok(()),
            _ => {
                println!("{}❌ Unknown command. Try 1-5 or 'q' to quit.{}", YELLOW_TEXT, RESET_COLOR);
                println!("   {}You can also use 'ae <command>' for AI commands.{}", GRAY_TEXT, RESET_COLOR);
            }
        }
        Ok(())
    }
}