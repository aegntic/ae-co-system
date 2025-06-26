# Quick Start Guide

> Get up and running with aegnt-27 in minutes

## Installation

Add aegnt-27 to your `Cargo.toml`:

```toml
[dependencies]
aegnt27 = "2.7.0"
tokio = { version = "1.0", features = ["full"] }
```

For specific features only:

```toml
[dependencies]
aegnt27 = { version = "2.7.0", features = ["mouse", "typing", "detection"] }
```

## Your First Aegnt27 Application

Create a new Rust project and add this basic example:

```rust
use aegnt27::prelude::*;

#[tokio::main]
async fn main() -> Result<(), Aegnt27Error> {
    // Create a Aegnt27 engine
    let aegnt = Aegnt27Engine::builder()
        .enable_all_features()
        .build()
        .await?;
    
    // Humanize some text
    let text = "Hello, this is my first Aegnt27 application!";
    let typing_sequence = aegnt.humanize_typing(text).await?;
    
    println!("Original: {}", text);
    println!("Humanized typing takes: {:.1}ms", 
             typing_sequence.total_duration().as_millis());
    println!("Average WPM: {:.1}", typing_sequence.average_wpm());
    
    // Validate content against AI detection
    let validation = aegnt.validate_content(text).await?;
    println!("AI resistance score: {:.1}%", 
             validation.resistance_score() * 100.0);
    
    Ok(())
}
```

Run with:
```bash
cargo run
```

## Core Concepts

### 1. The Aegnt27 Engine

The `Aegnt27Engine` is your main interface. It coordinates all humanization modules:

```rust
// Minimal engine - just typing
let aegnt = Aegnt27Engine::builder()
    .enable_typing_humanization()
    .build()
    .await?;

// Full-featured engine
let aegnt = Aegnt27Engine::builder()
    .enable_mouse_humanization()
    .enable_typing_humanization() 
    .enable_audio_enhancement()
    .enable_visual_enhancement()
    .enable_ai_detection_resistance()
    .build()
    .await?;
```

### 2. Feature Modules

aegnt-27 is modular. Enable only what you need:

| Module | Purpose | Feature Flag |
|--------|---------|--------------|
| Mouse | Natural mouse movements | `mouse` |
| Typing | Realistic keystroke patterns | `typing` |
| Audio | Human speech characteristics | `audio` |
| Visual | Gaze patterns, attention modeling | `visual` |
| Detection | AI content validation | `detection` |

### 3. Configuration

Customize behavior through configuration:

```rust
let config = Aegnt27Config::builder()
    .typing(TypingConfig {
        base_wpm: 75.0,           // Base typing speed
        wpm_variation: 15.0,      // Speed variation
        error_rate: 0.02,         // 2% error rate
        ..Default::default()
    })
    .build()?;

let aegnt = Aegnt27Engine::with_config(config).await?;
```

## Common Usage Patterns

### Mouse Movement Humanization

```rust
use aegnt27::mouse::{MousePath, Point};

// Create a path from point A to B
let path = MousePath::linear(
    Point::new(100, 100),  // Start position
    Point::new(500, 300)   // End position
);

// Humanize the movement
let humanized = aegnt.humanize_mouse_movement(path).await?;

// Execute the movement (pseudocode)
for point in humanized.points() {
    move_mouse_to(point.x(), point.y());
    tokio::time::sleep(point.delay()).await;
}
```

### Typing Simulation

```rust
let text = "This text will be typed with human-like patterns";
let sequence = aegnt.humanize_typing(text).await?;

// Execute typing (pseudocode)
for keystroke in sequence.keystrokes() {
    tokio::time::sleep(keystroke.delay()).await;
    press_key(keystroke.character());
    tokio::time::sleep(keystroke.hold_duration()).await;
    release_key(keystroke.character());
}

println!("Typed at {:.1} WPM", sequence.average_wpm());
```

### Content Validation

```rust
let content = "Your AI-generated content here";
let result = aegnt.validate_content(content).await?;

if result.resistance_score() > 0.9 {
    println!("✅ Content appears human-written");
} else {
    println!("⚠️  Content may be detected as AI-generated");
    
    // Get suggestions for improvement
    for suggestion in result.suggested_improvements() {
        println!("💡 {}", suggestion);
    }
}
```

## Error Handling

Aegnt27 uses a custom error type for comprehensive error handling:

```rust
use aegnt27::Aegnt27Error;

async fn safe_validation(content: &str) -> Result<f64, Box<dyn std::error::Error>> {
    match aegnt.validate_content(content).await {
        Ok(result) => Ok(result.resistance_score()),
        Err(Aegnt27Error::ValidationError(msg)) => {
            eprintln!("Validation failed: {}", msg);
            Ok(0.0) // Return safe default
        },
        Err(e) => Err(e.into()),
    }
}
```

## Configuration Files

Save configuration to a TOML file:

```toml
# aegnt_config.toml
[mouse]
movement_speed = 1.2
drift_factor = 0.15
micro_movement_intensity = 0.8

[typing]
base_wpm = 70.0
wpm_variation = 20.0
error_rate = 0.025

[detection]
authenticity_target = 0.95
validation_strictness = "High"
```

Load in your application:

```rust
let aegnt = Aegnt27Engine::builder()
    .with_config_file("aegnt_config.toml")?
    .build()
    .await?;
```

## Performance Tips

### 1. Choose Features Wisely
Only enable features you need:

```rust
// Lightweight for content validation only
let aegnt = Aegnt27Engine::builder()
    .enable_ai_detection_resistance()
    .build()
    .await?;
```

### 2. Reuse Engine Instances
Create once, use many times:

```rust
// ✅ Good - reuse engine
let aegnt = Aegnt27Engine::builder().enable_all_features().build().await?;

for text in texts {
    let result = aegnt.humanize_typing(text).await?;
    // Process result...
}

// ❌ Bad - recreate engine each time
for text in texts {
    let aegnt = Aegnt27Engine::builder().build().await?; // Expensive!
    let result = aegnt.humanize_typing(text).await?;
}
```

### 3. Batch Operations
Process multiple items together when possible:

```rust
// Process multiple texts efficiently
let combined_text = texts.join(" ");
let result = aegnt.humanize_typing(&combined_text).await?;
```

### 4. Configure Cache Sizes
Adjust cache sizes based on your usage:

```rust
let config = Aegnt27Config::builder()
    .typing(TypingConfig {
        cache_size: 500,  // Smaller cache for memory-constrained environments
        ..Default::default()
    })
    .build()?;
```

## Platform Considerations

### Windows
```rust
// Windows-specific optimizations are automatically applied
let aegnt = Aegnt27Engine::builder()
    .enable_mouse_humanization() // Uses Windows mouse acceleration curves
    .build()
    .await?;
```

### macOS
```rust
// macOS Retina display support
let config = Aegnt27Config::builder()
    .mouse(MouseConfig {
        coordinate_precision: CoordinatePrecision::SubPixel,
        ..Default::default()
    })
    .build()?;
```

### Linux
```rust
// X11/Wayland compatibility
let aegnt = Aegnt27Engine::builder()
    .enable_all_features() // Automatically detects display server
    .build()
    .await?;
```

## Testing Your Integration

Create a simple test to verify everything works:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_basic_functionality() {
        let aegnt = Aegnt27Engine::builder()
            .enable_typing_humanization()
            .enable_ai_detection_resistance()
            .build()
            .await
            .expect("Failed to create engine");

        // Test typing humanization
        let typing_result = aegnt.humanize_typing("test message").await;
        assert!(typing_result.is_ok());

        // Test content validation
        let validation_result = aegnt.validate_content("test content").await;
        assert!(validation_result.is_ok());
        
        let score = validation_result.unwrap().resistance_score();
        assert!(score >= 0.0 && score <= 1.0);
    }
}
```

Run tests:
```bash
cargo test
```

## Common Patterns

### 1. Web Automation
```rust
// Simulate human-like web interaction
async fn human_web_interaction(aegnt: &Aegnt27Engine) -> Result<(), Aegnt27Error> {
    // Move to search box
    let search_box = Point::new(400, 200);
    let path = aegnt.generate_natural_mouse_path(Point::new(0, 0), search_box).await?;
    let movement = aegnt.humanize_mouse_movement(path).await?;
    
    // Type search query
    let query = "human-like search query";
    let typing = aegnt.humanize_typing(query).await?;
    
    // Validate query appears human-written
    let validation = aegnt.validate_content(query).await?;
    
    println!("Query resistance: {:.1}%", validation.resistance_score() * 100.0);
    
    Ok(())
}
```

### 2. Content Generation
```rust
// Generate and validate human-like content
async fn generate_human_content(aegnt: &Aegnt27Engine, topic: &str) -> Result<String, Aegnt27Error> {
    let content = format!("My thoughts on {}: This is a natural perspective...", topic);
    
    let validation = aegnt.validate_content(&content).await?;
    
    if validation.resistance_score() > 0.85 {
        Ok(content)
    } else {
        // Apply suggestions and retry
        let improved_content = apply_suggestions(&content, validation.suggested_improvements());
        Ok(improved_content)
    }
}

fn apply_suggestions(content: &str, suggestions: &[Suggestion]) -> String {
    // Implement suggestion application logic
    content.to_string()
}
```

### 3. Gaming Automation
```rust
// Human-like gaming actions
async fn gaming_actions(aegnt: &Aegnt27Engine) -> Result<(), Aegnt27Error> {
    // Aim with natural mouse movement
    let target = Point::new(800, 400);
    let aim_path = aegnt.generate_natural_mouse_path(Point::new(400, 300), target).await?;
    let humanized_aim = aegnt.humanize_mouse_movement(aim_path).await?;
    
    // Type chat message
    let message = "gg well played!";
    let chat_typing = aegnt.humanize_typing(message).await?;
    
    // Validate message appears human
    let validation = aegnt.validate_content(message).await?;
    
    println!("Chat message human-likeness: {:.1}%", validation.resistance_score() * 100.0);
    
    Ok(())
}
```

## Next Steps

Now that you have aegnt-27 working, explore these advanced topics:

1. **[Configuration Guide](configuration.md)** - Deep dive into all configuration options
2. **[Best Practices](best_practices.md)** - Optimization and production patterns  
3. **[Web Automation Tutorial](../tutorials/web_automation.md)** - Complete browser automation example
4. **[Content Generation Tutorial](../tutorials/content_generation.md)** - AI content humanization workflow

## Troubleshooting

### Common Issues

**Engine fails to build:**
```
Error: Feature 'mouse' not enabled
```
Solution: Enable the required feature in `Cargo.toml`:
```toml
aegnt27 = { version = "2.7.0", features = ["mouse"] }
```

**High memory usage:**
```rust
// Reduce cache sizes
let config = Aegnt27Config::builder()
    .typing(TypingConfig {
        cache_size: 100, // Reduced from default 1000
        ..Default::default()
    })
    .build()?;
```

**Slow performance:**
```rust
// Enable only required features
let aegnt = Aegnt27Engine::builder()
    .enable_typing_humanization() // Only what you need
    .build()
    .await?;
```

### Getting Help

- Check the [API Reference](../api/README.md) for detailed documentation
- Browse [examples](../../examples/) for complete working code
- Search [GitHub Issues](https://github.com/anthropic/aegnt27/issues) for similar problems
- Ask questions in [GitHub Discussions](https://github.com/anthropic/aegnt27/discussions)

---

**Congratulations!** You now have aegnt-27 running. The library will make your automated behaviors indistinguishable from human activity while protecting against AI detection systems.