import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { NativeAudioEngine } from './audioEngine';
import { VOICE_CATALOG } from './voiceCatalog';

let audioEngine: NativeAudioEngine;
let statusBarItem: vscode.StatusBarItem;
let pollInterval: NodeJS.Timeout | null = null;
let lastSpokenContent: string = '';

export function activate(context: vscode.ExtensionContext) {
    audioEngine = new NativeAudioEngine();

    // 1. Create Status Bar Item (Click opens Interactive Settings Menu)
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'valentinia.menu';
    updateStatusBar();
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 2. Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('valentinia.menu', async () => {
            showQuickSettingsMenu();
        }),

        vscode.commands.registerCommand('valentinia.selectVoice', async () => {
            showVoicePickerMenu();
        }),

        vscode.commands.registerCommand('valentinia.selectSpeed', async () => {
            showSpeedPickerMenu();
        }),

        vscode.commands.registerCommand('valentinia.enable', () => {
            setMuteState(false);
            vscode.window.showInformationMessage('valentinIA Voice Output Activated.');
        }),

        vscode.commands.registerCommand('valentinia.disable', () => {
            setMuteState(true);
            audioEngine.stop();
            vscode.window.showInformationMessage('valentinIA Voice Output Muted.');
        }),

        vscode.commands.registerCommand('valentinia.toggle', () => {
            const config = vscode.workspace.getConfiguration('valentinia');
            const currentEnabled = config.get<boolean>('enabled', true);
            setMuteState(currentEnabled);
        }),

        vscode.commands.registerCommand('valentinia.testVoice', async () => {
            const config = vscode.workspace.getConfiguration('valentinia');
            const voiceKey = config.get<string>('voice', 'es_AR-daniela-high');
            const speed = config.get<number>('speed', 0.9);
            const voiceInfo = VOICE_CATALOG[voiceKey] || VOICE_CATALOG['es_AR-daniela-high'];

            vscode.window.showInformationMessage(`Testing valentinIA voice: ${voiceInfo.label}...`);
            await audioEngine.speak(cleanMarkdownForSpeech(voiceInfo.sampleText), voiceKey, speed);
        })
    );

    // 3. Register Native IDE Transcript & IPC Watcher
    setupTranscriptWatcher();

    // 4. Register Native IDE Lifecycle Event Hooks
    context.subscriptions.push(
        vscode.tasks.onDidEndTaskProcess(async (event) => {
            const config = vscode.workspace.getConfiguration('valentinia');
            if (!config.get<boolean>('enabled', true) || !config.get<boolean>('notifyOnTaskCompletion', true)) {
                return;
            }

            const voiceKey = config.get<string>('voice', 'es_AR-daniela-high');
            const speed = config.get<number>('speed', 0.9);
            const taskName = event.execution.task.name;

            if (event.exitCode === 0) {
                await audioEngine.speak(`La tarea ${taskName} ha sido completada exitosamente.`, voiceKey, speed);
            } else {
                await audioEngine.speak(`Atención. La tarea ${taskName} ha fallado con código de error ${event.exitCode}.`, voiceKey, speed);
            }
        })
    );

    context.subscriptions.push(
        vscode.debug.onDidTerminateDebugSession(async (session) => {
            const config = vscode.workspace.getConfiguration('valentinia');
            if (!config.get<boolean>('enabled', true) || !config.get<boolean>('notifyOnDebugTermination', true)) {
                return;
            }

            const voiceKey = config.get<string>('voice', 'es_AR-daniela-high');
            const speed = config.get<number>('speed', 0.9);
            await audioEngine.speak(`La sesión de depuración ${session.name} ha finalizado.`, voiceKey, speed);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('valentinia')) {
                updateStatusBar();
            }
        })
    );
}

async function showQuickSettingsMenu() {
    const config = vscode.workspace.getConfiguration('valentinia');
    const enabled = config.get<boolean>('enabled', true);
    const currentVoiceKey = config.get<string>('voice', 'es_AR-daniela-high');
    const currentSpeed = config.get<number>('speed', 0.9);
    const voiceInfo = VOICE_CATALOG[currentVoiceKey] || VOICE_CATALOG['es_AR-daniela-high'];

    const items: vscode.QuickPickItem[] = [
        {
            label: enabled ? '$(mute) Mute Voice Output' : '$(unmute) Activate Voice Output',
            description: enabled ? 'Currently: ACTIVE' : 'Currently: MUTED'
        },
        {
            label: '$(unmute) Select Regional Voice Model',
            description: `Currently: ${voiceInfo.label}`
        },
        {
            label: '$(dashboard) Adjust Speech Rate / Speed',
            description: `Currently: ${currentSpeed.toFixed(2)}`
        },
        {
            label: '$(play) Test Current Voice Sample',
            description: 'Audition current voice model & speed'
        }
    ];

    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'valentinIA Settings Menu'
    });

    if (!selection) {
        return;
    }

    if (selection.label.includes('Mute') || selection.label.includes('Activate')) {
        setMuteState(enabled);
    } else if (selection.label.includes('Select Regional Voice')) {
        showVoicePickerMenu();
    } else if (selection.label.includes('Adjust Speech Rate')) {
        showSpeedPickerMenu();
    } else if (selection.label.includes('Test Current Voice')) {
        vscode.commands.executeCommand('valentinia.testVoice');
    }
}

async function showVoicePickerMenu() {
    const config = vscode.workspace.getConfiguration('valentinia');
    const currentVoiceKey = config.get<string>('voice', 'es_AR-daniela-high');

    const items: vscode.QuickPickItem[] = Object.values(VOICE_CATALOG).map(v => ({
        label: v.label,
        description: v.key === currentVoiceKey ? '(Active)' : '',
        detail: v.key
    }));

    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select Female Regional Voice Model'
    });

    if (selection && selection.detail) {
        config.update('voice', selection.detail, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`valentinIA Voice set to: ${selection.label}`);
    }
}

async function showSpeedPickerMenu() {
    const config = vscode.workspace.getConfiguration('valentinia');
    const currentSpeed = config.get<number>('speed', 0.9);

    const speedOptions = [
        { label: '0.85 - Pausada / Relajada', speed: 0.85 },
        { label: '0.90 - Narradora de Estudio (Recomendada)', speed: 0.90 },
        { label: '1.00 - Estándar', speed: 1.00 },
        { label: '1.10 - Rápida', speed: 1.10 }
    ];

    const items: vscode.QuickPickItem[] = speedOptions.map(opt => ({
        label: opt.label,
        description: opt.speed === currentSpeed ? '(Active)' : ''
    }));

    const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select Speech Rate Speed'
    });

    if (selection) {
        const found = speedOptions.find(opt => opt.label === selection.label);
        if (found) {
            config.update('speed', found.speed, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`valentinIA Speech Speed set to: ${found.speed}`);
        }
    }
}

function setupTranscriptWatcher() {
    const tempDir = path.join(os.homedir(), '.valentinIA', 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const requestFile = path.join(tempDir, 'speak_request.json');

    const checkAllSources = async () => {
        const config = vscode.workspace.getConfiguration('valentinia');
        if (!config.get<boolean>('enabled', true)) {
            return;
        }

        // A. Priority 1: Direct IPC speak_request.json
        if (fs.existsSync(requestFile)) {
            try {
                const content = fs.readFileSync(requestFile, 'utf-8');
                if (content.trim()) {
                    const payload = JSON.parse(content);
                    const message = payload.message || payload.text;
                    if (message && message !== lastSpokenContent) {
                        lastSpokenContent = message;
                        const voiceKey = payload.voice || config.get<string>('voice', 'es_AR-daniela-high');
                        const speed = payload.speed || config.get<number>('speed', 0.9);
                        try {
                            fs.unlinkSync(requestFile);
                        } catch {}
                        await audioEngine.speak(cleanMarkdownForSpeech(message), voiceKey, speed);
                        return;
                    }
                }
            } catch {}
        }

        // B. Priority 2: Direct IDE Transcript Log Watcher (~/.gemini/antigravity-ide/brain/)
        try {
            const brainDir = path.join(os.homedir(), '.gemini', 'antigravity-ide', 'brain');
            if (fs.existsSync(brainDir)) {
                const convDirs = fs.readdirSync(brainDir);
                let latestFile: string | null = null;
                let latestMtime = 0;

                for (const conv of convDirs) {
                    const transcriptPath = path.join(brainDir, conv, '.system_generated', 'logs', 'transcript.jsonl');
                    if (fs.existsSync(transcriptPath)) {
                        const stat = fs.statSync(transcriptPath);
                        if (stat.mtimeMs > latestMtime) {
                            latestMtime = stat.mtimeMs;
                            latestFile = transcriptPath;
                        }
                    }
                }

                if (latestFile && (Date.now() - latestMtime < 10000)) { // Updated in last 10s
                    const lines = fs.readFileSync(latestFile, 'utf-8').trim().split('\n');
                    for (let i = lines.length - 1; i >= 0; i--) {
                        try {
                            const data = JSON.parse(lines[i]);
                            if (data.type === 'PLANNER_RESPONSE' && data.content) {
                                const responseText = data.content.trim();
                                if (responseText && responseText !== lastSpokenContent) {
                                    lastSpokenContent = responseText;
                                    const voiceKey = config.get<string>('voice', 'es_AR-daniela-high');
                                    const speed = config.get<number>('speed', 0.9);
                                    await audioEngine.speak(cleanMarkdownForSpeech(responseText), voiceKey, speed);
                                }
                                break;
                            }
                        } catch {}
                    }
                }
            }
        } catch {}
    };

    pollInterval = setInterval(checkAllSources, 1000);
}

function cleanMarkdownForSpeech(text: string): string {
    return text
        .replace(/```[\s\S]*?```/g, ' [bloque de código omitido] ') // Skip long code blocks
        .replace(/`([^`]+)`/g, '$1') // Inline code
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Strip Emojis
        .replace(/^#+\s+/gm, '') // Headers
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
        .replace(/\*([^*]+)\*/g, '$1') // Italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
        .replace(/^[\s*-]+\s+/gm, '') // Bullet points
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
}

function setMuteState(muted: boolean) {
    const config = vscode.workspace.getConfiguration('valentinia');
    config.update('enabled', !muted, vscode.ConfigurationTarget.Global);
    updateStatusBar();
}

function updateStatusBar() {
    const config = vscode.workspace.getConfiguration('valentinia');
    const enabled = config.get<boolean>('enabled', true);
    if (enabled) {
        statusBarItem.text = '$(unmute) valentinIA: Active';
        statusBarItem.tooltip = 'valentinIA Settings Menu (Click to open menu)';
    } else {
        statusBarItem.text = '$(mute) valentinIA: Muted';
        statusBarItem.tooltip = 'valentinIA Settings Menu (Click to open menu)';
    }
}

export function deactivate() {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    if (audioEngine) {
        audioEngine.stop();
    }
}
