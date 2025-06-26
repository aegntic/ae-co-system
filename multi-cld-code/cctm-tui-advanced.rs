/// CCTM TUI Advanced - Production-Ready Predictive Terminal
/// 
/// Sophisticated terminal control with proper raw mode, TTY detection,
/// and fallback modes for all environments.

use std::io::{self, Write, Read, stdin, IsTerminal};
use std::collections::{VecDeque, HashMap};
use std::os::fd::AsRawFd;

// Terminal control sequences
const CLEAR_LINE: &str = "\x1b[2K\r";
const SAVE_CURSOR: &str = "\x1b[s";
const RESTORE_CURSOR: &str = "\x1b[u";
const GRAY_TEXT: &str = "\x1b[90m";
const RESET_COLOR: &str = "\x1b[0m";
const BOLD_TEXT: &str = "\x1b[1m";
const GREEN_TEXT: &str = "\x1b[92m";
const CYAN_TEXT: &str = "\x1b[96m";
const YELLOW_TEXT: &str = "\x1b[93m";

// Termios bindings for raw mode
#[cfg(unix)]
mod termios {
    use std::os::fd::RawFd;
    
    #[repr(C)]
    #[derive(Clone, Copy)]
    pub struct Termios {
        pub c_iflag: u32,
        pub c_oflag: u32,
        pub c_cflag: u32,
        pub c_lflag: u32,
        pub c_cc: [u8; 32],
        pub c_ispeed: u32,
        pub c_ospeed: u32,
    }
    
    // Terminal control flags
    pub const ICANON: u32 = 0o000002;
    pub const ECHO: u32 = 0o000010;
    pub const ISIG: u32 = 0o000001;
    pub const VMIN: usize = 6;
    pub const VTIME: usize = 5;
    pub const TCSAFLUSH: i32 = 2;
    
    extern "C" {
        pub fn tcgetattr(fd: RawFd, termios_p: *mut Termios) -> i32;
        pub fn tcsetattr(fd: RawFd, optional_actions: i32, termios_p: *const Termios) -> i32;
        pub fn isatty(fd: RawFd) -> i32;
    }
}

#[derive(Debug)]
enum TerminalMode {
    Raw(RawTerminal),
    Line(LineTerminal),
}

#[cfg(unix)]
struct RawTerminal {
    original_termios: termios::Termios,
    stdin_fd: i32,
}

#[cfg(unix)]
impl RawTerminal {
    fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let stdin_fd = stdin().as_raw_fd();
        
        // Check if stdin is a TTY
        if unsafe { termios::isatty(stdin_fd) } == 0 {
            return Err("stdin is not a TTY".into());
        }
        
        let mut original_termios = termios::Termios {
            c_iflag: 0, c_oflag: 0, c_cflag: 0, c_lflag: 0,
            c_cc: [0; 32], c_ispeed: 0, c_ospeed: 0,
        };
        
        // Get current terminal attributes
        if unsafe { termios::tcgetattr(stdin_fd, &mut original_termios) } != 0 {
            return Err("Failed to get terminal attributes".into());
        }
        
        // Create modified termios for raw mode
        let mut raw_termios = original_termios;
        
        // Disable canonical mode, echo, and signals
        raw_termios.c_lflag &= !(termios::ICANON | termios::ECHO | termios::ISIG);
        
        // Set minimum characters and timeout
        raw_termios.c_cc[termios::VMIN] = 1;  // Read at least 1 character
        raw_termios.c_cc[termios::VTIME] = 0; // No timeout
        
        // Apply raw mode
        if unsafe { termios::tcsetattr(stdin_fd, termios::TCSAFLUSH, &raw_termios) } != 0 {
            return Err("Failed to set raw mode".into());
        }
        
        Ok(RawTerminal {
            original_termios,
            stdin_fd,
        })
    }
    
    fn read_char(&mut self) -> Result<char, Box<dyn std::error::Error>> {
        let mut buffer = [0; 1];
        stdin().read_exact(&mut buffer)?;
        Ok(buffer[0] as char)
    }
}

#[cfg(unix)]
impl Drop for RawTerminal {
    fn drop(&mut self) {
        // Restore original terminal settings
        unsafe {
            termios::tcsetattr(self.stdin_fd, termios::TCSAFLUSH, &self.original_termios);
        }
    }
}

struct LineTerminal;

impl LineTerminal {
    fn new() -> Self {
        LineTerminal
    }
    
    fn read_line(&mut self) -> Result<String, Box<dyn std::error::Error>> {
        let mut input = String::new();
        stdin().read_line(&mut input)?;
        Ok(input.trim().to_string())
    }
}

#[cfg(not(unix))]
struct RawTerminal;

#[cfg(not(unix))]
impl RawTerminal {
    fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Err("Raw mode not implemented for this platform".into())
    }
    
    fn read_char(&mut self) -> Result<char, Box<dyn std::error::Error>> {
        Err("Raw mode not available".into())
    }
}

impl TerminalMode {
    fn new() -> Self {
        // Try to create raw terminal first
        #[cfg(unix)]
        {
            if stdin().is_terminal() {
                match RawTerminal::new() {
                    Ok(raw) => return TerminalMode::Raw(raw),
                    Err(_) => {} // Fall through to line mode
                }
            }
        }
        
        // Fallback to line mode
        TerminalMode::Line(LineTerminal::new())
    }
    
    fn is_raw(&self) -> bool {
        matches!(self, TerminalMode::Raw(_))
    }
}

#[derive(Debug)]
enum InputResult {
    Command(String),
    Quit,
    Continue,
}

#[derive(Debug, Clone)]
struct Suggestion {
    text: String,
    description: String,
    confidence: f32,
    context_type: String,
}

#[derive(Debug)]
struct PredictiveEngine {
    command_history: VecDeque<String>,
    context_patterns: HashMap<String, Vec<String>>,
    usage_frequency: HashMap<String, u32>,
}

impl PredictiveEngine {
    fn new() -> Self {
        let mut engine = PredictiveEngine {
            command_history: VecDeque::new(),
            context_patterns: HashMap::new(),
            usage_frequency: HashMap::new(),
        };
        
        engine.initialize_patterns();
        engine
    }
    
    fn initialize_patterns(&mut self) {
        // Base command patterns
        self.context_patterns.insert("".to_string(), vec![
            "1".to_string(), "2".to_string(), "3".to_string(), "4".to_string(), "5".to_string(),
            "ae help".to_string(), "ae analyze".to_string(), "ae status".to_string(), "quit".to_string()
        ]);
        
        // AE command patterns
        self.context_patterns.insert("ae".to_string(), vec![
            "help".to_string(), "analyze code".to_string(), "run tests".to_string(),
            "suggest improvements".to_string(), "status".to_string(), "terminals".to_string(),
            "servers".to_string(), "watermark".to_string()
        ]);
        
        // Initialize frequencies
        self.usage_frequency.insert("ae help".to_string(), 100);
        self.usage_frequency.insert("ae analyze code".to_string(), 80);
        self.usage_frequency.insert("ae status".to_string(), 60);
    }
    
    fn get_suggestions(&self, input: &str) -> Vec<Suggestion> {
        let mut suggestions = Vec::new();
        
        // Pattern-based suggestions
        for (pattern, commands) in &self.context_patterns {
            if input.starts_with(pattern) && pattern.len() <= input.len() {
                for cmd in commands {
                    if cmd.starts_with(input) && cmd != input {
                        let frequency = self.usage_frequency.get(cmd).unwrap_or(&1);
                        suggestions.push(Suggestion {
                            text: cmd.clone(),
                            description: self.get_command_description(cmd),
                            confidence: (*frequency as f32 / 100.0).min(1.0),
                            context_type: "pattern_match".to_string(),
                        });
                    }
                }
            }
        }
        
        // Sort by confidence and limit to top 5
        suggestions.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        suggestions.truncate(5);
        
        suggestions
    }
    
    fn get_command_description(&self, cmd: &str) -> String {
        match cmd {
            "1" => "List active terminal sessions".to_string(),
            "2" => "Show AI conversation history".to_string(),
            "3" => "Display MCP server status".to_string(),
            "4" => "Show project information".to_string(),
            "5" => "Execute AE command interactively".to_string(),
            "quit" | "q" => "Exit CCTM TUI".to_string(),
            "ae help" => "Show available AE commands".to_string(),
            "ae analyze code" => "Analyze project structure and quality".to_string(),
            "ae run tests" => "Execute project test suite".to_string(),
            "ae suggest improvements" => "Get AI-powered improvement suggestions".to_string(),
            "ae status" => "Show comprehensive system status".to_string(),
            "ae terminals" => "List all active terminal sessions".to_string(),
            "ae servers" => "Show MCP server status and capabilities".to_string(),
            _ => "Execute command".to_string(),
        }
    }
    
    fn record_usage(&mut self, command: &str) {
        self.command_history.push_back(command.to_string());
        if self.command_history.len() > 100 {
            self.command_history.pop_front();
        }
        
        *self.usage_frequency.entry(command.to_string()).or_insert(0) += 1;
    }
}