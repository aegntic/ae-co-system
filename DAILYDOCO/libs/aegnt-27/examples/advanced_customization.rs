//! Advanced Customization Example
//! 
//! This example demonstrates advanced configuration options, custom profiles,
//! multi-module usage, and fine-tuning of aegnt-27 parameters for specific
//! use cases and requirements.

use aegnt27::prelude::*;
use std::collections::HashMap;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Aegnt27Error> {
    env_logger::init();
    
    println!("🔧 aegnt-27 Advanced Customization Example");
    println!("===========================================\n");
    
    // Example 1: Custom Configuration Building
    println!("⚙️  Example 1: Custom Configuration Building");
    println!("-------------------------------------------");
    
    let custom_config = create_custom_configuration().await?;
    let aegnt = Aegnt27Engine::with_config(custom_config).await?;
    
    println!("✅ Custom Aegnt27 engine created with advanced configuration");
    
    // Example 2: Profile-Based Configurations
    println!("\n👤 Example 2: Profile-Based Configurations");
    println!("------------------------------------------");
    
    // Create different user profiles
    let profiles = create_user_profiles().await?;
    
    for (profile_name, config) in profiles {
        println!("\nTesting profile: {}", profile_name);
        let profile_engine = Aegnt27Engine::with_config(config).await?;
        
        // Test the profile with sample content
        let test_result = profile_engine.validate_content("Sample test content for profile validation").await?;
        println!("  Resistance score: {:.1}%", test_result.resistance_score() * 100.0);
        
        // Test typing characteristics
        let typing_result = profile_engine.humanize_typing("Hello from this profile!").await?;
        println!("  Average WPM: {:.1}", typing_result.average_wpm());
        println!("  Keystroke variation: {:.2}", calculate_keystroke_variation(&typing_result));
    }
    
    // Example 3: Dynamic Configuration Updates
    println!("\n🔄 Example 3: Dynamic Configuration Updates");
    println!("------------------------------------------");
    
    demonstrate_dynamic_configuration().await?;
    
    // Example 4: Multi-Module Coordination
    println!("\n🎭 Example 4: Multi-Module Coordination");
    println!("--------------------------------------");
    
    demonstrate_multi_module_coordination(&aegnt).await?;
    
    // Example 5: Advanced Mouse Configuration
    println!("\n🖱️  Example 5: Advanced Mouse Configuration");
    println!("-----------------------------------------");
    
    demonstrate_advanced_mouse_configuration().await?;
    
    // Example 6: Advanced Typing Configuration
    println!("\n⌨️  Example 6: Advanced Typing Configuration");
    println!("------------------------------------------");
    
    demonstrate_advanced_typing_configuration().await?;
    
    // Example 7: AI Detection Fine-Tuning
    println!("\n🤖 Example 7: AI Detection Fine-Tuning");
    println!("-------------------------------------");
    
    demonstrate_detection_fine_tuning().await?;
    
    // Example 8: Performance Profiling and Optimization
    println!("\n⚡ Example 8: Performance Profiling");
    println!("----------------------------------");
    
    demonstrate_performance_profiling(&aegnt).await?;
    
    println!("\n🎉 Advanced customization example completed!");
    
    Ok(())
}

/// Creates a comprehensive custom configuration
async fn create_custom_configuration() -> Result<Aegnt27Config, Aegnt27Error> {
    let config = Aegnt27Config::builder()
        // Mouse configuration with custom parameters
        .mouse(MouseConfig {
            movement_speed: 1.2,           // 20% faster than default
            drift_factor: 0.15,            // More pronounced drift
            micro_movement_intensity: 0.8, // Stronger micro-movements
            bezier_curve_randomness: 0.3,  // More curved paths
            pause_probability: 0.1,        // 10% chance of pause during movement
            overshoot_correction: true,    // Enable overshoot simulation
            acceleration_profile: AccelerationProfile::Natural,
            coordinate_precision: CoordinatePrecision::SubPixel,
            ..Default::default()
        })
        // Typing configuration with personality
        .typing(TypingConfig {
            base_wpm: 75.0,                // Base typing speed
            wpm_variation: 15.0,           // ±15 WPM variation
            error_rate: 0.02,              // 2% error rate
            correction_delay: Duration::from_millis(300), // 300ms to correct errors
            burst_typing_probability: 0.15, // 15% chance of burst typing
            fatigue_factor: 0.05,          // Gradual slowdown over time
            key_hold_variation: 0.3,       // 30% variation in key hold times
            rhythm_patterns: vec![
                TypingRhythm::Steady,
                TypingRhythm::Burst,
                TypingRhythm::Hesitant,
            ],
            ..Default::default()
        })
        // Audio configuration for natural speech
        .audio(AudioConfig {
            breathing_frequency: 0.25,     // Breath every 4 seconds
            vocal_fry_intensity: 0.1,      // Subtle vocal fry
            pitch_variation: 0.15,         // 15% pitch variation
            pace_variation: 0.2,           // 20% pace variation
            silence_insertion: true,       // Insert natural pauses
            spectral_enhancement: true,    // Enhance spectral authenticity
            ..Default::default()
        })
        // Visual configuration for gaze patterns
        .visual(VisualConfig {
            gaze_drift_factor: 0.2,        // Natural gaze drift
            blink_rate: 15.0,              // 15 blinks per minute
            attention_span: Duration::from_secs(30), // 30-second attention spans
            distraction_probability: 0.05,  // 5% chance of distraction
            eye_movement_smoothness: 0.85,  // Smooth eye movements
            ..Default::default()
        })
        // Detection resistance configuration
        .detection(DetectionConfig {
            authenticity_target: 0.95,     // 95% authenticity target
            detection_models: vec![
                DetectionModel::GPTZero,
                DetectionModel::OriginalityAI,
                DetectionModel::Turnitin,
                DetectionModel::YouTube,
            ],
            resistance_strategies: vec![
                ResistanceStrategy::PerplexityVariation,
                ResistanceStrategy::SyntaxDiversification,
                ResistanceStrategy::SemanticNoise,
            ],
            validation_strictness: ValidationStrictness::High,
            ..Default::default()
        })
        .build()?;
    
    println!("Custom configuration created with:");
    println!("  • Mouse: Enhanced drift and micro-movements");
    println!("  • Typing: 75 WPM base with natural variations");
    println!("  • Audio: Natural breathing and vocal patterns");
    println!("  • Visual: Realistic gaze and attention modeling");
    println!("  • Detection: 95% authenticity target across all models");
    
    Ok(config)
}

/// Creates different user profiles for various use cases
async fn create_user_profiles() -> Result<HashMap<String, Aegnt27Config>, Aegnt27Error> {
    let mut profiles = HashMap::new();
    
    // Casual User Profile - Relaxed settings
    let casual_config = Aegnt27Config::builder()
        .mouse(MouseConfig {
            movement_speed: 0.8,
            drift_factor: 0.2,
            micro_movement_intensity: 1.0,
            ..Default::default()
        })
        .typing(TypingConfig {
            base_wpm: 45.0,
            wpm_variation: 20.0,
            error_rate: 0.04,
            ..Default::default()
        })
        .detection(DetectionConfig {
            authenticity_target: 0.85,
            validation_strictness: ValidationStrictness::Medium,
            ..Default::default()
        })
        .build()?;
    profiles.insert("Casual User".to_string(), casual_config);
    
    // Professional Profile - High precision
    let professional_config = Aegnt27Config::builder()
        .mouse(MouseConfig {
            movement_speed: 1.5,
            drift_factor: 0.05,
            micro_movement_intensity: 0.3,
            coordinate_precision: CoordinatePrecision::Pixel,
            ..Default::default()
        })
        .typing(TypingConfig {
            base_wpm: 90.0,
            wpm_variation: 8.0,
            error_rate: 0.005,
            correction_delay: Duration::from_millis(150),
            ..Default::default()
        })
        .detection(DetectionConfig {
            authenticity_target: 0.98,
            validation_strictness: ValidationStrictness::High,
            ..Default::default()
        })
        .build()?;
    profiles.insert("Professional".to_string(), professional_config);
    
    // Gaming Profile - Fast and reactive
    let gaming_config = Aegnt27Config::builder()
        .mouse(MouseConfig {
            movement_speed: 2.0,
            drift_factor: 0.02,
            micro_movement_intensity: 0.1,
            acceleration_profile: AccelerationProfile::Sharp,
            overshoot_correction: false,
            ..Default::default()
        })
        .typing(TypingConfig {
            base_wpm: 120.0,
            wpm_variation: 25.0,
            error_rate: 0.01,
            burst_typing_probability: 0.3,
            ..Default::default()
        })
        .build()?;
    profiles.insert("Gaming".to_string(), gaming_config);
    
    // Accessibility Profile - Slower, more deliberate
    let accessibility_config = Aegnt27Config::builder()
        .mouse(MouseConfig {
            movement_speed: 0.5,
            drift_factor: 0.1,
            pause_probability: 0.2,
            acceleration_profile: AccelerationProfile::Gradual,
            ..Default::default()
        })
        .typing(TypingConfig {
            base_wpm: 25.0,
            wpm_variation: 10.0,
            error_rate: 0.06,
            correction_delay: Duration::from_millis(800),
            fatigue_factor: 0.15,
            ..Default::default()
        })
        .build()?;
    profiles.insert("Accessibility".to_string(), accessibility_config);
    
    Ok(profiles)
}

/// Demonstrates dynamic configuration updates during runtime
async fn demonstrate_dynamic_configuration() -> Result<(), Aegnt27Error> {
    println!("Creating engine with initial configuration...");
    
    // Start with a basic configuration
    let mut current_config = Aegnt27Config::builder()
        .typing(TypingConfig {
            base_wpm: 60.0,
            error_rate: 0.02,
            ..Default::default()
        })
        .build()?;
    
    let mut aegnt = Aegnt27Engine::with_config(current_config.clone()).await?;
    
    // Test initial performance
    let initial_result = aegnt.humanize_typing("Initial configuration test").await?;
    println!("Initial WPM: {:.1}", initial_result.average_wpm());
    
    // Update configuration for faster typing
    println!("Updating configuration for faster typing...");
    current_config.typing.base_wpm = 100.0;
    current_config.typing.error_rate = 0.01;
    
    // Create new engine with updated config
    aegnt = Aegnt27Engine::with_config(current_config).await?;
    let updated_result = aegnt.humanize_typing("Updated configuration test").await?;
    println!("Updated WPM: {:.1}", updated_result.average_wpm());
    
    println!("Configuration successfully updated during runtime");
    
    Ok(())
}

/// Demonstrates coordination between multiple modules
async fn demonstrate_multi_module_coordination(aegnt: &Aegnt27Engine) -> Result<(), Aegnt27Error> {
    println!("Coordinating mouse, typing, and detection modules...");
    
    // Simulate a complete user interaction workflow
    let workflow_steps = vec![
        "Navigate to text editor",
        "Click in text field", 
        "Type document content",
        "Select and copy text",
        "Paste in new location",
        "Save document",
    ];
    
    for (i, step) in workflow_steps.iter().enumerate() {
        println!("Step {}: {}", i + 1, step);
        
        // Generate mouse movement for this step
        let start = Point::new(100 + i * 50, 100 + i * 30);
        let end = Point::new(200 + i * 100, 150 + i * 50);
        let mouse_path = aegnt.generate_natural_mouse_path(start, end).await?;
        let humanized_mouse = aegnt.humanize_mouse_movement(mouse_path).await?;
        
        // Generate typing if applicable
        if step.contains("Type") || step.contains("content") {
            let sample_text = format!("This is step {} of the workflow: {}", i + 1, step);
            let humanized_typing = aegnt.humanize_typing(&sample_text).await?;
            
            println!("  Mouse movement: {:.1}ms", humanized_mouse.total_duration().as_millis());
            println!("  Typing duration: {:.1}ms", humanized_typing.total_duration().as_millis());
            
            // Validate the typed content
            let validation = aegnt.validate_content(&sample_text).await?;
            println!("  Content resistance: {:.1}%", validation.resistance_score() * 100.0);
        } else {
            println!("  Mouse movement: {:.1}ms", humanized_mouse.total_duration().as_millis());
        }
        
        // Small delay between workflow steps
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    
    println!("Multi-module coordination completed successfully");
    
    Ok(())
}

/// Demonstrates advanced mouse configuration options
async fn demonstrate_advanced_mouse_configuration() -> Result<(), Aegnt27Error> {
    // Test different acceleration profiles
    let acceleration_profiles = vec![
        AccelerationProfile::Linear,
        AccelerationProfile::Natural,
        AccelerationProfile::Sharp,
        AccelerationProfile::Gradual,
    ];
    
    for profile in acceleration_profiles {
        let config = Aegnt27Config::builder()
            .mouse(MouseConfig {
                acceleration_profile: profile.clone(),
                movement_speed: 1.0,
                ..Default::default()
            })
            .build()?;
        
        let aegnt = Aegnt27Engine::with_config(config).await?;
        let path = MousePath::linear(Point::new(0, 0), Point::new(500, 500));
        let result = aegnt.humanize_mouse_movement(path).await?;
        
        println!("Acceleration profile {:?}:", profile);
        println!("  Points generated: {}", result.points().len());
        println!("  Total duration: {:.1}ms", result.total_duration().as_millis());
        println!("  Max velocity: {:.1}px/ms", result.max_velocity());
    }
    
    Ok(())
}

/// Demonstrates advanced typing configuration options
async fn demonstrate_advanced_typing_configuration() -> Result<(), Aegnt27Error> {
    // Test different rhythm patterns
    let rhythm_patterns = vec![
        vec![TypingRhythm::Steady],
        vec![TypingRhythm::Burst],
        vec![TypingRhythm::Hesitant],
        vec![TypingRhythm::Steady, TypingRhythm::Burst], // Mixed patterns
    ];
    
    let test_text = "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet.";
    
    for (i, patterns) in rhythm_patterns.iter().enumerate() {
        let config = Aegnt27Config::builder()
            .typing(TypingConfig {
                rhythm_patterns: patterns.clone(),
                base_wpm: 70.0,
                ..Default::default()
            })
            .build()?;
        
        let aegnt = Aegnt27Engine::with_config(config).await?;
        let result = aegnt.humanize_typing(test_text).await?;
        
        println!("Rhythm pattern set {}:", i + 1);
        println!("  Average WPM: {:.1}", result.average_wpm());
        println!("  Keystroke variation: {:.2}", calculate_keystroke_variation(&result));
        println!("  Error corrections: {}", result.error_corrections());
    }
    
    Ok(())
}

/// Demonstrates fine-tuning AI detection resistance
async fn demonstrate_detection_fine_tuning() -> Result<(), Aegnt27Error> {
    let test_contents = vec![
        "This is a straightforward sentence with common words.",
        "Utilizing sophisticated vernacular demonstrates enhanced linguistic capabilities.",
        "The implementation leverages advanced algorithms for optimal performance metrics.",
        "I think this works pretty well for most normal use cases honestly.",
    ];
    
    // Test different authenticity targets
    let authenticity_targets = vec![0.8, 0.9, 0.95, 0.99];
    
    for target in authenticity_targets {
        println!("\nAuthenticity target: {:.0}%", target * 100.0);
        
        let config = Aegnt27Config::builder()
            .detection(DetectionConfig {
                authenticity_target: target,
                validation_strictness: ValidationStrictness::High,
                ..Default::default()
            })
            .build()?;
        
        let aegnt = Aegnt27Engine::with_config(config).await?;
        
        for (i, content) in test_contents.iter().enumerate() {
            let result = aegnt.validate_content(content).await?;
            println!("  Content {}: {:.1}% resistance", 
                     i + 1, 
                     result.resistance_score() * 100.0);
        }
    }
    
    Ok(())
}

/// Demonstrates performance profiling and benchmarking
async fn demonstrate_performance_profiling(aegnt: &Aegnt27Engine) -> Result<(), Aegnt27Error> {
    println!("Running performance benchmarks...");
    
    // Benchmark mouse movement generation
    let mouse_start = std::time::Instant::now();
    for _ in 0..100 {
        let path = MousePath::linear(Point::new(0, 0), Point::new(1000, 1000));
        let _ = aegnt.humanize_mouse_movement(path).await?;
    }
    let mouse_elapsed = mouse_start.elapsed();
    
    // Benchmark typing humanization
    let typing_start = std::time::Instant::now();
    let sample_text = "Performance testing sample text with various characteristics.";
    for _ in 0..100 {
        let _ = aegnt.humanize_typing(sample_text).await?;
    }
    let typing_elapsed = typing_start.elapsed();
    
    // Benchmark content validation
    let validation_start = std::time::Instant::now();
    for _ in 0..50 {
        let _ = aegnt.validate_content(sample_text).await?;
    }
    let validation_elapsed = validation_start.elapsed();
    
    println!("Performance Results:");
    println!("  Mouse humanization: {:.2}ms avg", mouse_elapsed.as_millis() as f64 / 100.0);
    println!("  Typing humanization: {:.2}ms avg", typing_elapsed.as_millis() as f64 / 100.0);
    println!("  Content validation: {:.2}ms avg", validation_elapsed.as_millis() as f64 / 50.0);
    
    // Memory usage estimation
    println!("  Estimated memory overhead: ~{}KB", estimate_memory_usage());
    
    Ok(())
}

/// Utility function to calculate keystroke timing variation
fn calculate_keystroke_variation(typing_sequence: &TypingSequence) -> f64 {
    let delays: Vec<f64> = typing_sequence.keystrokes()
        .iter()
        .map(|k| k.delay().as_millis() as f64)
        .collect();
    
    if delays.is_empty() {
        return 0.0;
    }
    
    let mean = delays.iter().sum::<f64>() / delays.len() as f64;
    let variance = delays.iter()
        .map(|d| (d - mean).powi(2))
        .sum::<f64>() / delays.len() as f64;
    
    variance.sqrt() / mean // Coefficient of variation
}

/// Estimates memory usage for performance monitoring
fn estimate_memory_usage() -> usize {
    // This is a simplified estimation - in a real implementation,
    // you would use proper memory profiling tools
    std::mem::size_of::<Aegnt27Engine>() / 1024 // Convert to KB
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_custom_configuration() {
        let config = create_custom_configuration().await.unwrap();
        let aegnt = Aegnt27Engine::with_config(config).await.unwrap();
        
        // Test that custom configuration works
        let result = aegnt.humanize_typing("test").await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_user_profiles() {
        let profiles = create_user_profiles().await.unwrap();
        assert!(profiles.len() >= 4);
        
        for (name, config) in profiles {
            let aegnt = Aegnt27Engine::with_config(config).await
                .expect(&format!("Failed to create engine for profile: {}", name));
            
            let result = aegnt.humanize_typing("test").await;
            assert!(result.is_ok(), "Profile {} failed typing test", name);
        }
    }
    
    #[tokio::test]
    async fn test_keystroke_variation_calculation() {
        let config = Aegnt27Config::default();
        let aegnt = Aegnt27Engine::with_config(config).await.unwrap();
        let result = aegnt.humanize_typing("test text").await.unwrap();
        
        let variation = calculate_keystroke_variation(&result);
        assert!(variation >= 0.0);
        assert!(variation.is_finite());
    }
}