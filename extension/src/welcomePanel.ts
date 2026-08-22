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
                        vscode.window.showInformationMessage(`valentinIA: Voice set to ${VOICE_CATALOG[message.voice]?.label || message.voice} at ${message.speed}x speed.`);
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
            'valentinIA Setup',
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

        const optionsHtml = Object.values(VOICE_CATALOG).map(v => {
            const isSel = v.key === currentVoice ? 'selected' : '';
            return `<option value="${v.key}" ${isSel}>${v.label}</option>`;
        }).join('\n');

        this.panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>valentinIA Setup</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #181825;
            color: #cdd6f4;
            padding: 40px 20px;
            max-width: 580px;
            margin: 0 auto;
        }
        .title {
            font-size: 24px;
            font-weight: 700;
            color: #f5c2e7;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
        }
        .subtitle {
            font-size: 14px;
            color: #a6adc8;
            margin-bottom: 32px;
        }
        .form-group {
            margin-bottom: 24px;
        }
        .label {
            font-size: 13px;
            font-weight: 600;
            color: #89b4fa;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        select {
            width: 100%;
            padding: 12px 14px;
            background: #313244;
            color: #cdd6f4;
            border: 1px solid #45475a;
            border-radius: 6px;
            font-size: 14px;
            outline: none;
            cursor: pointer;
            box-sizing: border-box;
        }
        select:focus {
            border-color: #cba6f7;
        }
        .speed-options {
            display: flex;
            gap: 8px;
        }
        .speed-btn {
            flex: 1;
            padding: 10px 0;
            background: #313244;
            color: #cdd6f4;
            border: 1px solid #45475a;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            text-align: center;
            cursor: pointer;
        }
        .speed-btn.selected {
            background: #cba6f7;
            color: #11111b;
            border-color: #cba6f7;
        }
        .actions {
            display: flex;
            gap: 12px;
            margin-top: 36px;
        }
        .btn-test {
            flex: 1;
            padding: 12px;
            background: #313244;
            color: #cdd6f4;
            border: 1px solid #45475a;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-test:hover {
            background: #45475a;
        }
        .btn-save {
            flex: 2;
            padding: 12px;
            background: #cba6f7;
            color: #11111b;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
        }
        .btn-save:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="title">valentinIA Voice Configuration</div>
    <div class="subtitle">Zero-token native voice assistant setup</div>

    <div class="form-group">
        <div class="label">Voice Language Model</div>
        <select id="voiceSelect">
            ${optionsHtml}
        </select>
    </div>

    <div class="form-group">
        <div class="label">Speech Cadence Speed</div>
        <div class="speed-options">
            <div class="speed-btn ${currentSpeed === 0.75 ? 'selected' : ''}" onclick="setSpeed(0.75)">0.75x</div>
            <div class="speed-btn ${currentSpeed === 0.85 ? 'selected' : ''}" onclick="setSpeed(0.85)">0.85x (Default)</div>
            <div class="speed-btn ${currentSpeed === 0.95 ? 'selected' : ''}" onclick="setSpeed(0.95)">0.95x</div>
            <div class="speed-btn ${currentSpeed === 1.05 ? 'selected' : ''}" onclick="setSpeed(1.05)">1.05x</div>
        </div>
    </div>

    <div class="actions">
        <button class="btn-test" onclick="audition()">Audition Sample</button>
        <button class="btn-save" onclick="save()">Save & Get Started</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let selectedSpeed = ${currentSpeed};

        function setSpeed(s) {
            selectedSpeed = s;
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('selected'));
            event.currentTarget.classList.add('selected');
        }

        function audition() {
            const v = document.getElementById('voiceSelect').value;
            vscode.postMessage({ command: 'testVoice', voice: v, speed: selectedSpeed });
        }

        function save() {
            const v = document.getElementById('voiceSelect').value;
            vscode.postMessage({ command: 'saveSettings', voice: v, speed: selectedSpeed });
        }
    </script>
</body>
</html>`;
    }
}
