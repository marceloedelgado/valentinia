import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { NativeAudioEngine } from './audioEngine';
import { VOICE_CATALOG } from './voiceCatalog';
import { WelcomePanel } from './welcomePanel';

let audioEngine: NativeAudioEngine;
let statusBarItem: vscode.StatusBarItem;
let pollInterval: NodeJS.Timeout | null = null;
let lastSpokenContent: string = '';
let sessionMuted: boolean = false;

export function activate(context: vscode.ExtensionContext) {
    audioEngine = new NativeAudioEngine();

    // 1. Session Mute Reset (Always start in ACTIVE state on window reload)
    sessionMuted = false;

    // 2. First-Install Onboarding Flow (Dual-Page Coexistence: Extension Details + Onboarding Webview)
    const hasInstalledBefore = context.globalState.get<boolean>('hasInstalledBefore', false);
    if (!hasInstalledBefore) {
        context.globalState.update('hasInstalledBefore', true);
        markExistingTranscriptAsRead();

        // Open Default Extension Details Page (with README, marketing info, Uninstall & Settings buttons)
        vscode.commands.executeCommand('extension.open', 'valentinia.valentinia-extension').then(() => { }, () => { });

        // Recite initial greeting sample
        setTimeout(async () => {
            const config = vscode.workspace.getConfiguration('valentinia');
            const voiceKey = config.get<string>('voice', 'en_US-ljspeech-high');
            const speed = config.get<number>('speed', 0.85);
            await audioEngine.speak(cleanMarkdownForSpeech("Hi, I'm valentinIA. You can change my language anytime."), voiceKey, speed);
        }, 1000);

        // Open Welcome Panel automatically in active focus in front of details page
        setTimeout(() => {
            WelcomePanel.show(
                context.extensionUri,
                () => updateStatusBar(),
                (voiceKey, speed) => {
                    const voiceInfo = VOICE_CATALOG[voiceKey] || VOICE_CATALOG['en_US-ljspeech-high'];
                    audioEngine.speak(cleanMarkdownForSpeech(voiceInfo.sampleText), voiceKey, speed);
                }
            );
        }, 1500);
    }

    // 3. Create Status Bar Item (Direct 1-Click Instant Session Mute Toggle & Audio Kill)
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'valentinia.toggle';
    updateStatusBar();
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 4. Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('valentinia.welcome', () => {
            WelcomePanel.show(
                context.extensionUri,
                () => updateStatusBar(),
                (voiceKey, speed) => {
                    const voiceInfo = VOICE_CATALOG[voiceKey] || VOICE_CATALOG['en_US-ljspeech-high'];
                    audioEngine.speak(cleanMarkdownForSpeech(voiceInfo.sampleText), voiceKey, speed);
                }
            );
        }),

        vscode.commands.registerCommand('valentinia.menu', async () => {
            showQuickSettingsMenu(context);
        }),

        vscode.commands.registerCommand('valentinia.selectVoice', async () => {
            showVoicePickerMenu();
        }),

        vscode.commands.registerCommand('valentinia.selectSpeed', async () => {
            showSpeedPickerMenu();
        }),

        vscode.commands.registerCommand('valentinia.enable', () => {
            sessionMuted = false;
            updateStatusBar();
            vscode.window.showInformationMessage('valentinIA Voice Output Activated.');
        }),

        vscode.commands.registerCommand('valentinia.disable', () => {
            sessionMuted = true;
            audioEngine.stop();
            updateStatusBar();
            vscode.window.showInformationMessage('valentinIA Voice Output Muted.');
        }),

        vscode.commands.registerCommand('valentinia.toggle', () => {
            sessionMuted = !sessionMuted;
            if (sessionMuted) {
                audioEngine.stop(); // INSTANTLY KILL AUDIO PLAYBACK
            }
            updateStatusBar();
        }),

        vscode.commands.registerCommand('valentinia.testVoice', async () => {
            const config = vscode.workspace.getConfiguration('valentinia');
            const voiceKey = config.get<string>('voice', 'en_US-ljspeech-high');
            const speed = config.get<number>('speed', 0.85);
            const voiceInfo = VOICE_CATALOG[voiceKey] || VOICE_CATALOG['en_US-ljspeech-high'];

            vscode.window.showInformationMessage(`Testing valentinIA voice: ${voiceInfo.label}...`);
            await audioEngine.speak(cleanMarkdownForSpeech(voiceInfo.sampleText), voiceKey, speed);
        })
    );

    // 5. Register Isolated Native Transcript Watcher
    setupTranscriptWatcher();

    // 6. Configuration Change Listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('valentinia')) {
                updateStatusBar();
            }
        })
    );
}

function markExistingTranscriptAsRead() {
    try {
        const appName = vscode.env.appName || '';
        const isAntigravity = appName.toLowerCase().includes('antigravity');

        let latestFile: string | null = null;
        let latestMtime = 0;

        if (isAntigravity) {
            const brainDir = path.join(os.homedir(), '.gemini', 'antigravity-ide', 'brain');
            if (fs.existsSync(brainDir)) {
                const convDirs = fs.readdirSync(brainDir);
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
            }
        } else {
            const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
            if (fs.existsSync(claudeProjectsDir)) {
                const scanDir = (dir: string) => {
                    const entries = fs.readdirSync(dir);
                    for (const entry of entries) {
                        const fullPath = path.join(dir, entry);
                        try {
                            const stat = fs.statSync(fullPath);
                            if (stat.isDirectory()) {
                                scanDir(fullPath);
                            } else if (entry.endsWith('.jsonl')) {
                                if (stat.mtimeMs > latestMtime) {
                                    latestMtime = stat.mtimeMs;
                                    latestFile = fullPath;
                                }
                            }
                        } catch { }
                    }
                };
                scanDir(claudeProjectsDir);
            }
        }

        if (latestFile) {
            const lines = fs.readFileSync(latestFile, 'utf-8').trim().split('\n');
            for (let i = lines.length - 1; i >= 0; i--) {
                try {
                    const data = JSON.parse(lines[i]);
                    let responseText: string | null = null;
                    if (data.type === 'PLANNER_RESPONSE' && data.content) {
                        responseText = data.content.trim();
                    } else if (data.type === 'assistant' || data.role === 'assistant' || data.message?.role === 'assistant') {
                        const msgContent = data.message?.content || data.content;
                        if (typeof msgContent === 'string') {
                            responseText = msgContent.trim();
                        } else if (Array.isArray(msgContent)) {
                            const textBlocks = msgContent.filter((b: any) => b.type === 'text' && b.text);
                            if (textBlocks.length > 0) {
                                responseText = textBlocks.map((b: any) => b.text).join('\n\n').trim();
                            }
                        }
                    }
                    if (responseText) {
                        lastSpokenContent = responseText;
                        break;
                    }
                } catch { }
            }
        }
    } catch { }
}

async function showQuickSettingsMenu(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('valentinia');
    const currentVoiceKey = config.get<string>('voice', 'en_US-ljspeech-high');
    const currentSpeed = config.get<number>('speed', 0.85);
    const voiceInfo = VOICE_CATALOG[currentVoiceKey] || VOICE_CATALOG['en_US-ljspeech-high'];

    const items: vscode.QuickPickItem[] = [
        {
            label: !sessionMuted ? '$(mute) Mute Voice Output' : '$(unmute) Activate Voice Output',
            description: !sessionMuted ? 'Currently: ACTIVE' : 'Currently: MUTED'
        },
        {
            label: '$(layout) General Settings',
            description: 'Interactive visual setup panel'
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
        vscode.commands.executeCommand('valentinia.toggle');
    } else if (selection.label.includes('Settings')) {
        vscode.commands.executeCommand('valentinia.welcome');
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
    const currentVoiceKey = config.get<string>('voice', 'en_US-ljspeech-high');

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
        if (sessionMuted) {
            return;
        }

        const config = vscode.workspace.getConfiguration('valentinia');
        if (!config.get<boolean>('enabled', true)) {
            return;
        }

        const appName = vscode.env.appName || '';
        const isAntigravity = appName.toLowerCase().includes('antigravity');

        try {
            let latestFile: string | null = null;
            let latestMtime = 0;

            if (isAntigravity) {
                // 1. Antigravity IDE Isolated Logs
                const brainDir = path.join(os.homedir(), '.gemini', 'antigravity-ide', 'brain');
                if (fs.existsSync(brainDir)) {
                    const convDirs = fs.readdirSync(brainDir);
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
                }
            } else {
                // 2. VS Code Isolated Logs (Claude Code CLI / Terminal / VS Code Extensions)
                const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
                if (fs.existsSync(claudeProjectsDir)) {
                    const scanDir = (dir: string) => {
                        const entries = fs.readdirSync(dir);
                        for (const entry of entries) {
                            const fullPath = path.join(dir, entry);
                            try {
                                const stat = fs.statSync(fullPath);
                                if (stat.isDirectory()) {
                                    scanDir(fullPath);
                                } else if (entry.endsWith('.jsonl')) {
                                    if (stat.mtimeMs > latestMtime) {
                                        latestMtime = stat.mtimeMs;
                                        latestFile = fullPath;
                                    }
                                }
                            } catch { }
                        }
                    };
                    scanDir(claudeProjectsDir);
                }
            }

            if (latestFile) {
                const lines = fs.readFileSync(latestFile, 'utf-8').trim().split('\n');
                for (let i = lines.length - 1; i >= 0; i--) {
                    try {
                        const data = JSON.parse(lines[i]);
                        let responseText: string | null = null;

                        // 1. Antigravity Format (PLANNER_RESPONSE)
                        if (data.type === 'PLANNER_RESPONSE' && data.content) {
                            responseText = data.content.trim();
                        }
                        // 2. Claude Code Format (data.type === 'assistant' or data.message?.role === 'assistant')
                        else if (data.type === 'assistant' || data.role === 'assistant' || data.message?.role === 'assistant') {
                            const msgContent = data.message?.content || data.content;

                            if (typeof msgContent === 'string') {
                                responseText = msgContent.trim();
                            } else if (Array.isArray(msgContent)) {
                                const textBlocks = msgContent.filter((b: any) => b.type === 'text' && b.text);
                                if (textBlocks.length > 0) {
                                    responseText = textBlocks.map((b: any) => b.text).join('\n\n').trim();
                                }
                            }
                        }

                        if (responseText && responseText !== lastSpokenContent) {
                            lastSpokenContent = responseText;
                            const voiceKey = config.get<string>('voice', 'en_US-ljspeech-high');
                            const speed = config.get<number>('speed', 0.85);
                            await audioEngine.speak(cleanMarkdownForSpeech(responseText), voiceKey, speed);
                        }

                        if (responseText) {
                            break;
                        }
                    } catch { }
                }
            }
        } catch { }
    };

    // 50ms ultra-fast polling interval for host-isolated speech playback
    pollInterval = setInterval(checkFinalResponseOnly, 50);
}

function cleanMarkdownForSpeech(text: string): string {
    return text
        .replace(/```[\s\S]*?```/g, ' [bloque de código omitido] ') // Skip long code blocks
        .replace(/`([^`]+)`/g, '$1') // Inline code
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Strip Emojis
        .replace(/^[\s*-]{3,}$/gm, ' . . . ') // Convert horizontal dividers (--- / ***) into extended 1.2s acoustic silence pauses
        .replace(/^#+\s*(.+)$/gm, '$1.') // Convert Headers (# Title) into a distinct sentence with a trailing period & pause
        .replace(/^[\s*-]+\s*(.+)$/gm, '$1.') // Convert Bullet Points (- Item) into distinct sentences with a trailing period & pause
        .replace(/:\s*\n/g, '. \n') // Convert colons before newlines into full stops
        .replace(/:\s+/g, ', ') // Convert inline colons into comma pause markers
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
        .replace(/\*([^*]+)\*/g, '$1') // Italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
        .replace(/\n+/g, '. ') // Convert multiple newlines into full stops for distinct sentence pauses
        .replace(/\.\s*\./g, '.') // Normalize duplicate periods
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
}

function updateStatusBar() {
    if (!sessionMuted) {
        statusBarItem.text = '$(unmute) valentinIA: Active';
        statusBarItem.tooltip = 'Click to INSTANTLY MUTE audio for current session';
    } else {
        statusBarItem.text = '$(mute) valentinIA: Muted';
        statusBarItem.tooltip = 'Click to ACTIVATE audio';
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
