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
    """Recites an asynchronous voice notification message with an optional pre-chime SFX sound cue.

    Args:
        message: Text content for the AI assistant to speak aloud.
        status: Event state cue ('start', 'success', 'error', 'session_limit', 'token_limit', 'subscription_problem', 'human_input_required').
        language: Target spoken language code (e.g. 'es', 'en').
        voice: Specific Piper voice model key.
        speed: Speech rate multiplier (default 1.0).
    """
    audio_engine.enqueue_speech(
        message=message,
        status=status,
        language=language,
        voice=voice,
        speed=speed,
    )
    return f"Notification queued successfully [status={status or 'info'}]."


@mcp.tool()
def stop_speaking() -> str:
    """Immediately halts current audio playback and flushes the pending speech queue."""
    audio_engine.stop_speaking()
    return "Active speech cancelled and queue cleared."


if __name__ == "__main__":
    mcp.run()
