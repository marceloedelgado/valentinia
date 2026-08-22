import os
import sys
import shutil
import signal
import uuid
import queue
import threading
import subprocess
from dataclasses import dataclass
from typing import Optional


@dataclass
class AudioTask:
    message: str
    status: Optional[str] = None
    language: Optional[str] = None
    voice: Optional[str] = None
    speed: Optional[float] = 1.0


class AudioEngine:
    def __init__(self):
        self.base_dir = os.path.expanduser("~/.valentinIA")
        self.venv_bin = os.path.join(self.base_dir, "venv", "bin")
        self.voices_dir = os.path.join(self.base_dir, "voices")
        self.sfx_dir = os.path.join(self.base_dir, "sfx")
        self.temp_dir = os.path.join(self.base_dir, "temp")

        os.makedirs(self.temp_dir, exist_ok=True)

        self._task_queue: queue.Queue[AudioTask] = queue.Queue()
        self._current_process: Optional[subprocess.Popen] = None
        self._lock = threading.Lock()

        self._worker_thread = threading.Thread(target=self._process_queue, daemon=True)
        self._worker_thread.start()

    def get_silent_mode(self) -> bool:
        return os.getenv("SILENT_MODE", "false").lower() in ("true", "1", "yes")

    def get_default_voice(self) -> str:
        for env_path in [os.path.expanduser("~/.valentinIA/.env"), ".env"]:
            if os.path.exists(env_path):
                try:
                    with open(env_path, "r", encoding="utf-8") as f:
                        for line in f:
                            if line.startswith("DEFAULT_VOICE="):
                                val = line.split("=", 1)[1].strip()
                                if val:
                                    return val
                except Exception:
                    pass
        return os.getenv("DEFAULT_VOICE", "en_US-ljspeech-high")

    def get_default_speed(self) -> float:
        try:
            return float(os.getenv("DEFAULT_SPEED", "1.0"))
        except ValueError:
            return 1.0

    def resolve_audio_player(self) -> Optional[list[str]]:
        if sys.platform == "darwin":
            if shutil.which("afplay"):
                return ["afplay"]
        elif sys.platform.startswith("linux"):
            for cmd in ["aplay", "paplay", "pw-play"]:
                if shutil.which(cmd):
                    return [cmd]
        elif sys.platform == "win32":
            if shutil.which("powershell"):
                return ["powershell", "-c"]
        return None

    def enqueue_speech(
        self,
        message: str,
        status: Optional[str] = None,
        language: Optional[str] = None,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
    ) -> None:
        task = AudioTask(
            message=message,
            status=status,
            language=language,
            voice=voice,
            speed=speed if speed is not None else self.get_default_speed(),
        )
        self._task_queue.put(task)

    def stop_speaking(self) -> None:
        with self._lock:
            while not self._task_queue.empty():
                try:
                    self._task_queue.get_nowait()
                    self._task_queue.task_done()
                except queue.Empty:
                    break

            if self._current_process and self._current_process.poll() is None:
                try:
                    self._current_process.terminate()
                    self._current_process.wait(timeout=0.5)
                except Exception:
                    try:
                        self._current_process.kill()
                    except Exception:
                        pass
                self._current_process = None

    def _play_file(self, file_path: str) -> None:
        if not os.path.exists(file_path):
            return

        player_cmd = self.resolve_audio_player()
        if not player_cmd:
            return

        with self._lock:
            if sys.platform == "win32" and player_cmd[0] == "powershell":
                cmd = player_cmd + [f"(New-Object Media.SoundPlayer '{file_path}').PlaySync()"]
            else:
                cmd = player_cmd + [file_path]

            try:
                self._current_process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except Exception:
                self._current_process = None
                return

        if self._current_process:
            try:
                self._current_process.wait()
            except Exception:
                pass
            finally:
                with self._lock:
                    self._current_process = None

    def _synthesize_text(self, text: str, voice_name: str, speed: float) -> Optional[str]:
        piper_bin = os.path.join(self.venv_bin, "piper")
        if not os.path.exists(piper_bin):
            piper_bin = shutil.which("piper") or "piper"

        model_path = os.path.join(self.voices_dir, f"{voice_name}.onnx")
        if not os.path.exists(model_path):
            # Fallback to any locally installed voice model in ~/.valentinIA/voices/
            if os.path.exists(self.voices_dir):
                installed_models = [
                    os.path.join(self.voices_dir, f)
                    for f in os.listdir(self.voices_dir)
                    if f.endswith(".onnx")
                ]
                if installed_models:
                    model_path = installed_models[0]
                else:
                    return None
            else:
                return None

        output_file = os.path.join(self.temp_dir, f"speech_{uuid.uuid4().hex}.wav")
        length_scale = 1.0 / speed if speed > 0 else 1.0

        cmd = [
            piper_bin,
            "--model",
            model_path,
            "--output-file",
            output_file,
            "--length-scale",
            str(length_scale),
        ]

        try:
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            process.communicate(input=text.encode("utf-8"), timeout=15)

            if process.returncode == 0 and os.path.exists(output_file):
                return output_file
        except Exception:
            pass

        return None

    def _process_queue(self) -> None:
        while True:
            task = self._task_queue.get()
            try:
                if self.get_silent_mode():
                    continue

                if task.status:
                    sfx_path = os.path.join(self.sfx_dir, f"{task.status}.wav")
                    if os.path.exists(sfx_path):
                        self._play_file(sfx_path)

                if task.message and task.message.strip():
                    voice = task.voice or self.get_default_voice()
                    speed = task.speed if task.speed is not None else self.get_default_speed()
                    wav_file = self._synthesize_text(task.message, voice, speed)

                    if wav_file:
                        try:
                            self._play_file(wav_file)
                        finally:
                            if os.path.exists(wav_file):
                                try:
                                    os.remove(wav_file)
                                except OSError:
                                    pass
            finally:
                self._task_queue.task_done()
