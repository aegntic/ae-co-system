# aegnt-27 Quick Start Guide

Get up and running with aegnt-27 in just 5 minutes! This guide will walk you through installation, basic setup, and your first humanization operations.

## Prerequisites

Before you begin, ensure you have:

- **Rust 1.70.0 or later** - [Install Rust](https://rustup.rs/)
- **Platform support**: Windows 10+, Linux (Ubuntu 20.04+), or macOS 12+
- **Minimum 512MB RAM** and **2+ CPU cores** (recommended: 2GB RAM, 4+ cores)
- **Optional**: GPU with OpenCL/CUDA support for acceleration

## Installation

### Option 1: Add to Existing Project

Add aegnt-27 to your `Cargo.toml`:

```toml
[dependencies]
aegnt_27 = "2.7.0"

# For full feature set
aegnt_27 = { version = "2.7.0", features = ["full"] }

# For minimal installation
aegnt_27 = { version = "2.7.0", default-features = false, features = ["basic-humanization"] }
```

### Option 2: Clone and Build from Source

```bash
git clone https://github.com/aegntic/aegnt-27.git
cd aegnt-27
cargo build --release
```

### Feature Flags

Choose the features you need:

```toml
[dependencies]
aegnt_27 = { 
    version = "2.7.0", 
    features = [
        "mouse-humanization",    # Mouse movement humanization
        "typing-humanization",   # Typing pattern humanization  
        "audio-humanization",    # Audio spectral humanization
        "visual-humanization",   # Visual authenticity enhancement
        "ai-detection",          # AI detection validation
        "ml-models",            # Machine learning models
        "network-features",     # Network-based detection testing
    ]
}
```

## Your First aegnt-27 Program

Create a new Rust project and add this simple example:

```rust
// src/main.rs
use aegnt_27::prelude::*;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Initialize aegnt-27
    aegnt_27::init().await?;
    
    println!("🧠 aegnt-27 is ready!");
    
    // Create a simple mouse movement
    let result = humanize_simple_mouse_movement().await?;
    println!("✅ Mouse movement humanized with {:.1}% authenticity", 
        result.authenticity_scores.overall_authenticity * 100.0);
    
    // Create a simple typing sequence
    let result = humanize_simple_typing().await?;
    println!("✅ Typing humanized with {:.1}% authenticity", 
        result.authenticity_scores.overall_authenticity * 100.0);
    
    Ok(())
}

async fn humanize_simple_mouse_movement() -> Result<MouseHumanizationResult, Box<dyn Error>> {
    let humanizer = MouseHumanizer::new().await?;
    
    // Create a mouse path from point A to point B
    let mouse_path = MousePath {
        path_id: Uuid::new_v4(),
        movement_points: vec![
            MousePoint {
                timestamp: 0.0,
                coordinates: Coordinates { x: 100.0, y: 100.0, screen_relative: true },
                velocity: Velocity::default(),
                acceleration: Acceleration::default(),
                pressure: None,
                movement_type: MovementType::InitialMovement,
            },
            MousePoint {
                timestamp: 0.5,
                coordinates: Coordinates { x: 400.0, y: 250.0, screen_relative: true },
                velocity: Velocity::default(),
                acceleration: Acceleration::default(),
                pressure: None,
                movement_type: MovementType::ContinuousMovement,
            },
        ],
        total_duration: 0.5,
        path_type: MousePathType::DirectMovement { efficiency: 0.8 },
        target_coordinates: Coordinates { x: 400.0, y: 250.0, screen_relative: true },
        source_coordinates: Coordinates { x: 100.0, y: 100.0, screen_relative: true },
        movement_intent: MovementIntent::CasualBrowsing,
    };
    
    let input = MouseHumanizationInput {
        user_id: Uuid::new_v4(),
        original_mouse_path: mouse_path,
        context_information: MouseContextInformation::default(),
        humanization_preferences: MouseHumanizationPreferences::default(),
        target_authenticity: 0.95,
        environmental_conditions: EnvironmentalConditions::default(),
    };
    
    Ok(humanizer.humanize_mouse_movement(input).await?)
}

async fn humanize_simple_typing() -> Result<TypingHumanizationResult, Box<dyn Error>> {
    let humanizer = TypingHumanizer::new().await?;
    
    let input = TypingHumanizationInput {
        user_id: Uuid::new_v4(),
        text_content: "Hello, world! This is my first HUMaiN2.7 program.".to_string(),
        typing_context: TypingContext::default(),
        humanization_preferences: TypingHumanizationPreferences::default(),
        target_authenticity: 0.94,
        environmental_conditions: TypingEnvironmentalConditions::default(),
    };
    
    Ok(humanizer.humanize_typing_sequence(input).await?)
}
```

Run your program:

```bash
cargo run
```

You should see output like:
```
🧠 HUMaiN2.7 is ready!
✅ Mouse movement humanized with 96.2% authenticity
✅ Typing humanized with 94.8% authenticity
```

## Basic Configuration

### Step 1: Create a Custom Configuration

```rust
use humain27::config::*;

let config = HumainConfig {
    mouse: MouseConfig {
        authenticity_target: 0.98,  // Ultra-high authenticity
        micro_movements_enabled: true,
        drift_patterns_enabled: true,
        ..Default::default()
    },
    typing: TypingConfig {
        base_typing_speed: 75.0,    // 75 WPM
        typo_injection_rate: 0.02,  // 2% typo rate
        ..Default::default()
    },
    performance: PerformanceConfig {
        max_memory_mb: 1024,        // 1GB memory limit
        parallel_processing_enabled: true,
        ..Default::default()
    },
    privacy: PrivacyConfig {
        local_only: true,           // No cloud features
        encryption_enabled: true,
        ..Default::default()
    },
    ..Default::default()
};

// Validate and apply configuration
config.validate()?;
humain27::init_with_config(config).await?;
```

### Step 2: Save and Load Configuration

```rust
use humain27::config::ConfigManager;
use std::path::Path;

// Save configuration to file
let config_path = Path::new("humain27_config.toml");
ConfigManager::save_to_file(&config, config_path)?;

// Load configuration from file
let loaded_config = ConfigManager::load_from_file(config_path)?;
```

## Common Use Cases

### 1. Mouse Movement Humanization

```rust
// Create more complex mouse movements
let waypoints = vec![
    Coordinates { x: 100.0, y: 100.0, screen_relative: true },
    Coordinates { x: 300.0, y: 150.0, screen_relative: true },
    Coordinates { x: 500.0, y: 200.0, screen_relative: true },
];

let complex_path = MousePath {
    path_id: Uuid::new_v4(),
    movement_points: create_points_from_waypoints(&waypoints),
    total_duration: 1.2,
    path_type: MousePathType::MultistepMovement { waypoints },
    // ... other fields
};
```

### 2. Typing with Custom Patterns

```rust
// Long-form typing with natural patterns
let long_text = "This is a longer piece of text that will demonstrate \
                 natural typing patterns including pauses, corrections, \
                 and variable speed based on word complexity.";

let typing_input = TypingHumanizationInput {
    user_id: Uuid::new_v4(),
    text_content: long_text.to_string(),
    humanization_preferences: TypingHumanizationPreferences {
        thinking_pause_frequency: 0.2,     // More frequent pauses
        typo_correction_enabled: true,
        burst_typing_enabled: true,
        ..Default::default()
    },
    target_authenticity: 0.96,
    // ... other fields
};
```

### 3. AI Detection Validation

```rust
// Test content against AI detectors
let validator = AIDetectionValidator::new().await?;

let validation_input = ValidationInput {
    content_id: Uuid::new_v4(),
    content_type: ContentType::TextContent {
        text_data: "Your content to validate".to_string(),
        // ... other fields
    },
    validation_scope: ValidationScope {
        detectors_to_test: vec![
            DetectorType::GPTZero { version: "latest".to_string(), sensitivity: 0.8 },
            DetectorType::OriginalityAI { detection_model: "v3".to_string(), threshold: 0.7 },
        ],
        testing_depth: TestingDepth::Comprehensive,
        // ... other fields
    },
    // ... other fields
};

let validation_result = validator.validate_against_detectors(validation_input).await?;

println!("Detection resistance: {:.1}%", validation_result.overall_resistance_score * 100.0);
for detector_result in &validation_result.detector_test_results {
    println!("  {:?}: {}", detector_result.detector_type, 
        if detector_result.evasion_success { "✅ PASSED" } else { "❌ FAILED" });
}
```

## Performance Optimization

### Memory Management

```rust
// Configure for low-memory environments
let low_memory_config = HumainConfig {
    performance: PerformanceConfig {
        max_memory_mb: 256,               // Limit to 256MB
        cache_size_mb: 32,                // Small cache
        gpu_acceleration_enabled: false,  // Disable GPU
        ..Default::default()
    },
    mouse: MouseConfig {
        fatigue_simulation_enabled: false, // Disable heavy features
        environmental_modeling_enabled: false,
        ..Default::default()
    },
    ..Default::default()
};
```

### High-Performance Setup

```rust
// Configure for maximum performance
let high_perf_config = HumainConfig {
    performance: PerformanceConfig {
        max_memory_mb: 2048,              // 2GB memory
        worker_threads: Some(8),          // 8 worker threads
        gpu_acceleration_enabled: true,   // Enable GPU
        parallel_processing_enabled: true,
        ..Default::default()
    },
    mouse: MouseConfig {
        authenticity_target: 0.98,        // Maximum authenticity
        ..Default::default()
    },
    detection: DetectionConfig {
        resistance_target: 0.99,          // Maximum resistance
        comprehensive_testing_enabled: true,
        ..Default::default()
    },
    ..Default::default()
};
```

## Error Handling

### Basic Error Handling

```rust
use humain27::utils::{HumainError, Result};

async fn safe_humanization() -> Result<()> {
    let humanizer = MouseHumanizer::new().await?;
    
    match humanizer.humanize_mouse_movement(input).await {
        Ok(result) => {
            println!("Success: {:.1}% authenticity", 
                result.authenticity_scores.overall_authenticity * 100.0);
        },
        Err(HumainError::MouseHumanization { message }) => {
            eprintln!("Mouse humanization failed: {}", message);
            // Implement fallback or retry logic
        },
        Err(HumainError::Platform { message }) => {
            eprintln!("Platform error: {}", message);
            // Check system requirements
        },
        Err(e) => {
            eprintln!("Unexpected error: {}", e);
            return Err(e);
        }
    }
    
    Ok(())
}
```

### Retry Logic

```rust
async fn humanize_with_retry(input: MouseHumanizationInput, max_retries: usize) 
    -> Result<MouseHumanizationResult> {
    let humanizer = MouseHumanizer::new().await?;
    
    for attempt in 0..max_retries {
        match humanizer.humanize_mouse_movement(input.clone()).await {
            Ok(result) => return Ok(result),
            Err(e) if e.is_recoverable() && attempt < max_retries - 1 => {
                eprintln!("Attempt {} failed, retrying: {}", attempt + 1, e);
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                continue;
            },
            Err(e) => return Err(e),
        }
    }
    
    unreachable!()
}
```

## Next Steps

Now that you have HUMaiN2.7 running, explore these advanced topics:

### 📚 **Advanced Guides**
- **[Configuration Guide](configuration.md)** - Master all configuration options
- **[Performance Tuning](performance-tuning.md)** - Optimize for your use case  
- **[Integration Patterns](integration-patterns.md)** - Best practices for integration
- **[Security Guide](security.md)** - Privacy and security considerations

### 🔧 **API References**
- **[Mouse API](../api/mouse.md)** - Complete mouse humanization API
- **[Typing API](../api/typing.md)** - Typing humanization reference
- **[Detection API](../api/detection.md)** - AI detection validation API

### 💡 **Examples**
- **[Basic Integration](../../examples/basic_integration.rs)** - Simple integration example
- **[Advanced Customization](../../examples/advanced_customization.rs)** - Advanced features
- **[Performance Optimization](../../examples/performance_optimization.rs)** - Performance tuning

### 🌍 **Platform-Specific Guides**
- **[Windows Integration](platform-windows.md)** - Windows-specific features
- **[Linux Deployment](platform-linux.md)** - Linux optimization tips
- **[macOS Setup](platform-macos.md)** - macOS best practices

### 🤝 **Community**
- **[GitHub Repository](https://github.com/aegntic/humain27)** - Source code and issues
- **[Discord Community](https://discord.gg/humain27)** - Real-time help and discussion
- **[Documentation Site](https://docs.rs/humain27)** - Online API documentation

## Troubleshooting

### Common Issues

**Q: "Failed to initialize mouse humanizer"**
```
A: Check that your platform is supported and you have sufficient permissions.
   Try running with elevated privileges or check the system requirements.
```

**Q: "High memory usage"**
```
A: Reduce the cache size in your configuration:
   config.performance.cache_size_mb = 32;
   config.performance.max_memory_mb = 512;
```

**Q: "Slow performance"**
```
A: Enable parallel processing and increase worker threads:
   config.performance.parallel_processing_enabled = true;
   config.performance.worker_threads = Some(4);
```

**Q: "Detection validation failing"**
```
A: Check your network connection and consider adjusting timeout:
   config.detection.testing_timeout_seconds = 60;
```

### Getting Help

If you encounter issues not covered here:

1. **Check the logs** - Enable debug logging: `RUST_LOG=humain27=debug`
2. **Review system requirements** - Ensure your platform meets minimum requirements
3. **Search existing issues** - Check GitHub Issues for similar problems
4. **Ask the community** - Join our Discord for real-time help
5. **Report bugs** - Create a new GitHub Issue with reproduction steps

Happy humanizing! 🧠✨