# Contributing to aegnt-27: The Human Peak Protocol

> Thank you for your interest in contributing to aegnt-27! This guide will help you get started with contributing to our peak human authenticity achievement library.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Code Style and Standards](#code-style-and-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Performance Considerations](#performance-considerations)
- [Security Guidelines](#security-guidelines)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@anthropic.com](mailto:conduct@anthropic.com).

### Our Standards

- **Be respectful**: Treat all community members with respect and kindness
- **Be inclusive**: Welcome contributors from all backgrounds and experience levels
- **Be collaborative**: Work together constructively and assume good intentions
- **Be professional**: Keep discussions focused on technical matters
- **Be patient**: Help others learn and grow within the community

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Rust 1.70.0 or higher** - [Install Rust](https://rustup.rs/)
- **Git** - For version control
- **A GitHub account** - For submitting contributions
- **Basic understanding of async Rust** - Most of our code uses tokio

### Quick Setup

1. **Fork the repository**
   ```bash
   # Visit https://github.com/anthropic/aegnt27 and click "Fork"
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/aegnt27.git
   cd aegnt27
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/aegntic/aegnt27.git
   ```

4. **Create a development branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Install dependencies and run tests**
   ```bash
   cargo build
   cargo test
   ```

## Development Environment

### Recommended Tools

- **IDE**: VS Code with rust-analyzer extension
- **Formatter**: rustfmt (run with `cargo fmt`)
- **Linter**: clippy (run with `cargo clippy`)
- **Documentation**: Use `cargo doc --open` to build and view docs

### Environment Configuration

Create a `.env` file for development (not committed to git):

```bash
# Development environment variables
RUST_LOG=debug
AEGNT27_ENV=development
AEGNT27_PERFORMANCE_MONITORING=true
```

### Build Profiles

```bash
# Development build (faster compilation, debug symbols)
cargo build

# Release build (optimized, for performance testing)
cargo build --release

# Development with all features
cargo build --all-features

# Specific feature sets
cargo build --features "mouse,typing,detection"
```

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

#### 🐛 **Bug Reports**
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- System information (OS, Rust version, etc.)
- Minimal reproducible example

#### ✨ **Feature Requests**
- Clear use case description
- Proposed API design (if applicable)
- Consider backward compatibility
- Performance implications
- Security considerations

#### 🔧 **Code Contributions**
- Bug fixes
- New features
- Performance improvements
- Documentation improvements
- Test additions

#### 📚 **Documentation**
- API documentation improvements
- Tutorial enhancements
- Example additions
- README updates

### Contribution Areas

#### Core Modules
- **Mouse Authenticity** (`src/mouse.rs`) - Peak movement patterns through 7 behaviors
- **Typing Authenticity** (`src/typing.rs`) - Natural keystroke patterns through 7 behaviors
- **Audio Authenticity** (`src/audio.rs`) - Voice authenticity through 7 behaviors
- **Visual Authenticity** (`src/visual.rs`) - Gaze authenticity through 6 behaviors
- **Authenticity Validation** (`src/authenticity.rs`) - Human authenticity achievement

#### Supporting Systems
- **Configuration** (`src/config.rs`) - Configuration management
- **Error Handling** (`src/error.rs`) - Error types and handling
- **Utilities** (`src/utils.rs`) - Helper functions
- **Performance** - Optimization and monitoring
- **Testing** - Test coverage and quality

#### Examples and Documentation
- **Examples** (`examples/`) - Practical usage examples
- **Documentation** (`docs/`) - Guides and tutorials
- **Benchmarks** (`benches/`) - Performance benchmarks

## Pull Request Process

### Before Submitting

1. **Check existing issues/PRs** to avoid duplicates
2. **Discuss large changes** in an issue first
3. **Ensure all tests pass** locally
4. **Update documentation** if needed
5. **Consider performance impact**

### PR Requirements

#### Required Checks
- [ ] All tests pass (`cargo test`)
- [ ] Code is formatted (`cargo fmt`)
- [ ] No clippy warnings (`cargo clippy`)
- [ ] Documentation builds (`cargo doc`)
- [ ] No security vulnerabilities (`cargo audit`)

#### Code Quality
- [ ] Code follows project style guidelines
- [ ] New functions have documentation
- [ ] Complex logic is well-commented
- [ ] Error handling is appropriate
- [ ] Tests cover new functionality

#### Performance
- [ ] No significant performance regressions
- [ ] Memory usage is reasonable
- [ ] Async code doesn't block unnecessarily
- [ ] Resource cleanup is proper

### PR Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring (no functional changes)

## Testing
- [ ] Added tests for new functionality
- [ ] Verified existing tests still pass
- [ ] Tested on multiple platforms (if applicable)
- [ ] Performance tested (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] CHANGELOG.md updated (if needed)

## Related Issues
Fixes #(issue number)
Relates to #(issue number)

## Additional Notes
Any additional information reviewers should know.
```

### Review Process

1. **Automated checks** run on all PRs
2. **Code review** by maintainers
3. **Testing** on multiple platforms
4. **Performance evaluation** for significant changes
5. **Security review** for security-related changes

## Issue Guidelines

### Bug Reports

Use the bug report template and include:

```markdown
## Bug Description
Clear description of what the bug is.

## Reproduction Steps
1. Step one
2. Step two
3. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g., Ubuntu 22.04]
- Rust version: [e.g., 1.70.0]
- Aegnt27 version: [e.g., 2.7.0]
- Features enabled: [e.g., mouse,typing,detection]

## Additional Context
Logs, screenshots, or other helpful information.
```

### Feature Requests

```markdown
## Feature Description
Clear description of the proposed feature.

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
How would you like this feature to work?

## Alternatives Considered
Other approaches you've considered.

## Additional Context
Mockups, examples, or other helpful information.
```

## Code Style and Standards

### Rust Style Guidelines

We follow standard Rust conventions:

```rust
// Good: Use snake_case for functions and variables
fn humanize_mouse_movement(path: MousePath) -> Result<HumanizedPath, Error> {
    // Implementation
}

// Good: Use PascalCase for types
struct MouseHumanizer {
    config: MouseConfig,
}

// Good: Use SCREAMING_SNAKE_CASE for constants
const DEFAULT_MOVEMENT_SPEED: f64 = 1.0;
```

### Documentation Standards

#### Public APIs
All public APIs must have documentation:

```rust
/// Achieves mouse authenticity along the given path.
///
/// This function takes a [`MousePath`] and applies peak human authenticity
/// characteristics through 7 distinct behavioral patterns.
///
/// # Arguments
///
/// * `path` - The mouse movement path to humanize
///
/// # Returns
///
/// Returns an [`AuthenticMousePath`] with peak authenticity characteristics,
/// or an error if authenticity achievement fails.
///
/// # Examples
///
/// ```rust
/// use aegnt27::prelude::*;
///
/// # #[tokio::main]
/// # async fn main() -> Result<(), Aegnt27Error> {
/// let aegnt = Aegnt27Engine::builder()
///     .enable_mouse_authenticity()
///     .build()
///     .await?;
///
/// let path = MousePath::linear(Point::new(0, 0), Point::new(100, 100));
/// let authentic = aegnt.achieve_mouse_authenticity(path).await?;
///
/// println!("Movement duration: {}ms", authentic.total_duration().as_millis());
/// # Ok(())
/// # }
/// ```
///
/// # Errors
///
/// This function returns an error if:
/// - The path contains invalid coordinates
/// - The authenticity achievement process fails due to resource constraints
/// - The configuration is invalid
pub async fn achieve_mouse_authenticity(&self, path: MousePath) -> Result<AuthenticMousePath, Aegnt27Error> {
    // Implementation
}
```

#### Internal Code
Internal code should have helpful comments:

```rust
// Calculate Bezier curve control points based on path characteristics
// We use a weighted random approach to ensure natural variation
let control_points = self.calculate_control_points(&path, &self.config)?;

// Apply micro-movements at regular intervals to simulate natural hand tremor
// The intensity is configurable but defaults to subtle movements
for (i, point) in path.points().iter().enumerate() {
    if i % MICRO_MOVEMENT_INTERVAL == 0 {
        let offset = self.generate_micro_movement_offset();
        // Apply offset...
    }
}
```

### Error Handling

Use descriptive error types and messages:

```rust
// Good: Specific error with context
if path.points().is_empty() {
    return Err(Aegnt27Error::ValidationError(
        "Mouse path cannot be empty".to_string()
    ));
}

// Good: Wrap external errors with context
let data = tokio::fs::read(&config_path).await
    .map_err(|e| Aegnt27Error::ConfigurationError(
        format!("Failed to read config file '{}': {}", config_path, e)
    ))?;

// Good: Use Result consistently
pub async fn validate_authenticity(&self, content: &str) -> Result<AuthenticityResult, Aegnt27Error> {
    // Implementation
}
```

### Performance Guidelines

#### Async Best Practices
```rust
// Good: Use async/await properly
pub async fn process_batch(&self, items: Vec<Item>) -> Result<Vec<Result>, Error> {
    let futures = items.into_iter().map(|item| self.process_item(item));
    futures::future::try_join_all(futures).await
}

// Good: Don't block async runtime
pub async fn long_computation(&self) -> Result<ComputationResult, Error> {
    // For CPU-intensive work, use spawn_blocking
    let result = tokio::task::spawn_blocking(|| {
        // Heavy computation here
        expensive_computation()
    }).await?;
    
    Ok(result)
}
```

#### Memory Management
```rust
// Good: Use appropriate data structures
use std::collections::HashMap; // For key-value lookups
use std::collections::BTreeMap; // For ordered data
use std::collections::HashSet; // For unique items

// Good: Consider memory usage in loops
let mut results = Vec::with_capacity(expected_size); // Pre-allocate when size is known

// Good: Use references to avoid unnecessary allocations
fn process_text(text: &str) -> ProcessedText {
    // Process without taking ownership
}
```

## Testing

### Test Categories

#### Unit Tests
Test individual functions and modules:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_mouse_authenticity() {
        let config = MouseConfig::default();
        let authenticator = MouseAuthenticator::new(config).await.unwrap();
        
        let path = MousePath::linear(Point::new(0, 0), Point::new(100, 100));
        let result = authenticator.achieve_authenticity(path).await.unwrap();
        
        assert!(!result.points().is_empty());
        assert!(result.total_duration() > Duration::ZERO);
    }
    
    #[test]
    fn test_configuration_validation() {
        let invalid_config = MouseConfig {
            movement_speed: -1.0, // Invalid: negative speed
            ..Default::default()
        };
        
        assert!(invalid_config.validate().is_err());
    }
}
```

#### Integration Tests
Test component interactions:

```rust
// tests/integration_tests.rs
use aegnt27::prelude::*;

#[tokio::test]
async fn test_complete_workflow() {
    let aegnt = Aegnt27Engine::builder()
        .enable_all_features()
        .build()
        .await
        .unwrap();
    
    // Test mouse + typing workflow
    let mouse_path = MousePath::linear(Point::new(0, 0), Point::new(500, 300));
    let mouse_result = aegnt.achieve_mouse_authenticity(mouse_path).await.unwrap();
    
    let typing_result = aegnt.achieve_typing_authenticity("Hello, world!").await.unwrap();
    
    let validation = aegnt.validate_authenticity("Test content").await.unwrap();
    
    assert!(mouse_result.points().len() > 2);
    assert!(typing_result.keystrokes().len() > 0);
    assert!(validation.authenticity_score() > 0.0);
}
```

#### Performance Tests
Test performance characteristics:

```rust
// benches/performance.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use aegnt27::prelude::*;

fn benchmark_mouse_authenticity(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let aegnt = rt.block_on(async {
        Aegnt27Engine::builder()
            .enable_mouse_authenticity()
            .build()
            .await
            .unwrap()
    });
    
    c.bench_function("mouse_authenticity", |b| {
        b.to_async(&rt).iter(|| async {
            let path = MousePath::linear(
                Point::new(0, 0), 
                Point::new(black_box(1000), black_box(1000))
            );
            aegnt.achieve_mouse_authenticity(path).await.unwrap()
        })
    });
}

criterion_group!(benches, benchmark_mouse_authenticity);
criterion_main!(benches);
```

### Test Guidelines

#### Test Naming
```rust
// Good: Descriptive test names
#[tokio::test]
async fn achieve_typing_authenticity_returns_realistic_wpm_for_normal_text() { }

#[tokio::test]
async fn mouse_authenticity_fails_with_invalid_coordinates() { }

#[tokio::test]
async fn authenticity_validation_detects_suboptimal_patterns() { }
```

#### Test Structure
```rust
#[tokio::test]
async fn test_feature() {
    // Arrange: Set up test data
    let config = MouseConfig {
        movement_speed: 1.0,
        ..Default::default()
    };
    let aegnt = Aegnt27Engine::with_config(config).await.unwrap();
    
    // Act: Perform the operation
    let result = aegnt.some_operation("test input").await;
    
    // Assert: Verify the results
    assert!(result.is_ok());
    let value = result.unwrap();
    assert_eq!(value.expected_property(), expected_value);
}
```

### Running Tests

```bash
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_mouse_humanization

# Run tests with specific features
cargo test --features "mouse,typing"

# Run integration tests only
cargo test --test integration_tests

# Run benchmarks
cargo bench

# Run with coverage (requires cargo-tarpaulin)
cargo tarpaulin --out html
```

## Documentation

### Documentation Types

#### API Documentation
Generated from code comments using rustdoc:

```bash
# Build and open documentation
cargo doc --open --all-features

# Check for documentation warnings
cargo doc --all-features 2>&1 | grep warning
```

#### Guides and Tutorials
Markdown files in the `docs/` directory:

- **Quick Start Guide** - Getting started tutorial
- **Configuration Guide** - Comprehensive configuration reference
- **Best Practices** - Production deployment guidance
- **API Reference** - Complete API documentation
- **Tutorials** - Step-by-step examples

#### Examples
Practical examples in the `examples/` directory:

```rust
// examples/simple_usage.rs
use aegnt27::prelude::*;

#[tokio::main]
async fn main() -> Result<(), Aegnt27Error> {
    // Simple, focused example
    let aegnt = Aegnt27Engine::builder()
        .enable_typing_humanization()
        .build()
        .await?;
    
    let result = aegnt.humanize_typing("Hello, world!").await?;
    println!("Typing completed in {}ms", result.total_duration().as_millis());
    
    Ok(())
}
```

### Documentation Standards

#### Style Guide
- Use clear, concise language
- Include practical examples
- Explain the "why" not just the "how"
- Keep examples focused and minimal
- Update documentation with code changes

#### Review Checklist
- [ ] All public APIs documented
- [ ] Examples compile and run
- [ ] Links work correctly
- [ ] Spelling and grammar checked
- [ ] Screenshots/diagrams current
- [ ] Code samples follow best practices

## Performance Considerations

### Performance Requirements

aegnt-27 has specific performance targets:

- **Real-time Processing**: Sub-2x real-time for all humanization
- **Memory Usage**: <200MB baseline, configurable limits
- **CPU Usage**: <5% during idle monitoring
- **Startup Time**: <3 seconds for engine initialization
- **Response Time**: <100ms for UI operations

### Optimization Guidelines

#### Algorithm Efficiency
```rust
// Good: Use efficient algorithms
use std::collections::HashMap; // O(1) lookups
use std::collections::BinaryHeap; // O(log n) operations

// Consider algorithmic complexity
fn process_large_dataset(items: &[Item]) -> Vec<Result> {
    // Prefer O(n) or O(n log n) algorithms
    items.par_iter() // Use parallel processing when beneficial
         .map(|item| process_item(item))
         .collect()
}
```

#### Memory Optimization
```rust
// Good: Reuse allocations
struct ProcessorPool {
    buffer: Vec<u8>, // Reuse buffer across operations
}

impl ProcessorPool {
    fn process(&mut self, data: &[u8]) -> Result<Vec<u8>> {
        self.buffer.clear(); // Reuse existing allocation
        self.buffer.extend_from_slice(data);
        // Process buffer...
        Ok(self.buffer.clone())
    }
}

// Good: Use references when possible
fn analyze_content(content: &str) -> AnalysisResult {
    // Avoid unnecessary cloning
    content.lines()
           .filter(|line| !line.is_empty())
           .collect()
}
```

#### Async Optimization
```rust
// Good: Batch operations
async fn process_batch(items: Vec<Item>) -> Result<Vec<Result>> {
    const BATCH_SIZE: usize = 100;
    
    let mut results = Vec::new();
    for chunk in items.chunks(BATCH_SIZE) {
        let chunk_results = process_chunk(chunk).await?;
        results.extend(chunk_results);
        
        // Yield control periodically
        tokio::task::yield_now().await;
    }
    
    Ok(results)
}

// Good: Use bounded channels for backpressure
let (tx, rx) = tokio::sync::mpsc::channel(100); // Bounded channel
```

### Performance Testing

```rust
// benches/performance_regression.rs
use criterion::{criterion_group, criterion_main, Criterion};

fn regression_tests(c: &mut Criterion) {
    c.bench_function("mouse_humanization_1000_points", |b| {
        // Test must complete within acceptable time
        b.iter(|| {
            // Implementation that must maintain performance
        })
    });
}
```

## Security Guidelines

### Security Principles

1. **Input Validation**: Validate all inputs rigorously
2. **Least Privilege**: Request minimal necessary permissions
3. **Defense in Depth**: Multiple layers of security
4. **Fail Secure**: Fail to secure state, not open state
5. **Privacy by Design**: Default to most private options

### Secure Coding Practices

#### Input Validation
```rust
// Good: Validate inputs thoroughly
pub fn set_movement_speed(speed: f64) -> Result<(), ValidationError> {
    if speed <= 0.0 || speed > 10.0 {
        return Err(ValidationError::InvalidRange {
            field: "movement_speed",
            value: speed,
            min: 0.0,
            max: 10.0,
        });
    }
    
    if !speed.is_finite() {
        return Err(ValidationError::InvalidValue {
            field: "movement_speed",
            reason: "must be finite number",
        });
    }
    
    Ok(())
}

// Good: Sanitize string inputs
pub fn set_content(content: &str) -> Result<String, ValidationError> {
    // Check length
    if content.len() > MAX_CONTENT_LENGTH {
        return Err(ValidationError::TooLong {
            max_length: MAX_CONTENT_LENGTH,
            actual_length: content.len(),
        });
    }
    
    // Check for null bytes
    if content.contains('\0') {
        return Err(ValidationError::InvalidCharacter("null byte"));
    }
    
    // Sanitize and return
    Ok(content.trim().to_string())
}
```

#### Resource Limits
```rust
// Good: Implement resource limits
pub struct ResourceLimits {
    max_memory: usize,
    max_cpu_time: Duration,
    max_file_size: usize,
}

impl ResourceGuard {
    pub fn check_memory_usage(&self) -> Result<(), ResourceError> {
        let current_usage = get_memory_usage();
        if current_usage > self.limits.max_memory {
            return Err(ResourceError::MemoryLimitExceeded {
                limit: self.limits.max_memory,
                current: current_usage,
            });
        }
        Ok(())
    }
}
```

#### Cryptographic Security
```rust
// Good: Use secure cryptographic practices
use ring::rand::{SecureRandom, SystemRandom};
use ring::aead::{Aad, LessSafeKey, Nonce, UnboundKey, AES_256_GCM};

pub fn encrypt_sensitive_data(data: &[u8], key: &[u8]) -> Result<Vec<u8>, CryptoError> {
    let rng = SystemRandom::new();
    
    // Generate random nonce
    let mut nonce_bytes = [0u8; 12];
    rng.fill(&mut nonce_bytes)
        .map_err(|_| CryptoError::RandomGenerationFailed)?;
    
    // Encrypt data
    let unbound_key = UnboundKey::new(&AES_256_GCM, key)
        .map_err(|_| CryptoError::InvalidKey)?;
    let key = LessSafeKey::new(unbound_key);
    
    let nonce = Nonce::assume_unique_for_key(nonce_bytes);
    let mut ciphertext = data.to_vec();
    
    key.seal_in_place_append_tag(nonce, Aad::empty(), &mut ciphertext)
        .map_err(|_| CryptoError::EncryptionFailed)?;
    
    // Prepend nonce to ciphertext
    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&ciphertext);
    
    Ok(result)
}
```

### Security Review Process

1. **Threat Modeling**: Identify potential threats and attack vectors
2. **Code Review**: Security-focused code review for sensitive changes
3. **Dependency Scanning**: Regular vulnerability scanning of dependencies
4. **Penetration Testing**: External security testing for major releases
5. **Responsible Disclosure**: Process for handling security reports

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (e.g., 2.0.0 → 3.0.0): Breaking API changes
- **MINOR** (e.g., 2.7.0 → 2.8.0): New features, backward compatible
- **PATCH** (e.g., 2.7.0 → 2.7.1): Bug fixes, backward compatible

### Release Checklist

#### Pre-Release
- [ ] All tests pass on all supported platforms
- [ ] Performance benchmarks meet requirements
- [ ] Security review completed (for major releases)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version numbers updated consistently
- [ ] Breaking changes documented

#### Release
- [ ] Create release branch
- [ ] Tag release with version number
- [ ] Build and test release artifacts
- [ ] Publish to crates.io
- [ ] Create GitHub release with notes
- [ ] Update documentation website

#### Post-Release
- [ ] Monitor for issues
- [ ] Respond to community feedback
- [ ] Plan next release cycle

### Branching Strategy

- **main**: Stable branch, always deployable
- **develop**: Integration branch for new features
- **feature/***: Individual feature development
- **release/***: Preparation for releases
- **hotfix/***: Critical bug fixes

## Getting Help

### Community Resources

- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/anthropic/aegnt27/discussions)
- **GitHub Issues**: [Report bugs and request features](https://github.com/anthropic/aegnt27/issues)
- **Documentation**: [Complete documentation](https://docs.rs/aegnt27)

### For Contributors

- **Contributor Chat**: Join our Discord for real-time discussion
- **Office Hours**: Weekly contributor office hours (schedule in discussions)
- **Mentorship**: New contributor mentorship program available

### Contact Maintainers

- **General Questions**: Create a GitHub Discussion
- **Security Issues**: Email security@anthropic.com
- **Code of Conduct**: Email conduct@anthropic.com

---

**Thank you for contributing to aegnt-27!** Your contributions help make AI detection evasion accessible and reliable for everyone. We appreciate your time and effort in making this project better.