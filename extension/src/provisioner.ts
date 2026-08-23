import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as https from 'https';
import { execSync } from 'child_process';

const BASE_DIR = path.join(os.homedir(), '.valentinIA');
const BIN_DIR = path.join(BASE_DIR, 'bin');
const VOICES_DIR = path.join(BASE_DIR, 'voices');
const TEMP_DIR = path.join(BASE_DIR, 'temp');

export interface ProvisionStatus {
    piperBinary: string;
    defaultVoiceOnnx: string;
    defaultVoiceJson: string;
}

export class NativeProvisioner {
    constructor() {
        this.ensureDirectories();
    }

    private ensureDirectories(): void {
        [BASE_DIR, BIN_DIR, VOICES_DIR, TEMP_DIR].forEach((dir) => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    public getExecutablePath(): string | null {
        const binName = process.platform === 'win32' ? 'piper.exe' : 'piper';
        const localBin = path.join(BIN_DIR, binName);
        if (fs.existsSync(localBin)) {
            return localBin;
        }

        // Check fallback in Python venv
        const venvBin = path.join(BASE_DIR, 'venv', 'bin', binName);
        if (fs.existsSync(venvBin)) {
            return venvBin;
        }

        // Check system PATH
        try {
            const whichCmd = process.platform === 'win32' ? 'where piper' : 'which piper';
            const sysPath = execSync(whichCmd, { stdio: 'pipe' }).toString().trim().split('\n')[0];
            if (sysPath && fs.existsSync(sysPath)) {
                return sysPath;
            }
        } catch {
            // ignore
        }

        return null;
    }

    public isVoiceInstalled(voiceKey: string): boolean {
        const onnxPath = path.join(VOICES_DIR, `${voiceKey}.onnx`);
        const jsonPath = path.join(VOICES_DIR, `${voiceKey}.onnx.json`);
        return fs.existsSync(onnxPath) && fs.existsSync(jsonPath);
    }

    public async ensureProvisioned(defaultVoiceKey: string = 'en_US-ljspeech-high'): Promise<ProvisionStatus> {
        let piperBin = this.getExecutablePath();
        const voiceInstalled = this.isVoiceInstalled(defaultVoiceKey);

        if (piperBin && voiceInstalled) {
            return {
                piperBinary: piperBin,
                defaultVoiceOnnx: path.join(VOICES_DIR, `${defaultVoiceKey}.onnx`),
                defaultVoiceJson: path.join(VOICES_DIR, `${defaultVoiceKey}.onnx.json`)
            };
        }

        return await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'valentinIA: Auto-provisioning Native Speech Engine...',
                cancellable: false
            },
            async (progress) => {
                if (!piperBin) {
                    progress.report({ message: 'Downloading standalone Piper C++ engine...' });
                    piperBin = await this.downloadPiperBinary();
                }

                if (!this.isVoiceInstalled(defaultVoiceKey)) {
                    progress.report({ message: `Downloading global voice model (${defaultVoiceKey})...` });
                    await this.downloadVoiceModel(defaultVoiceKey);
                }

                return {
                    piperBinary: piperBin,
                    defaultVoiceOnnx: path.join(VOICES_DIR, `${defaultVoiceKey}.onnx`),
                    defaultVoiceJson: path.join(VOICES_DIR, `${defaultVoiceKey}.onnx.json`)
                };
            }
        );
    }

    private downloadPiperBinary(): Promise<string> {
        return new Promise((resolve, reject) => {
            const platform = process.platform;
            const arch = process.arch;
            const binName = platform === 'win32' ? 'piper.exe' : 'piper';
            const targetBinPath = path.join(BIN_DIR, binName);

            let archiveName = '';
            if (platform === 'darwin') {
                archiveName = arch === 'arm64' ? 'piper_macos_aarch64.tar.gz' : 'piper_macos_x64.tar.gz';
            } else if (platform === 'linux') {
                archiveName = arch === 'arm64' ? 'piper_linux_aarch64.tar.gz' : 'piper_linux_x86_64.tar.gz';
            } else if (platform === 'win32') {
                archiveName = 'piper_windows_amd64.zip';
            } else {
                archiveName = 'piper_linux_x86_64.tar.gz';
            }

            const downloadUrl = `https://github.com/rhasspy/piper/releases/download/2023.8.15-2/${archiveName}`;
            const tempArchive = path.join(TEMP_DIR, archiveName);

            this.downloadFile(downloadUrl, tempArchive)
                .then(() => {
                    try {
                        if (archiveName.endsWith('.tar.gz')) {
                            execSync(`tar -xzf "${tempArchive}" -C "${BIN_DIR}" --strip-components=1`, { stdio: 'ignore' });
                        } else if (archiveName.endsWith('.zip')) {
                            execSync(`powershell -c "Expand-Archive -Path '${tempArchive}' -DestinationPath '${BIN_DIR}' -Force"`, { stdio: 'ignore' });
                        }

                        if (fs.existsSync(targetBinPath)) {
                            if (platform !== 'win32') {
                                fs.chmodSync(targetBinPath, 0o755);
                            }
                            fs.unlinkSync(tempArchive);
                            resolve(targetBinPath);
                        } else {
                            // Check extracted subfolder
                            const extracted = path.join(BIN_DIR, 'piper', binName);
                            if (fs.existsSync(extracted)) {
                                fs.copyFileSync(extracted, targetBinPath);
                                if (platform !== 'win32') {
                                    fs.chmodSync(targetBinPath, 0o755);
                                }
                                fs.unlinkSync(tempArchive);
                                resolve(targetBinPath);
                            } else {
                                reject(new Error('Piper executable not found in extracted archive.'));
                            }
                        }
                    } catch (err) {
                        reject(err);
                    }
                })
                .catch(reject);
        });
    }

    public downloadVoiceModel(voiceKey: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const onnxPath = path.join(VOICES_DIR, `${voiceKey}.onnx`);
            const jsonPath = path.join(VOICES_DIR, `${voiceKey}.onnx.json`);

            const modelPaths: Record<string, string> = {
                'en_US-ljspeech-high': 'en/en_US/ljspeech/high/en_US-ljspeech-high',
                'es_AR-daniela-high': 'es/es_AR/daniela/high/es_AR-daniela-high',
                'es_ES-mls_10246-low': 'es/es_ES/mls_10246/low/es_ES-mls_10246-low',
                'es_MX-claude-high': 'es/es_MX/claude/high/es_MX-claude-high',
                'en_GB-cori-high': 'en/en_GB/cori/high/en_GB-cori-high',
                'pt_BR-faber-medium': 'pt/pt_BR/faber/medium/pt_BR-faber-medium',
                'fr_FR-siwis-medium': 'fr/fr_FR/siwis/medium/fr_FR-siwis-medium',
                'de_DE-kerstin-low': 'de/de_DE/kerstin/low/de_DE-kerstin-low',
                'it_IT-paola-medium': 'it/it_IT/paola/medium/it_IT-paola-medium'
            };

            const relPath = modelPaths[voiceKey] || `en/en_US/ljspeech/high/en_US-ljspeech-high`;
            const baseUrl = 'https://huggingface.co/rhasspy/piper-voices/resolve/main';

            const urlOnnx = `${baseUrl}/${relPath}.onnx`;
            const urlJson = `${baseUrl}/${relPath}.onnx.json`;

            try {
                if (!fs.existsSync(onnxPath)) {
                    await this.downloadFile(urlOnnx, onnxPath);
                }
                if (!fs.existsSync(jsonPath)) {
                    await this.downloadFile(urlJson, jsonPath);
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    private downloadFile(url: string, dest: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);
            const request = (targetUrl: string) => {
                https.get(targetUrl, (response) => {
                    if (response.statusCode === 301 || response.statusCode === 302) {
                        if (response.headers.location) {
                            request(response.headers.location);
                            return;
                        }
                    }

                    if (response.statusCode !== 200) {
                        fs.unlink(dest, () => {});
                        reject(new Error(`Failed download, HTTP status: ${response.statusCode}`));
                        return;
                    }

                    response.pipe(file);
                    file.on('finish', () => {
                        file.close(() => resolve());
                    });
                }).on('error', (err) => {
                    fs.unlink(dest, () => {});
                    reject(err);
                });
            };
            request(url);
        });
    }
}
