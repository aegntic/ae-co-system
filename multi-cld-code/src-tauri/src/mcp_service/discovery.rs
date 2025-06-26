/// MCP Discovery Engine for CCTM Phase 2C.1
/// 
/// Intelligent discovery of MCP servers across multiple sources:
/// - Node.js packages (@*/*-mcp patterns)
/// - Local MCP server configurations  
/// - Network-based MCP services
/// - System-wide MCP installations

use std::path::{Path, PathBuf};
use std::collections::HashMap;
use tokio::fs;
use anyhow::{Result, Error};
use serde_json;
use regex::Regex;
use chrono::Utc;

use super::{McpServiceConfig, McpServerInfo, McpCapability, McpServerStatus, McpToolType};

/// MCP Discovery Engine - Finds and catalogs available MCP servers
#[derive(Debug)]
pub struct McpDiscoveryEngine {
    config: McpServiceConfig,
    package_scanner: PackageScanner,
    local_scanner: LocalScanner,
    network_scanner: NetworkScanner,
}

impl McpDiscoveryEngine {
    /// Create a new MCP Discovery Engine
    pub fn new(config: McpServiceConfig) -> Result<Self> {
        let package_scanner = PackageScanner::new();
        let local_scanner = LocalScanner::new();
        let network_scanner = NetworkScanner::new();
        
        log::info!("MCP Discovery Engine initialized with {} discovery paths", config.discovery_paths.len());
        
        Ok(McpDiscoveryEngine {
            config,
            package_scanner,
            local_scanner,
            network_scanner,
        })
    }
    
    /// Discover all available MCP servers across all sources
    pub async fn discover_all_servers(&self) -> Result<Vec<McpServerInfo>> {
        log::info!("Starting comprehensive MCP server discovery...");
        
        let mut all_servers = Vec::new();
        
        // 1. Scan for npm/node package-based MCP servers
        for discovery_path in &self.config.discovery_paths {
            log::debug!("Scanning directory: {}", discovery_path.display());
            
            match self.package_scanner.scan_directory(discovery_path).await {
                Ok(mut servers) => {
                    log::info!("Found {} package-based MCP servers in {}", servers.len(), discovery_path.display());
                    all_servers.append(&mut servers);
                }
                Err(e) => {
                    log::warn!("Failed to scan directory {}: {}", discovery_path.display(), e);
                }
            }
        }
        
        // 2. Scan for local MCP server configurations
        match self.local_scanner.scan_local_configs().await {
            Ok(mut local_servers) => {
                log::info!("Found {} locally configured MCP servers", local_servers.len());
                all_servers.append(&mut local_servers);
            }
            Err(e) => {
                log::warn!("Failed to scan local MCP configs: {}", e);
            }
        }
        
        // 3. Network discovery (if enabled)
        if self.config.enable_network_discovery {
            match self.network_scanner.discover_network_servers().await {
                Ok(mut network_servers) => {
                    log::info!("Found {} network-based MCP servers", network_servers.len());
                    all_servers.append(&mut network_servers);
                }
                Err(e) => {
                    log::warn!("Failed to discover network MCP servers: {}", e);
                }
            }
        }
        
        // 4. Deduplicate and validate servers
        let unique_servers = self.deduplicate_servers(all_servers).await?;
        
        log::info!("Discovery complete: {} unique MCP servers found", unique_servers.len());
        Ok(unique_servers)
    }
    
    /// Discover MCP servers relevant to a specific project
    pub async fn discover_project_servers(&self, project_path: &Path, project_type: &str, languages: &[String]) -> Result<Vec<McpServerInfo>> {
        let all_servers = self.discover_all_servers().await?;
        
        // Filter servers relevant to the project
        let relevant_servers: Vec<McpServerInfo> = all_servers
            .into_iter()
            .filter(|server| {
                // Check if server supports the project type
                if !server.project_types.is_empty() && !server.project_types.contains(&project_type.to_string()) {
                    return false;
                }
                
                // Check if server supports any of the project languages
                if !server.languages.is_empty() {
                    let has_matching_language = languages.iter()
                        .any(|lang| server.languages.contains(lang));
                    if !has_matching_language {
                        return false;
                    }
                }
                
                true
            })
            .collect();
        
        log::info!("Found {} MCP servers relevant to project at {}", relevant_servers.len(), project_path.display());
        Ok(relevant_servers)
    }
    
    /// Refresh discovery cache and find new servers
    pub async fn refresh_discovery(&self) -> Result<Vec<McpServerInfo>> {
        log::info!("Refreshing MCP server discovery...");
        self.discover_all_servers().await
    }
    
    // Private helper methods
    
    /// Remove duplicate servers based on ID and path
    async fn deduplicate_servers(&self, servers: Vec<McpServerInfo>) -> Result<Vec<McpServerInfo>> {
        let mut unique_servers = HashMap::new();
        let mut duplicate_count = 0;
        
        for server in servers {
            let key = format!("{}:{}", server.id, server.path.display());
            
            if unique_servers.contains_key(&key) {
                duplicate_count += 1;
                log::debug!("Duplicate MCP server found: {} at {}", server.name, server.path.display());
            } else {
                unique_servers.insert(key, server);
            }
        }
        
        if duplicate_count > 0 {
            log::info!("Removed {} duplicate MCP servers", duplicate_count);
        }
        
        Ok(unique_servers.into_values().collect())
    }
}

/// Scanner for npm/node package-based MCP servers
#[derive(Debug)]
struct PackageScanner {
    mcp_pattern: Regex,
}

impl PackageScanner {
    fn new() -> Self {
        // Match patterns like @org/name-mcp, name-mcp-server, etc.
        let mcp_pattern = Regex::new(r".*-mcp(-.*)?$|.*mcp-.*$").unwrap();
        
        PackageScanner { mcp_pattern }
    }
    
    /// Scan a directory for package-based MCP servers
    async fn scan_directory(&self, path: &Path) -> Result<Vec<McpServerInfo>> {
        if !path.exists() || !path.is_dir() {
            return Ok(vec![]);
        }
        
        let mut servers = Vec::new();
        
        // Check for node_modules directory
        let node_modules_path = path.join("node_modules");
        if node_modules_path.exists() {
            servers.extend(self.scan_node_modules(&node_modules_path).await?);
        }
        
        // Check for direct MCP server packages in the directory
        servers.extend(self.scan_direct_packages(path).await?);
        
        Ok(servers)
    }
    
    /// Scan node_modules for MCP packages
    async fn scan_node_modules(&self, node_modules_path: &Path) -> Result<Vec<McpServerInfo>> {
        let mut servers = Vec::new();
        
        let mut entries = fs::read_dir(node_modules_path).await?;
        while let Some(entry) = entries.next_entry().await? {
            let entry_path = entry.path();
            let entry_name = entry.file_name();
            
            if let Some(name_str) = entry_name.to_str() {
                // Handle scoped packages (@org/package)
                if name_str.starts_with('@') && entry_path.is_dir() {
                    servers.extend(self.scan_scoped_packages(&entry_path).await?);
                } else if self.mcp_pattern.is_match(name_str) && entry_path.is_dir() {
                    // Direct MCP package
                    if let Ok(server_info) = self.analyze_package(&entry_path).await {
                        servers.push(server_info);
                    }
                }
            }
        }
        
        Ok(servers)
    }
    
    /// Scan scoped packages (@org/package-name)
    async fn scan_scoped_packages(&self, scope_path: &Path) -> Result<Vec<McpServerInfo>> {
        let mut servers = Vec::new();
        
        let mut entries = fs::read_dir(scope_path).await?;
        while let Some(entry) = entries.next_entry().await? {
            let entry_path = entry.path();
            let entry_name = entry.file_name();
            
            if let Some(name_str) = entry_name.to_str() {
                if self.mcp_pattern.is_match(name_str) && entry_path.is_dir() {
                    if let Ok(server_info) = self.analyze_package(&entry_path).await {
                        servers.push(server_info);
                    }
                }
            }
        }
        
        Ok(servers)
    }
    
    /// Scan directory for direct MCP packages (not in node_modules)
    async fn scan_direct_packages(&self, path: &Path) -> Result<Vec<McpServerInfo>> {
        let mut servers = Vec::new();
        
        // Look for package.json files that indicate MCP servers
        let package_json_path = path.join("package.json");
        if package_json_path.exists() {
            if let Ok(server_info) = self.analyze_package(path).await {
                servers.push(server_info);
            }
        }
        
        Ok(servers)
    }
    
    /// Analyze a package directory to determine if it's an MCP server
    async fn analyze_package(&self, package_path: &Path) -> Result<McpServerInfo> {
        let package_json_path = package_path.join("package.json");
        
        if !package_json_path.exists() {
            return Err(Error::msg("No package.json found"));
        }
        
        let package_content = fs::read_to_string(&package_json_path).await?;
        let package_json: serde_json::Value = serde_json::from_str(&package_content)?;
        
        // Extract package information
        let name = package_json.get("name")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();
        
        let version = package_json.get("version")
            .and_then(|v| v.as_str())
            .unwrap_or("0.0.0")
            .to_string();
        
        let description = package_json.get("description")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        
        // Check if this is actually an MCP server
        let is_mcp_server = self.is_mcp_server(&package_json, package_path).await?;
        if !is_mcp_server {
            return Err(Error::msg("Package is not an MCP server"));
        }
        
        // Extract MCP-specific information
        let capabilities = self.extract_capabilities(&package_json, package_path).await?;
        let (project_types, languages, frameworks) = self.extract_project_support(&package_json).await?;
        
        // Determine executable
        let executable = self.determine_executable(&package_json, package_path).await?;
        
        Ok(McpServerInfo {
            id: format!("pkg:{}", name),
            name,
            version,
            description,
            path: package_path.to_path_buf(),
            executable,
            capabilities,
            project_types,
            languages,
            frameworks,
            status: McpServerStatus::Discovered,
            last_seen: Utc::now(),
        })
    }
    
    /// Check if a package is actually an MCP server
    async fn is_mcp_server(&self, package_json: &serde_json::Value, package_path: &Path) -> Result<bool> {
        // Check for MCP-specific keywords
        if let Some(keywords) = package_json.get("keywords").and_then(|k| k.as_array()) {
            for keyword in keywords {
                if let Some(keyword_str) = keyword.as_str() {
                    if matches!(keyword_str, "mcp" | "mcp-server" | "model-context-protocol") {
                        return Ok(true);
                    }
                }
            }
        }
        
        // Check for MCP configuration section
        if package_json.get("mcp").is_some() {
            return Ok(true);
        }
        
        // Check for specific MCP dependencies
        let deps = package_json.get("dependencies").and_then(|d| d.as_object());
        let dev_deps = package_json.get("devDependencies").and_then(|d| d.as_object());
        
        for deps_obj in [deps, dev_deps].iter().flatten() {
            for dep_name in deps_obj.keys() {
                if dep_name.contains("mcp") || dep_name.contains("model-context-protocol") {
                    return Ok(true);
                }
            }
        }
        
        // Check for MCP server entry point files
        let mcp_files = ["mcp-server.js", "server.mcp.js", "index.mcp.js"];
        for file in &mcp_files {
            if package_path.join(file).exists() {
                return Ok(true);
            }
        }
        
        Ok(false)
    }
    
    /// Extract MCP capabilities from package
    async fn extract_capabilities(&self, package_json: &serde_json::Value, package_path: &Path) -> Result<Vec<McpCapability>> {
        let mut capabilities = Vec::new();
        
        // Check MCP configuration section
        if let Some(mcp_config) = package_json.get("mcp") {
            if let Some(tools) = mcp_config.get("tools").and_then(|t| t.as_array()) {
                for tool in tools {
                    if let Some(tool_obj) = tool.as_object() {
                        let name = tool_obj.get("name")
                            .and_then(|n| n.as_str())
                            .unwrap_or("unknown")
                            .to_string();
                        
                        let description = tool_obj.get("description")
                            .and_then(|d| d.as_str())
                            .unwrap_or("")
                            .to_string();
                        
                        let tool_type = self.classify_tool_type(&name, &description);
                        
                        capabilities.push(McpCapability {
                            name,
                            description,
                            tool_type,
                            input_schema: tool_obj.get("input").cloned(),
                            output_schema: tool_obj.get("output").cloned(),
                        });
                    }
                }
            }
        }
        
        // If no explicit capabilities, infer from package name and description
        if capabilities.is_empty() {
            capabilities.extend(self.infer_capabilities_from_package(package_json).await?);
        }
        
        Ok(capabilities)
    }
    
    /// Extract project type support from package
    async fn extract_project_support(&self, package_json: &serde_json::Value) -> Result<(Vec<String>, Vec<String>, Vec<String>)> {
        let mut project_types = Vec::new();
        let mut languages = Vec::new();
        let mut frameworks = Vec::new();
        
        // Check MCP configuration
        if let Some(mcp_config) = package_json.get("mcp") {
            if let Some(supports) = mcp_config.get("supports") {
                if let Some(proj_types) = supports.get("projectTypes").and_then(|p| p.as_array()) {
                    project_types.extend(proj_types.iter().filter_map(|v| v.as_str().map(|s| s.to_string())));
                }
                
                if let Some(langs) = supports.get("languages").and_then(|l| l.as_array()) {
                    languages.extend(langs.iter().filter_map(|v| v.as_str().map(|s| s.to_string())));
                }
                
                if let Some(fws) = supports.get("frameworks").and_then(|f| f.as_array()) {
                    frameworks.extend(fws.iter().filter_map(|v| v.as_str().map(|s| s.to_string())));
                }
            }
        }
        
        // Infer from package name and keywords if not explicitly specified
        if project_types.is_empty() && languages.is_empty() && frameworks.is_empty() {
            let (inferred_types, inferred_langs, inferred_fws) = self.infer_project_support(package_json).await?;
            project_types.extend(inferred_types);
            languages.extend(inferred_langs);
            frameworks.extend(inferred_fws);
        }
        
        Ok((project_types, languages, frameworks))
    }
    
    /// Determine the executable for the MCP server
    async fn determine_executable(&self, package_json: &serde_json::Value, package_path: &Path) -> Result<String> {
        // Check for MCP-specific entry point
        if let Some(mcp_config) = package_json.get("mcp") {
            if let Some(executable) = mcp_config.get("executable").and_then(|e| e.as_str()) {
                return Ok(executable.to_string());
            }
        }
        
        // Check for standard Node.js entry points
        if let Some(main) = package_json.get("main").and_then(|m| m.as_str()) {
            return Ok(format!("node {}", main));
        }
        
        // Check for bin entries
        if let Some(bin) = package_json.get("bin") {
            if let Some(bin_str) = bin.as_str() {
                return Ok(format!("node {}", bin_str));
            } else if let Some(bin_obj) = bin.as_object() {
                if let Some((_, bin_path)) = bin_obj.iter().next() {
                    if let Some(bin_path_str) = bin_path.as_str() {
                        return Ok(format!("node {}", bin_path_str));
                    }
                }
            }
        }
        
        // Default fallback
        Ok("node index.js".to_string())
    }
    
    // Helper methods for inference and classification
    
    fn classify_tool_type(&self, name: &str, description: &str) -> McpToolType {
        let combined = format!("{} {}", name.to_lowercase(), description.to_lowercase());
        
        if combined.contains("test") || combined.contains("spec") {
            McpToolType::Testing
        } else if combined.contains("doc") || combined.contains("readme") {
            McpToolType::Documentation
        } else if combined.contains("deploy") || combined.contains("build") {
            McpToolType::Deployment
        } else if combined.contains("analyze") || combined.contains("lint") {
            McpToolType::CodeAnalysis
        } else if combined.contains("database") || combined.contains("sql") {
            McpToolType::DatabaseQuery
        } else if combined.contains("file") || combined.contains("fs") {
            McpToolType::FileOperation
        } else if combined.contains("http") || combined.contains("web") || combined.contains("api") {
            McpToolType::WebRequest
        } else if combined.contains("git") {
            McpToolType::GitOperation
        } else if combined.contains("scaffold") || combined.contains("generate") {
            McpToolType::ProjectScaffolding
        } else {
            McpToolType::Other(name.to_string())
        }
    }
    
    async fn infer_capabilities_from_package(&self, package_json: &serde_json::Value) -> Result<Vec<McpCapability>> {
        let mut capabilities = Vec::new();
        
        let name = package_json.get("name").and_then(|n| n.as_str()).unwrap_or("");
        let description = package_json.get("description").and_then(|d| d.as_str()).unwrap_or("");
        
        // Basic capability inference based on package name
        if name.contains("test") {
            capabilities.push(McpCapability {
                name: "test-runner".to_string(),
                description: "Run and manage tests".to_string(),
                tool_type: McpToolType::Testing,
                input_schema: None,
                output_schema: None,
            });
        }
        
        if name.contains("doc") {
            capabilities.push(McpCapability {
                name: "documentation".to_string(),
                description: "Generate and manage documentation".to_string(),
                tool_type: McpToolType::Documentation,
                input_schema: None,
                output_schema: None,
            });
        }
        
        // Add more inference logic as needed
        
        Ok(capabilities)
    }
    
    async fn infer_project_support(&self, package_json: &serde_json::Value) -> Result<(Vec<String>, Vec<String>, Vec<String>)> {
        let mut project_types = Vec::new();
        let mut languages = Vec::new();
        let mut frameworks = Vec::new();
        
        let name = package_json.get("name").and_then(|n| n.as_str()).unwrap_or("").to_lowercase();
        let description = package_json.get("description").and_then(|d| d.as_str()).unwrap_or("").to_lowercase();
        let combined = format!("{} {}", name, description);
        
        // Language inference
        if combined.contains("rust") || combined.contains("cargo") {
            languages.push("Rust".to_string());
        }
        if combined.contains("typescript") || combined.contains("ts") {
            languages.push("TypeScript".to_string());
        }
        if combined.contains("javascript") || combined.contains("js") || combined.contains("node") {
            languages.push("JavaScript".to_string());
        }
        if combined.contains("python") || combined.contains("py") {
            languages.push("Python".to_string());
        }
        
        // Framework inference
        if combined.contains("react") {
            frameworks.push("React".to_string());
        }
        if combined.contains("vue") {
            frameworks.push("Vue".to_string());
        }
        if combined.contains("angular") {
            frameworks.push("Angular".to_string());
        }
        if combined.contains("django") {
            frameworks.push("Django".to_string());
        }
        if combined.contains("flask") {
            frameworks.push("Flask".to_string());
        }
        if combined.contains("tauri") {
            frameworks.push("Tauri".to_string());
        }
        
        // Project type inference
        if combined.contains("web") || frameworks.iter().any(|f| matches!(f.as_str(), "React" | "Vue" | "Angular")) {
            project_types.push("web".to_string());
        }
        if combined.contains("api") || combined.contains("server") {
            project_types.push("api".to_string());
        }
        if combined.contains("desktop") || frameworks.contains(&"Tauri".to_string()) {
            project_types.push("desktop".to_string());
        }
        if combined.contains("cli") || combined.contains("command") {
            project_types.push("cli".to_string());
        }
        
        Ok((project_types, languages, frameworks))
    }
}

/// Scanner for local MCP server configurations
#[derive(Debug)]
struct LocalScanner {}

impl LocalScanner {
    fn new() -> Self {
        LocalScanner {}
    }
    
    /// Scan for locally configured MCP servers
    async fn scan_local_configs(&self) -> Result<Vec<McpServerInfo>> {
        let mut servers = Vec::new();
        
        // Check common MCP configuration locations
        let config_paths = [
            PathBuf::from(".mcp"),
            PathBuf::from(".mcp.json"),
            PathBuf::from("mcp.config.json"),
            PathBuf::from("claude_desktop_config.json"),
        ];
        
        for config_path in &config_paths {
            if config_path.exists() {
                match self.parse_local_config(config_path).await {
                    Ok(mut config_servers) => {
                        servers.append(&mut config_servers);
                    }
                    Err(e) => {
                        log::warn!("Failed to parse MCP config at {}: {}", config_path.display(), e);
                    }
                }
            }
        }
        
        Ok(servers)
    }
    
    /// Parse a local MCP configuration file
    async fn parse_local_config(&self, config_path: &Path) -> Result<Vec<McpServerInfo>> {
        let content = fs::read_to_string(config_path).await?;
        let config: serde_json::Value = serde_json::from_str(&content)?;
        
        let mut servers = Vec::new();
        
        // Parse different configuration formats
        if let Some(mcp_servers) = config.get("mcpServers").and_then(|s| s.as_object()) {
            for (server_id, server_config) in mcp_servers {
                if let Ok(server_info) = self.parse_server_config(server_id, server_config, config_path).await {
                    servers.push(server_info);
                }
            }
        }
        
        Ok(servers)
    }
    
    /// Parse individual server configuration
    async fn parse_server_config(&self, server_id: &str, config: &serde_json::Value, config_path: &Path) -> Result<McpServerInfo> {
        let name = config.get("name")
            .and_then(|n| n.as_str())
            .unwrap_or(server_id)
            .to_string();
        
        let executable = config.get("command")
            .and_then(|c| c.as_str())
            .ok_or_else(|| Error::msg("No command specified for MCP server"))?
            .to_string();
        
        let description = config.get("description")
            .and_then(|d| d.as_str())
            .map(|s| s.to_string());
        
        Ok(McpServerInfo {
            id: format!("local:{}", server_id),
            name,
            version: "unknown".to_string(),
            description,
            path: config_path.parent().unwrap_or(Path::new(".")).to_path_buf(),
            executable,
            capabilities: vec![], // Could be enhanced to parse capabilities
            project_types: vec![],
            languages: vec![],
            frameworks: vec![],
            status: McpServerStatus::Discovered,
            last_seen: Utc::now(),
        })
    }
}

/// Scanner for network-based MCP servers
#[derive(Debug)]
struct NetworkScanner {}

impl NetworkScanner {
    fn new() -> Self {
        NetworkScanner {}
    }
    
    /// Discover network-based MCP servers
    async fn discover_network_servers(&self) -> Result<Vec<McpServerInfo>> {
        // TODO: Implement network discovery
        // This could include:
        // - Multicast DNS discovery
        // - Registry service queries
        // - Known MCP server endpoints
        
        log::info!("Network MCP discovery not yet implemented");
        Ok(vec![])
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_discovery_engine_creation() {
        let config = McpServiceConfig::default();
        let engine = McpDiscoveryEngine::new(config).unwrap();
        assert!(!engine.config.discovery_paths.is_empty());
    }
    
    #[tokio::test]
    async fn test_package_scanner_mcp_pattern() {
        let scanner = PackageScanner::new();
        
        assert!(scanner.mcp_pattern.is_match("test-mcp"));
        assert!(scanner.mcp_pattern.is_match("test-mcp-server"));
        assert!(scanner.mcp_pattern.is_match("mcp-test"));
        assert!(!scanner.mcp_pattern.is_match("test-package"));
    }
    
    #[tokio::test]
    async fn test_empty_directory_scan() {
        let temp_dir = TempDir::new().unwrap();
        let scanner = PackageScanner::new();
        
        let servers = scanner.scan_directory(temp_dir.path()).await.unwrap();
        assert!(servers.is_empty());
    }
}