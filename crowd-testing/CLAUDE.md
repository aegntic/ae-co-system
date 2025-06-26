# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**crowd-testing** is a Rust library that implements the AI Test Audience system for DailyDoco Pro. It creates synthetic audiences of 50-100 viewers to evaluate video documentation content before publication, providing engagement predictions, drop-off analysis, and optimization recommendations.

This is a workspace member of the larger DailyDoco Pro ecosystem located at `/home/tabs/ae-co-system/DAILYDOCO/libs/test-audience/` and symlinked to this directory.

## Key Architecture

### Core Components
- `persona_generator.rs` - Creates synthetic viewers with ML-powered behavior patterns
- `engagement_engine.rs` - Predicts content engagement and retention metrics
- `diversity_optimizer.rs` - Ensures realistic distribution of viewer personas
- `realism_enhancer.rs` - Enhances authenticity of synthetic behaviors
- `ml_engines.rs` - Machine learning engines for personality and behavior modeling
- `types.rs` - Type definitions for personas, behaviors, and platform-specific traits
- `lib.rs` - Main library interface exposing `TestAudienceSystem` API

### Key Features
- Ultra-realistic persona generation (junior developers, senior engineers, tech leads, PMs)
- Platform-specific behavior modeling (YouTube, LinkedIn, internal platforms)
- Real-time engagement prediction with confidence metrics
- Drop-off point detection and optimization recommendations
- Performance target: < 2x realtime processing

## Development Commands

### Build & Test
```bash
# Since this is a workspace member, run from DAILYDOCO directory:
cd /home/tabs/ae-co-system/DAILYDOCO
cargo build --package test-audience
cargo test --package test-audience

# Or if you want to work directly in this directory, create a Cargo.toml first:
# Then standard Rust commands:
cargo build
cargo test
cargo bench
cargo check
cargo fmt
cargo clippy -- -D warnings
```

### Quality Standards
```bash
# Code formatting
cargo fmt

# Linting (must pass without warnings)
cargo clippy -- -D warnings

# Run tests
cargo test

# Check without building
cargo check

# Run with debug logging
RUST_LOG=debug cargo run

# Run with backtrace on error
RUST_BACKTRACE=1 cargo run
```

### Integration Testing
```bash
# Run test audience simulation from DAILYDOCO directory
cd /home/tabs/ae-co-system/DAILYDOCO
bun run test:audience

# Or using nx:
nx run test-audience:simulate
```

## Architecture Patterns

### Performance Requirements
- Processing: < 2x realtime for video analysis
- Memory: < 200MB during operation
- Startup: < 3 seconds initialization
- Accuracy: > 95% behavior authenticity

### API Design
The library exposes a clean public API through `lib.rs`:
- `TestAudienceSystem` - Main orchestrator
- `PersonaGenerator` - Creates synthetic viewers
- `EngagementEngine` - Analyzes and predicts engagement
- Platform-specific traits for behavior modeling

### Dependencies
All dependencies are managed at the workspace level in `/home/tabs/ae-co-system/DAILYDOCO/Cargo.toml`. Key dependencies include:
- `tokio` - Async runtime
- `serde` - Serialization
- `uuid` - Unique identifiers
- `chrono` - Date/time handling

## Integration with DailyDoco Pro

This library is used by:
- Desktop app for real-time content validation
- API server for batch processing
- MCP server for Claude integration
- Web dashboard for visualization

The test audience results influence:
- Video compilation decisions
- Content optimization recommendations
- Publishing confidence scores
- Platform-specific adjustments