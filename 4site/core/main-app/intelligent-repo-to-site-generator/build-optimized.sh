#!/bin/bash

# 4site.pro Ultra Elite Build Script
# Implements 100B Standards for production deployment

echo "🚀 Starting Ultra Elite Build Process..."

# Pre-build optimizations
echo "🧹 Pre-build cleanup..."
rm -rf dist/
rm -rf node_modules/.vite/

# Install dependencies with performance focus
echo "📦 Installing dependencies..."
bun install --frozen-lockfile

# Type checking
echo "🔍 Type checking..."
bun run type-check

# Build with performance monitoring
echo "🏗️  Building with performance optimization..."
time bun run build

# Post-build analysis
echo "📊 Analyzing build performance..."

# Bundle size analysis
echo "Bundle sizes:"
find dist -name "*.js" -exec ls -lh {} \; | awk '{print $5 "\t" $9}'
echo ""
find dist -name "*.css" -exec ls -lh {} \; | awk '{print $5 "\t" $9}'

# Compression analysis
echo "\nCompression analysis:"
find dist -name "*.gz" -exec bash -c 'original=${1%.gz}; echo "$(ls -lh "$original" | awk "{print \$5}") → $(ls -lh "$1" | awk "{print \$5}") ($(basename "$1"))"' _ {} \;

# Performance validation
echo "\n🎯 Running performance validation..."
node quick-performance-test.js

# Security checks
echo "\n🔒 Security validation..."
if command -v audit &> /dev/null; then
    bun audit --audit-level high
fi

# Final summary
echo "\n✅ Build complete!"
echo "📄 Performance report: dist/performance-report.json"
echo "📊 Bundle analysis: dist/bundle-analysis.html"

# Start server for testing (optional)
if [[ "$1" == "--serve" ]]; then
    echo "\n🌐 Starting preview server..."
    bun run preview
fi