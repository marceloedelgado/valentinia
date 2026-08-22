#!/usr/bin/env bash
# ==============================================================================
# valentinIA - Local Setup Script
# ==============================================================================

set -e

VALENTINIA_DIR="$HOME/.valentinIA"
VENV_DIR="$VALENTINIA_DIR/venv"
VOICES_DIR="$VALENTINIA_DIR/voices"
SFX_DIR="$VALENTINIA_DIR/sfx"
TEMP_DIR="$VALENTINIA_DIR/temp"

echo "🗣️  Starting local setup for valentinIA..."

# 1. Create directory structure
echo "📁 Creating base directory structure at $VALENTINIA_DIR..."
mkdir -p "$VALENTINIA_DIR" "$VOICES_DIR" "$SFX_DIR" "$TEMP_DIR"

# 2. Check Python 3 availability
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed on this system."
    exit 1
fi

# 3. Create virtual environment
if [ ! -d "$VENV_DIR" ]; then
    echo "🐍 Creating Python virtual environment at $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
else
    echo "🐍 Existing virtual environment detected at $VENV_DIR."
fi

# 4. Install PIP dependencies
echo "📦 Installing Python dependencies (mcp, piper-tts, python-dotenv)..."
"$VENV_DIR/bin/pip" install --upgrade pip --quiet
"$VENV_DIR/bin/pip" install mcp piper-tts python-dotenv --quiet

# 5. Provision base default voice model via setup.py
echo "🎙️  Provisioning base high-quality female voice model..."
"$VENV_DIR/bin/python" setup.py --non-interactive

echo ""
echo "🎉 Local setup completed successfully!"
echo "📍 Python Executable Path: $VENV_DIR/bin/python"
echo "📍 Voices Path: $VOICES_DIR"
echo "📍 SFX Path: $SFX_DIR"
echo ""
echo "💡 Run 'python3 setup.py' anytime to launch the interactive voice wizard."
