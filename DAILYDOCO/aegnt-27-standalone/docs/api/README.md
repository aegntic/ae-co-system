# aegnt-27 API Reference

> **Human-like Ultra-Modern AI Neutralization 2.7**  
> Advanced AI detection evasion and content humanization library

## Overview

aegnt-27 provides a comprehensive API for creating human-like patterns in digital interactions, making AI-generated content and automated behaviors indistinguishable from authentic human activity.

## Quick Navigation

- [Core Engine](#core-engine) - Main Aegnt27 engine and configuration
- [Mouse Humanization](#mouse-humanization) - Natural mouse movement patterns
- [Typing Humanization](#typing-humanization) - Realistic keystroke simulation
- [Audio Enhancement](#audio-enhancement) - Natural speech characteristics
- [Visual Authenticity](#visual-authenticity) - Gaze patterns and visual behavior
- [AI Detection Resistance](#ai-detection-resistance) - Content validation and evasion
- [Configuration](#configuration) - Advanced configuration options
- [Error Handling](#error-handling) - Error types and handling strategies

---

## Core Engine

### `Aegnt27Engine`

The main engine that orchestrates all humanization modules.

```rust
use aegnt27::prelude::*;

// Create with builder pattern
let aegnt = Aegnt27Engine::builder()
    .enable_mouse_humanization()
    .enable_typing_humanization()
    .enable_ai_detection_resistance()
    .build()
    .await?;

// Create with custom configuration
let config = Aegnt27Config::builder()
    .mouse(MouseConfig::default())
    .typing(TypingConfig::default())
    .build()?;

let aegnt = Aegnt27Engine::with_config(config).await?;
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `builder()` | Creates a new engine builder | `Aegnt27EngineBuilder` |
| `with_config(config)` | Creates engine with custom config | `Result<Aegnt27Engine>` |
| `quick_validate(content, target)` | Quick content validation | `Result<ValidationResult>` |

### `Aegnt27EngineBuilder`

Fluent builder for configuring the Aegnt27 engine.

```rust
let engine = Aegnt27Engine::builder()
    .enable_mouse_humanization()
    .enable_typing_humanization()
    .enable_audio_enhancement()
    .enable_visual_enhancement()
    .enable_ai_detection_resistance()
    .with_config_file("config.toml")?
    .build()
    .await?;
```

#### Configuration Methods

| Method | Description | Feature Required |
|--------|-------------|------------------|
| `enable_mouse_humanization()` | Enables mouse movement humanization | `mouse` |
| `enable_typing_humanization()` | Enables typing pattern humanization | `typing` |
| `enable_audio_enhancement()` | Enables audio processing | `audio` |
| `enable_visual_enhancement()` | Enables visual authenticity | `visual` |
| `enable_ai_detection_resistance()` | Enables content validation | `detection` |
| `enable_all_features()` | Enables all available features | All |
| `with_config(config)` | Sets custom configuration | - |
| `with_config_file(path)` | Loads config from file | - |

---

## Mouse Humanization

### `MousePath`

Represents a path for mouse movement.

```rust
use aegnt27::mouse::{MousePath, Point};

// Linear path
let path = MousePath::linear(
    Point::new(0, 0),
    Point::new(500, 300)
);

// Bezier curve path
let path = MousePath::bezier(
    Point::new(0, 0),      // Start
    Point::new(100, 50),   // Control point 1
    Point::new(400, 250),  // Control point 2
    Point::new(500, 300)   // End
);

// Spline path through multiple points
let path = MousePath::spline(vec![
    Point::new(0, 0),
    Point::new(150, 100),
    Point::new(350, 200),
    Point::new(500, 300),
]);
```

#### Static Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `linear(start, end)` | Creates linear path | `Point`, `Point` |
| `bezier(start, cp1, cp2, end)` | Creates Bezier curve | `Point`, `Point`, `Point`, `Point` |
| `spline(points)` | Creates spline through points | `Vec<Point>` |

### `HumanizedMousePath`

Result of mouse path humanization with natural characteristics.

```rust
let humanized = aegnt.humanize_mouse_movement(path).await?;

println!("Points: {}", humanized.points().len());
println!("Duration: {}ms", humanized.total_duration().as_millis());
println!("Max velocity: {:.2}px/ms", humanized.max_velocity());
println!("Has micro-movements: {}", humanized.has_micro_movements());
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `points()` | Gets all path points | `&[Point]` |
| `total_duration()` | Gets total movement duration | `Duration` |
| `max_velocity()` | Gets maximum velocity | `f64` |
| `average_velocity()` | Gets average velocity | `f64` |
| `has_micro_movements()` | Checks for micro-movements | `bool` |
| `smoothness_factor()` | Gets path smoothness | `f64` |

### Engine Methods

```rust
// Humanize existing path
let humanized_path = aegnt.humanize_mouse_movement(path).await?;

// Generate natural path between points
let natural_path = aegnt.generate_natural_mouse_path(start, end).await?;
```

---

## Typing Humanization

### `TypingSequence`

Result of text humanization with realistic keystroke patterns.

```rust
let sequence = aegnt.humanize_typing("Hello, world!").await?;

println!("Keystrokes: {}", sequence.keystrokes().len());
println!("Duration: {}ms", sequence.total_duration().as_millis());
println!("Average WPM: {:.1}", sequence.average_wpm());
println!("Error corrections: {}", sequence.error_corrections());
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `keystrokes()` | Gets all keystrokes | `&[HumanizedKeystroke]` |
| `total_duration()` | Gets total typing duration | `Duration` |
| `average_wpm()` | Gets average words per minute | `f64` |
| `peak_wpm()` | Gets peak typing speed | `f64` |
| `error_corrections()` | Gets number of corrections | `usize` |
| `typing_rhythm()` | Gets rhythm pattern | `TypingRhythm` |

### `HumanizedKeystroke`

Individual keystroke with timing and characteristics.

```rust
for keystroke in sequence.keystrokes() {
    println!("'{}': {}ms delay, {}ms hold", 
             keystroke.character(),
             keystroke.delay().as_millis(),
             keystroke.hold_duration().as_millis());
}
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `character()` | Gets the character | `char` |
| `delay()` | Gets delay before keystroke | `Duration` |
| `hold_duration()` | Gets key hold duration | `Duration` |
| `is_correction()` | Checks if this is an error correction | `bool` |
| `velocity()` | Gets keystroke velocity | `f64` |

### Engine Methods

```rust
// Humanize text
let sequence = aegnt.humanize_typing("Your text here").await?;

// Simulate typing errors
let text_with_errors = aegnt.simulate_typing_errors("Perfect text", 0.02).await?;
```

---

## Audio Enhancement

### `AudioData`

Input audio data for humanization.

```rust
use aegnt27::audio::AudioData;

let audio = AudioData::from_file("speech.wav").await?;
let audio = AudioData::from_bytes(&audio_bytes, sample_rate)?;
```

### `HumanizedAudio`

Result of audio humanization with natural characteristics.

```rust
let humanized = aegnt.humanize_audio(audio).await?;

println!("Duration: {}ms", humanized.duration().as_millis());
println!("Sample rate: {}", humanized.sample_rate());
println!("Has breathing: {}", humanized.has_breathing_patterns());
println!("Vocal fry intensity: {:.2}", humanized.vocal_fry_intensity());
```

### Engine Methods

```rust
// Humanize audio
let humanized_audio = aegnt.humanize_audio(audio_data).await?;

// Add breathing patterns
let audio_with_breathing = aegnt.inject_breathing_patterns(audio_data).await?;
```

---

## Visual Authenticity

### `VideoFrame`

Individual video frame for processing.

```rust
use aegnt27::visual::VideoFrame;

let frame = VideoFrame::from_rgba(width, height, &pixel_data)?;
```

### `GazePattern`

Natural gaze movement pattern.

```rust
let gaze = aegnt.simulate_natural_gaze(Duration::from_secs(30)).await?;

println!("Fixation points: {}", gaze.fixation_points().len());
println!("Saccade count: {}", gaze.saccade_count());
println!("Attention shifts: {}", gaze.attention_shifts());
```

### Engine Methods

```rust
// Enhance video frames
let enhanced_frames = aegnt.enhance_visual_authenticity(&frames).await?;

// Generate gaze pattern
let gaze = aegnt.simulate_natural_gaze(Duration::from_secs(10)).await?;
```

---

## AI Detection Resistance

### `ValidationResult`

Result of content validation against AI detectors.

```rust
let result = aegnt.validate_content("Your content here").await?;

println!("Resistance score: {:.1}%", result.resistance_score() * 100.0);
println!("Confidence: {:.1}%", result.confidence() * 100.0);
println!("Detected patterns: {:?}", result.detected_patterns());

if result.passes_threshold(0.9) {
    println!("Content appears human-like");
}
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `resistance_score()` | Gets resistance score (0.0-1.0) | `f64` |
| `confidence()` | Gets confidence level | `f64` |
| `detected_patterns()` | Gets detected AI patterns | `&[DetectedPattern]` |
| `suggested_improvements()` | Gets improvement suggestions | `&[Suggestion]` |
| `passes_threshold(threshold)` | Checks if score meets threshold | `bool` |
| `detection_model_results()` | Gets per-model results | `&HashMap<DetectionModel, f64>` |

### `DetectedPattern`

Specific AI pattern detected in content.

```rust
for pattern in result.detected_patterns() {
    println!("Pattern: {:?}", pattern.pattern_type());
    println!("Confidence: {:.2}", pattern.confidence());
    println!("Location: {:?}", pattern.location());
    println!("Suggestion: {}", pattern.suggestion());
}
```

### Engine Methods

```rust
// Validate content
let result = aegnt.validate_content("Content to validate").await?;

// Generate evasion strategies
let strategies = aegnt.generate_evasion_strategies(&vulnerabilities).await?;

// Quick validation
let result = Aegnt27Engine::quick_validate("Content", 0.95).await?;
```

---

## Configuration

### `Aegnt27Config`

Main configuration structure.

```rust
let config = Aegnt27Config::builder()
    .mouse(MouseConfig {
        movement_speed: 1.2,
        drift_factor: 0.15,
        micro_movement_intensity: 0.8,
        ..Default::default()
    })
    .typing(TypingConfig {
        base_wpm: 75.0,
        wpm_variation: 15.0,
        error_rate: 0.02,
        ..Default::default()
    })
    .detection(DetectionConfig {
        authenticity_target: 0.95,
        validation_strictness: ValidationStrictness::High,
        ..Default::default()
    })
    .build()?;
```

### `MouseConfig`

Mouse humanization configuration.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `movement_speed` | `f64` | `1.0` | Movement speed multiplier |
| `drift_factor` | `f64` | `0.1` | Natural drift intensity |
| `micro_movement_intensity` | `f64` | `0.5` | Micro-movement strength |
| `bezier_curve_randomness` | `f64` | `0.2` | Path curve randomness |
| `pause_probability` | `f64` | `0.05` | Chance of movement pause |
| `overshoot_correction` | `bool` | `true` | Enable overshoot simulation |
| `acceleration_profile` | `AccelerationProfile` | `Natural` | Acceleration curve type |
| `coordinate_precision` | `CoordinatePrecision` | `SubPixel` | Coordinate precision |

### `TypingConfig`

Typing humanization configuration.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `base_wpm` | `f64` | `60.0` | Base typing speed |
| `wpm_variation` | `f64` | `20.0` | Speed variation range |
| `error_rate` | `f64` | `0.02` | Error probability (0.0-1.0) |
| `correction_delay` | `Duration` | `200ms` | Time to correct errors |
| `burst_typing_probability` | `f64` | `0.1` | Chance of burst typing |
| `fatigue_factor` | `f64` | `0.05` | Slowdown over time |
| `key_hold_variation` | `f64` | `0.2` | Key hold time variation |
| `rhythm_patterns` | `Vec<TypingRhythm>` | `[Steady]` | Available rhythm patterns |

### `DetectionConfig`

AI detection resistance configuration.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `authenticity_target` | `f64` | `0.9` | Target authenticity score |
| `detection_models` | `Vec<DetectionModel>` | `[GPTZero, ...]` | Models to test against |
| `resistance_strategies` | `Vec<ResistanceStrategy>` | `[...]` | Evasion strategies |
| `validation_strictness` | `ValidationStrictness` | `Medium` | Validation strictness |
| `cache_validation_results` | `bool` | `true` | Enable result caching |
| `max_cache_entries` | `usize` | `1000` | Maximum cache size |

---

## Error Handling

### `Aegnt27Error`

Main error type for the library.

```rust
use aegnt27::Aegnt27Error;

match aegnt.validate_content("").await {
    Ok(result) => println!("Success: {:.1}%", result.resistance_score() * 100.0),
    Err(Aegnt27Error::ValidationError(msg)) => eprintln!("Validation failed: {}", msg),
    Err(Aegnt27Error::ConfigurationError(msg)) => eprintln!("Config error: {}", msg),
    Err(Aegnt27Error::InternalError(msg)) => eprintln!("Internal error: {}", msg),
    Err(e) => eprintln!("Other error: {}", e),
}
```

#### Error Variants

| Variant | Description | Common Causes |
|---------|-------------|---------------|
| `ValidationError(String)` | Content validation failed | Empty content, invalid format |
| `ConfigurationError(String)` | Configuration is invalid | Invalid parameters, missing features |
| `InternalError(String)` | Internal processing error | System resources, algorithm failure |
| `IoError(std::io::Error)` | File or network I/O failed | Missing files, network issues |
| `SerializationError(String)` | Data serialization failed | Corrupt data, version mismatch |
| `ResourceUnavailable(String)` | Required resource unavailable | Memory, CPU, hardware |

#### Error Handling Patterns

```rust
// Basic error handling
async fn example() -> Result<(), Aegnt27Error> {
    let result = aegnt.validate_content("content").await?;
    Ok(())
}

// Detailed error handling
async fn detailed_example() -> Result<(), Box<dyn std::error::Error>> {
    match aegnt.validate_content("content").await {
        Ok(result) => {
            if result.resistance_score() < 0.8 {
                eprintln!("Warning: Low resistance score");
            }
        },
        Err(Aegnt27Error::ValidationError(msg)) => {
            eprintln!("Validation failed: {}", msg);
            // Try fallback strategy
            let fallback_result = aegnt.validate_content("fallback content").await?;
            println!("Fallback result: {:.1}%", fallback_result.resistance_score() * 100.0);
        },
        Err(e) => return Err(e.into()),
    }
    Ok(())
}

// Retry with exponential backoff
async fn retry_example() -> Result<ValidationResult, Aegnt27Error> {
    let mut attempts = 0;
    let max_attempts = 3;
    
    loop {
        match aegnt.validate_content("content").await {
            Ok(result) => return Ok(result),
            Err(Aegnt27Error::ResourceUnavailable(_)) if attempts < max_attempts => {
                attempts += 1;
                let delay = Duration::from_millis(100 * 2_u64.pow(attempts));
                tokio::time::sleep(delay).await;
            },
            Err(e) => return Err(e),
        }
    }
}
```

---

## Type Aliases and Utility Types

### Common Type Aliases

```rust
pub type Result<T> = std::result::Result<T, Aegnt27Error>;
```

### Enums

#### `AccelerationProfile`
- `Linear` - Constant acceleration
- `Natural` - Human-like acceleration curve
- `Sharp` - Quick acceleration/deceleration
- `Gradual` - Smooth acceleration changes

#### `CoordinatePrecision`
- `Pixel` - Integer pixel coordinates
- `SubPixel` - Sub-pixel precision

#### `TypingRhythm`
- `Steady` - Consistent typing speed
- `Burst` - Alternating fast/slow periods
- `Hesitant` - Frequent pauses and corrections

#### `ValidationStrictness`
- `Low` - Permissive validation
- `Medium` - Standard validation
- `High` - Strict validation

#### `DetectionModel`
- `GPTZero` - GPTZero detection
- `OriginalityAI` - Originality.ai detection
- `Turnitin` - Turnitin detection
- `YouTube` - YouTube detection
- `Custom(String)` - Custom detection model

---

## Feature Flags

Control which modules are compiled and available:

```toml
[features]
default = ["mouse", "typing", "detection"]

# Core humanization modules
mouse = []
typing = []
audio = []
visual = []
detection = []

# Advanced features
persistence = ["dep:sqlx"]
encryption = ["dep:aes-gcm"]
benchmarks = ["dep:criterion"]
compression = ["dep:flate2"]

# Development features
dev = ["benchmarks"]
integration-tests = ["dep:mockall"]
```

---

## Version Compatibility

### Minimum Supported Rust Version (MSRV)
- **Rust 1.70+** required

### Version Policy
- **Major versions** (2.x → 3.x): Breaking API changes
- **Minor versions** (2.7 → 2.8): New features, backward compatible
- **Patch versions** (2.7.0 → 2.7.1): Bug fixes, performance improvements

### Migration Guide
See [CHANGELOG.md](../../CHANGELOG.md) for detailed migration instructions between versions.

---

## Performance Considerations

### Memory Usage
- Base engine: ~100-200MB RAM
- Mouse humanization: +20-50MB
- Typing humanization: +30-60MB  
- Audio processing: +50-100MB
- Visual enhancement: +100-200MB
- Detection validation: +40-80MB

### CPU Usage
- Idle monitoring: <5% CPU
- Active humanization: 10-30% CPU
- Batch processing: 20-50% CPU

### Optimization Tips
1. Use appropriate cache sizes for your use case
2. Enable only required features
3. Consider batch processing for multiple operations
4. Use connection pooling for concurrent operations
5. Monitor memory usage in long-running applications

---

## Examples and Tutorials

- [Basic Integration](../guides/quick_start.md) - Getting started guide
- [Advanced Configuration](../guides/configuration.md) - Detailed configuration
- [Best Practices](../guides/best_practices.md) - Optimization and patterns
- [Web Automation Tutorial](../tutorials/web_automation.md) - Browser automation
- [Content Generation Tutorial](../tutorials/content_generation.md) - AI content humanization

---

## Support and Resources

- **Documentation**: [docs.rs/aegnt27](https://docs.rs/aegnt27)
- **Repository**: [github.com/anthropic/aegnt27](https://github.com/anthropic/aegnt27)
- **Issues**: [GitHub Issues](https://github.com/anthropic/aegnt27/issues)
- **Discussions**: [GitHub Discussions](https://github.com/anthropic/aegnt27/discussions)

---

*This API reference is for aegnt-27 version 2.7.0. For the latest documentation, visit [docs.rs/aegnt27](https://docs.rs/aegnt27).*