# Contributing to valentinIA 🗣️

Thank you for your interest in contributing to **valentinIA**! We welcome community contributions, including new regional neural voice models, extension enhancements, documentation improvements, and bug fixes.

---

## 🌟 Ways to Contribute

1. **Add New Female Voice Models:** Suggest or contribute ONNX voice models for additional languages and regional accents from the [Piper TTS Voice Library](https://github.com/rhasspy/piper).
2. **Enhance Native IDE Extension:** Improve the TypeScript extension in `extension/` (UI, settings, audio cadence, or event triggers).
3. **Enhance Python MCP Server:** Improve the Model Context Protocol (MCP) server integration in `server.py` and `audio_engine.py`.
4. **Report Bugs & Suggest Features:** Open detailed issues on [GitHub Issues](https://github.com/marceloedelgado/valentinia/issues).

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **VS Code or Antigravity IDE:** For testing the extension
- **Git:** Latest release

### 2. Building the VS Code / Antigravity Extension
```bash
git clone https://github.com/marceloedelgado/valentinia.git
cd valentinia/extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package VSIX extension locally
npx vsce package --no-dependencies
```

### 3. Testing the Extension Locally
Install the generated `.vsix` file into your IDE:
```bash
code --install-extension valentinia-extension-1.1.0.vsix --force
```

---

## 📜 Pull Request Guidelines

1. **Branch Naming:** Use descriptive branch names like `feature/add-japanese-voice` or `fix/audio-queue-pause`.
2. **Code Style:** Keep TypeScript code clean, modular, and lint-free.
3. **Commit Messages:** Follow standard Conventional Commits (e.g. `feat(voice): add Japanese regional voice model`, `fix(cadence): refine sentence boundary detection`).
4. **Zero UI Emojis & Zero Cognitive Overhead:** Maintain the senior UX standard (0 emojis in onboarding webviews or settings titles).

---

## 💬 Community & Support

- **Author & Maintainer:** Marcelo Delgado ([marcedelgado.dev](https://marcedelgado.dev))
- **Issues & Discussions:** [GitHub Issues](https://github.com/marceloedelgado/valentinia/issues)

Thank you for helping make **valentinIA** the ultimate zero-token voice assistant for developers worldwide!
