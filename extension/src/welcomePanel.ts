import * as vscode from 'vscode';
import { VOICE_CATALOG, VoiceModel } from './voiceCatalog';

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

        const extension = vscode.extensions.getExtension('valentinia.valentinia-extension');
        const version = extension ? extension.packageJSON.version : '1.1.0';

        const iconUri = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'icon.png'));
        const currentModel = VOICE_CATALOG[currentVoice] || VOICE_CATALOG['en_US-ljspeech-high'];
        const catalogJson = JSON.stringify(VOICE_CATALOG);

        this.panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>valentinIA Setup</title>
    <style>
        :root {
            --bg-color: #181825;
            --border-color: #313244;
            --text-main: #cdd6f4;
            --text-sub: #a6adc8;
            --accent-pink: #f5c2e7;
            --accent-purple: #cba6f7;
            --accent-blue: #89b4fa;
            --btn-bg: #313244;
            --btn-hover: #45475a;
        }
        body {
            font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif);
            background: var(--bg-color);
            color: var(--text-main);
            padding: 48px 24px;
            max-width: 500px;
            margin: 0 auto;
        }
        .header {
            margin-bottom: 28px;
        }
        .header-brand {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 8px;
        }
        .brand-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
        }
        .title-row {
            display: flex;
            align-items: baseline;
            gap: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: 700;
            color: var(--accent-pink);
            letter-spacing: -0.5px;
        }
        .version-tag {
            font-size: 12px;
            font-weight: 600;
            color: var(--accent-purple);
            background: #313244;
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid var(--border-color);
        }
        .subtitle {
            font-size: 14px;
            color: var(--text-sub);
            margin-bottom: 20px;
        }
        .section-header {
            font-size: 14px;
            font-weight: 600;
            color: var(--accent-blue);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 8px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .label {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-sub);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        select {
            width: 100%;
            padding: 10px 12px;
            background: var(--btn-bg);
            color: var(--text-main);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            font-size: 13px;
            outline: none;
            cursor: pointer;
            box-sizing: border-box;
        }
        select:focus {
            border-color: var(--accent-purple);
        }
        .speed-options {
            display: flex;
            gap: 8px;
        }
        .speed-btn {
            flex: 1;
            padding: 9px 0;
            background: var(--btn-bg);
            color: var(--text-main);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .speed-btn.selected {
            background: var(--accent-purple);
            color: #11111b;
            border-color: var(--accent-purple);
        }
        .actions {
            display: flex;
            gap: 10px;
            margin-top: 32px;
        }
        .btn-test {
            flex: 1;
            padding: 11px;
            background: var(--btn-bg);
            color: var(--text-main);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s;
        }
        .btn-test:hover {
            background: var(--btn-hover);
        }
        .btn-save {
            flex: 2;
            padding: 11px;
            background: var(--accent-purple);
            color: #11111b;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: opacity 0.15s;
        }
        .btn-save:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-brand">
            <img src="${iconUri}" class="brand-icon" alt="valentinIA Icon" />
            <div>
                <div class="title-row">
                    <div class="title">valentinIA</div>
                    <div class="version-tag">v${version}</div>
                </div>
                <div class="subtitle">Zero-token local voice AI assistant</div>
            </div>
        </div>
    </div>

    <div class="section-header">Setup</div>

    <div class="form-group">
        <div class="label">1. Language</div>
        <select id="langSelect" onchange="onLanguageChange()">
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="Portuguese">Portuguese</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Italian">Italian</option>
            <option value="Other languages">Other languages</option>
        </select>
    </div>

    <div class="form-group" id="continentGroup" style="display: none;">
        <div class="label">2. Region / Continent</div>
        <select id="continentSelect" onchange="onContinentChange()">
            <option value="Europe">Europe</option>
            <option value="Asia">Asia</option>
            <option value="Middle East">Middle East</option>
            <option value="Africa">Africa</option>
        </select>
    </div>

    <div class="form-group" id="accentGroup">
        <div class="label" id="accentLabel">2. Regional Accent</div>
        <select id="accentSelect">
        </select>
    </div>

    <div class="form-group">
        <div class="label">Speech Speed</div>
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
        const catalog = ${catalogJson};
        let selectedSpeed = ${currentSpeed};
        let initVoiceKey = '${currentVoice}';
        let initLang = '${currentModel.language}';
        let initContinent = '${currentModel.continent || 'Europe'}';
        let initRegion = '${currentModel.region}';

        document.getElementById('langSelect').value = initLang;
        updateFormHierarchy(initLang, initContinent, initRegion);

        function onLanguageChange() {
            const lang = document.getElementById('langSelect').value;
            updateFormHierarchy(lang);
        }

        function onContinentChange() {
            const lang = document.getElementById('langSelect').value;
            const continent = document.getElementById('continentSelect').value;
            updateAccentDropdown(lang, continent);
        }

        function updateFormHierarchy(lang, targetContinent, targetRegion) {
            const continentGroup = document.getElementById('continentGroup');
            const accentGroup = document.getElementById('accentGroup');
            const accentLabel = document.getElementById('accentLabel');

            if (lang === 'Other languages') {
                continentGroup.style.display = 'block';
                accentGroup.style.display = 'block';
                accentLabel.textContent = '3. Language Selection';
                const continent = targetContinent || document.getElementById('continentSelect').value;
                document.getElementById('continentSelect').value = continent;
                updateAccentDropdown(lang, continent, targetRegion);
            } else if (lang === 'English' || lang === 'Spanish') {
                continentGroup.style.display = 'none';
                accentGroup.style.display = 'block';
                accentLabel.textContent = '2. Regional Accent';
                updateAccentDropdown(lang, null, targetRegion);
            } else {
                // Portuguese, French, German, Italian (Direct single voice play)
                continentGroup.style.display = 'none';
                accentGroup.style.display = 'none';
                updateAccentDropdown(lang, null, targetRegion);
            }
        }

        function updateAccentDropdown(lang, continent, targetRegion) {
            const accentSelect = document.getElementById('accentSelect');
            accentSelect.innerHTML = '';

            let models = Object.values(catalog).filter(m => m.language === lang);
            if (lang === 'Other languages' && continent) {
                models = models.filter(m => m.continent === continent);
            }

            models.forEach((m, idx) => {
                const opt = document.createElement('option');
                opt.value = m.key;
                opt.textContent = m.region;
                if (targetRegion && m.region === targetRegion) {
                    opt.selected = true;
                } else if (!targetRegion && idx === 0) {
                    opt.selected = true;
                }
                accentSelect.appendChild(opt);
            });
        }

        function setSpeed(s) {
            selectedSpeed = s;
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('selected'));
            event.currentTarget.classList.add('selected');
        }

        function audition() {
            const voiceKey = document.getElementById('accentSelect').value;
            vscode.postMessage({ command: 'testVoice', voice: voiceKey, speed: selectedSpeed });
        }

        function save() {
            const voiceKey = document.getElementById('accentSelect').value;
            vscode.postMessage({ command: 'saveSettings', voice: voiceKey, speed: selectedSpeed });
        }
    </script>
</body>
</html>`;
    }
}
