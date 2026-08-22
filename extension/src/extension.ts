import * as vscode from 'vscode';
import { NativeAudioEngine } from './audioEngine';
import { VOICE_CATALOG } from './voiceCatalog';

let audioEngine: NativeAudioEngine;
let statusBarItem: vscode.StatusBarItem;

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

    // 3. Register Native IDE Lifecycle Event Hooks
    // Task End Event Hook (Terminal builds, scripts, tests completion)
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

    // Debug Termination Event Hook
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

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('valentinia')) {
                updateStatusBar();
            }
        })
    );
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
        statusBarItem.text = '$(symbol-keyword) valentinIA: Active';
        statusBarItem.tooltip = 'valentinIA Native Voice Notifications Active (Click to Mute)';
    } else {
        statusBarItem.text = '$(mute) valentinIA: Muted';
        statusBarItem.tooltip = 'valentinIA Native Voice Notifications Muted (Click to Activate)';
    }
}

export function deactivate() {
    if (audioEngine) {
        audioEngine.stop();
    }
}
