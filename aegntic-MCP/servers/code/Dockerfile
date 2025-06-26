# Porkbun MCP Server - Production Dockerfile
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Create app user for security
RUN groupadd -r porkbun && useradd --no-log-init -r -g porkbun porkbun

# Install system dependencies
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/logs /app/data /app/ssl_certificates /app/temp && \
    chown -R porkbun:porkbun /app

# Switch to non-root user
USER porkbun

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import asyncio; from porkbun_mcp_server import PorkbunMCPServer; exit(0)"

# Expose port (if running as HTTP server)
EXPOSE 8080

# Default command
CMD ["python", "porkbun_mcp_server.py"]

# Multi-stage build for development
FROM base AS development

# Install development dependencies
RUN pip install --no-cache-dir pytest pytest-asyncio pytest-cov black flake8 mypy

# Switch back to root for development tools
USER root

# Install development tools
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Switch back to app user
USER porkbun

# Development command with auto-reload
CMD ["python", "-m", "pytest", "test_porkbun_mcp.py", "-v"]

# Production stage
FROM base AS production

# Remove build dependencies
USER root
RUN apt-get purge -y build-essential && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Switch to app user
USER porkbun

# Production command
CMD ["python", "porkbun_mcp_server.py"]
