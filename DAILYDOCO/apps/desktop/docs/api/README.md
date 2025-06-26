# aegnt-27 API Reference

This directory contains comprehensive API documentation for all aegnt-27 modules.

## API Documentation Structure

### Core Modules

- **[Mouse Humanization API](mouse.md)** - Complete API reference for mouse movement humanization
- **[Typing Humanization API](typing.md)** - Typing pattern humanization interfaces
- **[Audio Humanization API](audio.md)** - Audio spectral humanization capabilities
- **[Visual Enhancement API](visual.md)** - Visual authenticity enhancement features
- **[AI Detection Validation API](detection.md)** - AI detection evasion and validation

### Configuration & Utilities

- **[Configuration API](config.md)** - Configuration management and validation
- **[Utilities API](utils.md)** - Common utilities, error handling, and mathematical functions
- **[Performance Monitoring API](performance.md)** - Performance metrics and optimization

### Integration Guides

- **[Quick Start](../guides/quick-start.md)** - Get started with aegnt-27 in 5 minutes
- **[Integration Patterns](../guides/integration-patterns.md)** - Common integration patterns and best practices
- **[Error Handling](../guides/error-handling.md)** - Comprehensive error handling strategies

## API Design Principles

### Consistency
All HUMaiN2.7 APIs follow consistent patterns:
- Async-first design with `async/await`
- Result types for error handling
- Builder patterns for complex configurations
- Extensive documentation with examples

### Performance
- Zero-cost abstractions where possible
- Minimal memory allocations
- Streaming interfaces for large data
- Configurable performance vs. accuracy trade-offs

### Privacy
- Local-first processing by default
- Explicit consent for any data retention
- Secure memory clearing for sensitive data
- Comprehensive audit logging options

### Extensibility
- Trait-based design for custom implementations
- Plugin architecture for adding new detectors
- Configurable humanization algorithms
- Custom metrics and monitoring hooks

## Common Patterns

### Error Handling
```rust
use humain27::prelude::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let humanizer = MouseHumanizer::new().await?;
    
    match humanizer.humanize_mouse_movement(input).await {
        Ok(result) => {
            println!("Success: {:.1}% authenticity", result.authenticity_scores.overall_authenticity * 100.0);
        },
        Err(HumainError::MouseHumanization { message }) => {
            eprintln!("Mouse humanization failed: {}", message);
        },
        Err(e) => {
            eprintln!("Unexpected error: {}", e);
        }
    }
    
    Ok(())
}
```

### Configuration Management
```rust
use humain27::config::*;

let config = HumainConfig {
    mouse: MouseConfig {
        authenticity_target: 0.98,
        micro_movements_enabled: true,
        ..Default::default()
    },
    performance: PerformanceConfig {
        max_memory_mb: 1024,
        parallel_processing_enabled: true,
        ..Default::default()
    },
    ..Default::default()
};

config.validate()?;
humain27::init_with_config(config).await?;
```

### Async Operations
```rust
use humain27::prelude::*;
use futures::future::join_all;

// Process multiple inputs concurrently
let inputs = vec![input1, input2, input3];
let tasks: Vec<_> = inputs.into_iter()
    .map(|input| humanizer.humanize_mouse_movement(input))
    .collect();

let results = join_all(tasks).await;
```

### Performance Monitoring
```rust
use humain27::utils::PerformanceTiming;

let mut timing = PerformanceTiming::new();

timing.checkpoint("start_humanization");
let result = humanizer.humanize_mouse_movement(input).await?;
timing.checkpoint("end_humanization");

println!("Humanization took: {:.2}ms", timing.total_duration().as_millis());
```

## Version Compatibility

### Semantic Versioning
HUMaiN2.7 follows semantic versioning:
- **Major** (2.x.x): Breaking API changes
- **Minor** (x.7.x): New features, backward compatible
- **Patch** (x.x.0): Bug fixes, backward compatible

### API Stability
- **Stable APIs**: Core humanization interfaces, configuration structures
- **Experimental APIs**: Advanced detection algorithms, ML model integrations
- **Internal APIs**: Implementation details, subject to change without notice

### Minimum Supported Rust Version (MSRV)
- **Current MSRV**: Rust 1.70.0
- **Update Policy**: MSRV may be updated in minor versions with 6-month notice

## Performance Characteristics

### Latency Targets
| Operation | Target Latency | Typical Range |
|-----------|----------------|---------------|
| Mouse humanization | < 2ms | 0.5-1.5ms |
| Typing humanization | < 1ms | 0.2-0.8ms |
| Audio humanization | < 5ms | 1-4ms |
| Visual enhancement | < 3ms | 0.8-2.5ms |
| Detection validation | < 50ms | 10-40ms |

### Memory Usage
| Component | Baseline | With ML Models | High Performance |
|-----------|----------|----------------|------------------|
| Core library | 50MB | 150MB | 200MB |
| Mouse humanizer | +10MB | +25MB | +35MB |
| Audio processor | +20MB | +80MB | +120MB |
| Detection validator | +15MB | +100MB | +150MB |

### Throughput
| Operation | Operations/Second | Notes |
|-----------|-------------------|-------|
| Mouse paths | 500-2000 | Depends on path complexity |
| Typing sequences | 1000-5000 | Depends on text length |
| Audio chunks | 100-500 | Real-time capable |
| Detection tests | 10-50 | Network dependent |

## Security Considerations

### Data Protection
- All sensitive data encrypted with AES-256-GCM
- Secure key derivation using PBKDF2
- Memory cleared using volatile operations
- Optional audit logging with configurable retention

### Attack Surface
- Minimal external dependencies
- No network communication by default
- Sandboxed execution support
- Regular security audits

### Compliance
- GDPR compliance through privacy-by-design
- SOC2 Type II compatible architecture
- HIPAA-ready with appropriate configuration
- Export control compliance (EAR/ITAR exempt)

## Contributing to Documentation

### Documentation Standards
- All public APIs must have documentation
- Examples required for complex interfaces
- Performance characteristics documented
- Error conditions explicitly listed

### Documentation Tools
- Generated from source using `cargo doc`
- Manually curated guides in Markdown
- Interactive examples in documentation
- Automated testing of code examples

### Contribution Process
1. Update documentation alongside code changes
2. Include examples for new features
3. Update performance benchmarks
4. Review documentation for clarity and accuracy

## Getting Help

### Documentation Issues
- Report documentation bugs in GitHub Issues
- Suggest improvements via Pull Requests
- Ask questions in GitHub Discussions
- Join the community Discord for real-time help

### API Support
- Stable APIs have long-term support
- Experimental APIs may change without notice
- Migration guides provided for breaking changes
- Community support available for integration help