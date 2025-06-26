# Multi-stage Dockerfile for YouTube Automation Pipeline

# Stage 1: Build dependencies
FROM python:3.12-slim as builder

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install uv (ultra-fast Python package manager)
RUN pip install uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml .
COPY uv.lock .

# Install Python dependencies using uv
RUN uv sync --frozen --no-dev

# Stage 2: Runtime image
FROM python:3.12-slim as runtime

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # FFmpeg for video processing
    ffmpeg \
    # OpenCV dependencies
    libopencv-dev \
    python3-opencv \
    # Audio processing
    libsndfile1-dev \
    # GPU support (NVIDIA)
    libnvidia-encode-470 \
    # System utilities
    curl \
    wget \
    unzip \
    # Cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install NVIDIA GPU drivers and CUDA toolkit (for GPU acceleration)
RUN wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb \
    && dpkg -i cuda-keyring_1.0-1_all.deb \
    && apt-get update \
    && apt-get install -y cuda-toolkit-12-3 \
    && rm cuda-keyring_1.0-1_all.deb

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PATH="/opt/venv/bin:$PATH"
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,video,utility

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/logs /app/temp /app/storage /app/credentials \
    && chown -R appuser:appuser /app

# Install additional Python packages that might be needed at runtime
RUN pip install --no-cache-dir \
    # GPU-specific packages
    torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 \
    # Additional AI/ML packages
    transformers[torch] \
    sentence-transformers \
    # Video processing
    opencv-python-headless \
    imageio[ffmpeg] \
    # Audio processing
    librosa \
    soundfile

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Default command (can be overridden)
CMD ["python", "-m", "youtube_automation_pipeline.api.main"]

# Alternative entrypoints for different services:
# API Server: python -m youtube_automation_pipeline.api.main
# Celery Worker: celery -A youtube_automation_pipeline.workers.celery_app worker --loglevel=info
# Celery Beat: celery -A youtube_automation_pipeline.workers.celery_app beat --loglevel=info
# Celery Flower: celery -A youtube_automation_pipeline.workers.celery_app flower
