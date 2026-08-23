# valentinIA - Native AI Voice Assistant

[![Open General Settings](https://img.shields.io/badge/General%20Settings-Launch%20Webview%20Setup-cba6f7?style=for-the-badge)](command:valentinia.welcome)
[![AI-Ready](https://img.shields.io/badge/AI--Ready-yes-brightgreen.svg?style=for-the-badge)](https://marcedelgado.dev)
[![Token Cost](https://img.shields.io/badge/Token%20Cost-0%20Tokens-blue.svg?style=for-the-badge)](https://marcedelgado.dev)
[![Engine](https://img.shields.io/badge/Engine-C%2B%2B%20Native-purple.svg?style=for-the-badge)](https://marcedelgado.dev)
[![License](https://img.shields.io/badge/License-MIT-orange.svg?style=for-the-badge)](https://marcedelgado.dev)

> **Zero-token native neural AI voice assistant for coding sessions in VS Code & Antigravity IDE.**

`valentinIA` is a zero-token native IDE voice assistant that recites AI agent text responses word-for-word out loud in natural, studio-quality 24kHz neural voices. It runs 100% locally on your machine with **zero LLM prompt token consumption**, **zero cloud API fees**, and **zero visual UI clutter**.

---

## Quick Action: Launch General Settings

Click the button above or execute in Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):  
**`valentinIA: General Settings`**

---

## Key Capabilities

- **Zero-Token Local Execution:** Operates natively in Node.js/TypeScript inside the IDE process. No LLM prompt context, tokens, or cloud API costs.
- **Standalone C++ Neural Engine:** Spawns lightweight, local C++ Piper neural synthesis processes without Python, pip, or virtualenv requirements.
- **Host & Workspace Isolation:** Zero cross-over audio. Antigravity IDE and VS Code sessions remain 100% isolated.
- **1-Click Instant Mute:** Clicking the status bar item (`valentinIA: Active`) instantly mutes audio and terminates playback processes.
- **Audited Female Voice Catalog:** Studio-quality female voice models for 30+ regional accents and languages.
- **Natural Speech Cadence:** Automatic Markdown punctuation naturalization for headers, lists, and horizontal section dividers.

---

## Voice Catalog & Regional Accents

This extension includes audited studio-quality voice variants for:

- **English:** USA (`LJ Speech High`), UK (`Cori High`)
- **Spanish:** Argentina (`Daniela Studio 24kHz`), Spain (`MLS Female`), Mexico (`Claude High`)
- **Portuguese:** Brazil (`Faber Medium`)
- **French:** France (`Siwis Medium`)
- **German:** Germany (`Kerstin Low`)
- **Italian:** Italy (`Paola Medium`)
- **Other Languages:** Europe (Dutch, Polish, Ukrainian, Swedish, Danish, Finnish, Greek, Czech, Hungarian, Romanian, Turkish, Catalan), Asia (Chinese, Japanese, Korean, Hindi, Vietnamese, Thai), Middle East (Arabic, Hebrew, Persian), Africa (Swahili, Amharic, Yoruba, Hausa).

---

## Quick Setup & Usage

### 1. General Settings Webview
Open the interactive onboarding panel anytime via:
- Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) ➔ `valentinIA: General Settings`
- Status Bar Menu ➔ Click `valentinIA: Active` ➔ `General Settings`

### 2. Status Bar Control
- **`valentinIA: Active`**: Click to INSTANTLY MUTE speech output for the active session.
- **`valentinIA: Muted`**: Click to ACTIVATE voice output.

---

## Extension Settings

`valentinIA` contributes the following configurable settings:

| Setting | Default | Description |
| :--- | :--- | :--- |
| `valentinia.enabled` | `true` | Enable or disable native voice notifications globally. |
| `valentinia.voice` | `"en_US-ljspeech-high"` | Active regional female voice model key. |
| `valentinia.speed` | `0.85` | Speech synthesis duration rate (0.75x, 0.85x Default, 0.95x, 1.05x). |

---

## Privacy & Local Security

`valentinIA` operates **100% offline and locally on your machine**. Speech synthesis takes place inside `~/.valentinIA/` using native C++ executables. No audio data or conversation text is ever transmitted over the network.

---

## Author & License

Created and maintained by **[marcedelgado.dev](https://marcedelgado.dev)** (Marcelo Delgado).  
Distributed under the MIT License. Contributions are welcome on [GitHub](https://github.com/marceloedelgado/valentinia).
