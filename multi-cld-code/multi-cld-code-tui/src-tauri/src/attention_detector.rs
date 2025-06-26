use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttentionPattern {
    pub name: String,
    pub pattern: String,
    pub priority: u8, // 1-10, 10 being highest
    pub context_required: bool,
    pub description: String,
}

#[derive(Debug, Clone)]
pub struct AttentionDetector {
    patterns: Vec<(Regex, AttentionPattern)>,
    output_buffer: VecDeque<String>,
    max_buffer_size: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct AttentionResult {
    pub detected: bool,
    pub pattern_name: String,
    pub priority: u8,
    pub matched_text: String,
    pub context_lines: Vec<String>,
    pub confidence: f32,
}

impl AttentionDetector {
    pub fn new() -> Self {
        let patterns = Self::create_default_patterns();
        let compiled_patterns = patterns
            .into_iter()
            .filter_map(|pattern| {
                match Regex::new(&pattern.pattern) {
                    Ok(regex) => Some((regex, pattern)),
                    Err(e) => {
                        log::warn!("Failed to compile pattern '{}': {}", pattern.name, e);
                        None
                    }
                }
            })
            .collect();

        Self {
            patterns: compiled_patterns,
            output_buffer: VecDeque::new(),
            max_buffer_size: 100,
        }
    }

    fn create_default_patterns() -> Vec<AttentionPattern> {
        vec![
            // Claude Code specific patterns
            AttentionPattern {
                name: "claude_choice_prompt".to_string(),
                pattern: r"(?i)please\s+(choose|select|pick)\s+(an?\s+)?(option|choice|action)".to_string(),
                priority: 9,
                context_required: true,
                description: "Claude Code asking user to make a choice".to_string(),
            },
            AttentionPattern {
                name: "claude_input_request".to_string(),
                pattern: r"(?i)(please\s+)?(provide|enter|type|input)\s+.*?[:?]".to_string(),
                priority: 8,
                context_required: true,
                description: "Claude Code requesting specific input".to_string(),
            },
            AttentionPattern {
                name: "confirmation_prompt".to_string(),
                pattern: r"(?i)(continue|proceed|confirm)\s*\?\s*$".to_string(),
                priority: 7,
                context_required: false,
                description: "Asking for confirmation to proceed".to_string(),
            },
            AttentionPattern {
                name: "yes_no_question".to_string(),
                pattern: r"\[y/n\]|\[yes/no\]|\(y/n\)|\(yes/no\)".to_string(),
                priority: 8,
                context_required: false,
                description: "Yes/No question prompt".to_string(),
            },
            AttentionPattern {
                name: "numbered_menu".to_string(),
                pattern: r"^\s*\d+[\.\)]\s+.+$".to_string(),
                priority: 6,
                context_required: true,
                description: "Numbered menu options".to_string(),
            },
            AttentionPattern {
                name: "user_input_required".to_string(),
                pattern: r"(?i)(user\s+input\s+required|waiting\s+for\s+input|input\s+needed)".to_string(),
                priority: 9,
                context_required: false,
                description: "Explicit user input requirement".to_string(),
            },
            AttentionPattern {
                name: "error_action_required".to_string(),
                pattern: r"(?i)(error|failed|problem).*?(please|try|action|fix)".to_string(),
                priority: 8,
                context_required: true,
                description: "Error requiring user action".to_string(),
            },
            AttentionPattern {
                name: "file_path_request".to_string(),
                pattern: r"(?i)(enter|provide|specify).*?(path|file|directory|folder)".to_string(),
                priority: 7,
                context_required: true,
                description: "Requesting file or directory path".to_string(),
            },
            AttentionPattern {
                name: "command_selection".to_string(),
                pattern: r"(?i)(which|what)\s+(command|action)\s+(would\s+you\s+like|do\s+you\s+want)".to_string(),
                priority: 7,
                context_required: true,
                description: "Asking which command to execute".to_string(),
            },
            AttentionPattern {
                name: "password_prompt".to_string(),
                pattern: r"(?i)(password|passphrase|pin).*?[:?]\s*$".to_string(),
                priority: 10,
                context_required: false,
                description: "Password or authentication prompt".to_string(),
            },
            // Shell and system prompts
            AttentionPattern {
                name: "shell_prompt_waiting".to_string(),
                pattern: r"[$#%>]\s*$".to_string(),
                priority: 5,
                context_required: false,
                description: "Shell prompt waiting for command".to_string(),
            },
            AttentionPattern {
                name: "sudo_password".to_string(),
                pattern: r"(?i)\[sudo\].*?password".to_string(),
                priority: 9,
                context_required: false,
                description: "Sudo password request".to_string(),
            },
            // Git prompts
            AttentionPattern {
                name: "git_merge_conflict".to_string(),
                pattern: r"(?i)(merge\s+conflict|resolve\s+conflicts)".to_string(),
                priority: 8,
                context_required: true,
                description: "Git merge conflict requiring resolution".to_string(),
            },
            AttentionPattern {
                name: "git_commit_message".to_string(),
                pattern: r"(?i)(commit\s+message|enter\s+commit)".to_string(),
                priority: 7,
                context_required: true,
                description: "Git requesting commit message".to_string(),
            },
            // Package manager prompts
            AttentionPattern {
                name: "package_install_confirm".to_string(),
                pattern: r"(?i)(install\s+these\s+packages|continue\s+with\s+installation)".to_string(),
                priority: 6,
                context_required: true,
                description: "Package manager confirmation".to_string(),
            },
            // Generic interactive prompts
            AttentionPattern {
                name: "press_key_continue".to_string(),
                pattern: r"(?i)(press\s+(any\s+)?key|hit\s+enter)\s+to\s+continue".to_string(),
                priority: 5,
                context_required: false,
                description: "Press key to continue prompt".to_string(),
            },
            AttentionPattern {
                name: "selection_prompt".to_string(),
                pattern: r"(?i)(select|choose)\s+from\s+the\s+following".to_string(),
                priority: 7,
                context_required: true,
                description: "Selection from multiple options".to_string(),
            },
        ]
    }

    pub fn add_output_line(&mut self, line: &str) {
        // Add new line to buffer
        self.output_buffer.push_back(line.to_string());
        
        // Maintain buffer size
        while self.output_buffer.len() > self.max_buffer_size {
            self.output_buffer.pop_front();
        }
    }

    pub fn detect_attention(&self, new_line: &str) -> AttentionResult {
        let mut best_match: Option<AttentionResult> = None;
        
        for (regex, pattern) in &self.patterns {
            if let Some(captures) = regex.captures(new_line) {
                let matched_text = captures.get(0).unwrap().as_str().to_string();
                
                // Calculate confidence based on pattern specificity and context
                let confidence = self.calculate_confidence(pattern, &matched_text, new_line);
                
                // Get context if required
                let context_lines = if pattern.context_required {
                    self.get_context_lines(5)
                } else {
                    vec![]
                };
                
                let result = AttentionResult {
                    detected: true,
                    pattern_name: pattern.name.clone(),
                    priority: pattern.priority,
                    matched_text,
                    context_lines,
                    confidence,
                };
                
                // Keep the highest priority match, or highest confidence if same priority
                match &best_match {
                    None => best_match = Some(result),
                    Some(current_best) => {
                        if result.priority > current_best.priority ||
                           (result.priority == current_best.priority && result.confidence > current_best.confidence) {
                            best_match = Some(result);
                        }
                    }
                }
            }
        }
        
        // Check for multi-line patterns (like numbered menus)
        if best_match.is_none() {
            if let Some(menu_result) = self.detect_numbered_menu() {
                best_match = Some(menu_result);
            }
        }
        
        best_match.unwrap_or(AttentionResult {
            detected: false,
            pattern_name: "none".to_string(),
            priority: 0,
            matched_text: String::new(),
            context_lines: vec![],
            confidence: 0.0,
        })
    }

    fn calculate_confidence(&self, pattern: &AttentionPattern, matched_text: &str, full_line: &str) -> f32 {
        let mut confidence = 0.5; // Base confidence
        
        // Increase confidence for longer matches
        confidence += (matched_text.len() as f32 / full_line.len() as f32) * 0.2;
        
        // Increase confidence for high-priority patterns
        confidence += (pattern.priority as f32 / 10.0) * 0.2;
        
        // Increase confidence for specific keywords
        let high_confidence_keywords = ["password", "input required", "choose", "select"];
        for keyword in &high_confidence_keywords {
            if matched_text.to_lowercase().contains(keyword) {
                confidence += 0.1;
            }
        }
        
        // Decrease confidence for very common patterns in wrong context
        if matched_text.len() < 3 {
            confidence -= 0.2;
        }
        
        confidence.clamp(0.0, 1.0)
    }

    fn get_context_lines(&self, count: usize) -> Vec<String> {
        self.output_buffer
            .iter()
            .rev()
            .take(count)
            .rev()
            .cloned()
            .collect()
    }

    fn detect_numbered_menu(&self) -> Option<AttentionResult> {
        let recent_lines = self.get_context_lines(10);
        let mut menu_lines = 0;
        
        for line in &recent_lines {
            if Regex::new(r"^\s*\d+[\.\)]\s+.+$").unwrap().is_match(line) {
                menu_lines += 1;
            }
        }
        
        // If we have 2 or more numbered lines, likely a menu
        if menu_lines >= 2 {
            Some(AttentionResult {
                detected: true,
                pattern_name: "numbered_menu_detected".to_string(),
                priority: 7,
                matched_text: format!("Detected {} menu items", menu_lines),
                context_lines: recent_lines,
                confidence: 0.8,
            })
        } else {
            None
        }
    }

    pub fn add_custom_pattern(&mut self, pattern: AttentionPattern) -> Result<(), String> {
        match Regex::new(&pattern.pattern) {
            Ok(regex) => {
                self.patterns.push((regex, pattern));
                Ok(())
            }
            Err(e) => Err(format!("Invalid regex pattern: {}", e))
        }
    }

    pub fn get_pattern_names(&self) -> Vec<String> {
        self.patterns.iter().map(|(_, p)| p.name.clone()).collect()
    }

    pub fn enable_pattern(&mut self, name: &str) {
        // Implementation for enabling/disabling patterns
        // This would involve adding an enabled field to AttentionPattern
    }

    pub fn get_statistics(&self) -> AttentionStats {
        AttentionStats {
            total_patterns: self.patterns.len(),
            buffer_size: self.output_buffer.len(),
            max_buffer_size: self.max_buffer_size,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct AttentionStats {
    pub total_patterns: usize,
    pub buffer_size: usize,
    pub max_buffer_size: usize,
}

impl Default for AttentionDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_attention_detection() {
        let mut detector = AttentionDetector::new();
        
        // Test yes/no question
        let result = detector.detect_attention("Would you like to continue? [y/n]");
        assert!(result.detected);
        assert_eq!(result.pattern_name, "yes_no_question");
        
        // Test input request
        let result = detector.detect_attention("Please enter your name:");
        assert!(result.detected);
        assert_eq!(result.pattern_name, "claude_input_request");
    }

    #[test]
    fn test_numbered_menu_detection() {
        let mut detector = AttentionDetector::new();
        
        // Simulate numbered menu
        detector.add_output_line("Choose an option:");
        detector.add_output_line("1. Create new file");
        detector.add_output_line("2. Edit existing file");
        detector.add_output_line("3. Delete file");
        
        let result = detector.detect_numbered_menu();
        assert!(result.is_some());
        let result = result.unwrap();
        assert!(result.detected);
        assert_eq!(result.pattern_name, "numbered_menu_detected");
    }

    #[test]
    fn test_priority_ordering() {
        let detector = AttentionDetector::new();
        
        // Password should have higher priority than general input
        let result = detector.detect_attention("Please enter your password:");
        assert!(result.detected);
        assert_eq!(result.pattern_name, "password_prompt");
        assert_eq!(result.priority, 10);
    }
}