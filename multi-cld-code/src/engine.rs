/// {multi-claude-code}CCTM Engine - Specialized Claude Engine for Focused Execution
/// 
/// Claude Engine operates within specialized domains with precise task execution,
/// reporting status and coordinating with the Master Claude Hub for optimal
/// workflow integration and cross-Engine collaboration.

use std::env;
use std::io::{self, Write};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone)]
pub struct EngineConfig {
    pub engine_id: String,
    pub project_path: PathBuf,
    pub specialization: String,
    pub hub_endpoint: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum EngineStatus {
    Initializing,
    Ready,
    Working,
    Idle,
    Error(String),
}

pub struct ClaudeEngine {
    config: EngineConfig,
    status: EngineStatus,
    task_count: u32,
    startup_time: std::time::SystemTime,
}

impl ClaudeEngine {
    pub fn new(config: EngineConfig) -> Self {
        println!("🔧 {{multi-claude-code}}CCTM Engine {} - Initializing", config.engine_id);
        println!("   Specialization: {}", config.specialization);
        println!("   Project Path: {}", config.project_path.display());
        
        Self {
            config,
            status: EngineStatus::Initializing,
            task_count: 0,
            startup_time: std::time::SystemTime::now(),
        }
    }

    pub fn initialize(&mut self) -> Result<(), String> {
        println!("🚀 Engine {}: Performing initialization...", self.config.engine_id);
        
        // Validate project path
        if !self.config.project_path.exists() {
            let error = format!("Project path does not exist: {}", self.config.project_path.display());
            self.status = EngineStatus::Error(error.clone());
            return Err(error);
        }

        // Detect project type and setup specialization
        self.setup_specialization()?;
        
        // Connect to Hub if endpoint provided
        if let Some(hub_endpoint) = &self.config.hub_endpoint {
            self.connect_to_hub(hub_endpoint)?;
        }

        self.status = EngineStatus::Ready;
        println!("✅ Engine {}: Ready for tasks", self.config.engine_id);
        
        Ok(())
    }

    fn setup_specialization(&self) -> Result<(), String> {
        match self.config.specialization.as_str() {
            "rust" => {
                if !self.config.project_path.join("Cargo.toml").exists() {
                    return Err("Rust specialization requires Cargo.toml".to_string());
                }
                println!("   🦀 Rust specialization configured");
            }
            "typescript" | "javascript" => {
                if !self.config.project_path.join("package.json").exists() {
                    return Err("TypeScript/JavaScript specialization requires package.json".to_string());
                }
                println!("   📦 TypeScript/JavaScript specialization configured");
            }
            "python" => {
                let has_pyproject = self.config.project_path.join("pyproject.toml").exists();
                let has_requirements = self.config.project_path.join("requirements.txt").exists();
                if !has_pyproject && !has_requirements {
                    return Err("Python specialization requires pyproject.toml or requirements.txt".to_string());
                }
                println!("   🐍 Python specialization configured");
            }
            spec => {
                println!("   ⚙️  Generic specialization: {}", spec);
            }
        }
        Ok(())
    }

    fn connect_to_hub(&self, _hub_endpoint: &str) -> Result<(), String> {
        // In real implementation, establish connection to Hub
        println!("   🔗 Connected to Hub at endpoint");
        Ok(())
    }

    pub fn execute_task(&mut self, task: &str) -> Result<String, String> {
        println!("🎯 Engine {}: Executing task: {}", self.config.engine_id, task);
        
        self.status = EngineStatus::Working;
        self.task_count += 1;

        let result = match task {
            task if task.contains("analyze") => self.analyze_codebase(),
            task if task.contains("test") => self.run_tests(),
            task if task.contains("build") => self.run_build(),
            task if task.contains("format") => self.format_code(),
            task if task.contains("lint") => self.run_linting(),
            task if task.contains("explain") => self.explain_error(task),
            _ => self.execute_custom_task(task),
        };

        self.status = EngineStatus::Idle;
        
        match &result {
            Ok(output) => println!("✅ Engine {}: Task completed successfully", self.config.engine_id),
            Err(error) => println!("❌ Engine {}: Task failed: {}", self.config.engine_id, error),
        }

        result
    }

    fn analyze_codebase(&self) -> Result<String, String> {
        println!("   📊 Analyzing codebase structure...");
        
        let mut analysis = String::new();
        analysis.push_str(&format!("Codebase Analysis for {}\n", self.config.project_path.display()));
        analysis.push_str("═══════════════════════════════════\n");
        
        // Count files by type
        let mut file_counts = std::collections::HashMap::new();
        
        if let Ok(entries) = std::fs::read_dir(&self.config.project_path) {
            for entry in entries.flatten() {
                if let Some(ext) = entry.path().extension() {
                    if let Some(ext_str) = ext.to_str() {
                        *file_counts.entry(ext_str.to_string()).or_insert(0) += 1;
                    }
                }
            }
        }
        
        analysis.push_str("File Distribution:\n");
        for (ext, count) in file_counts {
            analysis.push_str(&format!("  .{}: {} files\n", ext, count));
        }
        
        // Specialization-specific analysis
        match self.config.specialization.as_str() {
            "rust" => analysis.push_str(self.analyze_rust_project().as_str()),
            "typescript" | "javascript" => analysis.push_str(self.analyze_js_project().as_str()),
            "python" => analysis.push_str(self.analyze_python_project().as_str()),
            _ => analysis.push_str("Generic project analysis complete.\n"),
        }
        
        Ok(analysis)
    }

    fn analyze_rust_project(&self) -> String {
        let mut analysis = String::new();
        analysis.push_str("\nRust Project Analysis:\n");
        
        if let Ok(cargo_toml) = std::fs::read_to_string(self.config.project_path.join("Cargo.toml")) {
            if cargo_toml.contains("[workspace]") {
                analysis.push_str("  📦 Workspace detected\n");
            }
            if cargo_toml.contains("[[bin]]") {
                analysis.push_str("  🎯 Binary targets found\n");
            }
            if cargo_toml.contains("[lib]") {
                analysis.push_str("  📚 Library target found\n");
            }
        }
        
        analysis
    }

    fn analyze_js_project(&self) -> String {
        let mut analysis = String::new();
        analysis.push_str("\nJavaScript/TypeScript Project Analysis:\n");
        
        if let Ok(package_json) = std::fs::read_to_string(self.config.project_path.join("package.json")) {
            if package_json.contains("\"react\"") {
                analysis.push_str("  ⚛️  React framework detected\n");
            }
            if package_json.contains("\"vue\"") {
                analysis.push_str("  💚 Vue framework detected\n");
            }
            if package_json.contains("\"svelte\"") {
                analysis.push_str("  🧡 Svelte framework detected\n");
            }
            if package_json.contains("\"next\"") {
                analysis.push_str("  ▲ Next.js framework detected\n");
            }
        }
        
        analysis
    }

    fn analyze_python_project(&self) -> String {
        let mut analysis = String::new();
        analysis.push_str("\nPython Project Analysis:\n");
        
        if self.config.project_path.join("pyproject.toml").exists() {
            analysis.push_str("  📋 Modern Python project (pyproject.toml)\n");
        }
        if self.config.project_path.join("requirements.txt").exists() {
            analysis.push_str("  📝 Traditional requirements.txt found\n");
        }
        if self.config.project_path.join("setup.py").exists() {
            analysis.push_str("  ⚙️  Legacy setup.py found\n");
        }
        
        analysis
    }

    fn run_tests(&self) -> Result<String, String> {
        println!("   🧪 Running tests...");
        
        let cmd_result = match self.config.specialization.as_str() {
            "rust" => Command::new("cargo")
                .arg("test")
                .current_dir(&self.config.project_path)
                .output(),
            "typescript" | "javascript" => Command::new("npm")
                .arg("test")
                .current_dir(&self.config.project_path)
                .output(),
            "python" => Command::new("python")
                .arg("-m")
                .arg("pytest")
                .current_dir(&self.config.project_path)
                .output(),
            _ => return Err("No test command configured for this specialization".to_string()),
        };

        match cmd_result {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                
                if output.status.success() {
                    Ok(format!("Tests passed!\n\nOutput:\n{}", stdout))
                } else {
                    Err(format!("Tests failed!\n\nError:\n{}\n\nOutput:\n{}", stderr, stdout))
                }
            }
            Err(e) => Err(format!("Failed to run tests: {}", e)),
        }
    }

    fn run_build(&self) -> Result<String, String> {
        println!("   🔨 Building project...");
        
        let cmd_result = match self.config.specialization.as_str() {
            "rust" => Command::new("cargo")
                .arg("build")
                .current_dir(&self.config.project_path)
                .output(),
            "typescript" | "javascript" => Command::new("npm")
                .arg("run")
                .arg("build")
                .current_dir(&self.config.project_path)
                .output(),
            "python" => return Ok("Python projects typically don't require building".to_string()),
            _ => return Err("No build command configured for this specialization".to_string()),
        };

        match cmd_result {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                
                if output.status.success() {
                    Ok(format!("Build successful!\n\nOutput:\n{}", stdout))
                } else {
                    Err(format!("Build failed!\n\nError:\n{}\n\nOutput:\n{}", stderr, stdout))
                }
            }
            Err(e) => Err(format!("Failed to run build: {}", e)),
        }
    }

    fn format_code(&self) -> Result<String, String> {
        println!("   🎨 Formatting code...");
        
        match self.config.specialization.as_str() {
            "rust" => {
                match Command::new("cargo")
                    .arg("fmt")
                    .current_dir(&self.config.project_path)
                    .output() {
                    Ok(_) => Ok("Rust code formatted successfully".to_string()),
                    Err(e) => Err(format!("Failed to format Rust code: {}", e)),
                }
            }
            "typescript" | "javascript" => {
                Ok("Consider running prettier or eslint --fix".to_string())
            }
            "python" => {
                Ok("Consider running black or autopep8".to_string())
            }
            _ => Ok("No formatter configured for this specialization".to_string()),
        }
    }

    fn run_linting(&self) -> Result<String, String> {
        println!("   🔍 Running linting...");
        
        match self.config.specialization.as_str() {
            "rust" => {
                match Command::new("cargo")
                    .arg("clippy")
                    .current_dir(&self.config.project_path)
                    .output() {
                    Ok(output) => {
                        let stdout = String::from_utf8_lossy(&output.stdout);
                        Ok(format!("Clippy analysis:\n{}", stdout))
                    }
                    Err(e) => Err(format!("Failed to run clippy: {}", e)),
                }
            }
            _ => Ok("No linter configured for this specialization".to_string()),
        }
    }

    fn explain_error(&self, task: &str) -> Result<String, String> {
        println!("   💡 Analyzing error...");
        Ok(format!("Error analysis for: {}\n\nThis would analyze the error and provide explanations.", task))
    }

    fn execute_custom_task(&self, task: &str) -> Result<String, String> {
        println!("   ⚙️  Executing custom task...");
        Ok(format!("Custom task '{}' would be executed based on Engine specialization", task))
    }

    pub fn status_report(&self) {
        println!("\n🔧 Engine {} Status Report", self.config.engine_id);
        println!("═══════════════════════════════════");
        println!("Status: {:?}", self.status);
        println!("Specialization: {}", self.config.specialization);
        println!("Project: {}", self.config.project_path.display());
        println!("Tasks Completed: {}", self.task_count);
        println!("Uptime: {:?}", self.startup_time.elapsed().unwrap_or_default());
        println!("");
    }
}

fn print_help() {
    println!("{{multi-claude-code}}CCTM Engine - Specialized Claude Engine for Focused Execution");
    println!("════════════════════════════════════════════════════════════════");
    println!();
    println!("Commands:");
    println!("  analyze                    - Analyze current codebase");
    println!("  test                       - Run project tests");
    println!("  build                      - Build the project");
    println!("  format                     - Format code");
    println!("  lint                       - Run linting");
    println!("  explain <error>            - Explain error or issue");
    println!("  status                     - Show Engine status");
    println!("  help                       - Show this help");
    println!("  quit                       - Shutdown Engine");
    println!();
    println!("Custom Commands:");
    println!("  Any other text will be treated as a custom task");
    println!();
}

fn main() {
    let args: Vec<String> = env::args().collect();
    
    // Parse command line arguments
    let engine_id = args.get(1).cloned().unwrap_or_else(|| "engine-default".to_string());
    let project_path = args.get(2).cloned().unwrap_or_else(|| ".".to_string());
    let specialization = args.get(3).cloned().unwrap_or_else(|| "generic".to_string());
    
    let config = EngineConfig {
        engine_id: engine_id.clone(),
        project_path: PathBuf::from(project_path),
        specialization,
        hub_endpoint: None, // Could be passed as argument
    };

    let mut engine = ClaudeEngine::new(config);
    
    match engine.initialize() {
        Ok(_) => {
            println!();
            println!("Type 'help' for commands or 'quit' to exit");
            println!();
        }
        Err(e) => {
            println!("❌ Failed to initialize Engine: {}", e);
            return;
        }
    }

    loop {
        print!("multi-claude-code-cctm-engine[{}]> ", engine_id);
        io::stdout().flush().unwrap();

        let mut input = String::new();
        match io::stdin().read_line(&mut input) {
            Ok(_) => {
                let input = input.trim();
                
                if input.is_empty() {
                    continue;
                }

                match input {
                    "help" => print_help(),
                    "quit" | "exit" => {
                        println!("🛑 Engine {}: Shutting down...", engine_id);
                        break;
                    }
                    "status" => engine.status_report(),
                    task => {
                        match engine.execute_task(task) {
                            Ok(result) => println!("{}", result),
                            Err(e) => println!("❌ Error: {}", e),
                        }
                    }
                }
            }
            Err(e) => {
                println!("Error reading input: {}", e);
                break;
            }
        }
    }
}