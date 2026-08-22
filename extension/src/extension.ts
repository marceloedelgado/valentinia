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

    // 1. Create Status Bar Item (Direct 1-Click Instant Mute / Active Toggle & Audio Kill)
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'valentinia.toggle';
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
            const speed = config.get<number>('speed', 0.85);
            const voiceInfo = VOICE_CATALOG[voiceKey] || VOICE_CATALOG['es_AR-daniela-high'];

            vscode.window.showInformationMessage(`Testing valentinIA voice: ${voiceInfo.label}...`);
            await audioEngine.speak(cleanMarkdownForSpeech(voiceInfo.sampleText), voiceKey, speed);
        })
    );

    // 3. Register Native IDE Transcript Watcher (Final Turn Completion Only)
    setupTranscriptWatcher();

    // 4. Configuration Change Listener
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
    const currentSpeed = config.get<number>('speed', 0.85);
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
            description: `Currently: ${currentSpeed.toFixed(2)}x`
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
    const currentSpeed = config.get<number>('speed', 0.85);

    const speedOptions = [
        { label: '0.75x - Muy Pausada / Calma', speed: 0.75 },
        { label: '0.85x - Narradora de Estudio 24kHz (Por Defecto)', speed: 0.85 },
        { label: '0.95x - Estándar', speed: 0.95 },
        { label: '1.05x - Rápida', speed: 1.05 },
        { label: '1.15x - Ultra Rápida', speed: 1.15 }
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
            vscode.window.showInformationMessage(`valentinIA Speech Speed set to: ${found.speed}x`);
        }
    }
}

function setupTranscriptWatcher() {
    const checkFinalResponseOnly = async () => {
        const config = vscode.workspace.getConfiguration('valentinia');
        if (!config.get<boolean>('enabled', true)) {
            return;
        }

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

                // Verify file has completed generation and settled for at least 5000ms (5 seconds buffer)
                if (latestFile) {
                    const quietTime = Date.now() - latestMtime;
                    if (quietTime >= 5000 && quietTime < 60000) {
                        const lines = fs.readFileSync(latestFile, 'utf-8').trim().split('\n');
                        for (let i = lines.length - 1; i >= 0; i--) {
                            try {
                                const data = JSON.parse(lines[i]);
                                if (data.type === 'PLANNER_RESPONSE' && data.content) {
                                    const responseText = data.content.trim();
                                    if (responseText && responseText !== lastSpokenContent) {
                                        lastSpokenContent = responseText;
                                        const voiceKey = config.get<string>('voice', 'es_AR-daniela-high');
                                        const speed = config.get<number>('speed', 0.85);
                                        await audioEngine.speak(cleanMarkdownForSpeech(responseText), voiceKey, speed);
                                    }
                                    break;
                                }
                            } catch {}
                        }
                    }
                }
            }
        } catch {}
    };

    pollInterval = setInterval(checkFinalResponseOnly, 500);
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
    const newEnabledState = !muted;
    config.update('enabled', newEnabledState, vscode.ConfigurationTarget.Global);
    if (muted) {
        audioEngine.stop(); // INSTANTLY KILL AUDIO PLAYBACK
    }
    updateStatusBar();
}

function updateStatusBar() {
    const config = vscode.workspace.getConfiguration('valentinia');
    const enabled = config.get<boolean>('enabled', true);
    if (enabled) {
        statusBarItem.text = '$(unmute) valentinIA: Active';
        statusBarItem.tooltip = 'Click to INSTANTLY MUTE & silence audio';
    } else {
        statusBarItem.text = '$(mute) valentinIA: Muted';
        statusBarItem.tooltip = 'Click to ACTIVATE voice output';
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
