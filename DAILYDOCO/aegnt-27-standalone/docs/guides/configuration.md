# Configuration Guide

> Complete guide to configuring aegnt-27 for your specific needs

## Overview

aegnt-27 provides extensive configuration options to fine-tune behavior for different use cases, platforms, and requirements. This guide covers all configuration parameters and best practices.

## Configuration Structure

The main configuration is built using `Aegnt27Config::builder()`:

```rust
use aegnt27::prelude::*;

let config = Aegnt27Config::builder()
    .mouse(MouseConfig { /* ... */ })
    .typing(TypingConfig { /* ... */ })
    .audio(AudioConfig { /* ... */ })
    .visual(VisualConfig { /* ... */ })
    .detection(DetectionConfig { /* ... */ })
    .build()?;

let aegnt = Aegnt27Engine::with_config(config).await?;
```

## Loading Configuration

### From File (TOML)

Create a configuration file:

```toml
# aegnt_config.toml
[mouse]
movement_speed = 1.2
drift_factor = 0.15
micro_movement_intensity = 0.8
bezier_curve_randomness = 0.25
pause_probability = 0.05
overshoot_correction = true
acceleration_profile = "Natural"
coordinate_precision = "SubPixel"

[typing]
base_wpm = 75.0
wpm_variation = 20.0
error_rate = 0.025
correction_delay = "300ms"
burst_typing_probability = 0.15
fatigue_factor = 0.05
key_hold_variation = 0.3
rhythm_patterns = ["Steady", "Burst"]

[audio]
breathing_frequency = 0.2
vocal_fry_intensity = 0.1
pitch_variation = 0.15
pace_variation = 0.2
silence_insertion = true
spectral_enhancement = true

[visual]
gaze_drift_factor = 0.2
blink_rate = 15.0
attention_span = "30s"
distraction_probability = 0.05
eye_movement_smoothness = 0.85

[detection]
authenticity_target = 0.95
validation_strictness = "High"
cache_validation_results = true
max_cache_entries = 1000

[[detection.detection_models]]
model = "GPTZero"
enabled = true

[[detection.detection_models]]
model = "OriginalityAI"
enabled = true

[[detection.resistance_strategies]]
strategy = "PerplexityVariation"
enabled = true

[[detection.resistance_strategies]]
strategy = "SyntaxDiversification"
enabled = true
```

Load in your application:

```rust
let aegnt = Aegnt27Engine::builder()
    .with_config_file("aegnt_config.toml")?
    .build()
    .await?;
```

### From Environment Variables

```rust
use std::env;

let config = Aegnt27Config::builder()
    .typing(TypingConfig {
        base_wpm: env::var("AEGNT_BASE_WPM")
            .unwrap_or("70.0".to_string())
            .parse()
            .unwrap_or(70.0),
        error_rate: env::var("AEGNT_ERROR_RATE")
            .unwrap_or("0.02".to_string())
            .parse()
            .unwrap_or(0.02),
        ..Default::default()
    })
    .build()?;
```

### Runtime Configuration Updates

```rust
// Create mutable configuration
let mut config = Aegnt27Config::default();

// Update specific settings
config.typing.base_wpm = 90.0;
config.mouse.movement_speed = 1.5;

// Recreate engine with updated config
let aegnt = Aegnt27Engine::with_config(config).await?;
```

---

## Mouse Configuration

### `MouseConfig` Structure

```rust
#[derive(Debug, Clone)]
pub struct MouseConfig {
    pub movement_speed: f64,
    pub drift_factor: f64,
    pub micro_movement_intensity: f64,
    pub bezier_curve_randomness: f64,
    pub pause_probability: f64,
    pub overshoot_correction: bool,
    pub acceleration_profile: AccelerationProfile,
    pub coordinate_precision: CoordinatePrecision,
    pub cache_size: usize,
    pub precompute_curves: bool,
}
```

### Parameters

#### `movement_speed: f64` (default: 1.0)
Controls overall mouse movement speed multiplier.

```rust
MouseConfig {
    movement_speed: 0.8,  // 20% slower
    // movement_speed: 1.5,  // 50% faster
    ..Default::default()
}
```

**Use cases:**
- `0.5-0.8`: Accessibility, elderly users, careful interactions
- `0.8-1.2`: Normal desktop usage
- `1.2-2.0`: Gaming, power users, fast interactions

#### `drift_factor: f64` (default: 0.1)
Natural drift and imprecision in mouse movements (0.0-1.0).

```rust
MouseConfig {
    drift_factor: 0.05,   // Very precise
    // drift_factor: 0.2,   // More natural variation
    ..Default::default()
}
```

**Guidelines:**
- `0.0-0.05`: Professional/precise usage
- `0.05-0.15`: Normal usage
- `0.15-0.3`: Casual/relaxed usage

#### `micro_movement_intensity: f64` (default: 0.5)
Intensity of small involuntary movements (0.0-1.0).

```rust
MouseConfig {
    micro_movement_intensity: 0.8,  // More micro-movements
    ..Default::default()
}
```

#### `bezier_curve_randomness: f64` (default: 0.2)
Randomness in Bezier curve generation (0.0-1.0).

```rust
MouseConfig {
    bezier_curve_randomness: 0.3,  // More curved paths
    ..Default::default()
}
```

#### `pause_probability: f64` (default: 0.05)
Probability of pausing during movement (0.0-1.0).

```rust
MouseConfig {
    pause_probability: 0.1,  // 10% chance of pause
    ..Default::default()
}
```

#### `overshoot_correction: bool` (default: true)
Enable overshoot and correction simulation.

```rust
MouseConfig {
    overshoot_correction: false,  // Disable for gaming
    ..Default::default()
}
```

#### `acceleration_profile: AccelerationProfile`
Mouse acceleration curve type.

```rust
pub enum AccelerationProfile {
    Linear,    // Constant acceleration
    Natural,   // Human-like acceleration (default)
    Sharp,     // Quick acceleration/deceleration
    Gradual,   // Smooth acceleration changes
}

MouseConfig {
    acceleration_profile: AccelerationProfile::Sharp, // For gaming
    ..Default::default()
}
```

#### `coordinate_precision: CoordinatePrecision`
Coordinate precision level.

```rust
pub enum CoordinatePrecision {
    Pixel,     // Integer pixel coordinates
    SubPixel,  // Sub-pixel precision (default)
}

MouseConfig {
    coordinate_precision: CoordinatePrecision::Pixel, // For older systems
    ..Default::default()
}
```

### Preset Configurations

```rust
// Gaming configuration
let gaming_mouse = MouseConfig {
    movement_speed: 2.0,
    drift_factor: 0.02,
    micro_movement_intensity: 0.1,
    acceleration_profile: AccelerationProfile::Sharp,
    overshoot_correction: false,
    pause_probability: 0.01,
    ..Default::default()
};

// Accessibility configuration
let accessibility_mouse = MouseConfig {
    movement_speed: 0.5,
    drift_factor: 0.05,
    pause_probability: 0.2,
    acceleration_profile: AccelerationProfile::Gradual,
    ..Default::default()
};

// Professional configuration
let professional_mouse = MouseConfig {
    movement_speed: 1.2,
    drift_factor: 0.08,
    micro_movement_intensity: 0.3,
    acceleration_profile: AccelerationProfile::Natural,
    coordinate_precision: CoordinatePrecision::SubPixel,
    ..Default::default()
};
```

---

## Typing Configuration

### `TypingConfig` Structure

```rust
#[derive(Debug, Clone)]
pub struct TypingConfig {
    pub base_wpm: f64,
    pub wpm_variation: f64,
    pub error_rate: f64,
    pub correction_delay: Duration,
    pub burst_typing_probability: f64,
    pub fatigue_factor: f64,
    pub key_hold_variation: f64,
    pub rhythm_patterns: Vec<TypingRhythm>,
    pub cache_size: usize,
    pub precompute_common_patterns: bool,
    pub cache_strategy: CacheStrategy,
    pub cache_ttl: Duration,
}
```

### Parameters

#### `base_wpm: f64` (default: 60.0)
Base typing speed in words per minute.

```rust
TypingConfig {
    base_wpm: 45.0,   // Slower typing
    // base_wpm: 90.0,   // Fast typing
    ..Default::default()
}
```

**Typical ranges:**
- `25-40 WPM`: Beginner typists, accessibility needs
- `40-60 WPM`: Average computer users
- `60-80 WPM`: Proficient typists
- `80-120 WPM`: Professional/power users
- `120+ WPM`: Expert typists, transcriptionists

#### `wpm_variation: f64` (default: 20.0)
Range of typing speed variation (±WPM).

```rust
TypingConfig {
    base_wpm: 70.0,
    wpm_variation: 15.0,  // Speed varies between 55-85 WPM
    ..Default::default()
}
```

#### `error_rate: f64` (default: 0.02)
Probability of typing errors (0.0-1.0).

```rust
TypingConfig {
    error_rate: 0.01,   // 1% error rate (very accurate)
    // error_rate: 0.05,   // 5% error rate (more human-like)
    ..Default::default()
}
```

#### `correction_delay: Duration` (default: 200ms)
Time delay before correcting errors.

```rust
use std::time::Duration;

TypingConfig {
    correction_delay: Duration::from_millis(150),  // Quick correction
    // correction_delay: Duration::from_millis(500),  // Thoughtful correction
    ..Default::default()
}
```

#### `burst_typing_probability: f64` (default: 0.1)
Probability of burst typing episodes (0.0-1.0).

```rust
TypingConfig {
    burst_typing_probability: 0.2,  // 20% chance of burst typing
    ..Default::default()
}
```

#### `fatigue_factor: f64` (default: 0.05)
Gradual slowdown over time (0.0-1.0).

```rust
TypingConfig {
    fatigue_factor: 0.1,   // More pronounced fatigue
    // fatigue_factor: 0.0,   // No fatigue (machine-like)
    ..Default::default()
}
```

#### `key_hold_variation: f64` (default: 0.2)
Variation in key hold duration (0.0-1.0).

```rust
TypingConfig {
    key_hold_variation: 0.4,  // More variation in key holds
    ..Default::default()
}
```

#### `rhythm_patterns: Vec<TypingRhythm>`
Available typing rhythm patterns.

```rust
pub enum TypingRhythm {
    Steady,    // Consistent typing speed
    Burst,     // Alternating fast/slow periods
    Hesitant,  // Frequent pauses and corrections
}

TypingConfig {
    rhythm_patterns: vec![
        TypingRhythm::Steady,
        TypingRhythm::Burst,
    ],
    ..Default::default()
}
```

### Preset Configurations

```rust
// Beginner typist
let beginner_typing = TypingConfig {
    base_wpm: 35.0,
    wpm_variation: 15.0,
    error_rate: 0.06,
    correction_delay: Duration::from_millis(800),
    fatigue_factor: 0.15,
    rhythm_patterns: vec![TypingRhythm::Hesitant],
    ..Default::default()
};

// Professional typist
let professional_typing = TypingConfig {
    base_wpm: 85.0,
    wpm_variation: 12.0,
    error_rate: 0.008,
    correction_delay: Duration::from_millis(120),
    burst_typing_probability: 0.25,
    fatigue_factor: 0.02,
    rhythm_patterns: vec![TypingRhythm::Steady, TypingRhythm::Burst],
    ..Default::default()
};

// Gaming/Chat typing
let gaming_typing = TypingConfig {
    base_wpm: 65.0,
    wpm_variation: 25.0,
    error_rate: 0.03,
    burst_typing_probability: 0.4,
    rhythm_patterns: vec![TypingRhythm::Burst],
    ..Default::default()
};
```

---

## Audio Configuration

### `AudioConfig` Structure

```rust
#[derive(Debug, Clone)]
pub struct AudioConfig {
    pub breathing_frequency: f64,
    pub vocal_fry_intensity: f64,
    pub pitch_variation: f64,
    pub pace_variation: f64,
    pub silence_insertion: bool,
    pub spectral_enhancement: bool,
    pub noise_floor: f64,
    pub dynamic_range: f64,
}
```

### Parameters

#### `breathing_frequency: f64` (default: 0.2)
Breathing patterns per second (breaths per second).

```rust
AudioConfig {
    breathing_frequency: 0.25,  // Breath every 4 seconds
    ..Default::default()
}
```

#### `vocal_fry_intensity: f64` (default: 0.1)
Intensity of vocal fry effect (0.0-1.0).

```rust
AudioConfig {
    vocal_fry_intensity: 0.05,  // Subtle vocal fry
    ..Default::default()
}
```

#### `pitch_variation: f64` (default: 0.15)
Natural pitch variation (0.0-1.0).

```rust
AudioConfig {
    pitch_variation: 0.2,  // More expressive speech
    ..Default::default()
}
```

#### `pace_variation: f64` (default: 0.2)
Speaking pace variation (0.0-1.0).

```rust
AudioConfig {
    pace_variation: 0.15,  // Consistent pacing
    ..Default::default()
}
```

### Audio Presets

```rust
// Professional presenter
let presenter_audio = AudioConfig {
    breathing_frequency: 0.15,
    vocal_fry_intensity: 0.02,
    pitch_variation: 0.12,
    pace_variation: 0.1,
    silence_insertion: true,
    ..Default::default()
};

// Casual conversation
let casual_audio = AudioConfig {
    breathing_frequency: 0.3,
    vocal_fry_intensity: 0.15,
    pitch_variation: 0.25,
    pace_variation: 0.3,
    ..Default::default()
};
```

---

## Visual Configuration

### `VisualConfig` Structure

```rust
#[derive(Debug, Clone)]
pub struct VisualConfig {
    pub gaze_drift_factor: f64,
    pub blink_rate: f64,
    pub attention_span: Duration,
    pub distraction_probability: f64,
    pub eye_movement_smoothness: f64,
    pub fixation_duration: Duration,
    pub saccade_velocity: f64,
}
```

### Parameters

#### `gaze_drift_factor: f64` (default: 0.15)
Natural gaze drift intensity (0.0-1.0).

```rust
VisualConfig {
    gaze_drift_factor: 0.2,  // More natural gaze drift
    ..Default::default()
}
```

#### `blink_rate: f64` (default: 12.0)
Blinks per minute.

```rust
VisualConfig {
    blink_rate: 15.0,  // More frequent blinking
    ..Default::default()
}
```

#### `attention_span: Duration` (default: 25 seconds)
Duration of focused attention periods.

```rust
VisualConfig {
    attention_span: Duration::from_secs(45),  // Longer attention spans
    ..Default::default()
}
```

---

## Detection Configuration

### `DetectionConfig` Structure

```rust
#[derive(Debug, Clone)]
pub struct DetectionConfig {
    pub authenticity_target: f64,
    pub detection_models: Vec<DetectionModel>,
    pub resistance_strategies: Vec<ResistanceStrategy>,
    pub validation_strictness: ValidationStrictness,
    pub cache_validation_results: bool,
    pub max_cache_entries: usize,
    pub cache_strategy: CacheStrategy,
    pub cache_ttl: Duration,
}
```

### Parameters

#### `authenticity_target: f64` (default: 0.9)
Target authenticity score (0.0-1.0).

```rust
DetectionConfig {
    authenticity_target: 0.95,  // 95% authenticity target
    ..Default::default()
}
```

#### `detection_models: Vec<DetectionModel>`
AI detection models to test against.

```rust
pub enum DetectionModel {
    GPTZero,
    OriginalityAI,
    Turnitin,
    YouTube,
    Custom(String),
}

DetectionConfig {
    detection_models: vec![
        DetectionModel::GPTZero,
        DetectionModel::OriginalityAI,
        DetectionModel::Turnitin,
    ],
    ..Default::default()
}
```

#### `resistance_strategies: Vec<ResistanceStrategy>`
Strategies for evading detection.

```rust
pub enum ResistanceStrategy {
    PerplexityVariation,
    SyntaxDiversification,
    SemanticNoise,
    StructuralModification,
}

DetectionConfig {
    resistance_strategies: vec![
        ResistanceStrategy::PerplexityVariation,
        ResistanceStrategy::SyntaxDiversification,
    ],
    ..Default::default()
}
```

#### `validation_strictness: ValidationStrictness`
Validation strictness level.

```rust
pub enum ValidationStrictness {
    Low,     // Permissive validation
    Medium,  // Standard validation (default)
    High,    // Strict validation
}

DetectionConfig {
    validation_strictness: ValidationStrictness::High,
    ..Default::default()
}
```

### Detection Presets

```rust
// Maximum security
let max_security = DetectionConfig {
    authenticity_target: 0.98,
    validation_strictness: ValidationStrictness::High,
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
        ResistanceStrategy::StructuralModification,
    ],
    ..Default::default()
};

// Balanced approach
let balanced_detection = DetectionConfig {
    authenticity_target: 0.9,
    validation_strictness: ValidationStrictness::Medium,
    detection_models: vec![
        DetectionModel::GPTZero,
        DetectionModel::OriginalityAI,
    ],
    resistance_strategies: vec![
        ResistanceStrategy::PerplexityVariation,
        ResistanceStrategy::SyntaxDiversification,
    ],
    ..Default::default()
};
```

---

## Advanced Configuration

### Dynamic Configuration

Update configuration based on runtime conditions:

```rust
use aegnt27::prelude::*;

async fn adaptive_configuration() -> Result<Aegnt27Config, Aegnt27Error> {
    let system_load = get_system_load().await;
    let network_latency = measure_network_latency().await;
    
    let config = Aegnt27Config::builder()
        .typing(TypingConfig {
            base_wpm: if system_load > 0.8 { 50.0 } else { 70.0 },
            cache_size: if system_load > 0.8 { 100 } else { 1000 },
            ..Default::default()
        })
        .detection(DetectionConfig {
            authenticity_target: if network_latency > 200.0 { 0.85 } else { 0.95 },
            cache_validation_results: network_latency > 100.0,
            ..Default::default()
        })
        .build()?;
    
    Ok(config)
}
```

### Profile-Based Configuration

Create configuration profiles for different scenarios:

```rust
use std::collections::HashMap;

struct ConfigurationManager {
    profiles: HashMap<String, Aegnt27Config>,
    current_profile: String,
}

impl ConfigurationManager {
    fn new() -> Self {
        let mut profiles = HashMap::new();
        
        // Gaming profile
        profiles.insert("gaming".to_string(), Aegnt27Config::builder()
            .mouse(MouseConfig {
                movement_speed: 2.0,
                drift_factor: 0.02,
                acceleration_profile: AccelerationProfile::Sharp,
                ..Default::default()
            })
            .typing(TypingConfig {
                base_wpm: 80.0,
                burst_typing_probability: 0.4,
                ..Default::default()
            })
            .build().unwrap());
        
        // Work profile
        profiles.insert("work".to_string(), Aegnt27Config::builder()
            .mouse(MouseConfig {
                movement_speed: 1.0,
                drift_factor: 0.1,
                acceleration_profile: AccelerationProfile::Natural,
                ..Default::default()
            })
            .typing(TypingConfig {
                base_wpm: 70.0,
                error_rate: 0.015,
                ..Default::default()
            })
            .detection(DetectionConfig {
                authenticity_target: 0.95,
                validation_strictness: ValidationStrictness::High,
                ..Default::default()
            })
            .build().unwrap());
        
        Self {
            profiles,
            current_profile: "work".to_string(),
        }
    }
    
    fn get_config(&self, profile: &str) -> Option<&Aegnt27Config> {
        self.profiles.get(profile)
    }
    
    fn switch_profile(&mut self, profile: String) {
        if self.profiles.contains_key(&profile) {
            self.current_profile = profile;
        }
    }
}
```

### Configuration Validation

Validate configuration before use:

```rust
impl Aegnt27Config {
    fn validate(&self) -> Result<(), ConfigurationError> {
        // Validate mouse configuration
        if self.mouse.movement_speed <= 0.0 || self.mouse.movement_speed > 5.0 {
            return Err(ConfigurationError::InvalidParameter(
                "movement_speed must be between 0.0 and 5.0".to_string()
            ));
        }
        
        if self.mouse.drift_factor < 0.0 || self.mouse.drift_factor > 1.0 {
            return Err(ConfigurationError::InvalidParameter(
                "drift_factor must be between 0.0 and 1.0".to_string()
            ));
        }
        
        // Validate typing configuration
        if self.typing.base_wpm <= 0.0 || self.typing.base_wpm > 300.0 {
            return Err(ConfigurationError::InvalidParameter(
                "base_wpm must be between 0.0 and 300.0".to_string()
            ));
        }
        
        if self.typing.error_rate < 0.0 || self.typing.error_rate > 1.0 {
            return Err(ConfigurationError::InvalidParameter(
                "error_rate must be between 0.0 and 1.0".to_string()
            ));
        }
        
        // Validate detection configuration
        if self.detection.authenticity_target < 0.0 || self.detection.authenticity_target > 1.0 {
            return Err(ConfigurationError::InvalidParameter(
                "authenticity_target must be between 0.0 and 1.0".to_string()
            ));
        }
        
        Ok(())
    }
}
```

### Configuration Inheritance

Create configuration hierarchies:

```rust
struct ConfigurationHierarchy {
    base: Aegnt27Config,
    overrides: HashMap<String, Aegnt27Config>,
}

impl ConfigurationHierarchy {
    fn resolve(&self, context: &str) -> Aegnt27Config {
        let mut config = self.base.clone();
        
        if let Some(override_config) = self.overrides.get(context) {
            // Apply overrides
            config = merge_configs(config, override_config.clone());
        }
        
        config
    }
}

fn merge_configs(base: Aegnt27Config, override_config: Aegnt27Config) -> Aegnt27Config {
    // Implementation would merge non-default values from override into base
    // This is a simplified example
    Aegnt27Config {
        mouse: if override_config.mouse != MouseConfig::default() {
            override_config.mouse
        } else {
            base.mouse
        },
        typing: if override_config.typing != TypingConfig::default() {
            override_config.typing
        } else {
            base.typing
        },
        // ... other fields
        ..base
    }
}
```

---

## Best Practices

### 1. Start with Defaults
Begin with default configurations and adjust incrementally:

```rust
let config = Aegnt27Config::builder()
    .typing(TypingConfig {
        base_wpm: 75.0,  // Only change what you need
        ..Default::default()
    })
    .build()?;
```

### 2. Test Configuration Changes
Always test configuration changes:

```rust
#[cfg(test)]
mod config_tests {
    use super::*;

    #[tokio::test]
    async fn test_custom_config() {
        let config = Aegnt27Config::builder()
            .typing(TypingConfig {
                base_wpm: 80.0,
                error_rate: 0.01,
                ..Default::default()
            })
            .build()
            .unwrap();

        let aegnt = Aegnt27Engine::with_config(config).await.unwrap();
        let result = aegnt.humanize_typing("test").await.unwrap();
        
        // Verify configuration is applied
        assert!(result.average_wpm() > 70.0);
    }
}
```

### 3. Document Configuration Choices
Document why specific configurations are chosen:

```rust
// Gaming configuration optimized for competitive FPS games
// - High movement speed for quick reactions
// - Low drift for precision aiming
// - Burst typing for quick chat messages
let gaming_config = Aegnt27Config::builder()
    .mouse(MouseConfig {
        movement_speed: 2.0,      // Quick reactions
        drift_factor: 0.02,       // Precision aiming
        acceleration_profile: AccelerationProfile::Sharp,
        ..Default::default()
    })
    .typing(TypingConfig {
        burst_typing_probability: 0.4,  // Quick chat
        ..Default::default()
    })
    .build()?;
```

### 4. Environment-Specific Configuration
Use different configurations for different environments:

```rust
fn get_config_for_environment() -> Aegnt27Config {
    match std::env::var("ENVIRONMENT").as_deref() {
        Ok("production") => production_config(),
        Ok("staging") => staging_config(),
        Ok("development") => development_config(),
        _ => default_config(),
    }
}

fn production_config() -> Aegnt27Config {
    Aegnt27Config::builder()
        .detection(DetectionConfig {
            authenticity_target: 0.98,  // Maximum authenticity in production
            validation_strictness: ValidationStrictness::High,
            ..Default::default()
        })
        .build()
        .unwrap()
}

fn development_config() -> Aegnt27Config {
    Aegnt27Config::builder()
        .detection(DetectionConfig {
            authenticity_target: 0.8,   // Relaxed for testing
            cache_validation_results: false,  // No caching during development
            ..Default::default()
        })
        .build()
        .unwrap()
}
```

---

## Troubleshooting Configuration

### Common Configuration Issues

**Error: "Invalid WPM value"**
```rust
// ❌ Invalid
TypingConfig {
    base_wpm: -10.0,  // Negative values not allowed
    ..Default::default()
}

// ✅ Valid
TypingConfig {
    base_wpm: 45.0,   // Positive values only
    ..Default::default()
}
```

**Error: "Cache size too large"**
```rust
// ❌ May cause memory issues
TypingConfig {
    cache_size: 100_000,  // Very large cache
    ..Default::default()
}

// ✅ Reasonable cache size
TypingConfig {
    cache_size: 1000,     // Balanced cache size
    ..Default::default()
}
```

### Configuration Debugging

Enable debug logging to troubleshoot configuration issues:

```rust
use log::debug;

let config = Aegnt27Config::builder()
    .typing(TypingConfig {
        base_wpm: 70.0,
        ..Default::default()
    })
    .build()?;

debug!("Created configuration: {:?}", config);

let aegnt = Aegnt27Engine::with_config(config).await?;
debug!("Engine created successfully");
```

---

This comprehensive configuration guide covers all aspects of customizing aegnt-27 for your specific needs. For more examples, see the [examples directory](../../examples/) and [best practices guide](best_practices.md).