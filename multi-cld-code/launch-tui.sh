#!/bin/bash

# CCTM TUI Launcher Script
# Production-ready terminal manager with sophisticated predictive completion

echo "🚀 {ae} CCTM TUI Launcher"
echo "════════════════════════════"
echo "Choose your TUI experience:"
echo ""
echo "1. 🎯 Advanced TUI (Production-Ready)"
echo "   • Sophisticated terminal control with termios"
echo "   • Automatic TTY detection and fallback"
echo "   • Production-grade error handling"
echo ""
echo "2. 🧠 Predictive TUI (Cursor-style Completion)"
echo "   • Revolutionary predictive typing"
echo "   • Tab completion and arrow navigation"
echo "   • Context-aware suggestions"
echo ""
echo "3. 📊 Simple TUI (Basic Interface)"
echo "   • Clean command-line interface"
echo "   • Essential terminal management"
echo "   • Lightweight and fast"
echo ""

read -p "Select TUI version (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🎯 Launching Advanced TUI with Production Terminal Control..."
        echo "   • TTY Detection: Automatic"
        echo "   • Raw Mode: Available (if TTY detected)"
        echo "   • Fallback: Line mode for non-TTY"
        echo ""
        cargo run --bin cctm-advanced
        ;;
    2)
        echo ""
        echo "🧠 Launching Predictive TUI with Cursor-style Completion..."
        echo "   • Predictive Typing: Active"
        echo "   • Tab Completion: Enabled"
        echo "   • Context Analysis: Real-time"
        echo ""
        rustc cctm-tui-predictive.rs -o cctm-predictive && ./cctm-predictive
        ;;
    3)
        echo ""
        echo "📊 Launching Simple TUI Interface..."
        echo "   • Clean Interface: Optimized"
        echo "   • Essential Features: Core terminal management"
        echo "   • Performance: Lightning fast"
        echo ""
        rustc cctm-tui-simple.rs -o cctm-simple && ./cctm-simple
        ;;
    *)
        echo ""
        echo "❌ Invalid selection. Please run the script again and choose 1-3."
        exit 1
        ;;
esac

echo ""
echo "👋 Thanks for using {ae} CCTM TUI!"
echo "   aegntic.ai | {ae} | Revolutionary AI Development Tools"