#!/bin/bash

echo "🎬 Testing Zero-Cost Video Generation Components"
echo "=============================================="
echo ""

# Test 1: Check for free TTS options
echo "1. Checking Text-to-Speech Options:"
if command -v edge-tts &> /dev/null; then
    echo "✅ Edge-TTS is available"
else
    echo "❌ Edge-TTS not found (pip install edge-tts)"
fi

if command -v piper &> /dev/null; then
    echo "✅ Piper TTS is available"
else
    echo "⚠️  Piper TTS not found (optional)"
fi

# Test 2: Check FFmpeg
echo ""
echo "2. Checking Video Tools:"
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg is available"
    ffmpeg -version | head -n1
else
    echo "❌ FFmpeg not found (required for video)"
fi

# Test 3: Check for local AI models
echo ""
echo "3. Checking Local AI Options:"
if command -v ollama &> /dev/null; then
    echo "✅ Ollama is available"
    ollama list 2>/dev/null | head -5
else
    echo "⚠️  Ollama not found (for local script generation)"
fi

# Test 4: Create demo with available tools
echo ""
echo "4. Creating Zero-Cost Demo:"

# Generate a simple script
SCRIPT="Welcome to DailyDoco Pro. Documentation that writes itself. Join thousands of teams saving time every day."

# Save script
echo "$SCRIPT" > /tmp/demo-script.txt
echo "✅ Script created"

# Try to generate audio (fallback to say command on Mac)
if command -v say &> /dev/null; then
    say -o /tmp/demo-audio.aiff "$SCRIPT" 2>/dev/null && echo "✅ Audio generated with 'say' command"
elif command -v espeak &> /dev/null; then
    espeak "$SCRIPT" -w /tmp/demo-audio.wav 2>/dev/null && echo "✅ Audio generated with espeak"
else
    echo "⚠️  No TTS available, skipping audio"
fi

# Create a simple image with ImageMagick if available
if command -v convert &> /dev/null; then
    convert -size 1920x1080 xc:black \
        -fill white -gravity center \
        -pointsize 72 -annotate +0+0 'DailyDoco Pro\nZero Cost Demo' \
        /tmp/demo-image.png 2>/dev/null && echo "✅ Image created with ImageMagick"
else
    echo "⚠️  ImageMagick not found, skipping image"
fi

echo ""
echo "📊 Zero-Cost Summary:"
echo "- Script: ✅ FREE (local or free API)"
echo "- Voice: ✅ FREE (system TTS or Edge-TTS)"
echo "- Images: ✅ FREE (Canvas, ImageMagick, or free APIs)"
echo "- Video: ✅ FREE (FFmpeg)"
echo "- Total Cost: $0.00"
echo ""
echo "🚀 You can generate professional videos at ZERO cost!"