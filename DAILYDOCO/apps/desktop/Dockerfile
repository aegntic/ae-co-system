# Multi-stage build for Rust desktop engine
FROM rust:1.75 AS builder

WORKDIR /app

# Install system dependencies for capture and GPU acceleration
RUN apt-get update && apt-get install -y \
    pkg-config \
    libx11-dev \
    libxrandr-dev \
    libxi-dev \
    libgl1-mesa-dev \
    libglu1-mesa-dev \
    libasound2-dev \
    libpulse-dev \
    libudev-dev \
    libvulkan-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace configuration
COPY Cargo.toml Cargo.lock ./
COPY libs/ ./libs/

# Copy desktop app source
COPY apps/desktop/ ./apps/desktop/

# Build the application
WORKDIR /app/apps/desktop
RUN cargo build --release

# Production stage
FROM debian:bookworm-slim

# Install runtime dependencies for GPU and display
RUN apt-get update && apt-get install -y \
    libx11-6 \
    libxrandr2 \
    libxi6 \
    libgl1-mesa-glx \
    libglu1-mesa \
    libasound2 \
    libpulse0 \
    libudev1 \
    libvulkan1 \
    mesa-vulkan-drivers \
    intel-media-va-driver \
    vainfo \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user with video group access
RUN groupadd -r dailydoco && useradd -r -g dailydoco -G video,audio dailydoco

WORKDIR /app

# Copy the built binary
COPY --from=builder /app/target/release/dailydoco-desktop ./

# Create necessary directories
RUN mkdir -p output config && chown -R dailydoco:dailydoco .

USER dailydoco

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD ./dailydoco-desktop --health-check || exit 1

# Expose any necessary ports (if the desktop engine has an API)
EXPOSE 8082

ENTRYPOINT ["./dailydoco-desktop"]