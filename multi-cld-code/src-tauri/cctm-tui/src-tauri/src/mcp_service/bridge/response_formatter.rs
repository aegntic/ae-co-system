/// Response Formatter for CCTM Phase 2C.4
/// 
/// Formats MCP tool responses into beautiful, terminal-friendly displays with
/// colors, formatting, and intelligent content organization.

use anyhow::Result;
use serde_json;

use crate::mcp_service::{McpCapability, TerminalContext};

/// Terminal response formatter with intelligent formatting
#[derive(Debug)]
pub struct ResponseFormatter {
    /// Color and formatting enabled
    colors_enabled: bool,
    
    /// Response formatting templates
    formatting_templates: FormattingTemplates,
}

impl ResponseFormatter {
    /// Create a new response formatter
    pub fn new() -> Self {
        let formatting_templates = FormattingTemplates::default();
        
        ResponseFormatter {
            colors_enabled: true, // TODO: Make configurable
            formatting_templates,
        }
    }
    
    /// Format successful MCP tool response
    pub async fn format_success_response(
        &self,
        tool_name: &str,
        result: &serde_json::Value,
        context: &TerminalContext,
    ) -> Result<String> {
        let mut output = String::new();
        
        // Add header
        output.push_str(&self.format_header("✅ AI Tool Result", "success"));
        output.push_str(&format!("Tool: {}\n", self.style_tool_name(tool_name)));
        output.push_str(&format!("Directory: {}\n\n", context.current_directory.display()));
        
        // Format result based on tool type and content
        let formatted_result = self.format_result_content(tool_name, result).await?;
        output.push_str(&formatted_result);
        
        // Add footer with suggestions
        output.push_str(&self.format_footer_suggestions());
        
        Ok(output)
    }
    
    /// Format error response
    pub async fn format_error_response(
        &self,
        tool_name: &str,
        error: &anyhow::Error,
        context: &TerminalContext,
    ) -> Result<String> {
        let mut output = String::new();
        
        // Add error header
        output.push_str(&self.format_header("❌ AI Tool Error", "error"));
        output.push_str(&format!("Tool: {}\n", self.style_tool_name(tool_name)));
        output.push_str(&format!("Directory: {}\n\n", context.current_directory.display()));
        
        // Format error message
        output.push_str(&self.style_error(&format!("Error: {}\n\n", error)));
        
        // Add helpful suggestions
        output.push_str(&self.format_error_suggestions(tool_name));
        
        Ok(output)
    }
    
    /// Format help response
    pub async fn format_help_response(
        &self,
        available_capabilities: &[McpCapability],
        terminal_id: Option<&str>,
    ) -> Result<String> {
        let mut output = String::new();
        
        // Add help header
        output.push_str(&self.format_header("🤖 AI Assistant Help", "info"));
        
        if let Some(id) = terminal_id {
            output.push_str(&format!("Terminal: {}\n\n", id));
        }
        
        // Add usage instructions
        output.push_str(&self.format_usage_instructions());
        
        // Add available capabilities
        if !available_capabilities.is_empty() {
            output.push_str(&self.format_available_capabilities(available_capabilities));
        } else {
            output.push_str(&self.style_warning("No AE tools are currently available for this project.\n"));
            output.push_str("Try changing to a project directory or check your MCP server configuration.\n\n");
        }
        
        // Add examples
        output.push_str(&self.format_command_examples());
        
        Ok(output)
    }
    
    /// Format streaming response (for long-running operations)
    pub async fn format_streaming_response(
        &self,
        tool_name: &str,
        progress: f32,
        message: &str,
    ) -> Result<String> {
        let mut output = String::new();
        
        // Progress bar
        let bar_width = 30;
        let filled = (progress * bar_width as f32) as usize;
        let empty = bar_width - filled;
        
        output.push_str("🔄 ");
        output.push_str(&self.style_tool_name(tool_name));
        output.push_str(" - ");
        output.push_str(&self.style_progress(&format!("{:.1}%", progress * 100.0)));
        output.push('\n');
        
        output.push('[');
        output.push_str(&"█".repeat(filled));
        output.push_str(&"░".repeat(empty));
        output.push(']');
        output.push('\n');
        
        if !message.is_empty() {
            output.push_str(&format!("{}\n", message));
        }
        
        Ok(output)
    }
    
    // Private formatting methods
    
    /// Format result content based on tool type
    async fn format_result_content(&self, tool_name: &str, result: &serde_json::Value) -> Result<String> {
        match tool_name {
            name if name.contains("analyz") || name.contains("review") => {
                self.format_analysis_result(result).await
            }
            name if name.contains("test") => {
                self.format_test_result(result).await
            }
            name if name.contains("doc") => {
                self.format_documentation_result(result).await
            }
            name if name.contains("suggest") || name.contains("improve") => {
                self.format_suggestions_result(result).await
            }
            _ => {
                self.format_generic_result(result).await
            }
        }
    }
    
    /// Format code analysis results
    async fn format_analysis_result(&self, result: &serde_json::Value) -> Result<String> {
        let mut output = String::new();
        
        if let Some(analysis) = result.get("analysis") {
            if let Some(language) = analysis.get("language") {
                output.push_str(&format!("Language: {}\n", self.style_highlight(language.as_str().unwrap_or("Unknown"))));
            }
            
            if let Some(issues) = analysis.get("issues").and_then(|i| i.as_array()) {
                if issues.is_empty() {
                    output.push_str(&self.style_success("✅ No issues found!\n"));
                } else {
                    output.push_str(&format!("\n{}\n", self.style_section_header("Issues Found:")));
                    for (i, issue) in issues.iter().enumerate() {
                        output.push_str(&format!("{}. {}\n", i + 1, issue.as_str().unwrap_or("Unknown issue")));
                    }
                }
            }
            
            if let Some(suggestions) = analysis.get("suggestions").and_then(|s| s.as_array()) {
                if !suggestions.is_empty() {
                    output.push_str(&format!("\n{}\n", self.style_section_header("Suggestions:")));
                    for (i, suggestion) in suggestions.iter().enumerate() {
                        output.push_str(&format!("{}. {}\n", i + 1, suggestion.as_str().unwrap_or("Unknown suggestion")));
                    }
                }
            }
        }
        
        if output.is_empty() {
            output.push_str("Analysis completed successfully.\n");
        }
        
        Ok(output)
    }
    
    /// Format test results
    async fn format_test_result(&self, result: &serde_json::Value) -> Result<String> {
        let mut output = String::new();
        
        if let Some(test_results) = result.get("test_results") {
            let total = test_results.get("total").and_then(|t| t.as_u64()).unwrap_or(0);
            let passed = test_results.get("passed").and_then(|p| p.as_u64()).unwrap_or(0);
            let failed = test_results.get("failed").and_then(|f| f.as_u64()).unwrap_or(0);
            
            output.push_str(&format!("{}\n", self.style_section_header("Test Results:")));
            output.push_str(&format!("Total: {}\n", total));
            output.push_str(&format!("Passed: {}\n", self.style_success(&passed.to_string())));
            
            if failed > 0 {
                output.push_str(&format!("Failed: {}\n", self.style_error(&failed.to_string())));
            } else {
                output.push_str(&self.style_success("All tests passed! ✅\n"));
            }
            
            if let Some(details) = test_results.get("details") {
                output.push_str(&format!("\n{}\n", details.as_str().unwrap_or("")));
            }
        } else {
            output.push_str("Tests completed.\n");
        }
        
        Ok(output)
    }
    
    /// Format documentation results
    async fn format_documentation_result(&self, result: &serde_json::Value) -> Result<String> {
        let mut output = String::new();
        
        if let Some(documentation) = result.get("documentation") {
            output.push_str(&format!("{}\n", self.style_section_header("Generated Documentation:")));
            
            if let Some(format) = documentation.get("format") {
                output.push_str(&format!("Format: {}\n", format.as_str().unwrap_or("Unknown")));
            }
            
            if let Some(content) = documentation.get("content") {
                output.push_str("\n");
                output.push_str(&self.format_code_block(content.as_str().unwrap_or("")));
            }
        } else {
            output.push_str("Documentation generated successfully.\n");
        }
        
        Ok(output)
    }
    
    /// Format improvement suggestions
    async fn format_suggestions_result(&self, result: &serde_json::Value) -> Result<String> {
        let mut output = String::new();
        
        output.push_str(&format!("{}\n", self.style_section_header("Improvement Suggestions:")));
        
        if let Some(suggestions) = result.get("suggestions").and_then(|s| s.as_array()) {
            for (i, suggestion) in suggestions.iter().enumerate() {
                output.push_str(&format!("{}. {}\n", i + 1, suggestion.as_str().unwrap_or("Unknown suggestion")));
            }
        } else if let Some(message) = result.get("message") {
            output.push_str(&format!("{}\n", message.as_str().unwrap_or("")));
        } else {
            output.push_str("No specific suggestions available.\n");
        }
        
        Ok(output)
    }
    
    /// Format generic results
    async fn format_generic_result(&self, result: &serde_json::Value) -> Result<String> {
        let mut output = String::new();
        
        if let Some(message) = result.get("message") {
            output.push_str(&format!("{}\n", message.as_str().unwrap_or("")));
        } else if let Some(status) = result.get("status") {
            output.push_str(&format!("Status: {}\n", status.as_str().unwrap_or("Unknown")));
        } else {
            output.push_str(&format!("Result:\n{}\n", serde_json::to_string_pretty(result).unwrap_or_else(|_| "Invalid JSON".to_string())));
        }
        
        Ok(output)
    }
    
    /// Format header with styling
    fn format_header(&self, title: &str, style_type: &str) -> String {
        let border = "═".repeat(50);
        let styled_title = match style_type {
            "success" => self.style_success(title),
            "error" => self.style_error(title),
            "info" => self.style_info(title),
            _ => title.to_string(),
        };
        
        format!("╔{border}╗\n║{:^50}║\n╚{border}╝\n", styled_title)
    }
    
    /// Format usage instructions
    fn format_usage_instructions(&self) -> String {
        let mut output = String::new();
        
        output.push_str(&format!("{}\n", self.style_section_header("Usage:")));
        output.push_str("• Type 'ae' followed by your request\n");
        output.push_str("• Examples: 'ae analyze code', 'ae run tests', 'ae explain this'\n");
        output.push_str("• Use 'ae help' for this help message\n\n");
        
        output
    }
    
    /// Format available capabilities
    fn format_available_capabilities(&self, capabilities: &[McpCapability]) -> String {
        let mut output = String::new();
        
        output.push_str(&format!("{}\n", self.style_section_header("Available AE Tools:")));
        
        for capability in capabilities.iter().take(10) { // Show top 10
            output.push_str(&format!("• {}: {}\n", 
                self.style_tool_name(&capability.name),
                capability.description
            ));
        }
        
        if capabilities.len() > 10 {
            output.push_str(&format!("... and {} more tools\n", capabilities.len() - 10));
        }
        
        output.push('\n');
        output
    }
    
    /// Format command examples
    fn format_command_examples(&self) -> String {
        let mut output = String::new();
        
        output.push_str(&format!("{}\n", self.style_section_header("Example Commands:")));
        output.push_str(&format!("• {} - Analyze code quality\n", self.style_command("ae analyze code")));
        output.push_str(&format!("• {} - Run project tests\n", self.style_command("ae run tests")));
        output.push_str(&format!("• {} - Explain current error\n", self.style_command("ae explain error")));
        output.push_str(&format!("• {} - Suggest improvements\n", self.style_command("ae suggest improvements")));
        output.push_str(&format!("• {} - Generate documentation\n", self.style_command("ae generate docs")));
        
        output
    }
    
    /// Format footer suggestions
    fn format_footer_suggestions(&self) -> String {
        format!("\n{}\n", self.style_info("💡 Type 'ae help' for more commands"))
    }
    
    /// Format error suggestions
    fn format_error_suggestions(&self, tool_name: &str) -> String {
        let mut output = String::new();
        
        output.push_str(&format!("{}\n", self.style_section_header("Try:")));
        output.push_str(&format!("• {} - Get help\n", self.style_command("ae help")));
        output.push_str(&format!("• {} - Check available tools\n", self.style_command("ae")));
        
        if !tool_name.is_empty() {
            output.push_str(&format!("• Check if {} is properly configured\n", tool_name));
        }
        
        output
    }
    
    /// Format code block with syntax highlighting (simplified)
    fn format_code_block(&self, content: &str) -> String {
        let mut output = String::new();
        
        output.push_str("```\n");
        output.push_str(content);
        if !content.ends_with('\n') {
            output.push('\n');
        }
        output.push_str("```\n");
        
        output
    }
    
    // Styling methods (ANSI color codes)
    
    fn style_success(&self, text: &str) -> String {
        if self.colors_enabled {
            format!("\x1b[32m{}\x1b[0m", text) // Green
        } else {
            text.to_string()
        }
    }
    
    fn style_error(&self, text: &str) -> String {
        if self.colors_enabled {
            format!("\x1b[31m{}\x1b[0m", text) // Red
        } else {
            text.to_string()
        }
    }
    
    fn style_warning(&self, text: &str) -> String {
        if self.colors_enabled {
            format!("\x1b[33m{}\x1b[0m", text) // Yellow
        } else {
            text.to_string()
        }
    }
    
    fn style_info(&self, text: &str) -> String {
        if self.colors_enabled {
            format!("\x1b[36m{}\x1b[0m", text) // Cyan
        } else {
            text.to_string()
        }
    }
    
    fn style_highlight(&self, text: &str) -> String {
        if self.colors_enabled {
            format!("\x1b[1;34m{}\x1b[0m", text) // Bold Blue
        } else {
            text.to_string()
        }
    }
    
    fn style_tool_name(&self, text: &str) -> String {
        if self.colors_enabled {
            format!("\x1b[1;35m{}\x1b[0m", text) // Bold Magenta
        } else {
            text.to_string()
        }
    }
    
    fn style_section_header(&self, text: &str) -> String {
        if self.colors_enabled {
            format!("\x1b[1;37m{}\x1b[0m", text) // Bold White
        } else {
            text.to_string()
        }
    }
    
    fn style_command(&self, text: &str) -> String {
        if self.colors_enabled {
            format!("\x1b[1;32m{}\x1b[0m", text) // Bold Green
        } else {
            format!("`{}`", text)
        }
    }
    
    fn style_progress(&self, text: &str) -> String {
        if self.colors_enabled {
            format!("\x1b[1;36m{}\x1b[0m", text) // Bold Cyan
        } else {
            text.to_string()
        }
    }
}

/// Formatting templates for consistent styling
#[derive(Debug)]
struct FormattingTemplates {
    // Placeholder for future template system
}

impl Default for FormattingTemplates {
    fn default() -> Self {
        FormattingTemplates {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::path::PathBuf;
    
    fn create_test_context() -> TerminalContext {
        TerminalContext {
            terminal_id: "test_terminal".to_string(),
            current_directory: PathBuf::from("/test/project"),
            project_context: None,
            recent_commands: vec![],
            environment_variables: HashMap::new(),
        }
    }
    
    #[tokio::test]
    async fn test_formatter_creation() {
        let formatter = ResponseFormatter::new();
        assert!(formatter.colors_enabled);
    }
    
    #[tokio::test]
    async fn test_success_response_formatting() {
        let formatter = ResponseFormatter::new();
        let context = create_test_context();
        
        let result = serde_json::json!({
            "status": "success",
            "analysis": {
                "language": "rust",
                "issues": [],
                "suggestions": ["Add documentation", "Consider using generics"]
            }
        });
        
        let formatted = formatter.format_success_response("code_analyzer", &result, &context).await.unwrap();
        
        assert!(formatted.contains("✅ AI Tool Result"));
        assert!(formatted.contains("code_analyzer"));
        assert!(formatted.contains("rust"));
        assert!(formatted.contains("Add documentation"));
    }
    
    #[tokio::test]
    async fn test_error_response_formatting() {
        let formatter = ResponseFormatter::new();
        let context = create_test_context();
        let error = anyhow::Error::msg("Test error message");
        
        let formatted = formatter.format_error_response("test_tool", &error, &context).await.unwrap();
        
        assert!(formatted.contains("❌ AI Tool Error"));
        assert!(formatted.contains("test_tool"));
        assert!(formatted.contains("Test error message"));
        assert!(formatted.contains("ae help"));
    }
    
    #[tokio::test]
    async fn test_help_response_formatting() {
        let formatter = ResponseFormatter::new();
        let capabilities = vec![
            McpCapability {
                name: "test_analyzer".to_string(),
                description: "Analyzes test code".to_string(),
                tool_type: crate::mcp_service::McpToolType::CodeAnalysis,
                input_schema: None,
                output_schema: None,
            }
        ];
        
        let formatted = formatter.format_help_response(&capabilities, Some("terminal1")).await.unwrap();
        
        assert!(formatted.contains("🤖 AI Assistant Help"));
        assert!(formatted.contains("test_analyzer"));
        assert!(formatted.contains("ae analyze code"));
    }
    
    #[tokio::test]
    async fn test_streaming_response_formatting() {
        let formatter = ResponseFormatter::new();
        
        let formatted = formatter.format_streaming_response("test_tool", 0.5, "Processing...").await.unwrap();
        
        assert!(formatted.contains("🔄"));
        assert!(formatted.contains("test_tool"));
        assert!(formatted.contains("50.0%"));
        assert!(formatted.contains("Processing..."));
    }
}