# Contributing to aegnt-27

Thank you for your interest in contributing to aegnt-27! This document provides guidelines and information for contributors to help maintain the quality and consistency of the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Standards](#documentation-standards)
- [Performance Considerations](#performance-considerations)
- [Security Guidelines](#security-guidelines)
- [Release Process](#release-process)
- [Community](#community)

## Code of Conduct

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior include:

- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at conduct@aegntic.com. All complaints will be reviewed and investigated promptly and fairly.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Rust 1.70.0 or later** - [Install Rust](https://rustup.rs/)
- **Git** - [Install Git](https://git-scm.com/)
- **A GitHub account** - [Sign up](https://github.com/join)
- **Understanding of the project** - Read the [README](README.md) and [documentation](docs/)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/aegnt-27.git
cd aegnt-27
```

3. Add the upstream repository:
```bash
git remote add upstream https://github.com/aegntic/aegnt-27.git
```

4. Create a new branch for your contribution:
```bash
git checkout -b feature/your-feature-name
```

## Development Environment

### Initial Setup

1. **Install Dependencies**:
```bash
# Install Rust dependencies
cargo build

# Install development tools
cargo install cargo-watch cargo-audit cargo-deny
rustup component add clippy rustfmt
```

2. **Verify Installation**:
```bash
# Run tests
cargo test

# Check formatting
cargo fmt --check

# Run linter
cargo clippy
```

3. **Optional GPU Setup** (for ML features):
```bash
# CUDA support (NVIDIA)
export CUDA_PATH=/usr/local/cuda
export LD_LIBRARY_PATH=$CUDA_PATH/lib64:$LD_LIBRARY_PATH

# OpenCL support (cross-platform)
# Follow platform-specific OpenCL installation guides
```

### Development Workflow

1. **Keep your fork updated**:
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

2. **Create feature branches**:
```bash
git checkout -b feature/descriptive-name
```

3. **Regular development cycle**:
```bash
# Make changes
cargo check          # Quick syntax check
cargo test           # Run tests
cargo clippy         # Lint code
cargo fmt            # Format code
```

4. **Pre-commit checks**:
```bash
./scripts/pre-commit.sh  # Run all checks
```

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

#### 🐛 **Bug Reports**
- Use the bug report template
- Include reproduction steps
- Provide system information
- Attach relevant logs

#### 💡 **Feature Requests**
- Use the feature request template
- Explain the use case and benefit
- Consider performance implications
- Discuss security considerations

#### 🔧 **Code Contributions**
- Bug fixes
- New features
- Performance improvements
- Documentation updates

#### 📚 **Documentation**
- API documentation
- Tutorials and guides
- Code examples
- README improvements

#### 🧪 **Testing**
- Unit tests
- Integration tests
- Performance benchmarks
- Cross-platform testing

### Contribution Process

1. **Issue First**: For significant changes, create an issue first to discuss the approach
2. **Small PRs**: Keep pull requests focused and reasonably sized
3. **Tests Required**: All code changes must include appropriate tests
4. **Documentation**: Update documentation for any API changes
5. **Performance**: Consider performance implications of your changes

## Pull Request Process

### Before Submitting

1. **Ensure your branch is up to date**:
```bash
git fetch upstream
git rebase upstream/main
```

2. **Run the full test suite**:
```bash
cargo test --all-features
cargo test --no-default-features
```

3. **Check code quality**:
```bash
cargo clippy --all-targets --all-features
cargo fmt --check
```

4. **Run security checks**:
```bash
cargo audit
cargo deny check
```

5. **Update documentation**:
```bash
cargo doc --all-features --no-deps
```

### PR Requirements

Your pull request must:

- ✅ **Pass all CI checks**
- ✅ **Include appropriate tests**
- ✅ **Update relevant documentation**
- ✅ **Follow coding standards**
- ✅ **Have a clear description**
- ✅ **Reference related issues**

### PR Template

```markdown
## Description
Brief description of the changes and their purpose.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] Performance benchmarks run

## Documentation
- [ ] Code comments updated
- [ ] API documentation updated
- [ ] User guide updated
- [ ] CHANGELOG.md updated

## Security
- [ ] Security implications considered
- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] Error handling reviewed

## Performance
- [ ] Performance impact assessed
- [ ] Memory usage considered
- [ ] Benchmarks run (if applicable)

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

## Coding Standards

### Rust Style Guide

Follow the [Rust Style Guide](https://doc.rust-lang.org/1.0.0/style/) and use `rustfmt`:

```bash
# Format code
cargo fmt

# Check formatting without modifying files
cargo fmt --check
```

### Code Organization

```rust
// File structure
src/
├── lib.rs              // Main library interface
├── module/
│   ├── mod.rs          // Module interface
│   ├── implementation.rs // Core implementation
│   ├── types.rs        // Type definitions
│   └── tests.rs        // Module-specific tests
├── utils/              // Utility functions
└── config/             // Configuration management
```

### Naming Conventions

- **Modules**: `snake_case` (e.g., `mouse_humanizer`)
- **Functions**: `snake_case` (e.g., `humanize_movement`)
- **Types**: `PascalCase` (e.g., `MouseHumanizer`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `DEFAULT_AUTHENTICITY_TARGET`)
- **Lifetimes**: `'lowercase` (e.g., `'a`, `'input`)

### Documentation Requirements

All public APIs must have comprehensive documentation:

```rust
/// Humanizes mouse movement patterns to appear more natural and human-like.
///
/// This function applies various humanization techniques including micro-movements,
/// drift patterns, and Bezier curve acceleration to make synthetic mouse movements
/// indistinguishable from natural human input.
///
/// # Arguments
///
/// * `input` - The mouse humanization input containing the original path and preferences
///
/// # Returns
///
/// Returns a `Result` containing the humanized mouse movement data or an error
/// if humanization fails.
///
/// # Examples
///
/// ```rust
/// use humain27::prelude::*;
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let humanizer = MouseHumanizer::new().await?;
///     let input = MouseHumanizationInput {
///         // ... configuration
///     };
///     
///     let result = humanizer.humanize_mouse_movement(input).await?;
///     println!("Authenticity: {:.1}%", result.authenticity_scores.overall_authenticity * 100.0);
///     
///     Ok(())
/// }
/// ```
///
/// # Performance
///
/// - **Latency**: Typically completes in <2ms for simple paths
/// - **Memory**: Uses approximately 10-50MB depending on path complexity
/// - **CPU**: Utilizes multiple cores when parallel processing is enabled
///
/// # Security
///
/// All input data is processed locally and no information is transmitted over the network.
/// Sensitive movement patterns are cleared from memory after processing.
///
/// # Errors
///
/// This function may return errors in the following cases:
/// - [`HumainError::MouseHumanization`] - Invalid input parameters or humanization failure
/// - [`HumainError::Platform`] - Platform-specific initialization issues
/// - [`HumainError::Resource`] - Insufficient system resources
pub async fn humanize_mouse_movement(
    &self,
    input: MouseHumanizationInput,
) -> Result<MouseHumanizationResult> {
    // Implementation...
}
```

### Error Handling

Use the project's error types and provide meaningful error messages:

```rust
use crate::utils::{HumainError, Result};

pub fn validate_input(input: &MouseHumanizationInput) -> Result<()> {
    if input.original_mouse_path.movement_points.is_empty() {
        return Err(HumainError::validation(
            "Mouse path must contain at least one movement point"
        ));
    }
    
    if input.target_authenticity < 0.0 || input.target_authenticity > 1.0 {
        return Err(HumainError::validation(
            "Target authenticity must be between 0.0 and 1.0"
        ));
    }
    
    Ok(())
}
```

### Performance Guidelines

- **Prefer zero-cost abstractions**
- **Minimize allocations in hot paths**
- **Use streaming for large data sets**
- **Profile performance-critical code**
- **Document performance characteristics**

```rust
// Good: Zero-cost abstraction
pub fn process_points<I>(points: I) -> impl Iterator<Item = ProcessedPoint>
where
    I: Iterator<Item = MousePoint>,
{
    points.map(|point| ProcessedPoint::from(point))
}

// Avoid: Unnecessary allocations
pub fn process_points_slow(points: &[MousePoint]) -> Vec<ProcessedPoint> {
    points.iter().map(|point| ProcessedPoint::from(*point)).collect()
}
```

## Testing Guidelines

### Test Structure

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tokio::test;

    #[tokio::test]
    async fn test_mouse_humanization_basic() {
        // Arrange
        let humanizer = MouseHumanizer::new().await.unwrap();
        let input = create_test_input();
        
        // Act
        let result = humanizer.humanize_mouse_movement(input).await.unwrap();
        
        // Assert
        assert!(result.authenticity_scores.overall_authenticity >= 0.9);
        assert!(!result.humanized_mouse_path.humanized_points.is_empty());
    }

    #[test]
    fn test_input_validation() {
        let invalid_input = MouseHumanizationInput {
            target_authenticity: 1.5, // Invalid value
            // ... other fields
        };
        
        let result = validate_input(&invalid_input);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), HumainError::Validation { .. }));
    }
}
```

### Test Categories

1. **Unit Tests** - Test individual functions and methods
2. **Integration Tests** - Test module interactions
3. **Property Tests** - Test with random inputs using `proptest`
4. **Benchmark Tests** - Performance regression testing using `criterion`

### Test Requirements

- All public functions must have tests
- Edge cases and error conditions must be tested
- Performance-critical paths should have benchmarks
- Cross-platform functionality should be tested

### Running Tests

```bash
# Run all tests
cargo test

# Run tests with all features
cargo test --all-features

# Run tests without default features
cargo test --no-default-features

# Run specific test module
cargo test mouse::tests

# Run benchmarks
cargo bench

# Run with coverage
cargo tarpaulin --out Html
```

## Documentation Standards

### Types of Documentation

1. **API Documentation** - Generated from code comments
2. **User Guides** - Markdown files in `docs/guides/`
3. **Examples** - Working code in `examples/`
4. **README** - Project overview and quick start

### Documentation Requirements

- All public APIs must be documented
- Include examples for complex functionality
- Explain performance characteristics
- Document error conditions
- Keep documentation up to date with code changes

### Building Documentation

```bash
# Generate API documentation
cargo doc --all-features --no-deps --open

# Check documentation links
cargo doc --all-features --no-deps

# Build documentation book (if using mdbook)
mdbook build docs/
```

## Performance Considerations

### Performance Requirements

HUMaiN2.7 has strict performance requirements:

- **Mouse humanization**: <2ms latency (P95)
- **Typing humanization**: <1ms latency (P95)
- **Audio processing**: Real-time capable (<5ms)
- **Memory usage**: <200MB for full feature set
- **CPU usage**: <50% on modern multi-core systems

### Benchmarking

Use `criterion` for performance testing:

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_mouse_humanization(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    let humanizer = rt.block_on(MouseHumanizer::new()).unwrap();
    let input = create_benchmark_input();
    
    c.bench_function("mouse_humanization", |b| {
        b.iter(|| {
            rt.block_on(humanizer.humanize_mouse_movement(black_box(input.clone())))
        })
    });
}

criterion_group!(benches, benchmark_mouse_humanization);
criterion_main!(benches);
```

### Memory Management

- Use `Box<[T]>` instead of `Vec<T>` for fixed-size data
- Consider memory-mapped files for large datasets
- Implement `Drop` for types that hold sensitive data
- Profile memory usage with tools like `valgrind` or `heaptrack`

## Security Guidelines

### Security Requirements

- All sensitive data must be encrypted at rest
- Memory containing sensitive data must be securely cleared
- Input validation is required for all external data
- No sensitive information in logs or error messages
- Regular security audits using `cargo audit`

### Secure Coding Practices

```rust
use crate::utils::clear_sensitive_memory;

struct SensitiveData {
    data: Vec<u8>,
}

impl Drop for SensitiveData {
    fn drop(&mut self) {
        // Securely clear sensitive data
        clear_sensitive_memory(&mut self.data);
    }
}

pub fn process_sensitive_input(input: &[u8]) -> Result<ProcessedData> {
    // Validate input
    if input.is_empty() {
        return Err(HumainError::validation("Input cannot be empty"));
    }
    
    if input.len() > MAX_INPUT_SIZE {
        return Err(HumainError::validation("Input too large"));
    }
    
    // Process data...
    Ok(ProcessedData::new())
}
```

### Security Testing

```bash
# Run security audit
cargo audit

# Check for security issues
cargo deny check

# Static analysis
clippy -W clippy::security
```

## Release Process

### Version Numbers

HUMaiN2.7 follows semantic versioning:
- **Major** (X.y.z): Breaking changes
- **Minor** (x.Y.z): New features, backward compatible
- **Patch** (x.y.Z): Bug fixes, backward compatible

### Release Checklist

1. **Update version numbers**:
   - `Cargo.toml`
   - `README.md`
   - Documentation

2. **Update CHANGELOG.md**:
   - Add new version section
   - Document all changes
   - Include performance impact

3. **Run full test suite**:
   ```bash
   cargo test --all-features
   cargo bench
   cargo audit
   ```

4. **Create release PR**:
   - Update all documentation
   - Include migration guide if needed
   - Tag with version number

5. **Publish release**:
   ```bash
   cargo publish --dry-run
   cargo publish
   ```

## Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and community discussion
- **Discord** - Real-time chat and community support
- **Email** - Security issues and private communications

### Community Guidelines

- Be respectful and inclusive
- Help newcomers learn and contribute
- Share knowledge and best practices
- Provide constructive feedback
- Follow the code of conduct

### Recognition

We recognize contributors through:
- GitHub contributor graph
- CHANGELOG.md acknowledgments
- Social media mentions
- Community spotlights

## Getting Help

If you need help with contributing:

1. **Read the documentation** - Most questions are answered in the docs
2. **Search existing issues** - Your question might already be answered
3. **Ask in discussions** - GitHub Discussions for general questions
4. **Join Discord** - Real-time help from the community
5. **Create an issue** - For bug reports or feature requests

## Thank You

Thank you for contributing to HUMaiN2.7! Your contributions help make this project better for everyone. We appreciate your time and effort in improving human-like AI interaction technology while maintaining privacy and security standards.

---

*For questions about this contributing guide, please open an issue or contact the maintainers.*