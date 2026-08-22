import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, execSync } from 'child_process';
import { VOICE_CATALOG } from './voiceCatalog';

export class NativeAudioEngine {
    private baseDir: string;
    private venvBin: string;
    private voicesDir: string;
    private tempDir: string;
    private activeProcess: any = null;

    constructor() {
        this.baseDir = path.join(os.homedir(), '.valentinIA');
        this.venvBin = path.join(this.baseDir, 'venv', 'bin');
        this.voicesDir = path.join(this.baseDir, 'voices');
        this.tempDir = path.join(this.baseDir, 'temp');

        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    private resolveAudioPlayer(): string[] | null {
        if (process.platform === 'darwin') {
            return ['afplay'];
        } else if (process.platform === 'linux') {
            for (const cmd of ['aplay', 'paplay', 'pw-play']) {
                try {
                    execSync(`which ${cmd}`, { stdio: 'ignore' });
                    return [cmd];
                } catch {
                    // continue
                }
            }
        } else if (process.platform === 'win32') {
            return ['powershell', '-c'];
        }
        return null;
    }

    public stop(): void {
        if (this.activeProcess) {
            try {
                this.activeProcess.kill('SIGKILL');
            } catch {
                // ignore
            }
            this.activeProcess = null;
        }
    }

    public speak(text: string, voiceKey: string = 'es_AR-daniela-high', speed: number = 1.0): Promise<void> {
        return new Promise((resolve) => {
            this.stop();

            const piperBin = path.join(this.venvBin, 'piper');
            if (!fs.existsSync(piperBin)) {
                resolve();
                return;
            }

            let modelPath = path.join(this.voicesDir, `${voiceKey}.onnx`);
            if (!fs.existsSync(modelPath)) {
                if (fs.existsSync(this.voicesDir)) {
                    const installed = fs.readdirSync(this.voicesDir).filter(f => f.endsWith('.onnx'));
                    if (installed.length > 0) {
                        modelPath = path.join(this.voicesDir, installed[0]);
                    } else {
                        resolve();
                        return;
                    }
                } else {
                    resolve();
                    return;
                }
            }

            const tempWav = path.join(this.tempDir, `native_${Date.now()}.wav`);
            const lengthScale = speed > 0 ? (1.0 / speed).toFixed(2) : '1.0';

            const piperProc = spawn(piperBin, [
                '--model', modelPath,
                '--output-file', tempWav,
                '--length-scale', lengthScale
            ]);

            piperProc.stdin.write(text, 'utf-8');
            piperProc.stdin.end();

            piperProc.on('close', (code) => {
                if (code === 0 && fs.existsSync(tempWav)) {
                    const playerCmd = this.resolveAudioPlayer();
                    if (!playerCmd) {
                        this.cleanup(tempWav);
                        resolve();
                        return;
                    }

                    let args = [tempWav];
                    if (process.platform === 'win32' && playerCmd[0] === 'powershell') {
                        args = [`(New-Object Media.SoundPlayer '${tempWav}').PlaySync()`];
                    }

                    this.activeProcess = spawn(playerCmd[0], playerCmd.slice(1).concat(args));

                    this.activeProcess.on('close', () => {
                        this.activeProcess = null;
                        this.cleanup(tempWav);
                        resolve();
                    });

                    this.activeProcess.on('error', () => {
                        this.activeProcess = null;
                        this.cleanup(tempWav);
                        resolve();
                    });
                } else {
                    this.cleanup(tempWav);
                    resolve();
                }
            });

            piperProc.on('error', () => {
                this.cleanup(tempWav);
                resolve();
            });
        });
    }

    private cleanup(filePath: string): void {
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch {
                // ignore
            }
        }
    }
}
