import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { NativeAudioEngine } from './audioEngine';
import { VOICE_CATALOG } from './voiceCatalog';

let audioEngine: NativeAudioEngine;
let statusBarItem: vscode.StatusBarItem;
let fileWatcher: fs.FSWatcher | null = null;
let pollInterval: NodeJS.Timeout | null = null;
let lastSpokenText: string = '';

export function activate(context: vscode.ExtensionContext) {
    audioEngine = new NativeAudioEngine();

    // 1. Create Status Bar Item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'valentinia.toggle';
    updateStatusBar();
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 2. Register Commands
    context.subscriptions.push(
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
            const speed = config.get<number>('speed', 1.0);
            const voiceInfo = VOICE_CATALOG[voiceKey] || VOICE_CATALOG['es_AR-daniela-high'];

            vscode.window.showInformationMessage(`Testing valentinIA voice: ${voiceInfo.label}...`);
            await audioEngine.speak(voiceInfo.sampleText, voiceKey, speed);
        })
    );

    // 3. Register Native Transcript & IPC Watcher
    setupTranscriptWatcher();

    // 4. Register Native IDE Lifecycle Event Hooks
    context.subscriptions.push(
        vscode.tasks.onDidEndTaskProcess(async (event) => {
            const config = vscode.workspace.getConfiguration('valentinia');
            if (!config.get<boolean>('enabled', true) || !config.get<boolean>('notifyOnTaskCompletion', true)) {
                return;
            }

            const voiceKey = config.get<string>('voice', 'es_AR-daniela-high');
            const speed = config.get<number>('speed', 1.0);
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
            const speed = config.get<number>('speed', 1.0);
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

function setupTranscriptWatcher() {
    const tempDir = path.join(os.homedir(), '.valentinIA', 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const requestFile = path.join(tempDir, 'speak_request.json');

    const checkRequestFile = async () => {
        const config = vscode.workspace.getConfiguration('valentinia');
        if (!config.get<boolean>('enabled', true)) {
            return;
        }

        if (fs.existsSync(requestFile)) {
            try {
                const content = fs.readFileSync(requestFile, 'utf-8');
                if (content.trim()) {
                    const payload = JSON.parse(content);
                    const message = payload.message || payload.text;
                    if (message && message !== lastSpokenText) {
                        lastSpokenText = message;
                        const voiceKey = payload.voice || config.get<string>('voice', 'es_AR-daniela-high');
                        const speed = payload.speed || config.get<number>('speed', 1.0);
                        try {
                            fs.unlinkSync(requestFile);
                        } catch {
                            // ignore
                        }
                        await audioEngine.speak(message, voiceKey, speed);
                    }
                }
            } catch {
                // ignore
            }
        }
    };

    try {
        fileWatcher = fs.watch(tempDir, (eventType, filename) => {
            if (!filename || filename === 'speak_request.json') {
                checkRequestFile();
            }
        });
    } catch {
        // fallback
    }

    // Always poll every 500ms as reliable fallback on macOS/Linux
    pollInterval = setInterval(checkRequestFile, 500);
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
        statusBarItem.tooltip = 'valentinIA Native Voice Notifications Active (Click to Mute)';
    } else {
        statusBarItem.text = '$(mute) valentinIA: Muted';
        statusBarItem.tooltip = 'valentinIA Native Voice Notifications Muted (Click to Activate)';
    }
}

export function deactivate() {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    if (fileWatcher) {
        try {
            fileWatcher.close();
        } catch {
            // ignore
        }
    }
    if (audioEngine) {
        audioEngine.stop();
    }
}
