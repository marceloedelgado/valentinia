import * as vscode from 'vscode';
import { VOICE_CATALOG } from './voiceCatalog';

export class WelcomePanel {
    public static currentPanel: WelcomePanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private readonly onSaveCallback: () => void;
    private readonly onTestCallback: (voiceKey: string, speed: number) => void;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        onSaveCallback: () => void,
        onTestCallback: (voiceKey: string, speed: number) => void
    ) {
        this.panel = panel;
        this.extensionUri = extensionUri;
        this.onSaveCallback = onSaveCallback;
        this.onTestCallback = onTestCallback;

        this.updateWebviewContent();

        this.panel.onDidDispose(() => this.dispose(), null);

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                const config = vscode.workspace.getConfiguration('valentinia');
                switch (message.command) {
                    case 'testVoice':
                        this.onTestCallback(message.voice, message.speed);
                        break;
                    case 'saveSettings':
                        await config.update('voice', message.voice, vscode.ConfigurationTarget.Global);
                        await config.update('speed', message.speed, vscode.ConfigurationTarget.Global);
                        vscode.window.showInformationMessage(`valentinIA: Voice updated to ${VOICE_CATALOG[message.voice]?.label || message.voice} at ${message.speed}x speed.`);
                        this.onSaveCallback();
                        this.panel.dispose();
                        break;
                }
            },
            null
        );
    }

    public static show(
        extensionUri: vscode.Uri,
        onSaveCallback: () => void,
        onTestCallback: (voiceKey: string, speed: number) => void
    ) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (WelcomePanel.currentPanel) {
            WelcomePanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'valentiniaWelcome',
            'valentinIA - Voice Assistant Setup',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        WelcomePanel.currentPanel = new WelcomePanel(panel, extensionUri, onSaveCallback, onTestCallback);
    }

    private dispose() {
        WelcomePanel.currentPanel = undefined;
        this.panel.dispose();
    }

    private updateWebviewContent() {
        const config = vscode.workspace.getConfiguration('valentinia');
        const currentVoice = config.get<string>('voice', 'en_US-ljspeech-high');
        const currentSpeed = config.get<number>('speed', 0.85);

        this.panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>valentinIA Setup</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #1e1e2e;
            color: #cdd6f4;
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 32px;
            color: #f5c2e7;
            margin-bottom: 8px;
        }
        .header p {
            font-size: 16px;
            color: #a6adc8;
        }
        .card {
            background: #181825;
            border: 1px solid #313244;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #89b4fa;
        }
        .voice-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
        }
        .voice-option {
            background: #313244;
            border: 2px solid transparent;
            border-radius: 8px;
            padding: 12px 16px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .voice-option:hover {
            border-color: #b4befe;
        }
        .voice-option.selected {
            border-color: #cba6f7;
            background: #45475a;
        }
        .voice-title {
            font-weight: 600;
            font-size: 14px;
        }
        .voice-sub {
            font-size: 12px;
            color: #a6adc8;
            margin-top: 4px;
        }
        .speed-grid {
            display: flex;
            gap: 12px;
        }
        .speed-btn {
            flex: 1;
            padding: 10px;
            background: #313244;
            border: 2px solid transparent;
            border-radius: 8px;
            color: #cdd6f4;
            font-weight: 600;
            cursor: pointer;
            text-align: center;
        }
        .speed-btn.selected {
            border-color: #cba6f7;
            background: #45475a;
        }
        .actions {
            display: flex;
            gap: 16px;
            margin-top: 30px;
        }
        .btn-primary {
            flex: 2;
            background: #cba6f7;
            color: #11111b;
            font-size: 16px;
            font-weight: 700;
            padding: 14px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .btn-primary:hover {
            opacity: 0.9;
        }
        .btn-secondary {
            flex: 1;
            background: #313244;
            color: #cdd6f4;
            font-size: 16px;
            font-weight: 600;
            padding: 14px;
            border: 1px solid #45475a;
            border-radius: 8px;
            cursor: pointer;
        }
        .btn-secondary:hover {
            background: #45475a;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🗣️ valentinIA</h1>
        <p>Zero-token native voice assistant for VS Code & Antigravity IDE</p>
    </div>

    <div class="card">
        <div class="section-title">Select Regional Female Voice Model</div>
        <div class="voice-grid">
            <div class="voice-option ${currentVoice === 'en_US-ljspeech-high' ? 'selected' : ''}" onclick="selectVoice('en_US-ljspeech-high')">
                <div class="voice-title">🇺🇸 English (USA)</div>
                <div class="voice-sub">LJ Speech High (Default)</div>
            </div>
            <div class="voice-option ${currentVoice === 'es_AR-daniela-high' ? 'selected' : ''}" onclick="selectVoice('es_AR-daniela-high')">
                <div class="voice-title">🇦🇷 Spanish (Argentina)</div>
                <div class="voice-sub">Daniela Studio 24kHz</div>
            </div>
            <div class="voice-option ${currentVoice === 'es_ES-mls_10246-low' ? 'selected' : ''}" onclick="selectVoice('es_ES-mls_10246-low')">
                <div class="voice-title">🇪🇸 Spanish (Spain)</div>
                <div class="voice-sub">MLS Female</div>
            </div>
            <div class="voice-option ${currentVoice === 'es_MX-claude-high' ? 'selected' : ''}" onclick="selectVoice('es_MX-claude-high')">
                <div class="voice-title">🇲🇽 Spanish (Mexico)</div>
                <div class="voice-sub">Claude High</div>
            </div>
            <div class="voice-option ${currentVoice === 'en_GB-cori-high' ? 'selected' : ''}" onclick="selectVoice('en_GB-cori-high')">
                <div class="voice-title">🇬🇧 English (UK)</div>
                <div class="voice-sub">Cori High</div>
            </div>
            <div class="voice-option ${currentVoice === 'pt_BR-faber-medium' ? 'selected' : ''}" onclick="selectVoice('pt_BR-faber-medium')">
                <div class="voice-title">🇧🇷 Portuguese (Brazil)</div>
                <div class="voice-sub">Faber Medium</div>
            </div>
            <div class="voice-option ${currentVoice === 'fr_FR-siwis-medium' ? 'selected' : ''}" onclick="selectVoice('fr_FR-siwis-medium')">
                <div class="voice-title">🇫🇷 French (France)</div>
                <div class="voice-sub">Siwis Medium</div>
            </div>
            <div class="voice-option ${currentVoice === 'de_DE-kerstin-low' ? 'selected' : ''}" onclick="selectVoice('de_DE-kerstin-low')">
                <div class="voice-title">🇩🇪 German (Germany)</div>
                <div class="voice-sub">Kerstin Low</div>
            </div>
            <div class="voice-option ${currentVoice === 'it_IT-paola-medium' ? 'selected' : ''}" onclick="selectVoice('it_IT-paola-medium')">
                <div class="voice-title">🇮🇹 Italian (Italy)</div>
                <div class="voice-sub">Paola Medium</div>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="section-title">Speech Cadence Speed</div>
        <div class="speed-grid">
            <div class="speed-btn ${currentSpeed === 0.75 ? 'selected' : ''}" onclick="selectSpeed(0.75)">0.75x (Relaxed)</div>
            <div class="speed-btn ${currentSpeed === 0.85 ? 'selected' : ''}" onclick="selectSpeed(0.85)">0.85x (Studio Narrator)</div>
            <div class="speed-btn ${currentSpeed === 0.95 ? 'selected' : ''}" onclick="selectSpeed(0.95)">0.95x (Standard)</div>
            <div class="speed-btn ${currentSpeed === 1.05 ? 'selected' : ''}" onclick="selectSpeed(1.05)">1.05x (Fast)</div>
        </div>
    </div>

    <div class="actions">
        <button class="btn-secondary" onclick="auditionVoice()">▶ Audition Voice Sample</button>
        <button class="btn-primary" onclick="saveSettings()">Save & Get Started</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let selectedVoice = '${currentVoice}';
        let selectedSpeed = ${currentSpeed};

        function selectVoice(key) {
            selectedVoice = key;
            document.querySelectorAll('.voice-option').forEach(el => el.classList.remove('selected'));
            event.currentTarget.classList.add('selected');
        }

        function selectSpeed(speed) {
            selectedSpeed = speed;
            document.querySelectorAll('.speed-btn').forEach(el => el.classList.remove('selected'));
            event.currentTarget.classList.add('selected');
        }

        function auditionVoice() {
            vscode.postMessage({ command: 'testVoice', voice: selectedVoice, speed: selectedSpeed });
        }

        function saveSettings() {
            vscode.postMessage({ command: 'saveSettings', voice: selectedVoice, speed: selectedSpeed });
        }
    </script>
</body>
</html>`;
    }
}
