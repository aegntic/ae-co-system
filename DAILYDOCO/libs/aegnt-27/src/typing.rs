//! Typing humanization module for aegnt-27
//! 
//! This module provides sophisticated typing pattern humanization that simulates
//! natural human typing behavior including realistic timing variations, error patterns,
//! fatigue modeling, and keyboard-specific characteristics.

use std::time::Duration;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use rand::prelude::*;
// use rand_distr::{Normal, Beta};

use crate::error::{Aegnt27Error, TypingError, Result};
use crate::utils::{timing, random::HumanRng, validation};

/// Configuration for typing humanization behavior
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypingConfig {
    /// Base typing speed in words per minute (20-200)
    pub base_wpm: f64,
    
    /// Typing speed variation factor (0.0-1.0)
    pub speed_variation: f64,
    
    /// Error injection rate (0.0-0.1 = 0-10%)
    pub error_rate: f64,
    
    /// Enable fatigue modeling (typing gets slower over time)
    pub enable_fatigue_modeling: bool,
    
    /// Fatigue buildup rate (0.0-1.0)
    pub fatigue_rate: f64,
    
    /// Enable burst typing patterns
    pub enable_burst_patterns: bool,
    
    /// Pause probability after sentences (0.0-1.0)
    pub sentence_pause_probability: f64,
    
    /// Pause probability after words (0.0-1.0)
    pub word_pause_probability: f64,
    
    /// Enable keyboard layout specific timing
    pub enable_layout_timing: bool,
    
    /// Keyboard layout ("qwerty", "dvorak", "colemak")
    pub keyboard_layout: String,
    
    /// Enable autocorrection simulation
    pub enable_autocorrection: bool,
    
    /// Thinking pause probability (0.0-1.0)
    pub thinking_pause_probability: f64,
    
    /// Maximum thinking pause duration in milliseconds
    pub max_thinking_pause_ms: u64,
}

impl Default for TypingConfig {
    fn default() -> Self {
        Self {
            base_wpm: 65.0,
            speed_variation: 0.25,
            error_rate: 0.02,
            enable_fatigue_modeling: true,
            fatigue_rate: 0.1,
            enable_burst_patterns: true,
            sentence_pause_probability: 0.3,
            word_pause_probability: 0.05,
            enable_layout_timing: true,
            keyboard_layout: "qwerty".to_string(),
            enable_autocorrection: true,
            thinking_pause_probability: 0.08,
            max_thinking_pause_ms: 2000,
        }
    }
}

/// Represents a single keystroke with timing and metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HumanizedKeystroke {
    /// The character or key being pressed
    pub character: String,
    
    /// Time since the start of typing sequence
    pub timestamp: Duration,
    
    /// Duration the key is held down
    pub hold_duration: Duration,
    
    /// Type of keystroke
    pub keystroke_type: KeystrokeType,
    
    /// Confidence/naturalness score (0.0-1.0)
    pub confidence: f32,
}

/// Types of keystrokes for better simulation
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum KeystrokeType {
    /// Normal character input
    Normal,
    /// Correction (backspace/delete)
    Correction,
    /// Punctuation with potential pause
    Punctuation,
    /// Space with potential word boundary effects
    Space,
    /// Special keys (Enter, Tab, etc.)
    Special,
    /// Error keystroke (typo)
    Error,
    /// Autocorrection replacement
    Autocorrect,
}

/// A complete typing sequence with humanized characteristics
#[derive(Debug, Clone)]
pub struct TypingSequence {
    /// All keystrokes in the sequence
    pub keystrokes: Vec<HumanizedKeystroke>,
    
    /// Total time for the sequence
    pub total_duration: Duration,
    
    /// Average WPM for this sequence
    pub actual_wpm: f64,
    
    /// Error rate achieved
    pub error_rate: f64,
    
    /// Authenticity score (0.0-1.0)
    pub authenticity_score: f32,
    
    /// Original text
    pub original_text: String,
    
    /// Final text after errors and corrections
    pub final_text: String,
}

impl TypingSequence {
    /// Gets the total number of keystrokes including corrections
    pub fn total_keystrokes(&self) -> usize {
        self.keystrokes.len()
    }
    
    /// Gets the number of correction keystrokes
    pub fn correction_count(&self) -> usize {
        self.keystrokes
            .iter()
            .filter(|k| k.keystroke_type == KeystrokeType::Correction)
            .count()
    }
    
    /// Gets the number of error keystrokes
    pub fn error_count(&self) -> usize {
        self.keystrokes
            .iter()
            .filter(|k| k.keystroke_type == KeystrokeType::Error)
            .count()
    }
    
    /// Calculates typing rhythm consistency (lower = more human-like)
    pub fn calculate_rhythm_consistency(&self) -> f64 {
        if self.keystrokes.len() < 3 {
            return 1.0;
        }
        
        let intervals: Vec<u64> = self.keystrokes
            .windows(2)
            .map(|window| {
                window[1].timestamp.saturating_sub(window[0].timestamp).as_millis() as u64
            })
            .collect();
        
        if intervals.is_empty() {
            return 1.0;
        }
        
        let mean = intervals.iter().sum::<u64>() as f64 / intervals.len() as f64;
        let variance = intervals
            .iter()
            .map(|&x| (x as f64 - mean).powi(2))
            .sum::<f64>() / intervals.len() as f64;
        
        variance.sqrt() / mean
    }
}

/// Typing pattern analysis for behavioral modeling
#[derive(Debug, Clone)]
pub struct TypingPattern {
    /// Character-to-character timing patterns
    pub digraph_timings: HashMap<String, Duration>,
    
    /// Common typo patterns
    pub typo_patterns: HashMap<char, Vec<char>>,
    
    /// Pause patterns after punctuation
    pub punctuation_pauses: HashMap<char, Duration>,
    
    /// Fatigue factor progression
    pub fatigue_progression: Vec<f64>,
}

/// The main typing humanization engine
pub struct TypingHumanizer {
    config: TypingConfig,
    rng: HumanRng,
    keyboard_layout: KeyboardLayout,
    typing_pattern: TypingPattern,
    current_fatigue: f64,
}

impl TypingHumanizer {
    /// Creates a new typing humanizer with the given configuration
    pub async fn new(config: TypingConfig) -> Result<Self> {
        // Validate configuration
        validation::validate_range(config.base_wpm, 10.0, 250.0, "base_wpm")?;
        validation::validate_range(config.speed_variation, 0.0, 1.0, "speed_variation")?;
        validation::validate_range(config.error_rate, 0.0, 0.2, "error_rate")?;
        validation::validate_range(config.fatigue_rate, 0.0, 1.0, "fatigue_rate")?;
        
        let keyboard_layout = KeyboardLayout::new(&config.keyboard_layout)?;
        let typing_pattern = TypingPattern::generate_default(&keyboard_layout);
        
        Ok(Self {
            config,
            rng: HumanRng::new(),
            keyboard_layout,
            typing_pattern,
            current_fatigue: 0.0,
        })
    }
    
    /// Humanizes text input with natural typing patterns
    pub async fn humanize_text(&mut self, text: &str) -> Result<TypingSequence> {
        validation::validate_non_empty(text, "text")?;
        
        let mut keystrokes = Vec::new();
        let mut current_time = Duration::ZERO;
        let mut current_text = String::new();
        let _start_time = std::time::Instant::now();
        
        // Reset fatigue for new sequence
        self.current_fatigue = 0.0;
        
        let chars: Vec<char> = text.chars().collect();
        let mut i = 0;
        
        while i < chars.len() {
            let ch = chars[i];
            
            // Calculate timing for this keystroke
            let keystroke_timing = self.calculate_keystroke_timing(
                ch,
                chars.get(i.saturating_sub(1)).copied(),
                chars.get(i + 1).copied(),
                current_text.len(),
            ).await?;
            
            // Check for thinking pause
            if self.should_add_thinking_pause(ch, &current_text).await {
                let pause_duration = self.generate_thinking_pause().await;
                current_time += pause_duration;
            }
            
            // Check for error injection
            if self.should_inject_error(ch).await {
                let (error_keystrokes, actual_char) = self.generate_error_sequence(ch, current_time).await?;
                keystrokes.extend(error_keystrokes);
                current_time = keystrokes.last().unwrap().timestamp + keystrokes.last().unwrap().hold_duration;
                
                if let Some(final_char) = actual_char {
                    current_text.push(final_char);
                }
            } else {
                // Normal keystroke
                let keystroke = HumanizedKeystroke {
                    character: ch.to_string(),
                    timestamp: current_time,
                    hold_duration: keystroke_timing,
                    keystroke_type: self.classify_keystroke(ch),
                    confidence: self.calculate_keystroke_confidence(ch),
                };
                
                keystrokes.push(keystroke);
                current_text.push(ch);
                current_time += keystroke_timing;
            }
            
            // Add pause after punctuation or words
            if self.should_add_pause_after_character(ch).await {
                let pause_duration = self.generate_pause_duration(ch).await;
                current_time += pause_duration;
            }
            
            // Update fatigue
            if self.config.enable_fatigue_modeling {
                self.update_fatigue(current_text.len());
            }
            
            i += 1;
        }
        
        let total_duration = current_time;
        let actual_wpm = self.calculate_wpm(text.len(), total_duration);
        let error_rate = keystrokes.iter()
            .filter(|k| k.keystroke_type == KeystrokeType::Error)
            .count() as f64 / keystrokes.len() as f64;
        
        let sequence = TypingSequence {
            keystrokes,
            total_duration,
            actual_wpm,
            error_rate,
            authenticity_score: 0.0, // Will be calculated
            original_text: text.to_string(),
            final_text: current_text,
        };
        
        // Calculate authenticity score
        let authenticity_score = self.calculate_authenticity_score(&sequence)?;
        
        Ok(TypingSequence {
            authenticity_score,
            ..sequence
        })
    }
    
    /// Injects realistic typing errors into text
    pub async fn inject_errors(&mut self, text: &str, error_rate: f64) -> Result<String> {
        validation::validate_range(error_rate, 0.0, 0.5, "error_rate")?;
        
        let mut result = String::new();
        
        for ch in text.chars() {
            if self.rng.gen::<f64>() < error_rate {
                // Inject error
                if let Some(typo_char) = self.generate_typo_for_character(ch) {
                    result.push(typo_char);
                    // Sometimes add correction
                    if self.rng.gen::<f64>() < 0.7 {
                        result.push('\u{0008}'); // Backspace
                        result.push(ch);
                    }
                } else {
                    result.push(ch);
                }
            } else {
                result.push(ch);
            }
        }
        
        Ok(result)
    }
    
    /// Generates typing errors and corrections for a character
    async fn generate_error_sequence(
        &mut self,
        target_char: char,
        start_time: Duration,
    ) -> Result<(Vec<HumanizedKeystroke>, Option<char>)> {
        let mut keystrokes = Vec::new();
        let mut current_time = start_time;
        
        // Generate the typo
        if let Some(typo_char) = self.generate_typo_for_character(target_char) {
            let typo_timing = self.calculate_base_keystroke_timing().await;
            
            keystrokes.push(HumanizedKeystroke {
                character: typo_char.to_string(),
                timestamp: current_time,
                hold_duration: typo_timing,
                keystroke_type: KeystrokeType::Error,
                confidence: 0.2, // Low confidence for errors
            });
            
            current_time += typo_timing;
            
            // Decide whether to correct the error
            if self.rng.gen::<f64>() < 0.8 {
                // Add short pause (error recognition)
                current_time += Duration::from_millis(self.rng.gen_range(100..300));
                
                // Add backspace
                let backspace_timing = self.calculate_base_keystroke_timing().await;
                keystrokes.push(HumanizedKeystroke {
                    character: "\u{0008}".to_string(), // Backspace
                    timestamp: current_time,
                    hold_duration: backspace_timing,
                    keystroke_type: KeystrokeType::Correction,
                    confidence: 0.9,
                });
                
                current_time += backspace_timing;
                
                // Add correct character
                let correct_timing = self.calculate_base_keystroke_timing().await;
                keystrokes.push(HumanizedKeystroke {
                    character: target_char.to_string(),
                    timestamp: current_time,
                    hold_duration: correct_timing,
                    keystroke_type: KeystrokeType::Normal,
                    confidence: 0.95,
                });
                
                return Ok((keystrokes, Some(target_char)));
            } else {
                // Error not corrected
                return Ok((keystrokes, Some(typo_char)));
            }
        }
        
        // Fallback: normal keystroke
        let timing = self.calculate_base_keystroke_timing().await;
        keystrokes.push(HumanizedKeystroke {
            character: target_char.to_string(),
            timestamp: current_time,
            hold_duration: timing,
            keystroke_type: KeystrokeType::Normal,
            confidence: 0.9,
        });
        
        Ok((keystrokes, Some(target_char)))
    }
    
    async fn calculate_keystroke_timing(
        &mut self,
        current_char: char,
        previous_char: Option<char>,
        _next_char: Option<char>,
        _position: usize,
    ) -> Result<Duration> {
        let mut base_timing = self.calculate_base_keystroke_timing().await;
        
        // Apply digraph timing if available
        if let Some(prev) = previous_char {
            let digraph = format!("{}{}", prev, current_char);
            if let Some(&digraph_timing) = self.typing_pattern.digraph_timings.get(&digraph) {
                base_timing = digraph_timing;
            }
        }
        
        // Apply keyboard layout specific timing
        if self.config.enable_layout_timing {
            let layout_modifier = self.keyboard_layout.get_timing_modifier(current_char);
            let modified_ms = base_timing.as_millis() as f64 * layout_modifier;
            base_timing = Duration::from_millis(modified_ms as u64);
        }
        
        // Apply fatigue effect
        if self.config.enable_fatigue_modeling {
            let fatigue_modifier = 1.0 + self.current_fatigue;
            let fatigued_ms = base_timing.as_millis() as f64 * fatigue_modifier;
            base_timing = Duration::from_millis(fatigued_ms as u64);
        }
        
        // Add natural variation
        let variation = self.config.speed_variation;
        let varied_timing = timing::generate_natural_delay(base_timing, variation);
        
        Ok(varied_timing)
    }
    
    async fn calculate_base_keystroke_timing(&mut self) -> Duration {
        // Convert WPM to average keystroke timing
        let chars_per_minute = self.config.base_wpm * 5.0; // Average 5 chars per word
        let chars_per_second = chars_per_minute / 60.0;
        let base_ms = 1000.0 / chars_per_second;
        
        // Add human-like variation using beta distribution
        let beta_variation = self.rng.beta_sample(2.0, 2.0);
        let varied_ms = base_ms * (0.5 + beta_variation);
        
        Duration::from_millis(varied_ms as u64)
    }
    
    fn classify_keystroke(&self, ch: char) -> KeystrokeType {
        match ch {
            ' ' => KeystrokeType::Space,
            '.' | '!' | '?' | ',' | ';' | ':' => KeystrokeType::Punctuation,
            '\n' | '\r' | '\t' => KeystrokeType::Special,
            _ => KeystrokeType::Normal,
        }
    }
    
    fn calculate_keystroke_confidence(&mut self, ch: char) -> f32 {
        // Characters that are harder to type have lower confidence
        let base_confidence = match ch {
            'a'..='z' | 'A'..='Z' => 0.95,
            '0'..='9' => 0.90,
            ' ' => 0.98,
            '.' | ',' => 0.92,
            _ => 0.85, // Special characters
        };
        
        // Add some random variation
        let variation = self.rng.bounded_normal(0.0, 0.05, -0.1, 0.1);
        (base_confidence + variation as f32).clamp(0.0, 1.0)
    }
    
    async fn should_inject_error(&mut self, ch: char) -> bool {
        // Don't inject errors on spaces or simple characters too often
        let base_error_rate = match ch {
            ' ' => self.config.error_rate * 0.3,
            'a' | 'e' | 'i' | 'o' | 'u' => self.config.error_rate * 0.5,
            _ => self.config.error_rate,
        };
        
        self.rng.gen::<f64>() < base_error_rate
    }
    
    async fn should_add_thinking_pause(&mut self, ch: char, current_text: &str) -> bool {
        // More likely to pause before complex words or after periods
        let base_probability = if current_text.ends_with(". ") || current_text.ends_with("? ") || current_text.ends_with("! ") {
            self.config.thinking_pause_probability * 3.0
        } else if ch.is_uppercase() && !current_text.is_empty() {
            self.config.thinking_pause_probability * 2.0
        } else {
            self.config.thinking_pause_probability
        };
        
        self.rng.gen::<f64>() < base_probability
    }
    
    async fn generate_thinking_pause(&mut self) -> Duration {
        let max_ms = self.config.max_thinking_pause_ms as f64;
        let pause_ms = self.rng.bounded_normal(max_ms * 0.3, max_ms * 0.2, 50.0, max_ms);
        Duration::from_millis(pause_ms as u64)
    }
    
    async fn should_add_pause_after_character(&mut self, ch: char) -> bool {
        match ch {
            '.' | '!' | '?' => self.rng.gen::<f64>() < self.config.sentence_pause_probability,
            ' ' => self.rng.gen::<f64>() < self.config.word_pause_probability,
            _ => false,
        }
    }
    
    async fn generate_pause_duration(&mut self, ch: char) -> Duration {
        let base_ms = match ch {
            '.' | '!' | '?' => 800.0, // Longer pause after sentences
            ' ' => 150.0,             // Shorter pause after words
            _ => 50.0,
        };
        
        let pause_ms = self.rng.bounded_normal(base_ms, base_ms * 0.3, base_ms * 0.2, base_ms * 2.0);
        Duration::from_millis(pause_ms as u64)
    }
    
    fn update_fatigue(&mut self, characters_typed: usize) {
        if characters_typed > 100 {
            let fatigue_increase = self.config.fatigue_rate * 0.001 * (characters_typed as f64).sqrt();
            self.current_fatigue = (self.current_fatigue + fatigue_increase).min(0.5);
        }
    }
    
    fn calculate_wpm(&self, character_count: usize, duration: Duration) -> f64 {
        let minutes = duration.as_secs_f64() / 60.0;
        let words = character_count as f64 / 5.0; // Average 5 characters per word
        if minutes > 0.0 {
            words / minutes
        } else {
            0.0
        }
    }
    
    fn calculate_authenticity_score(&self, sequence: &TypingSequence) -> Result<f32> {
        let mut score = 1.0f32;
        
        // Check rhythm consistency (more variation = more human)
        let rhythm_consistency = sequence.calculate_rhythm_consistency();
        if rhythm_consistency < 0.1 {
            score -= 0.2; // Too consistent
        }
        
        // Check error rate (should be reasonable)
        if sequence.error_rate > 0.1 {
            score -= 0.3; // Too many errors
        } else if sequence.error_rate < 0.005 {
            score -= 0.1; // Too few errors
        }
        
        // Check WPM reasonableness
        if sequence.actual_wpm > 150.0 || sequence.actual_wpm < 10.0 {
            score -= 0.2; // Unrealistic typing speed
        }
        
        // Check for natural pauses
        let has_pauses = sequence.keystrokes.windows(2).any(|window| {
            let interval = window[1].timestamp.saturating_sub(window[0].timestamp);
            interval > Duration::from_millis(500)
        });
        
        if !has_pauses && sequence.keystrokes.len() > 50 {
            score -= 0.1; // No natural pauses in long sequences
        }
        
        Ok(score.max(0.0))
    }
    
    fn generate_typo_for_character(&mut self, ch: char) -> Option<char> {
        // Use keyboard layout to generate realistic typos
        self.keyboard_layout.get_adjacent_keys(ch)
            .and_then(|adjacent| adjacent.choose(&mut self.rng.rng).copied())
    }
}

/// Keyboard layout information for realistic typo generation
#[derive(Debug, Clone)]
pub struct KeyboardLayout {
    name: String,
    key_positions: HashMap<char, (i32, i32)>,
    adjacent_keys: HashMap<char, Vec<char>>,
}

impl KeyboardLayout {
    pub fn new(layout_name: &str) -> Result<Self> {
        match layout_name.to_lowercase().as_str() {
            "qwerty" => Ok(Self::qwerty_layout()),
            "dvorak" => Ok(Self::dvorak_layout()),
            "colemak" => Ok(Self::colemak_layout()),
            _ => Err(Aegnt27Error::Typing(TypingError::UnsupportedLayout(
                layout_name.to_string(),
            ))),
        }
    }
    
    fn qwerty_layout() -> Self {
        let mut key_positions: HashMap<char, (i32, i32)> = HashMap::new();
        let mut adjacent_keys = HashMap::new();
        
        // Row 1
        let row1 = "qwertyuiop";
        for (i, ch) in row1.chars().enumerate() {
            key_positions.insert(ch, (i as i32, 0));
        }
        
        // Row 2
        let row2 = "asdfghjkl";
        for (i, ch) in row2.chars().enumerate() {
            key_positions.insert(ch, (i as i32, 1));
        }
        
        // Row 3
        let row3 = "zxcvbnm";
        for (i, ch) in row3.chars().enumerate() {
            key_positions.insert(ch, (i as i32, 2));
        }
        
        // Generate adjacent keys based on positions
        for (&ch, &(x, y)) in &key_positions {
            let mut adjacent = Vec::new();
            
            for (&other_ch, &(other_x, other_y)) in &key_positions {
                if ch != other_ch {
                    let distance = (x - other_x).abs() + (y - other_y).abs();
                    if distance <= 1 {
                        adjacent.push(other_ch);
                    }
                }
            }
            
            adjacent_keys.insert(ch, adjacent);
        }
        
        Self {
            name: "qwerty".to_string(),
            key_positions,
            adjacent_keys,
        }
    }
    
    fn dvorak_layout() -> Self {
        // Simplified Dvorak layout implementation
        let mut layout = Self::qwerty_layout();
        layout.name = "dvorak".to_string();
        // Would need full Dvorak key mapping here
        layout
    }
    
    fn colemak_layout() -> Self {
        // Simplified Colemak layout implementation
        let mut layout = Self::qwerty_layout();
        layout.name = "colemak".to_string();
        // Would need full Colemak key mapping here
        layout
    }
    
    pub fn get_adjacent_keys(&self, ch: char) -> Option<&Vec<char>> {
        self.adjacent_keys.get(&ch.to_ascii_lowercase())
    }
    
    pub fn get_timing_modifier(&self, ch: char) -> f64 {
        // Characters that are harder to reach take longer
        match ch {
            'a' | 's' | 'd' | 'f' | 'j' | 'k' | 'l' => 0.9, // Home row
            'q' | 'w' | 'e' | 'r' | 't' | 'y' | 'u' | 'i' | 'o' | 'p' => 1.0, // Top row
            'z' | 'x' | 'c' | 'v' | 'b' | 'n' | 'm' => 1.1, // Bottom row
            ' ' => 0.8, // Space bar is easy
            _ => 1.2, // Numbers and symbols
        }
    }
}

impl TypingPattern {
    fn generate_default(_keyboard_layout: &KeyboardLayout) -> Self {
        let mut digraph_timings = HashMap::new();
        let typo_patterns = HashMap::new();
        let mut punctuation_pauses = HashMap::new();
        
        // Common digraph patterns (simplified)
        digraph_timings.insert("th".to_string(), Duration::from_millis(80));
        digraph_timings.insert("he".to_string(), Duration::from_millis(85));
        digraph_timings.insert("in".to_string(), Duration::from_millis(90));
        digraph_timings.insert("er".to_string(), Duration::from_millis(85));
        digraph_timings.insert("an".to_string(), Duration::from_millis(88));
        
        // Common punctuation pauses
        punctuation_pauses.insert('.', Duration::from_millis(600));
        punctuation_pauses.insert('!', Duration::from_millis(500));
        punctuation_pauses.insert('?', Duration::from_millis(550));
        punctuation_pauses.insert(',', Duration::from_millis(200));
        
        Self {
            digraph_timings,
            typo_patterns,
            punctuation_pauses,
            fatigue_progression: Vec::new(),
        }
    }
}

impl std::fmt::Debug for TypingHumanizer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("TypingHumanizer")
            .field("config", &self.config)
            .field("current_fatigue", &self.current_fatigue)
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_typing_humanizer_creation() {
        let config = TypingConfig::default();
        let result = TypingHumanizer::new(config).await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_text_humanization() {
        let config = TypingConfig::default();
        let mut humanizer = TypingHumanizer::new(config).await.unwrap();
        
        let text = "Hello, world! This is a test.";
        let result = humanizer.humanize_text(text).await;
        
        assert!(result.is_ok());
        let sequence = result.unwrap();
        assert!(!sequence.keystrokes.is_empty());
        assert!(sequence.total_duration > Duration::ZERO);
        assert!(sequence.authenticity_score > 0.0);
    }
    
    #[tokio::test]
    async fn test_error_injection() {
        let config = TypingConfig::default();
        let mut humanizer = TypingHumanizer::new(config).await.unwrap();
        
        let text = "testing error injection";
        let result = humanizer.inject_errors(text, 0.1).await;
        
        assert!(result.is_ok());
        let modified_text = result.unwrap();
        // The text might be different due to injected errors
        assert!(!modified_text.is_empty());
    }
    
    #[tokio::test]
    async fn test_keyboard_layout() {
        let qwerty = KeyboardLayout::new("qwerty");
        assert!(qwerty.is_ok());
        
        let layout = qwerty.unwrap();
        let adjacent = layout.get_adjacent_keys('a');
        assert!(adjacent.is_some());
        assert!(!adjacent.unwrap().is_empty());
    }
    
    #[test]
    fn test_typing_sequence_analysis() {
        let keystrokes = vec![
            HumanizedKeystroke {
                character: "h".to_string(),
                timestamp: Duration::from_millis(0),
                hold_duration: Duration::from_millis(80),
                keystroke_type: KeystrokeType::Normal,
                confidence: 0.95,
            },
            HumanizedKeystroke {
                character: "e".to_string(),
                timestamp: Duration::from_millis(120),
                hold_duration: Duration::from_millis(85),
                keystroke_type: KeystrokeType::Normal,
                confidence: 0.92,
            },
        ];
        
        let sequence = TypingSequence {
            keystrokes,
            total_duration: Duration::from_millis(200),
            actual_wpm: 60.0,
            error_rate: 0.02,
            authenticity_score: 0.85,
            original_text: "he".to_string(),
            final_text: "he".to_string(),
        };
        
        assert_eq!(sequence.total_keystrokes(), 2);
        assert_eq!(sequence.correction_count(), 0);
        assert_eq!(sequence.error_count(), 0);
        
        let consistency = sequence.calculate_rhythm_consistency();
        assert!(consistency >= 0.0);
    }
    
    #[test]
    fn test_config_validation() {
        let mut config = TypingConfig::default();
        config.base_wpm = 0.0; // Invalid
        
        let result = futures::executor::block_on(TypingHumanizer::new(config));
        assert!(result.is_err());
    }
}