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

# 5. Download default female voice model (es_AR-daniela-high)
VOICE_NAME="es_AR-daniela-high"
VOICE_ONNX="$VOICES_DIR/$VOICE_NAME.onnx"
VOICE_JSON="$VOICES_DIR/$VOICE_NAME.onnx.json"

if [ ! -f "$VOICE_ONNX" ] || [ ! -f "$VOICE_JSON" ]; then
    echo "🎙️  Downloading default female Piper voice model ($VOICE_NAME)..."
    BASE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_AR/daniela/high"
    
    curl -L --progress-bar "$BASE_URL/es_AR-daniela-high.onnx" -o "$VOICE_ONNX"
    curl -L --progress-bar "$BASE_URL/es_AR-daniela-high.onnx.json" -o "$VOICE_JSON"
    echo "✅ Female Argentina voice model downloaded successfully."
else
    echo "🎙️  Female voice model $VOICE_NAME is already present."
fi

# 6. Generate synthesized SFX WAV notification tones locally
echo "🔔 Generating SFX notification sound tones..."
"$VENV_DIR/bin/python" - << 'EOF'
import os
import wave
import math
import struct

sfx_dir = os.path.expanduser("~/.valentinIA/sfx")

def generate_tone(filename, frequencies_with_duration, sample_rate=22050, volume=0.5):
    filepath = os.path.join(sfx_dir, filename)
    audio_data = []
    
    for freq, duration_ms in frequencies_with_duration:
        num_samples = int(sample_rate * (duration_ms / 1000.0))
        if freq == 0:
            for _ in range(num_samples):
                audio_data.append(0)
        else:
            for i in range(num_samples):
                sample = volume * math.sin(2 * math.pi * freq * i / sample_rate)
                # Apply envelope fade out
                fade = 1.0 - (i / num_samples) * 0.3
                audio_data.append(int(sample * fade * 32767))
                
    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        packed_data = struct.pack(f'<{len(audio_data)}h', *audio_data)
        wav_file.writeframes(packed_data)

# Start chime (Soft ascending arpeggio)
generate_tone("start.wav", [(440, 80), (554, 80), (659, 120)])

# Success chime (Cheerful arpeggio C5 -> E5 -> G5 -> C6)
generate_tone("success.wav", [(523, 70), (659, 70), (783, 70), (1046, 150)])

# Error chime (Two low descending warning tones)
generate_tone("error.wav", [(261, 120), (0, 30), (196, 200)])

# Human input required chime (Double attention beep)
generate_tone("human_input_required.wav", [(880, 90), (0, 40), (880, 120)])

# Session / token limit chime (Warning tone)
generate_tone("session_limit.wav", [(600, 100), (0, 30), (450, 150)])
generate_tone("token_limit.wav", [(600, 100), (0, 30), (450, 150)])
generate_tone("subscription_problem.wav", [(350, 150), (0, 30), (280, 200)])

print("✅ All SFX tone files generated successfully.")
EOF

# 7. Create initial .env if not present
if [ ! -f ".env" ]; then
    echo "⚙️  Creating default .env configuration file..."
    cat << 'EOF' > .env
READ_MODE=events
SILENT_MODE=false
DEFAULT_VOICE=es_AR-daniela-high
DEFAULT_SPEED=1.0
EOF
fi

echo ""
echo "🎉 Local setup completed successfully!"
echo "📍 Python Executable Path: $VENV_DIR/bin/python"
echo "📍 Voices Path: $VOICES_DIR"
echo "📍 SFX Path: $SFX_DIR"
