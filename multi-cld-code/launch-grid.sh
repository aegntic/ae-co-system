#!/bin/bash

# {ae}CCTM Terminal Grid Launcher
# This script launches CCTM with a grid of system terminal instances

echo "🚀 Launching {ae}CCTM Terminal Grid Manager..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 3A: Hub-Engine Architecture"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if CCTM is built
if [ ! -f "src-tauri/target/release/cctm" ]; then
    echo "⚙️  Building CCTM..."
    cd src-tauri && cargo build --release && cd ..
fi

# Set environment variables for optimal performance
export RUST_LOG=info
export CCTM_TERMINAL_GRID=true
export CCTM_GRID_SIZE=18
export CCTM_MAX_MAXIMIZED=4

echo "✅ Environment configured:"
echo "   - Grid Size: $CCTM_GRID_SIZE terminals"
echo "   - Max Maximized: $CCTM_MAX_MAXIMIZED terminals"
echo "   - Terminal Emulator: Auto-detected"
echo ""
echo "📋 Instructions:"
echo "   - Controller window will appear in top-left"
echo "   - Double-click any terminal to maximize"
echo "   - Drag maximized terminals to reposition"
echo "   - Up to 4 terminals can be maximized"
echo ""
echo "🎯 Starting CCTM Terminal Grid..."

# Launch CCTM
./src-tauri/target/release/cctm