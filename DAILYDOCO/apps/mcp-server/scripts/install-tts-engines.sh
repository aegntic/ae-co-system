#!/bin/bash

# TTS Engine Installation Script for DailyDoco Pro
# Installs multiple open-source TTS engines for video narration

echo "🎙️  Installing TTS Engines for DailyDoco Pro..."
echo "============================================"

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

echo "📍 Detected OS: $OS"
echo ""

# Install eSpeak
echo "1️⃣  Installing eSpeak..."
if [[ "$OS" == "linux" ]]; then
    sudo apt-get update
    sudo apt-get install -y espeak espeak-ng
elif [[ "$OS" == "macos" ]]; then
    brew install espeak
fi

# Install Python and pip if not present
echo "2️⃣  Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "Installing Python 3..."
    if [[ "$OS" == "linux" ]]; then
        sudo apt-get install -y python3 python3-pip
    elif [[ "$OS" == "macos" ]]; then
        brew install python3
    fi
fi

# Install Python TTS libraries
echo "3️⃣  Installing Python TTS libraries..."
pip3 install --user gTTS pyttsx3

# Install Coqui TTS (optional - larger download)
echo "4️⃣  Installing Coqui TTS (optional - this may take a while)..."
read -p "Install Coqui TTS? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pip3 install --user TTS
else
    echo "Skipping Coqui TTS installation"
fi

# Install Piper (optional)
echo "5️⃣  Installing Piper TTS (optional)..."
read -p "Install Piper TTS? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [[ "$OS" == "linux" ]]; then
        # Download Piper binary
        wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz
        tar -xzf piper_linux_x86_64.tar.gz
        sudo mv piper /usr/local/bin/
        rm piper_linux_x86_64.tar.gz
        
        # Download a voice model
        mkdir -p ~/.piper-voices
        cd ~/.piper-voices
        wget https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-amy-low.tar.gz
        tar -xzf voice-en-us-amy-low.tar.gz
        cd -
    else
        echo "⚠️  Piper installation on macOS requires manual setup"
        echo "Visit: https://github.com/rhasspy/piper"
    fi
else
    echo "Skipping Piper TTS installation"
fi

# Install FFmpeg (required for audio processing)
echo "6️⃣  Installing FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    if [[ "$OS" == "linux" ]]; then
        sudo apt-get install -y ffmpeg
    elif [[ "$OS" == "macos" ]]; then
        brew install ffmpeg
    fi
else
    echo "FFmpeg already installed"
fi

# Test installations
echo ""
echo "🧪 Testing installations..."
echo "=========================="

# Test eSpeak
if command -v espeak &> /dev/null; then
    echo "✅ eSpeak installed"
    espeak "Hello from eSpeak" 2>/dev/null || echo "⚠️  eSpeak test failed"
else
    echo "❌ eSpeak not found"
fi

# Test gTTS
if python3 -c "import gtts" 2>/dev/null; then
    echo "✅ gTTS installed"
else
    echo "❌ gTTS not found"
fi

# Test pyttsx3
if python3 -c "import pyttsx3" 2>/dev/null; then
    echo "✅ pyttsx3 installed"
else
    echo "❌ pyttsx3 not found"
fi

# Test FFmpeg
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg installed"
else
    echo "❌ FFmpeg not found"
fi

echo ""
echo "🎉 TTS engine installation complete!"
echo ""
echo "Available TTS engines:"
echo "- eSpeak (fast, robotic)"
echo "- gTTS (natural, requires internet)"
echo "- pyttsx3 (system voices)"
if python3 -c "import TTS" 2>/dev/null; then
    echo "- Coqui TTS (high quality)"
fi
if command -v piper &> /dev/null; then
    echo "- Piper (fast, natural)"
fi

echo ""
echo "📝 Note: Restart your terminal or run 'source ~/.bashrc' to update PATH"