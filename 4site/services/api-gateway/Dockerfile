# ================================================================================================
# ENTERPRISE API GATEWAY DOCKERFILE - $100B COMPANY STANDARDS
# Zero-compromise security, performance, and reliability
# ================================================================================================

FROM node:20-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S gateway && \
    adduser -S gateway -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# ================================================================================================
# DEPENDENCIES STAGE
# ================================================================================================
FROM base AS deps

# Install dependencies with production optimizations
RUN npm ci --only=production && npm cache clean --force

# ================================================================================================
# BUILD STAGE
# ================================================================================================
FROM base AS build

# Install all dependencies for building
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ================================================================================================
# PRODUCTION STAGE
# ================================================================================================
FROM base AS runner

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Switch to non-root user
USER gateway

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/enterprise-gateway.js"]