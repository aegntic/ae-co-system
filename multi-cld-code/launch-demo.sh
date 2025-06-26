#!/bin/bash

# CCTM Terminal Grid Demo Launcher
echo "🚀 {ae}CCTM Terminal Grid Demo"
echo "================================"
echo ""
echo "This demo showcases:"
echo "✓ 18+ system terminal instances in a grid"
echo "✓ Controller window for management"
echo "✓ Neon glow effects on active terminals"
echo "✓ Ctrl+Tab cycling (simulated)"
echo ""

# Simple terminal grid launcher using xterm as fallback
launch_terminal_grid() {
    echo "🔧 Launching terminal grid..."
    
    # Detect available terminal
    TERM_CMD=""
    if command -v alacritty &> /dev/null; then
        TERM_CMD="alacritty"
    elif command -v kitty &> /dev/null; then
        TERM_CMD="kitty"
    elif command -v gnome-terminal &> /dev/null; then
        TERM_CMD="gnome-terminal"
    else
        TERM_CMD="xterm"
    fi
    
    echo "📟 Using terminal: $TERM_CMD"
    
    # Launch 18 terminals in a 6x3 grid
    for row in {0..2}; do
        for col in {0..5}; do
            idx=$((row * 6 + col))
            x=$((400 + col * 320))
            y=$((100 + row * 220))
            
            # Launch terminal with position and size
            case $TERM_CMD in
                alacritty)
                    $TERM_CMD --position $x,$y --dimensions 40,15 --title "CCTM Terminal $((idx+1))" &
                    ;;
                kitty)
                    $TERM_CMD --title "CCTM Terminal $((idx+1))" --override initial_window_width=400 initial_window_height=200 &
                    ;;
                gnome-terminal)
                    $TERM_CMD --geometry=40x15+$x+$y --title="CCTM Terminal $((idx+1))" -- bash -c 'echo "CCTM Terminal '$((idx+1))' Ready"; exec bash' &
                    ;;
                *)
                    $TERM_CMD -geometry 40x15+$x+$y -title "CCTM Terminal $((idx+1))" -e bash &
                    ;;
            esac
            
            # Small delay to prevent overwhelming the system
            sleep 0.1
        done
    done
    
    echo "✅ Launched 18 terminal instances"
    echo ""
    echo "🎮 Controller Features (simulated):"
    echo "   • Double-click any terminal to maximize (manual)"
    echo "   • Ctrl+Tab to cycle through terminals (use Alt+Tab)"
    echo "   • Drag terminals to reposition"
    echo "   • Active terminal has neon green glow (imagine it!)"
    echo ""
    echo "Press Ctrl+C to close all terminals"
}

# Trap to clean up on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    pkill -f "CCTM Terminal" 2>/dev/null
    exit 0
}

trap cleanup INT

# Launch the demo
launch_terminal_grid

# Keep script running
while true; do
    sleep 1
done