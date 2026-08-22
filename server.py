import os
from typing import Optional
from dotenv import load_dotenv
from mcp.server.mcpserver import MCPServer
from audio_engine import AudioEngine

# Load environment configuration
load_dotenv()

# Initialize audio engine manager
audio_engine = AudioEngine()

# Initialize MCP Server instance
mcp = MCPServer(name="valentinIA", version="1.0.0")


@mcp.tool()
def speak_status(
    message: str,
    status: Optional[str] = None,
    language: Optional[str] = None,
    voice: Optional[str] = None,
    speed: Optional[float] = None,
) -> str:
    """Recites a voice notification message via native extension and audio engine.

    Args:
        message: Text content for the AI assistant to speak aloud.
        status: Event state cue ('start', 'success', 'error', 'session_limit', 'token_limit', 'subscription_problem', 'human_input_required').
        language: Target spoken language code (e.g. 'es', 'en').
        voice: Specific Piper voice model key.
        speed: Speech rate multiplier (default 1.0).
    """
    # 1. Enqueue in Python Audio Engine
    audio_engine.enqueue_speech(
        message=message,
        status=status,
        language=language,
        voice=voice,
        speed=speed,
    )

    # 2. Write IPC payload for Native IDE Extension
    try:
        temp_dir = os.path.expanduser("~/.valentinIA/temp")
        os.makedirs(temp_dir, exist_ok=True)
        request_file = os.path.join(temp_dir, "speak_request.json")

        payload = {
            "message": message,
            "status": status,
            "voice": voice or audio_engine.get_default_voice(),
            "speed": speed or audio_engine.get_default_speed(),
            "timestamp": os.path.getmtime(temp_dir) if os.path.exists(temp_dir) else 0,
        }
        with open(request_file, "w", encoding="utf-8") as f:
            json.dump(payload, f)
    except Exception:
        pass

    return f"Notification queued successfully [status={status or 'info'}]."


@mcp.tool()
def stop_speaking() -> str:
    """Immediately halts current audio playback and flushes the pending speech queue."""
    audio_engine.stop_speaking()
    return "Active speech cancelled and queue cleared."


@mcp.tool()
def toggle_mute(silent: bool) -> str:
    """Enables or disables valentinIA voice output globally.

    Args:
        silent: True to mute voice notifications, False to activate voice.
    """
    if silent:
        audio_engine.stop_speaking()

    target_files = [".env", os.path.expanduser("~/.valentinIA/.env")]
    val_str = "true" if silent else "false"

    for env_file in target_files:
        lines = []
        if os.path.exists(env_file):
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    lines = f.readlines()
            except Exception:
                lines = []

        new_lines = []
        updated = False
        for line in lines:
            if line.startswith("SILENT_MODE="):
                new_lines.append(f"SILENT_MODE={val_str}\n")
                updated = True
            else:
                new_lines.append(line)

        if not updated:
            new_lines.append(f"SILENT_MODE={val_str}\n")

        try:
            with open(env_file, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception:
            pass

    status_txt = "MUTED (silent)" if silent else "UNMUTED (active)"
    return f"valentinIA voice output is now {status_txt}."


if __name__ == "__main__":
    mcp.run()
