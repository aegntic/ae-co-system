#!/bin/bash

# DailyDoco Pro Launch Script
# Attempts to resolve libsoup2/3 conflicts

export DAILYDOCO_HOME="/home/tabs/DAILYDOCO/apps/desktop"
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export GTK_THEME=Adwaita:dark
export GDK_BACKEND=x11

# Try to prevent libsoup conflicts
export LD_PRELOAD="/usr/lib/x86_64-linux-gnu/libsoup-2.4.so.1"

cd "$DAILYDOCO_HOME"

echo "🚀 Launching DailyDoco Pro..."
echo "Working directory: $(pwd)"
echo "Binary path: $DAILYDOCO_HOME/target/debug/dailydoco-desktop"

# Launch with error handling
if [ -f "$DAILYDOCO_HOME/target/debug/dailydoco-desktop" ]; then
    exec "$DAILYDOCO_HOME/target/debug/dailydoco-desktop" "$@"
else
    echo "❌ DailyDoco Pro binary not found!"
    echo "Please build the application first with: cargo build"
    exit 1
fi