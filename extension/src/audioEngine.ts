import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, execSync, ChildProcess } from 'child_process';
import { VOICE_CATALOG } from './voiceCatalog';
import { NativeProvisioner } from './provisioner';

export class NativeAudioEngine {
    private baseDir: string;
    private voicesDir: string;
    private tempDir: string;
    private activePiperProcess: ChildProcess | null = null;
    private activePlayerProcess: ChildProcess | null = null;
    private provisioner: NativeProvisioner;

    constructor() {
        this.baseDir = path.join(os.homedir(), '.valentinIA');
        this.voicesDir = path.join(this.baseDir, 'voices');
        this.tempDir = path.join(this.baseDir, 'temp');
        this.provisioner = new NativeProvisioner();

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
        if (this.activePiperProcess) {
            try {
                this.activePiperProcess.kill('SIGKILL');
            } catch {
                // ignore
            }
            this.activePiperProcess = null;
        }

        if (this.activePlayerProcess) {
            try {
                this.activePlayerProcess.kill('SIGKILL');
            } catch {
                // ignore
            }
            this.activePlayerProcess = null;
        }
    }

    public speak(text: string, voiceKey: string = 'en_US-ljspeech-high', speed: number = 0.85): Promise<void> {
        return new Promise(async (resolve) => {
            this.stop();

            // Ensure binary and target voice model are provisioned
            const status = await this.provisioner.ensureProvisioned(voiceKey);
            const piperBin = status.piperBinary;

            if (!piperBin || !fs.existsSync(piperBin)) {
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
            const lengthScale = speed > 0 ? (1.0 / speed).toFixed(2) : '1.18';

            this.activePiperProcess = spawn(piperBin, [
                '--model', modelPath,
                '--output-file', tempWav,
                '--length-scale', lengthScale
            ]);

            if (this.activePiperProcess.stdin) {
                this.activePiperProcess.stdin.write(text, 'utf-8');
                this.activePiperProcess.stdin.end();
            }

            this.activePiperProcess.on('close', (code) => {
                this.activePiperProcess = null;

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

                    this.activePlayerProcess = spawn(playerCmd[0], playerCmd.slice(1).concat(args));

                    this.activePlayerProcess.on('close', () => {
                        this.activePlayerProcess = null;
                        this.cleanup(tempWav);
                        resolve();
                    });

                    this.activePlayerProcess.on('error', () => {
                        this.activePlayerProcess = null;
                        this.cleanup(tempWav);
                        resolve();
                    });
                } else {
                    this.cleanup(tempWav);
                    resolve();
                }
            });

            this.activePiperProcess.on('error', () => {
                this.activePiperProcess = null;
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
