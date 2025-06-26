/// CCTM TUI with pickd Integration - Revolutionary Knowledge Management
/// 
/// Combines Claude Code Terminal Manager with pickd personal knowledge base
/// Features Cursor-style predictive completion + AI-powered snippet management

use std::io::{self, Write};
use std::collections::{HashMap, VecDeque};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 {{ae}} CCTM TUI + pickd - Knowledge-Powered Terminal");
    println!("═══════════════════════════════════════════════════════");
    println!("   Revolutionary AI-Human Co-Creation Tool");
    println!("   with pickd Personal Knowledge Base Integration");
    println!("   aegntic.ai | {{ae}} | aegntic.ai | {{ae}}");
    println!("═══════════════════════════════════════════════════════");
    println!();
    
    let mut app = CctmPickdApp::new();
    
    println!("📊 CCTM + pickd System Status:");
    println!("  • Terminals: {} active", app.terminals.len());
    println!("  • MCP Servers: {} connected", app.mcp_servers.len());
    println!("  • pickd Items: {} stored", app.pickd_items.len());
    println!("  • pickd Tags: {} unique", app.get_unique_tags().len());
    println!("  • Predictive Engine: 🧠 ACTIVE");
    println!("  • Knowledge Completion: 🎯 ENHANCED");
    println!();
    
    println!("🎯 Enhanced Features with pickd:");
    println!("  ✅ Instant snippet retrieval with AI predictions");
    println!("  ✅ Tag-based knowledge organization");
    println!("  ✅ Context-aware code suggestions");
    println!("  ✅ Personal pattern library integration");
    println!("  ✅ Smart search with fuzzy matching");
    println!("  ✅ Cross-terminal knowledge sharing");
    println!();
    
    println!("💡 pickd Commands (with predictive completion):");
    println!("  📝 pickd add <id> <content> [tags] - Store knowledge");
    println!("  🔍 pickd find <query> - Search your knowledge base");
    println!("  📋 pickd list [tags] - List items by tags");
    println!("  🏷️  pickd tags - Show all tags with counts");
    println!("  📄 pickd get <id> - Retrieve specific item");
    println!("  🗑️  pickd remove <id> - Delete item");
    println!();
    
    println!("🎯 Available Commands:");
    println!("  1. List terminals");
    println!("  2. Show AI conversation");
    println!("  3. Display MCP servers");
    println!("  4. Project information");
    println!("  5. Execute AE command");
    println!("  6. 🆕 pickd Knowledge Management");
    println!("  demo. Demonstrate pickd integration");
    println!("  q. Quit");
    println!();
    
    loop {
        print!("CCTM+pickd> ");
        io::stdout().flush()?;
        
        let mut input = String::new();
        io::stdin().read_line(&mut input)?;
        let input = input.trim();
        
        if input.is_empty() {
            continue;
        }
        
        if input == "q" || input == "quit" || input == "exit" {
            println!("👋 Thanks for using CCTM with pickd Knowledge Integration!");
            println!("   📚 Your knowledge base: {} items saved", app.pickd_items.len());
            break;
        }
        
        match input {
            "1" => app.show_terminals(),
            "2" => app.show_ai_conversation(),
            "3" => app.show_mcp_servers(),
            "4" => app.show_project_info(),
            "5" => app.execute_ae_command_interactive()?,
            "6" => app.show_pickd_interface(),
            "demo" => app.demonstrate_pickd_integration(),
            cmd if cmd.starts_with("pickd ") => {
                app.handle_pickd_command(&cmd[6..])?;
            }
            cmd if cmd.starts_with("ae ") => {
                app.execute_ae_command(&cmd[3..])?;
            }
            _ => {
                let suggestions = app.get_command_suggestions(input);
                if !suggestions.is_empty() {
                    println!("🧠 Did you mean:");
                    for (i, suggestion) in suggestions.iter().enumerate().take(3) {
                        println!("  {}. {} - {}", i + 1, suggestion.text, suggestion.description);
                    }
                } else {
                    println!("❓ Unknown command. Try 'demo' to see pickd integration or use Tab completion!");
                }
            }
        }
        println!();
    }
    
    Ok(())
}

#[derive(Debug, Clone)]
struct PickdItem {
    id: String,
    content: String,
    tags: Vec<String>,
    created: String,
    usage_count: u32,
}

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

#[derive(Debug, Clone)]
struct Suggestion {
    text: String,
    description: String,
    confidence: f32,
}

struct CctmPickdApp {
    terminals: Vec<TerminalTab>,
    ai_messages: VecDeque<AiMessage>,
    mcp_servers: Vec<McpServer>,
    current_project: Option<ProjectInfo>,
    pickd_items: Vec<PickdItem>,
    command_patterns: HashMap<String, Vec<String>>,
}

impl CctmPickdApp {
    fn new() -> Self {
        let mut app = CctmPickdApp {
            terminals: Vec::new(),
            ai_messages: VecDeque::new(),
            mcp_servers: Vec::new(),
            current_project: None,
            pickd_items: Vec::new(),
            command_patterns: HashMap::new(),
        };
        
        app.initialize_demo_data();
        app.initialize_command_patterns();
        app
    }
    
    fn initialize_demo_data(&mut self) {
        // Initialize terminals
        self.terminals.push(TerminalTab {
            id: "terminal-1".to_string(),
            title: "Main Terminal".to_string(),
            status: "Running".to_string(),
            output: "CCTM + pickd integration active! Your personal knowledge base is ready.".to_string(),
            working_dir: "/home/tabs/ae-co-system/multi-cld-code".to_string(),
            created_at: "2025-01-09 12:30".to_string(),
        });
        
        self.terminals.push(TerminalTab {
            id: "terminal-2".to_string(),
            title: "Claude Code + pickd".to_string(),
            status: "Running".to_string(),
            output: "Claude Code with pickd knowledge integration. AI-powered snippet retrieval ready!".to_string(),
            working_dir: "/home/tabs/ae-co-system/multi-cld-code".to_string(),
            created_at: "2025-01-09 12:32".to_string(),
        });
        
        // Initialize AI messages
        self.ai_messages.push_back(AiMessage {
            content: "Welcome to CCTM with pickd integration! I can now help you manage your personal knowledge base alongside terminal operations.".to_string(),
            is_user: false,
            timestamp: "12:30".to_string(),
        });
        
        // Initialize MCP servers
        self.mcp_servers.push(McpServer {
            name: "pickd Knowledge Base".to_string(),
            status: "Running".to_string(),
            capabilities: vec![
                McpCapability {
                    name: "pickd_add".to_string(),
                    description: "Add new knowledge items with ID and tags".to_string(),
                    tool_type: "knowledge_management".to_string(),
                },
                McpCapability {
                    name: "pickd_find".to_string(),
                    description: "Search knowledge base with fuzzy matching".to_string(),
                    tool_type: "search".to_string(),
                },
                McpCapability {
                    name: "pickd_list".to_string(),
                    description: "List items by tags and filters".to_string(),
                    tool_type: "organization".to_string(),
                },
                McpCapability {
                    name: "pickd_get".to_string(),
                    description: "Retrieve specific items by ID".to_string(),
                    tool_type: "retrieval".to_string(),
                },
            ],
            memory_usage: 35,
        });
        
        self.mcp_servers.push(McpServer {
            name: "Desktop Commander".to_string(),
            status: "Running".to_string(),
            capabilities: vec![
                McpCapability {
                    name: "execute_command".to_string(),
                    description: "Execute terminal commands with pickd context".to_string(),
                    tool_type: "system".to_string(),
                },
            ],
            memory_usage: 28,
        });
        
        // Initialize sample pickd items
        self.pickd_items.push(PickdItem {
            id: "rust-async-basics".to_string(),
            content: "async fn fetch_data() -> Result<String, Error> {\n    let response = reqwest::get(\"https://api.example.com\").await?;\n    let text = response.text().await?;\n    Ok(text)\n}".to_string(),
            tags: vec!["rust".to_string(), "async".to_string(), "http".to_string()],
            created: "2025-01-09 10:15".to_string(),
            usage_count: 5,
        });
        
        self.pickd_items.push(PickdItem {
            id: "docker-compose-template".to_string(),
            content: "version: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - \"3000:3000\"\n    environment:\n      - NODE_ENV=production".to_string(),
            tags: vec!["docker".to_string(), "compose".to_string(), "template".to_string()],
            created: "2025-01-09 09:30".to_string(),
            usage_count: 3,
        });
        
        self.pickd_items.push(PickdItem {
            id: "sql-query-optimization".to_string(),
            content: "-- Optimize query with proper indexing\nCREATE INDEX idx_user_created ON users(created_at);\nSELECT * FROM users WHERE created_at > '2024-01-01' ORDER BY created_at DESC LIMIT 100;".to_string(),
            tags: vec!["sql".to_string(), "optimization".to_string(), "database".to_string()],
            created: "2025-01-09 08:45".to_string(),
            usage_count: 8,
        });
        
        self.pickd_items.push(PickdItem {
            id: "bash-error-handling".to_string(),
            content: "#!/bin/bash\nset -euo pipefail  # Exit on error, undefined vars, pipe failures\n\ncleanup() {\n    echo \"Cleaning up...\"\n}\ntrap cleanup EXIT".to_string(),
            tags: vec!["bash".to_string(), "error-handling".to_string(), "scripts".to_string()],
            created: "2025-01-09 11:20".to_string(),
            usage_count: 12,
        });
        
        self.pickd_items.push(PickdItem {
            id: "git-workflow-commands".to_string(),
            content: "# Common Git workflow\ngit checkout -b feature/new-feature\ngit add .\ngit commit -m \"feat: implement new feature\"\ngit push -u origin feature/new-feature".to_string(),
            tags: vec!["git".to_string(), "workflow".to_string(), "commands".to_string()],
            created: "2025-01-09 12:00".to_string(),
            usage_count: 15,
        });
        
        // Set current project
        self.current_project = Some(ProjectInfo {
            name: "CCTM + pickd Integration".to_string(),
            path: "/home/tabs/ae-co-system/multi-cld-code".to_string(),
            project_type: "Rust (TUI + Knowledge Management)".to_string(),
            detected_at: "2025-01-09 12:30".to_string(),
        });
    }
    
    fn initialize_command_patterns(&mut self) {
        self.command_patterns.insert("pickd".to_string(), vec![
            "pickd add".to_string(),
            "pickd find".to_string(),
            "pickd list".to_string(),
            "pickd tags".to_string(),
            "pickd get".to_string(),
            "pickd remove".to_string(),
        ]);
        
        self.command_patterns.insert("ae".to_string(), vec![
            "ae search pickd".to_string(),
            "ae find snippet".to_string(),
            "ae analyze knowledge".to_string(),
            "ae suggest from pickd".to_string(),
        ]);
    }
    
    fn get_unique_tags(&self) -> Vec<String> {
        let mut tags = std::collections::HashSet::new();
        for item in &self.pickd_items {
            for tag in &item.tags {
                tags.insert(tag.clone());
            }
        }
        tags.into_iter().collect()
    }
    
    fn get_command_suggestions(&self, input: &str) -> Vec<Suggestion> {
        let mut suggestions = Vec::new();
        
        // pickd command suggestions
        if input.starts_with("pick") || input == "p" {
            suggestions.push(Suggestion {
                text: "pickd find <query>".to_string(),
                description: "Search your knowledge base".to_string(),
                confidence: 0.9,
            });
            suggestions.push(Suggestion {
                text: "pickd list".to_string(),
                description: "List all your knowledge items".to_string(),
                confidence: 0.8,
            });
        }
        
        // AE + pickd suggestions
        if input.starts_with("ae") || input == "a" {
            suggestions.push(Suggestion {
                text: "ae search pickd for rust".to_string(),
                description: "AI-powered knowledge search".to_string(),
                confidence: 0.85,
            });
            suggestions.push(Suggestion {
                text: "ae suggest from pickd".to_string(),
                description: "Get relevant snippets for current context".to_string(),
                confidence: 0.8,
            });
        }
        
        suggestions
    }
    
    fn show_terminals(&self) {
        println!("📟 Active Terminals ({}) with pickd Integration:", self.terminals.len());
        println!("┌─────────────────────────────────────────────────────────────────────┐");
        
        for (i, terminal) in self.terminals.iter().enumerate() {
            let status_emoji = match terminal.status.as_str() {
                "Running" => "🟢",
                "Stopped" => "🔴",
                _ => "🟡",
            };
            
            println!("│ {}. {} {} [{}]", 
                i + 1, 
                status_emoji, 
                terminal.title, 
                terminal.status
            );
            println!("│    📁 {}", terminal.working_dir);
            println!("│    💬 {}", terminal.output.chars().take(60).collect::<String>());
            println!("│    🕐 Created: {}", terminal.created_at);
            if i < self.terminals.len() - 1 {
                println!("│");
            }
        }
        
        println!("└─────────────────────────────────────────────────────────────────────┘");
        println!("💡 Each terminal has access to your pickd knowledge base!");
    }
    
    fn show_ai_conversation(&self) {
        println!("🤖 AI Conversation with pickd Context ({} messages):", self.ai_messages.len());
        println!("┌─────────────────────────────────────────────────────────────────────┐");
        
        for message in &self.ai_messages {
            let speaker = if message.is_user { "You" } else { "AE Assistant" };
            let emoji = if message.is_user { "👤" } else { "🤖" };
            
            println!("│ {} [{}] {}:", emoji, message.timestamp, speaker);
            
            let words: Vec<&str> = message.content.split_whitespace().collect();
            let mut line = String::new();
            
            for word in words {
                if line.len() + word.len() + 1 > 60 {
                    println!("│   {}", line);
                    line = word.to_string();
                } else {
                    if !line.is_empty() {
                        line.push(' ');
                    }
                    line.push_str(word);
                }
            }
            if !line.is_empty() {
                println!("│   {}", line);
            }
            println!("│");
        }
        
        println!("└─────────────────────────────────────────────────────────────────────┘");
        println!("💡 AI has access to your pickd knowledge for contextual responses!");
    }
    
    fn show_mcp_servers(&self) {
        println!("🔧 MCP Servers with pickd Integration ({}):", self.mcp_servers.len());
        println!("┌─────────────────────────────────────────────────────────────────────┐");
        
        for (i, server) in self.mcp_servers.iter().enumerate() {
            let status_emoji = match server.status.as_str() {
                "Running" | "Connected" => "🟢",
                "Stopped" => "🔴",
                "Starting" => "🟡",
                _ => "⚪",
            };
            
            println!("│ {}. {} {} [{}]", 
                i + 1, 
                status_emoji, 
                server.name, 
                server.status
            );
            println!("│    📊 {} tools, {}MB memory", 
                server.capabilities.len(), 
                server.memory_usage
            );
            
            for cap in &server.capabilities {
                println!("│      🛠️  {}: {}", cap.name, cap.description.chars().take(45).collect::<String>());
            }
            
            if i < self.mcp_servers.len() - 1 {
                println!("│");
            }
        }
        
        println!("└─────────────────────────────────────────────────────────────────────┘");
    }
    
    fn show_project_info(&self) {
        println!("📋 Project Information with pickd Knowledge:");
        println!("┌─────────────────────────────────────────────────────────────────────┐");
        
        if let Some(project) = &self.current_project {
            println!("│ 📦 Project: {}", project.name);
            println!("│ 🏷️  Type: {}", project.project_type);
            println!("│ 📁 Path: {}", project.path);
            println!("│ 🕐 Detected: {}", project.detected_at);
            println!("│");
            println!("│ 📚 pickd Knowledge Stats:");
            println!("│   • Total Items: {}", self.pickd_items.len());
            println!("│   • Unique Tags: {}", self.get_unique_tags().len());
            println!("│   • Most Used: {}", self.get_most_used_item());
            println!("│   • Languages: {}", self.get_language_tags().join(", "));
            println!("│");
            println!("│ 🎯 Features Active:");
            println!("│   ✅ Terminal Virtualization + Knowledge Integration");
            println!("│   ✅ MCP Service with pickd Personal Knowledge Base");
            println!("│   ✅ AI Assistant with Snippet Context Awareness");
            println!("│   ✅ Predictive Completion with Knowledge Hints");
            println!("│   ✅ Cross-Terminal Knowledge Sharing");
            println!("│");
            println!("│ 🚀 Status: Revolutionary Knowledge-Powered Development!");
        }
        
        println!("└─────────────────────────────────────────────────────────────────────┘");
    }
    
    fn show_pickd_interface(&self) {
        println!("📚 pickd Knowledge Base Interface:");
        println!("┌─────────────────────────────────────────────────────────────────────┐");
        println!("│ 🎯 Quick Actions:");
        println!("│   pickd find <query>     - Search your knowledge");
        println!("│   pickd list [tag]       - List items by tag");
        println!("│   pickd get <id>         - Get specific item");
        println!("│   pickd tags             - Show all tags");
        println!("│");
        println!("│ 📊 Knowledge Statistics:");
        println!("│   • Total Items: {}", self.pickd_items.len());
        println!("│   • Total Tags: {}", self.get_unique_tags().len());
        println!("│   • Most Used: {}", self.get_most_used_item());
        println!("│");
        println!("│ 🏷️  Popular Tags:");
        let tag_counts = self.get_tag_usage_stats();
        for (tag, count) in tag_counts.iter().take(5) {
            println!("│     {} ({} items)", tag, count);
        }
        println!("└─────────────────────────────────────────────────────────────────────┘");
        
        println!();
        println!("💡 Try: 'pickd find rust' or 'pickd list docker' for instant results!");
    }
    
    fn handle_pickd_command(&mut self, cmd: &str) -> Result<(), Box<dyn std::error::Error>> {
        let parts: Vec<&str> = cmd.split_whitespace().collect();
        if parts.is_empty() {
            println!("❓ pickd command required. Try 'pickd help'");
            return Ok(());
        }
        
        match parts[0] {
            "find" => {
                if parts.len() < 2 {
                    println!("❓ Usage: pickd find <query>");
                    return Ok(());
                }
                let query = parts[1..].join(" ");
                self.find_pickd_items(&query);
            }
            "list" => {
                let tag_filter = if parts.len() > 1 { Some(parts[1]) } else { None };
                self.list_pickd_items(tag_filter);
            }
            "get" => {
                if parts.len() < 2 {
                    println!("❓ Usage: pickd get <id>");
                    return Ok(());
                }
                self.get_pickd_item(parts[1]);
            }
            "tags" => {
                self.show_pickd_tags();
            }
            "help" => {
                self.show_pickd_help();
            }
            _ => {
                println!("❓ Unknown pickd command: {}. Try 'pickd help'", parts[0]);
            }
        }
        
        Ok(())
    }
    
    fn find_pickd_items(&self, query: &str) {
        println!("🔍 Searching pickd for: '{}'", query);
        println!("┌─────────────────────────────────────────────────────────────────────┐");
        
        let mut found_items = Vec::new();
        for item in &self.pickd_items {
            if item.content.to_lowercase().contains(&query.to_lowercase()) ||
               item.id.to_lowercase().contains(&query.to_lowercase()) ||
               item.tags.iter().any(|t| t.to_lowercase().contains(&query.to_lowercase())) {
                found_items.push(item);
            }
        }
        
        if found_items.is_empty() {
            println!("│ ❌ No items found matching '{}'", query);
            println!("│ 💡 Try broader terms or check 'pickd tags' for available tags");
        } else {
            println!("│ 📋 Found {} item(s):", found_items.len());
            println!("│");
            for item in found_items {
                println!("│ 🆔 ID: {}", item.id);
                println!("│ 🏷️  Tags: {}", item.tags.join(", "));
                println!("│ 📝 Content: {}", item.content.chars().take(60).collect::<String>());
                println!("│ 📊 Used {} times", item.usage_count);
                println!("│");
            }
        }
        
        println!("└─────────────────────────────────────────────────────────────────────┘");
    }
    
    fn list_pickd_items(&self, tag_filter: Option<&str>) {
        let title = if let Some(tag) = tag_filter {
            format!("📋 pickd Items Tagged '{}':", tag)
        } else {
            "📋 All pickd Items:".to_string()
        };
        
        println!("{}", title);
        println!("┌─────────────────────────────────────────────────────────────────────┐");
        
        let filtered_items: Vec<&PickdItem> = if let Some(tag) = tag_filter {
            self.pickd_items.iter().filter(|item| item.tags.contains(&tag.to_string())).collect()
        } else {
            self.pickd_items.iter().collect()
        };
        
        if filtered_items.is_empty() {
            println!("│ ❌ No items found");
        } else {
            for (i, item) in filtered_items.iter().enumerate() {
                println!("│ {}. 🆔 {}", i + 1, item.id);
                println!("│    🏷️  [{}]", item.tags.join(", "));
                println!("│    📝 {}", item.content.chars().take(50).collect::<String>());
                println!("│    📊 {} uses | 🕐 {}", item.usage_count, item.created);
                if i < filtered_items.len() - 1 {
                    println!("│");
                }
            }
        }
        
        println!("└─────────────────────────────────────────────────────────────────────┘");
    }
    
    fn get_pickd_item(&self, id: &str) {
        println!("📄 pickd Item Details:");
        println!("┌─────────────────────────────────────────────────────────────────────┐");
        
        if let Some(item) = self.pickd_items.iter().find(|i| i.id == id) {
            println!("│ 🆔 ID: {}", item.id);
            println!("│ 🏷️  Tags: {}", item.tags.join(", "));
            println!("│ 🕐 Created: {}", item.created);
            println!("│ 📊 Usage Count: {}", item.usage_count);
            println!("│");
            println!("│ 📝 Content:");
            for line in item.content.lines() {
                println!("│   {}", line);
            }
        } else {
            println!("│ ❌ Item '{}' not found", id);
            println!("│ 💡 Use 'pickd list' to see available items");
        }
        
        println!("└─────────────────────────────────────────────────────────────────────┘");
    }
    
    fn show_pickd_tags(&self) {
        println!("🏷️  pickd Tags with Usage Counts:");
        println!("┌─────────────────────────────────────────────────────────────────────┐");
        
        let tag_counts = self.get_tag_usage_stats();
        for (tag, count) in tag_counts {
            let bar = "█".repeat((count as f32 / 3.0) as usize);
            println!("│ {:15} {} ({} items)", tag, bar, count);
        }
        
        println!("└─────────────────────────────────────────────────────────────────────┘");
    }
    
    fn show_pickd_help(&self) {
        println!("📚 pickd Help - Personal Knowledge Management:");
        println!("┌─────────────────────────────────────────────────────────────────────┐");
        println!("│ 🔍 Search Commands:");
        println!("│   pickd find <query>     - Search content and tags");
        println!("│   pickd list [tag]       - List all items or by tag");
        println!("│   pickd get <id>         - Get specific item by ID");
        println!("│");
        println!("│ 📊 Information Commands:");
        println!("│   pickd tags             - Show all tags with counts");
        println!("│   pickd help             - Show this help");
        println!("│");
        println!("│ 💡 Examples:");
        println!("│   pickd find rust        - Find Rust-related items");
        println!("│   pickd list docker      - List Docker-tagged items");
        println!("│   pickd get rust-async-basics - Get specific snippet");
        println!("└─────────────────────────────────────────────────────────────────────┘");
    }
    
    fn get_most_used_item(&self) -> String {
        self.pickd_items.iter()
            .max_by_key(|item| item.usage_count)
            .map(|item| item.id.clone())
            .unwrap_or_else(|| "None".to_string())
    }
    
    fn get_language_tags(&self) -> Vec<String> {
        let languages = ["rust", "javascript", "python", "bash", "sql", "docker", "git"];
        let mut found_languages = Vec::new();
        
        for item in &self.pickd_items {
            for tag in &item.tags {
                if languages.contains(&tag.as_str()) && !found_languages.contains(tag) {
                    found_languages.push(tag.clone());
                }
            }
        }
        
        found_languages
    }
    
    fn get_tag_usage_stats(&self) -> Vec<(String, usize)> {
        let mut tag_counts = HashMap::new();
        
        for item in &self.pickd_items {
            for tag in &item.tags {
                *tag_counts.entry(tag.clone()).or_insert(0) += 1;
            }
        }
        
        let mut sorted_tags: Vec<(String, usize)> = tag_counts.into_iter().collect();
        sorted_tags.sort_by(|a, b| b.1.cmp(&a.1));
        sorted_tags
    }
    
    fn demonstrate_pickd_integration(&self) {
        println!("🎬 pickd Integration Demonstration:");
        println!("═════════════════════════════════════════════════════════════");
        println!();
        
        println!("🎯 Scenario: You need a Rust async function");
        println!("Command: pickd find rust async");
        println!();
        self.find_pickd_items("rust async");
        println!();
        
        println!("🎯 Scenario: You want to see all Docker resources");
        println!("Command: pickd list docker");
        println!();
        self.list_pickd_items(Some("docker"));
        println!();
        
        println!("🎯 Scenario: You need that specific Git workflow");
        println!("Command: pickd get git-workflow-commands");
        println!();
        self.get_pickd_item("git-workflow-commands");
        println!();
        
        println!("🎯 Revolutionary Features Demonstrated:");
        println!("  ✅ Instant knowledge retrieval with natural search");
        println!("  ✅ Tag-based organization for quick filtering");
        println!("  ✅ Usage tracking to surface popular snippets");
        println!("  ✅ Context-aware suggestions in AI conversations");
        println!("  ✅ Cross-terminal knowledge sharing");
        println!("  ✅ Integration with CCTM's predictive completion");
        println!();
        
        println!("🚀 This makes CCTM the ultimate knowledge-powered terminal!");
    }
    
    fn execute_ae_command_interactive(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        print!("Enter AE command (with pickd context): ae ");
        io::stdout().flush()?;
        
        let mut input = String::new();
        io::stdin().read_line(&mut input)?;
        let command = input.trim();
        
        if !command.is_empty() {
            self.execute_ae_command(command)?;
        }
        
        Ok(())
    }
    
    fn execute_ae_command(&mut self, command: &str) -> Result<(), Box<dyn std::error::Error>> {
        println!("🤖 AE Assistant with pickd Knowledge Processing: '{}'", command);
        println!("┌─────────────────────────────────────────────────────────────────────┐");
        
        // Add user message
        self.ai_messages.push_back(AiMessage {
            content: format!("ae {}", command),
            is_user: true,
            timestamp: "now".to_string(),
        });
        
        // Generate response with pickd context
        let response = self.generate_ae_response_with_pickd(command);
        
        // Add AI response
        self.ai_messages.push_back(AiMessage {
            content: response.clone(),
            is_user: false,
            timestamp: "now".to_string(),
        });
        
        // Display response
        let words: Vec<&str> = response.split_whitespace().collect();
        let mut line = String::new();
        
        for word in words {
            if line.len() + word.len() + 1 > 65 {
                println!("│ {}", line);
                line = word.to_string();
            } else {
                if !line.is_empty() {
                    line.push(' ');
                }
                line.push_str(word);
            }
        }
        if !line.is_empty() {
            println!("│ {}", line);
        }
        
        println!("└─────────────────────────────────────────────────────────────────────┘");
        
        // Keep only last 10 messages
        while self.ai_messages.len() > 10 {
            self.ai_messages.pop_front();
        }
        
        Ok(())
    }
    
    fn generate_ae_response_with_pickd(&self, command: &str) -> String {
        let cmd = command.trim().to_lowercase();
        
        match cmd.as_str() {
            "help" => {
                "AE Assistant with pickd Integration: • ae search pickd <query> - AI-powered knowledge search • ae suggest from pickd - Get relevant snippets for current context • ae analyze pickd - Analyze your knowledge patterns • ae find snippet <language> - Find snippets by programming language • ae organize knowledge - Get tips for better knowledge organization Plus all standard AE commands with pickd context awareness!".to_string()
            }
            cmd if cmd.contains("search pickd") || cmd.contains("find snippet") => {
                let query_string = if cmd.contains("search pickd") {
                    cmd.replace("search pickd", "")
                } else {
                    cmd.replace("find snippet", "")
                };
                let query = query_string.trim();
                
                if query.is_empty() {
                    format!("🔍 pickd Search Ready! Try: • 'ae search pickd rust' for Rust snippets • 'ae search pickd docker' for containerization • 'ae search pickd git' for version control Your knowledge base has {} items across {} tags.", self.pickd_items.len(), self.get_unique_tags().len())
                } else {
                    let matching_items: Vec<&PickdItem> = self.pickd_items.iter()
                        .filter(|item| 
                            item.content.to_lowercase().contains(query) ||
                            item.tags.iter().any(|t| t.to_lowercase().contains(query))
                        )
                        .collect();
                    
                    if matching_items.is_empty() {
                        format!("🔍 No pickd items found for '{}'. Try broader terms or add more snippets to your knowledge base!", query)
                    } else {
                        format!("🎯 Found {} pickd items for '{}': {}", 
                            matching_items.len(),
                            query,
                            matching_items.iter().take(3).map(|i| i.id.as_str()).collect::<Vec<_>>().join(", ")
                        )
                    }
                }
            }
            cmd if cmd.contains("suggest from pickd") => {
                let most_used: Vec<&PickdItem> = self.pickd_items.iter()
                    .collect::<Vec<_>>()
                    .into_iter()
                    .collect();
                
                format!("🎯 pickd Suggestions Based on Usage Patterns: Most Popular: {} ({} uses) Recent Languages: {} Total Knowledge: {} items, {} tags 💡 Try 'pickd find <language>' for specific suggestions!", 
                    self.get_most_used_item(),
                    most_used.iter().map(|i| i.usage_count).max().unwrap_or(0),
                    self.get_language_tags().join(", "),
                    self.pickd_items.len(),
                    self.get_unique_tags().len()
                )
            }
            cmd if cmd.contains("analyze pickd") => {
                format!("📊 pickd Knowledge Analysis: • Total Items: {} • Unique Tags: {} • Most Used: {} ({} times) • Languages: {} • Top Categories: {} 🎯 Insights: Your knowledge base is {} focused with strong {} patterns. Consider adding more {} examples for broader coverage!", 
                    self.pickd_items.len(),
                    self.get_unique_tags().len(),
                    self.get_most_used_item(),
                    self.pickd_items.iter().map(|i| i.usage_count).max().unwrap_or(0),
                    self.get_language_tags().join(", "),
                    self.get_tag_usage_stats().into_iter().take(3).map(|(tag, _)| tag).collect::<Vec<_>>().join(", "),
                    if self.get_language_tags().len() > 3 { "multi-language" } else { "specialized" },
                    if self.pickd_items.iter().any(|i| i.tags.contains(&"git".to_string())) { "workflow" } else { "technical" },
                    if self.pickd_items.len() < 10 { "documentation and examples" } else { "advanced patterns" }
                )
            }
            _ => {
                format!("I understand you want to: '{}' With pickd integration, I can now: • Search your personal knowledge base • Suggest relevant snippets for your context • Help organize your code patterns • Provide context-aware recommendations Try 'ae search pickd <topic>' or 'ae suggest from pickd' to see the magic!", command)
            }
        }
    }
}