# YouTube Intelligence Engine Dockerfile
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install uv for fast Python package management
RUN pip install uv

# Copy dependency files
# These files should be at the root of the build context (i.e., youtube-intelligence/)
COPY pyproject.toml ./
# Optional: Copy README if it's small and relevant for build context, otherwise not strictly needed.
# COPY README.md ./

# Install Python dependencies using uv
# Ensure pyproject.toml specifies an editable install or all necessary packages for runtime.
# If using -e ., the source code needs to be copied before this step.
# For non-editable install, this can come before copying all source.
# Let's assume non-editable for a cleaner image, source copied later.
RUN uv pip install --system --no-cache-dir -r <(grep -E '^[a-zA-Z0-9_!<=>~@.\-\[\]]+' pyproject.toml | sed -e '/^\[/d' -e '/^$/d' -e 's/"//g' -e 's/,//g' -e '/^name =/d' -e '/^version =/d' -e '/^description =/d' -e '/^readme =/d' -e '/^requires-python =/d' -e '/^dependencies =/d' -e 's/ //g' | grep -v "\[project.optional-dependencies\]" | grep -v "\[build-system\]" | grep -v "\[tool.*")


# Copy application code
# This should copy all necessary Python modules (core, api, graph, services) and main.py, config.py
COPY core ./core
COPY api ./api
COPY graph ./graph
COPY services ./services
COPY main.py .
COPY config.py .
# COPY examples ./examples # Optional, if needed in image
COPY scripts ./scripts # If init-db.sql is run from here, or other scripts are needed

# Create required directories if not copied
RUN mkdir -p temp snapshots logs

# Expose port
EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["uv", "run", "python", "main.py"]
