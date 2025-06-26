# Stage 1: Build React Client
FROM node:20 as client-builder
WORKDIR /app/client

# Copy package files and install dependencies
COPY client/package.json client/package-lock.json ./
RUN npm ci

# Copy the rest of the client source code
COPY client/ ./

# Build the client application
RUN npm run build

# Stage 2: Build Electron App
FROM node:20 as builder
WORKDIR /app

# Install dependencies needed by electron-builder for Linux builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    fakeroot \
    dpkg \
    libx11-dev \
    libxkbfile-dev \
    libsecret-1-dev \
    libgbm-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy root package files and install dependencies (including devDependencies for builder)
COPY package.json package-lock.json ./
RUN npm ci

# Copy Electron source code and any assets
COPY electron ./electron
COPY client/ ./client

# Copy the built client from the previous stage
COPY --from=client-builder /app/client/build ./client/build

# Run electron-builder for Linux targets (e.g., AppImage, deb)
# This assumes your package.json build config is set up for Linux targets
RUN NODE_ENV=development ELECTRON_BUILDER_LOG_LEVEL=verbose npx electron-builder --linux

# Debug: List contents of /app/dist
RUN ls -la /app/dist

# Stage 3: Final stage to collect artifacts
FROM scratch
WORKDIR /dist
COPY --from=builder /app/dist ./