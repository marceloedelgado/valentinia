# PRD valentinIA: Local Voice MCP AI Assistant (Open Source)

## 1. Context and Objective
The goal is to develop an open-source MCP (Model Context Protocol) server in Python that equips local AI coding agents with a fluid, asynchronous, non-blocking voice output. The tool is **100% LLM agnostic**. It works seamlessly with any model supporting Tool Calling / Function Calling, including commercial APIs (Claude, Gemini, OpenAI) and local models running via Ollama, LM Studio, or vLLM (Llama 3, Qwen, Mistral, etc.).

The tool enables audible notifications for task start/completion, error reporting, human decision requests, and optional accessibility reading across client environments (Antigravity, Claude Code, Roo Code, Cursor, Windsurf, etc.).

## 2. Architecture and Technical Stack
* **Language & SDK:** Python 3.10+ with the official MCP Python SDK (`mcp` / `FastMCP`).
* **TTS Engine:** `piper-tts` (ultra-fast local execution powered by neural ONNX models).
* **Concurrency & Audio Queue:**
  - **Background FIFO Queue:** Implemented using `queue.Queue` and a background worker daemon thread. Ensures MCP tool calls return immediate responses to the LLM while audio is synthesized and played sequentially without overlap or locking turns.
* **Native Cross-Platform Audio Playback:**
  - **macOS:** Native `afplay` command execution.
  - **Linux:** Automatic fallback selection among `aplay`, `paplay` (PulseAudio), or `pw-play` (PipeWire).
  - **Windows:** PowerShell media playback (`Media.SoundPlayer` / `System.Media`).

## 3. Core Features & Specifications
* **Voice Management & Persona Standard:**
  - **Exclusively Female Voice Models:** All voice models integrated and configured across all supported languages and regional accents (e.g., English-US `en_US-amy-medium` [Default], Spanish-Argentina `es_AR-daniela-high`, Spanish-Spain `es_ES-sharvard-medium`, Portuguese-Brazil `pt_BR-faber-medium`) must strictly be **female voices**.
  - **Interactive Setup Menu:** Running `./install.sh` provides an interactive terminal menu allowing the user to pick their regional female voice preference during installation.
  - The `speak_status` tool accepts language (`language`), female voice model key (`voice`), and reading speed (`speed`).
* **MCP Tools:**
  1. `speak_status`: Accepts notification message (`message`), event state (`status`), language (`language`), voice model key (`voice`), and reading speed multiplier (`speed`).
  2. `stop_speaking` / `cancel_speech`: Halts active audio playback immediately and flushes pending queued audio tasks.
* **Multimodal Sound Alerts (SFX):**
  - Before reciting the TTS text, the system plays a brief `.wav` chime corresponding to the status cue.
  - Supported states: `start`, `success`, `error`, `session_limit`, `token_limit`, `subscription_problem`, `human_input_required`.
* **Reading & Accessibility Modes:**
  - `READ_MODE="events"`: The agent speaks only during key state transitions (start, completion, error, or human input needed).
  - `READ_MODE="accessibility"`: The agent is instructed to recite detailed workflow outputs and relevant continuous progress.
* **Execution & Mute Controls:**
  - `SILENT_MODE="true"` (Do Not Disturb), which logs notifications without emitting physical sound.

## 4. Deliverables and Structure
* **Setup Script (`install.sh`):**
  - Creates virtual environment in `~/.valentinIA/venv`.
  - Installs dependencies (`piper-tts`, `mcp`, `python-dotenv`).
  - Downloads default Spanish/English voice model and provisions synthesized `.wav` SFX sound cues in `~/.valentinIA/sfx/`.
* **MCP Server (`server.py`):**
  - FastMCP implementation with asynchronous background FIFO audio queue and tool handlers (`speak_status`, `stop_speaking`).
* **Documentation & Guidelines (`README.md`):**
  - Setup instructions, MCP JSON configuration snippets for Antigravity & Claude Code, and agent rules/system prompts.

## 5. Security and Privacy Guidelines
* **100% Local Privacy:** All text-to-speech synthesis and audio processing occur entirely on local hardware. No text, audio, or metadata is transmitted externally.
* **Environment Sandboxing:** Tools operate exclusively within `~/.valentinIA/` and local temporary file locations (`/tmp`), leaving host system files untouched.
