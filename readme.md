<div align="center">
  <h1>🗣️ valentinIA</h1>
  <p><strong>Local Voice MCP AI Assistant (Open Source)</strong></p>
  
  [![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org)
  [![MCP](https://img.shields.io/badge/Protocol-MCP-green.svg)](https://modelcontextprotocol.io/)
  [![LLM Agnostic](https://img.shields.io/badge/LLM-Agnostic-8A2BE2.svg)](#-llm-agnostic)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

---

**valentinIA** is a fast, asynchronous Model Context Protocol (MCP) server built in Python that gives your AI coding agents (like Gemini in Antigravity, Claude Code, or Roo Code) a fluid and configurable voice. 

Instead of staring at the terminal waiting for long tasks (migrations, tests, builds) to finish, valentinIA notifies you audibly with system chimes and human-like text-to-speech.

## 🧠 Powered by Piper TTS (Female Voice Standard)
valentinIA integrates exclusively with **[piper-tts](https://github.com/rhasspy/piper)**, an ultra-fast, completely open-source neural text-to-speech engine. 

> 👩 **Voice Persona Standard:** All default and supported voice models in valentinIA are **exclusively female voices** across all regional accents and languages (e.g., `es_ES-sharvard-medium`, `es_AR-sharvard-medium`, `pt_BR-faber-medium`, `en_US-amy-medium`). It runs locally using ONNX models, ensuring zero latency, zero API costs, and absolute privacy. 

## 🤖 LLM Agnostic
valentinIA is **100% model and AI provider agnostic**. As long as your model supports Tool Calling/Function Calling, it works perfectly.
- **Cloud Providers:** Google (Gemini), Anthropic (Claude), OpenAI
- **Local AI Servers:** Ollama, LM Studio, vLLM
- **Local Models:** Llama 3, Qwen, Mistral, Phi-3

## ✨ Features
- ⚡ **Zero-Latency Local TTS:** 100% local CPU-friendly execution with ONNX models.
- 🔊 **Non-Blocking Asynchronous Queue:** Internal FIFO background worker thread processes SFX and TTS sequentially without blocking LLM turns or overlapping audio.
- 🎛️ **Voice Management:** Configurable tool parameters for language, voice model, and reading speed.
- 🔔 **Multimodal Alerts (SFX):** Audio cues for states like `start`, `success`, `error`, `session_limit`, `token_limit`, `subscription_problem`, and `human_input_required`.
- 🛑 **Playback Control:** Includes a `stop_speaking` tool to immediately halt playback and purge pending audio in queue.
- 🌐 **Cross-Platform Audio:** Native execution on macOS (`afplay`), Linux (`aplay`/`paplay`/`pw-play`), and Windows (`powershell`).
- 👁️‍🗨️ **Accessibility Modes:** `events` mode for critical state changes, or `accessibility` mode to read relevant workflow outputs.
- 🔕 **Do Not Disturb Mode:** Easily mute the server via environment variables (`SILENT_MODE=true`).

## 🛠️ MCP Tools Exposed

### 1. `speak_status`
Recites a message with a preceding sound chime based on status.
- **`message`** *(string, required)*: The text for the AI to recite.
- **`status`** *(string, optional)*: Event state (`start`, `success`, `error`, `session_limit`, `token_limit`, `subscription_problem`, `human_input_required`).
- **`language`** *(string, optional)*: Language code (e.g. `es`, `en`).
- **`voice`** *(string, optional)*: Specific Piper voice model key.
- **`speed`** *(float, optional)*: Speech playback rate multiplier (default `1.0`).

### 2. `stop_speaking`
Immediately stops any playing audio and clears the queued speech list.

## 🚀 Installation

### Prerequisites
- Python 3.10+
- macOS, Linux, or Windows (with WSL/PowerShell)
- Git

### Setup

```bash
git clone https://github.com/yourusername/valentinIA.git
cd valentinIA
chmod +x install.sh
./install.sh
```

## ⚙️ Integration (Antigravity & Others)

Add the following configuration to your MCP client settings (e.g., Antigravity or Claude Code configuration file):

```json
{
  "mcpServers": {
    "valentinIA": {
      "command": "/Users/YOUR_USER/.valentinIA/venv/bin/python",
      "args": ["/path/to/valentinIA/server.py"],
      "env": {
        "READ_MODE": "events",
        "SILENT_MODE": "false",
        "DEFAULT_VOICE": "en_US-amy-medium",
        "DEFAULT_SPEED": "1.0"
      }
    }
  }
}
```

## 💡 Recommended Agent Rule / System Prompt

To ensure your AI agent proactively uses **valentinIA**, add a rule to your workspace (e.g. in `.agents/rules/valentinIA.md` for Antigravity or `CLAUDE.md` for Claude Code):

```markdown
# Voice Notifications Rule
- Call `speak_status` with `status="start"` when initiating long background commands or multi-step operations.
- Call `speak_status` with `status="success"` upon successfully resolving a task or fixing a build/test error.
- Call `speak_status` with `status="error"` or `status="human_input_required"` if blocked or requiring user approval.
- Keep spoken text concise and clear.
```

## 🤝 Contributing
valentinIA is an open-source initiative and we welcome contributions from the global developer community! 
Whether you want to add new Piper voice models, optimize the asynchronous queue, fix bugs, or improve compatibility with more MCP clients, your PRs are highly appreciated.

- Fork the repository
- Create your feature branch (`git checkout -b feature/AmazingFeature`)
- Commit your changes (`git commit -m 'Add some AmazingFeature'`)
- Push to the branch (`git push origin feature/AmazingFeature`)
- Open a Pull Request

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.