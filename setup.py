#!/usr/bin/env python3
import os
import sys
import json
import shutil
import subprocess
import urllib.request
from typing import Optional, Tuple, Dict


VOICE_MAP = {
    # English
    "en_US": {
        "key": "en_US-ljspeech-high",
        "label": "USA",
        "sample": "Hello, all tasks have been completed successfully.",
    },
    "en_GB": {
        "key": "en_GB-cori-high",
        "label": "UK",
        "sample": "Hello, all tasks have been completed successfully.",
    },
    # Spanish
    "es_AR": {
        "key": "es_AR-daniela-high",
        "label": "Argentina",
        "sample": "Hola, las tareas fueron completadas exitosamente.",
    },
    "es_ES": {
        "key": "es_ES-sharvard-medium",
        "label": "Spain",
        "sample": "Hola, las tareas fueron completadas exitosamente.",
    },
    "es_MX": {
        "key": "es_MX-claude-high",
        "label": "Mexico",
        "sample": "Hola, las tareas fueron completadas exitosamente.",
    },
    # Direct Single Voices
    "pt_BR": {
        "key": "pt_BR-faber-medium",
        "label": "Portuguese",
        "sample": "Olá, todas as tarefas foram concluídas com sucesso.",
    },
    "fr_FR": {
        "key": "fr_FR-siwis-medium",
        "label": "French",
        "sample": "Bonjour, toutes les tâches sont terminées avec succès.",
    },
    "de_DE": {
        "key": "de_DE-kerstin-low",
        "label": "German",
        "sample": "Hallo, alle Aufgaben wurden erfolgreich abgeschlossen.",
    },
    "it_IT": {
        "key": "it_IT-paola-medium",
        "label": "Italian",
        "sample": "Ciao, tutti i compiti sono stati completati con successo.",
    },
    # Regional / Other Voices
    "nl_NL": {
        "key": "nl_NL-coachtts-medium",
        "label": "Dutch",
        "sample": "Hallo, alle taken zijn succesvol afgerond.",
    },
    "pl_PL": {
        "key": "pl_PL-darkman-medium",
        "label": "Polish",
        "sample": "Cześć, wszystkie zadania zostały zakończone pomyślnie.",
    },
    "ru_RU": {
        "key": "ru_RU-iryna-medium",
        "label": "Russian",
        "sample": "Здравствуйте, все задачи успешно выполнены.",
    },
    "zh_CN": {
        "key": "zh_CN-huayan-medium",
        "label": "Chinese",
        "sample": "你好，所有任务都已成功完成。",
    },
    "ko_KR": {
        "key": "ko_KR-kss-medium",
        "label": "Korean",
        "sample": "안녕하세요, 모든 작업이 성공적으로 완료 되었습니다.",
    },
    "ar_JO": {
        "key": "ar_JO-kareem-medium",
        "label": "Arabic",
        "sample": "مرحبا، تم إكمال جميع المهام بنجاح.",
    },
    "tr_TR": {
        "key": "tr_TR-dfki-medium",
        "label": "Turkish",
        "sample": "Merhaba, tüm görevler başarıyla tamamlandı.",
    },
    "sw_CD": {
        "key": "sw_CD-lanfrica-medium",
        "label": "Swahili",
        "sample": "Jambo, kazi zote zimekamilika kwa mafanikio.",
    },
}


class SetupWizard:
    def __init__(self):
        self.base_dir = os.path.expanduser("~/.valentinIA")
        self.venv_bin = os.path.join(self.base_dir, "venv", "bin")
        self.voices_dir = os.path.join(self.base_dir, "voices")
        self.temp_dir = os.path.join(self.base_dir, "temp")
        self.catalog_path = os.path.join(self.temp_dir, "voices.json")
        self.catalog_url = "https://huggingface.co/rhasspy/piper-voices/resolve/main/voices.json"
        self.base_hf_url = "https://huggingface.co/rhasspy/piper-voices/resolve/main"

        os.makedirs(self.voices_dir, exist_ok=True)
        os.makedirs(self.temp_dir, exist_ok=True)

        self.catalog: Dict = {}
        self._load_catalog()

    def _load_catalog(self) -> None:
        if not os.path.exists(self.catalog_path):
            try:
                subprocess.run(["curl", "-s", "-L", self.catalog_url, "-o", self.catalog_path], check=True)
            except Exception:
                pass

        if os.path.exists(self.catalog_path):
            try:
                with open(self.catalog_path, "r", encoding="utf-8") as f:
                    self.catalog = json.load(f)
            except Exception:
                self.catalog = {}

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

    def get_download_urls(self, voice_key: str) -> Tuple[Optional[str], Optional[str]]:
        info = self.catalog.get(voice_key, {})
        files = info.get("files", {})
        onnx_rel = None
        json_rel = None
        for path in files.keys():
            if path.endswith(".onnx"):
                onnx_rel = path
            elif path.endswith(".onnx.json"):
                json_rel = path

        if not onnx_rel:
            return None, None

        return f"{self.base_hf_url}/{onnx_rel}", f"{self.base_hf_url}/{json_rel}"

    def ensure_voice_downloaded(self, voice_key: str) -> bool:
        onnx_path = os.path.join(self.voices_dir, f"{voice_key}.onnx")
        json_path = os.path.join(self.voices_dir, f"{voice_key}.onnx.json")

        if os.path.exists(onnx_path) and os.path.exists(json_path):
            return True

        onnx_url, json_url = self.get_download_urls(voice_key)
        if not onnx_url or not json_url:
            return False

        try:
            print(f"Downloading voice model '{voice_key}'...")
            subprocess.run(["curl", "-L", "--progress-bar", onnx_url, "-o", onnx_path], check=True)
            subprocess.run(["curl", "-L", "--progress-bar", json_url, "-o", json_path], check=True)
            print("Download completed successfully.")
            return True
        except Exception as e:
            print(f"Failed to download voice model: {e}")
            if os.path.exists(onnx_path):
                os.remove(onnx_path)
            if os.path.exists(json_path):
                os.remove(json_path)
            return False

    def test_voice(self, voice_key: str, sample_text: str) -> None:
        if not self.ensure_voice_downloaded(voice_key):
            print("Could not load voice model for audio test.")
            return

        piper_bin = os.path.join(self.venv_bin, "piper")
        if not os.path.exists(piper_bin):
            piper_bin = shutil.which("piper") or "piper"

        model_path = os.path.join(self.voices_dir, f"{voice_key}.onnx")
        temp_wav = os.path.join(self.temp_dir, "audition.wav")

        try:
            process = subprocess.Popen(
                [piper_bin, "--model", model_path, "--output-file", temp_wav],
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            process.communicate(input=sample_text.encode("utf-8"), timeout=15)

            if process.returncode == 0 and os.path.exists(temp_wav):
                player_cmd = self.resolve_audio_player()
                if player_cmd:
                    print("Testing voice sample...")
                    if sys.platform == "win32" and player_cmd[0] == "powershell":
                        cmd = player_cmd + [f"(New-Object Media.SoundPlayer '{temp_wav}').PlaySync()"]
                    else:
                        cmd = player_cmd + [temp_wav]
                    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
        finally:
            if os.path.exists(temp_wav):
                try:
                    os.remove(temp_wav)
                except OSError:
                    pass

    def save_env_config(self, voice_key: str) -> None:
        target_files = [".env", os.path.expanduser("~/.valentinIA/.env")]
        for env_file in target_files:
            lines = []
            if os.path.exists(env_file):
                try:
                    with open(env_file, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                except Exception:
                    lines = []

            new_lines = []
            voice_updated = False
            for line in lines:
                if line.startswith("DEFAULT_VOICE="):
                    new_lines.append(f"DEFAULT_VOICE={voice_key}\n")
                    voice_updated = True
                else:
                    new_lines.append(line)

            if not voice_updated:
                new_lines.append(f"DEFAULT_VOICE={voice_key}\n")

            try:
                with open(env_file, "w", encoding="utf-8") as f:
                    f.writelines(new_lines)
            except Exception:
                pass

        print(f"\nConfiguration saved. Active voice: {voice_key}")

    def prompt_voice_selection(self, voice_key: str, label: str, sample: str) -> bool:
        print(f"\nTesting {label} voice...")
        self.test_voice(voice_key, sample)

        choice = input("\nUse this voice? [Y/n]: ").strip().lower()
        if choice in ("", "y", "yes"):
            self.save_env_config(voice_key)
            return True
        return False

    def menu_english(self) -> bool:
        while True:
            print("\nEnglish")
            print("--------------------------------------------------")
            print("  1. USA")
            print("  2. UK")
            print("  0. Back")
            choice = input("\nSelect [0-2] (Default 1): ").strip() or "1"
            if choice == "0":
                return False
            elif choice == "1":
                if self.prompt_voice_selection(
                    VOICE_MAP["en_US"]["key"],
                    "English (USA)",
                    VOICE_MAP["en_US"]["sample"],
                ):
                    return True
            elif choice == "2":
                if self.prompt_voice_selection(
                    VOICE_MAP["en_GB"]["key"],
                    "English (UK)",
                    VOICE_MAP["en_GB"]["sample"],
                ):
                    return True

    def menu_spanish(self) -> bool:
        while True:
            print("\nSpanish")
            print("--------------------------------------------------")
            print("  1. Argentina")
            print("  2. Spain")
            print("  3. Mexico")
            print("  0. Back")
            choice = input("\nSelect [0-3] (Default 1): ").strip() or "1"
            if choice == "0":
                return False
            elif choice == "1":
                if self.prompt_voice_selection(
                    VOICE_MAP["es_AR"]["key"],
                    "Spanish (Argentina)",
                    VOICE_MAP["es_AR"]["sample"],
                ):
                    return True
            elif choice == "2":
                if self.prompt_voice_selection(
                    VOICE_MAP["es_ES"]["key"],
                    "Spanish (Spain)",
                    VOICE_MAP["es_ES"]["sample"],
                ):
                    return True
            elif choice == "3":
                if self.prompt_voice_selection(
                    VOICE_MAP["es_MX"]["key"],
                    "Spanish (Mexico)",
                    VOICE_MAP["es_MX"]["sample"],
                ):
                    return True

    def menu_other_languages(self) -> bool:
        while True:
            print("\nOther Languages")
            print("--------------------------------------------------")
            print("  1. Europe")
            print("  2. Asia")
            print("  3. Middle East")
            print("  4. Africa")
            print("  5. Search Code")
            print("  0. Back")
            choice = input("\nSelect [0-5] (Default 1): ").strip() or "1"

            if choice == "0":
                return False
            elif choice == "1":
                if self.menu_europe():
                    return True
            elif choice == "2":
                if self.menu_asia():
                    return True
            elif choice == "3":
                if self.menu_middle_east():
                    return True
            elif choice == "4":
                if self.prompt_voice_selection(
                    VOICE_MAP["sw_CD"]["key"],
                    "Swahili",
                    VOICE_MAP["sw_CD"]["sample"],
                ):
                    return True
            elif choice == "5":
                if self.menu_search():
                    return True

    def menu_europe(self) -> bool:
        while True:
            print("\nEurope")
            print("--------------------------------------------------")
            print("  1. Dutch")
            print("  2. Polish")
            print("  3. Russian")
            print("  0. Back")
            choice = input("\nSelect [0-3] (Default 1): ").strip() or "1"
            if choice == "0":
                return False
            elif choice == "1":
                if self.prompt_voice_selection(
                    VOICE_MAP["nl_NL"]["key"],
                    "Dutch",
                    VOICE_MAP["nl_NL"]["sample"],
                ):
                    return True
            elif choice == "2":
                if self.prompt_voice_selection(
                    VOICE_MAP["pl_PL"]["key"],
                    "Polish",
                    VOICE_MAP["pl_PL"]["sample"],
                ):
                    return True
            elif choice == "3":
                if self.prompt_voice_selection(
                    VOICE_MAP["ru_RU"]["key"],
                    "Russian",
                    VOICE_MAP["ru_RU"]["sample"],
                ):
                    return True

    def menu_asia(self) -> bool:
        while True:
            print("\nAsia")
            print("--------------------------------------------------")
            print("  1. Chinese")
            print("  2. Korean")
            print("  0. Back")
            choice = input("\nSelect [0-2] (Default 1): ").strip() or "1"
            if choice == "0":
                return False
            elif choice == "1":
                if self.prompt_voice_selection(
                    VOICE_MAP["zh_CN"]["key"],
                    "Chinese",
                    VOICE_MAP["zh_CN"]["sample"],
                ):
                    return True
            elif choice == "2":
                if self.prompt_voice_selection(
                    VOICE_MAP["ko_KR"]["key"],
                    "Korean",
                    VOICE_MAP["ko_KR"]["sample"],
                ):
                    return True

    def menu_middle_east(self) -> bool:
        while True:
            print("\nMiddle East")
            print("--------------------------------------------------")
            print("  1. Arabic")
            print("  2. Turkish")
            print("  0. Back")
            choice = input("\nSelect [0-2] (Default 1): ").strip() or "1"
            if choice == "0":
                return False
            elif choice == "1":
                if self.prompt_voice_selection(
                    VOICE_MAP["ar_JO"]["key"],
                    "Arabic",
                    VOICE_MAP["ar_JO"]["sample"],
                ):
                    return True
            elif choice == "2":
                if self.prompt_voice_selection(
                    VOICE_MAP["tr_TR"]["key"],
                    "Turkish",
                    VOICE_MAP["tr_TR"]["sample"],
                ):
                    return True

    def menu_search(self) -> bool:
        query = input("\nEnter language or ISO country code: ").strip().lower()
        if not query:
            return False

        matches = []
        for key, info in self.catalog.items():
            lang = info.get("language", {})
            code = lang.get("code", "").lower()
            country = lang.get("country_english", "").lower()
            name_eng = lang.get("name_english", "").lower()
            if query in (code, country, name_eng, key.lower()):
                matches.append((key, info))

        if not matches:
            print(f"No voice models found for '{query}'.")
            return False

        print(f"\nSearch Results for '{query}':")
        print("--------------------------------------------------")
        for idx, (k, info) in enumerate(matches[:10], 1):
            lang = info.get("language", {})
            print(f"  {idx}. {lang.get('name_english')} ({lang.get('country_english')}) [{k}]")
        print("  0. Back")

        choice = input(f"\nSelect [0-{len(matches[:10])}] (Default 1): ").strip() or "1"
        if choice == "0":
            return False

        try:
            idx = int(choice) - 1
            if 0 <= idx < len(matches[:10]):
                selected_key = matches[idx][0]
                lang_name = matches[idx][1].get("language", {}).get("name_english", "Selected")
                return self.prompt_voice_selection(
                    selected_key,
                    lang_name,
                    "Hello, voice notification test successfully completed.",
                )
        except ValueError:
            pass

        return False

    def run(self) -> None:
        while True:
            print("\nvalentinIA Voice Setup")
            print("--------------------------------------------------")
            print("  1. English")
            print("  2. Spanish")
            print("  3. Portuguese")
            print("  4. French")
            print("  5. German")
            print("  6. Italian")
            print("  7. Other languages")
            print("  8. Cancel")

            choice = input("\nSelect [1-8] (Default 1): ").strip() or "1"

            if choice == "8":
                print("Setup cancelled. Retaining current configuration.")
                sys.exit(0)
            elif choice == "1":
                if self.menu_english():
                    break
            elif choice == "2":
                if self.menu_spanish():
                    break
            elif choice == "3":
                if self.prompt_voice_selection(
                    VOICE_MAP["pt_BR"]["key"],
                    "Portuguese",
                    VOICE_MAP["pt_BR"]["sample"],
                ):
                    break
            elif choice == "4":
                if self.prompt_voice_selection(
                    VOICE_MAP["fr_FR"]["key"],
                    "French",
                    VOICE_MAP["fr_FR"]["sample"],
                ):
                    break
            elif choice == "5":
                if self.prompt_voice_selection(
                    VOICE_MAP["de_DE"]["key"],
                    "German",
                    VOICE_MAP["de_DE"]["sample"],
                ):
                    break
            elif choice == "6":
                if self.prompt_voice_selection(
                    VOICE_MAP["it_IT"]["key"],
                    "Italian",
                    VOICE_MAP["it_IT"]["sample"],
                ):
                    break
            elif choice == "7":
                if self.menu_other_languages():
                    break


if __name__ == "__main__":
    wizard = SetupWizard()
    if len(sys.argv) > 1 and sys.argv[1] in ("-y", "--non-interactive"):
        wizard.ensure_voice_downloaded("en_US-ljspeech-high")
        wizard.save_env_config("en_US-ljspeech-high")
    else:
        wizard.run()
