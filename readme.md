<div align="center">
  <img src="extension/icon.png" alt="valentinIA Icon" width="160" height="160" />
  <h1>valentinIA</h1>
  <p><strong>Zero-Token Local Neural Voice Assistant for AI Coding Sessions</strong></p>

  <a href="https://marketplace.visualstudio.com/items?itemName=marcedelgadodev.valentinia-extension"><img src="https://img.shields.io/visual-studio-marketplace/v/marcedelgadodev.valentinia-extension?style=for-the-badge&label=VS%20Code%20Marketplace&color=blue" alt="VS Code Marketplace" /></a>
  <a href="https://open-vsx.org/extension/marcedelgadodev/valentinia-extension"><img src="https://img.shields.io/open-vsx/v/marcedelgadodev/valentinia-extension?style=for-the-badge&label=Open%20VSX&color=purple" alt="Open VSX" /></a>
  <a href="https://github.com/marceloedelgado/valentinia/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-orange.svg?style=for-the-badge" alt="License MIT" /></a>
  <a href="https://marcedelgado.dev"><img src="https://img.shields.io/badge/Token%20Cost-0%20Tokens-brightgreen.svg?style=for-the-badge" alt="Zero Tokens" /></a>
  <a href="https://marcedelgado.dev"><img src="https://img.shields.io/badge/Engine-C%2B%2B%20Native-8A2BE2.svg?style=for-the-badge" alt="C++ Native Engine" /></a>
</div>

---

**valentinIA** is a zero-token native IDE voice assistant that recites AI agent text responses word-for-word out loud in natural, studio-quality 24kHz neural voices.

Instead of staring at the editor waiting for long autonomous agent tasks (refactorings, builds, unit test runs) to complete, **valentinIA** reads responses aloud in real-time with zero LLM prompt token consumption, zero cloud API fees, and zero visual UI clutter.

---

## Architecture Overview

`valentinIA` supports a **Dual Architecture** for maximum compatibility:

```
                  ┌─────────────────────────────────────────┐
                  │              AI Coding Agent            │
                  │   (Gemini, Claude Code, Cursor, Roo)    │
                  └────────────────────┬────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │  Native Extension     │             │    Python MCP Server  │
        │ (VS Code / Antigravity│             │ (Claude Code / Roo)   │
        └───────────┬───────────┘             └───────────┬───────────┘
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       │ (50ms Zero-Latency Execution)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │      Standalone C++ Piper Binary        │
                  │        (~/.valentinIA/bin/piper)        │
                  └─────────────────────────────────────────┘
```

1. **Native IDE Extension (`extension/`):** Runs natively inside Visual Studio Code and Antigravity IDE. Listens directly to IDE background transcripts, requiring zero tool calling and consuming **0 tokens**.
2. **Model Context Protocol Server (`server.py`):** Operates as a local MCP server for CLI environments like Claude Code or Roo Code.

---

## Key Capabilities

- **50ms Zero-Latency Execution:** Spawns cached local C++ Piper neural synthesis binaries synchronously. No Python, virtualenv, or pip installation required on the host system.
- **Zero-Token Cost:** Operates via background transcript listeners. Uses 0 LLM prompt tokens and zero cloud API fees.
- **Host & Workspace Isolation:** Dynamic host environment detection prevents cross-talk audio between Antigravity IDE and VS Code instances.
- **30 Languages & 34 Regional Accents:** Studio-quality 24kHz female voice models across 4 continents.
- **Naturalized Speech Cadence:** Automatic Markdown punctuation naturalization for headers, lists, colons, and **1.2s silence pauses** on horizontal section dividers (`---`).
- **1-Click Instant Mute:** Click the status bar (`valentinIA: Active`) anytime to instantly terminate audio playback.

---

## Voice Catalog (30 Languages / 34 Accents)

All default and supported voice models in `valentinIA` use audited **studio-quality female voice models**:

| Region / Language | Primary Voice Model | Accents / Variants |
| :--- | :--- | :--- |
| **English** | `en_US-ljspeech-high` (24kHz) | USA, UK (`Cori High`) |
| **Spanish** | `es_AR-daniela-high` (24kHz) | Argentina, Spain (`MLS Female`), Mexico (`Claude High`) |
| **Portuguese** | `pt_BR-faber-medium` | Brazil |
| **French** | `fr_FR-siwis-medium` | France |
| **German** | `de_DE-kerstin-low` | Germany |
| **Italian** | `it_IT-paola-medium` | Italy |
| **European Languages** | *Dutch, Polish, Ukrainian, Swedish, Danish, Finnish, Greek, Czech, Hungarian, Romanian, Turkish, Catalan* | 11 Continental Voice Models |
| **Asian Languages** | *Chinese, Japanese, Korean, Hindi, Vietnamese, Thai* | 6 Regional Voice Models |
| **Middle East** | *Arabic, Hebrew, Persian* | 3 Regional Voice Models |
| **Africa** | *Swahili, Amharic, Yoruba, Hausa* | 4 Continental Voice Models |

---

## Quick Setup & Installation

### Option A: Install from VS Code Marketplace (1-Click)
1. Open **Visual Studio Code** ➔ Press `Cmd+Shift+X` (Extensions tab).
2. Search for: **`valentinIA`** or **`marcedelgadodev`**.
3. Click **Install**.

### Option B: Install in Antigravity IDE / Cursor / VSCodium (Open VSX)
1. Open **Antigravity IDE** or **Cursor** ➔ Press `Cmd+Shift+X`.
2. Search for **`valentinIA`**.
3. Click **Install**.

### Option C: Interactive General Settings
Open the onboarding setup panel anytime in your editor via:
- Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) ➔ `valentinIA: General Settings`

---

## Privacy & Local Execution

`valentinIA` operates **100% offline and locally on your machine**. Neural text-to-speech synthesis takes place inside `~/.valentinIA/` using native local executables. No voice data, source code, or conversation transcripts are ever transmitted over the network.

---

## Governance & License

Distributed under the **MIT License**. Created and maintained by **[Marcelo Delgado (marcedelgado.dev)](https://marcedelgado.dev)**.

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Issue Tracker](https://github.com/marceloedelgado/valentinia/issues)