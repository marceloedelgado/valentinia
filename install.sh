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

NON_INTERACTIVE=false

for arg in "$@"; do
  case $arg in
    -y|--non-interactive)
      NON_INTERACTIVE=true
      shift
      ;;
  esac
done

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

# 5. Fetch global Piper voices catalog (voices.json)
CATALOG_FILE="$TEMP_DIR/voices.json"
echo "🌐 Fetching global Piper voice catalog..."
curl -s -L "https://huggingface.co/rhasspy/piper-voices/resolve/main/voices.json" -o "$CATALOG_FILE"

# 6. Run interactive voice selector via Python
VOICE_SELECTION_OUTPUT=$("$VENV_DIR/bin/python" - "$NON_INTERACTIVE" << 'EOF'
import sys
import json
import os

non_interactive = sys.argv[1].lower() == "true"
catalog_path = os.path.expanduser("~/.valentinIA/temp/voices.json")

if not os.path.exists(catalog_path):
    print("DEFAULT|en_US-amy-medium|https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx|https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json")
    sys.exit(0)

with open(catalog_path, "r", encoding="utf-8") as f:
    catalog = json.load(f)

def search_catalog(query):
    q = query.strip().lower()
    matches = []
    for key, info in catalog.items():
        lang = info.get("language", {})
        code = lang.get("code", "").lower()
        family = lang.get("family", "").lower()
        region = lang.get("region", "").lower()
        country = lang.get("country_english", "").lower()
        name_eng = lang.get("name_english", "").lower()
        name_nat = lang.get("name_native", "").lower()

        if (q == region or q == code or q == country or q == family or q == name_eng or q == name_nat or q in code or q in country or q in key.lower()):
            matches.append((key, info))

    matches.sort(key=lambda item: 0 if (item[1].get("language", {}).get("region", "").lower() == q or item[1].get("language", {}).get("code", "").lower() == q or item[1].get("language", {}).get("country_english", "").lower() == q) else 1)
    return matches

selected_key = "en_US-amy-medium"

if not non_interactive and sys.stdin.isatty():
    try:
        sys.stderr.write("\n🌍 Search global Piper voices by country code, country name, or language (e.g. AR, Argentina, es_ES, US, pt_BR, MX):\n")
        sys.stderr.write("Input query [Default: en_US]: ")
        sys.stderr.flush()
        user_query = sys.stdin.readline().strip()
        if not user_query:
            user_query = "en_US"

        results = search_catalog(user_query)
        if not results:
            sys.stderr.write(f"⚠️ No matches found for '{user_query}'. Falling back to default en_US-amy-medium.\n")
            selected_key = "en_US-amy-medium"
        elif len(results) == 1:
            selected_key = results[0][0]
            sys.stderr.write(f"✅ Found voice: {selected_key}\n")
        else:
            sys.stderr.write(f"\nFound {len(results)} voice models for '{user_query}':\n")
            for idx, (k, info) in enumerate(results[:15], 1):
                lang = info.get("language", {})
                sys.stderr.write(f"  {idx}) {k} : {lang.get('name_english')} ({lang.get('country_english')}) [{info.get('quality')}]\n")
            sys.stderr.write("Select model number [1]: ")
            sys.stderr.flush()
            choice_str = sys.stdin.readline().strip()
            try:
                choice_idx = int(choice_str) - 1
                if 0 <= choice_idx < len(results[:15]):
                    selected_key = results[choice_idx][0]
                else:
                    selected_key = results[0][0]
            except ValueError:
                selected_key = results[0][0]
    except Exception:
        selected_key = "en_US-amy-medium"

info = catalog.get(selected_key, catalog.get("en_US-amy-medium", {}))
files = info.get("files", {})

onnx_rel = None
json_rel = None
for p in files.keys():
    if p.endswith(".onnx"):
        onnx_rel = p
    elif p.endswith(".onnx.json"):
        json_rel = p

base = "https://huggingface.co/rhasspy/piper-voices/resolve/main"
onnx_url = f"{base}/{onnx_rel}" if onnx_rel else ""
json_url = f"{base}/{json_rel}" if json_rel else ""

print(f"{selected_key}|{onnx_url}|{json_url}")
EOF
)

IFS='|' read -r SELECTED_VOICE ONNX_URL JSON_URL <<< "$VOICE_SELECTION_OUTPUT"

if [ -z "$SELECTED_VOICE" ]; then
    SELECTED_VOICE="en_US-amy-medium"
    ONNX_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx"
    JSON_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json"
fi

VOICE_ONNX="$VOICES_DIR/$SELECTED_VOICE.onnx"
VOICE_JSON="$VOICES_DIR/$SELECTED_VOICE.onnx.json"

if [ ! -f "$VOICE_ONNX" ] || [ ! -f "$VOICE_JSON" ]; then
    echo "🎙️  Downloading selected voice model ($SELECTED_VOICE)..."
    curl -L --progress-bar "$ONNX_URL" -o "$VOICE_ONNX"
    curl -L --progress-bar "$JSON_URL" -o "$VOICE_JSON"
    echo "✅ Voice model $SELECTED_VOICE downloaded successfully."
else
    echo "🎙️  Voice model $SELECTED_VOICE is already present."
fi

# 7. Generate synthesized SFX WAV notification tones locally
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
                fade = 1.0 - (i / num_samples) * 0.3
                audio_data.append(int(sample * fade * 32767))
                
    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        packed_data = struct.pack(f'<{len(audio_data)}h', *audio_data)
        wav_file.writeframes(packed_data)

generate_tone("start.wav", [(440, 80), (554, 80), (659, 120)])
generate_tone("success.wav", [(523, 70), (659, 70), (783, 70), (1046, 150)])
generate_tone("error.wav", [(261, 120), (0, 30), (196, 200)])
generate_tone("human_input_required.wav", [(880, 90), (0, 40), (880, 120)])
generate_tone("session_limit.wav", [(600, 100), (0, 30), (450, 150)])
generate_tone("token_limit.wav", [(600, 100), (0, 30), (450, 150)])
generate_tone("subscription_problem.wav", [(350, 150), (0, 30), (280, 200)])

print("✅ All SFX tone files generated successfully.")
EOF

# 8. Create or update .env configuration file
echo "⚙️  Updating .env configuration file..."
cat << EOF > .env
READ_MODE=events
SILENT_MODE=false
DEFAULT_VOICE=$SELECTED_VOICE
DEFAULT_SPEED=1.0
EOF

echo ""
echo "🎉 Local setup completed successfully!"
echo "📍 Selected Default Voice: $SELECTED_VOICE"
echo "📍 Python Executable Path: $VENV_DIR/bin/python"
echo "📍 Voices Path: $VOICES_DIR"
echo "📍 SFX Path: $SFX_DIR"
