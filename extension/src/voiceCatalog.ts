export interface VoiceModel {
    key: string;
    language: string;
    region: string;
    continent?: string;
    label: string;
    sampleText: string;
}

export const VOICE_CATALOG: Record<string, VoiceModel> = {
    // 1. English
    "en_US-ljspeech-high": {
        key: "en_US-ljspeech-high",
        language: "English",
        region: "USA",
        label: "English - USA",
        sampleText: "Hi, I'm valentinIA. You can change my language anytime."
    },
    "en_GB-cori-high": {
        key: "en_GB-cori-high",
        language: "English",
        region: "UK",
        label: "English - UK",
        sampleText: "Hello, tasks have completed successfully."
    },

    // 2. Spanish
    "es_AR-daniela-high": {
        key: "es_AR-daniela-high",
        language: "Spanish",
        region: "Argentina",
        label: "Spanish - Argentina",
        sampleText: "Hola, la extensión nativa de valentinIA está lista y operando."
    },
    "es_ES-mls_10246-low": {
        key: "es_ES-mls_10246-low",
        language: "Spanish",
        region: "Spain",
        label: "Spanish - Spain",
        sampleText: "Hola, las tareas se han completado correctamente."
    },
    "es_MX-claude-high": {
        key: "es_MX-claude-high",
        language: "Spanish",
        region: "Mexico",
        label: "Spanish - Mexico",
        sampleText: "Hola, la ejecución ha finalizado exitosamente."
    },

    // 3. Portuguese
    "pt_BR-faber-medium": {
        key: "pt_BR-faber-medium",
        language: "Portuguese",
        region: "Brazil",
        label: "Portuguese",
        sampleText: "Olá, as tarefas foram concluídas com sucesso."
    },

    // 4. French
    "fr_FR-siwis-medium": {
        key: "fr_FR-siwis-medium",
        language: "French",
        region: "France",
        label: "French",
        sampleText: "Bonjour, toutes les tâches sont terminées."
    },

    // 5. German
    "de_DE-kerstin-low": {
        key: "de_DE-kerstin-low",
        language: "German",
        region: "Germany",
        label: "German",
        sampleText: "Hallo, alle Aufgaben wurden abgeschlossen."
    },

    // 6. Italian
    "it_IT-paola-medium": {
        key: "it_IT-paola-medium",
        language: "Italian",
        region: "Italy",
        label: "Italian",
        sampleText: "Ciao, tutti i compiti sono stati completati."
    },

    // 7. Other Languages -> Continent Breakdown (0 paréntesis, 0 aclaraciones)
    // Europe
    "nl_NL-mls-medium": {
        key: "nl_NL-mls-medium",
        language: "Other languages",
        continent: "Europe",
        region: "Dutch",
        label: "Dutch",
        sampleText: "Hallo, de taken zijn succesvol afgerond."
    },
    "pl_PL-darkzar-medium": {
        key: "pl_PL-darkzar-medium",
        language: "Other languages",
        continent: "Europe",
        region: "Polish",
        label: "Polish",
        sampleText: "Cześć, zadania zostały pomyślnie ukończone."
    },
    "uk_UA-ukrainian_tts-medium": {
        key: "uk_UA-ukrainian_tts-medium",
        language: "Other languages",
        continent: "Europe",
        region: "Ukrainian",
        label: "Ukrainian",
        sampleText: "Привіт, завдання успішно виконані."
    },
    "sv_SE-nst-medium": {
        key: "sv_SE-nst-medium",
        language: "Other languages",
        continent: "Europe",
        region: "Swedish",
        label: "Swedish",
        sampleText: "Hej, uppgifterna har slutförts."
    },
    "da_DK-talesyntese-medium": {
        key: "da_DK-talesyntese-medium",
        language: "Other languages",
        continent: "Europe",
        region: "Danish",
        label: "Danish",
        sampleText: "Hej, opgaverne er udført."
    },
    "fi_FI-harri-medium": {
        key: "fi_FI-harri-medium",
        language: "Other languages",
        continent: "Europe",
        region: "Finnish",
        label: "Finnish",
        sampleText: "Hei, tehtävät on suoritettu."
    },
    "el_GR-rapunzelina-low": {
        key: "el_GR-rapunzelina-low",
        language: "Other languages",
        continent: "Europe",
        region: "Greek",
        label: "Greek",
        sampleText: "Γεια σας, οι εργασίες ολοκληρώθηκαν."
    },
    "cs_CZ-jirka-medium": {
        key: "cs_CZ-jirka-medium",
        language: "Other languages",
        continent: "Europe",
        region: "Czech",
        label: "Czech",
        sampleText: "Ahoj, úkoly byly úspěšně dokončeny."
    },
    "hu_HU-dora-medium": {
        key: "hu_HU-dora-medium",
        language: "Other languages",
        continent: "Europe",
        region: "Hungarian",
        label: "Hungarian",
        sampleText: "Szia, a feladatok sikeresen befejeződtek."
    },
    "ro_RO-mihai-medium": {
        key: "ro_RO-mihai-medium",
        language: "Other languages",
        continent: "Europe",
        region: "Romanian",
        label: "Romanian",
        sampleText: "Salut, sarcinile au fost finalizate."
    },
    "tr_TR-dfki-medium": {
        key: "tr_TR-dfki-medium",
        language: "Other languages",
        continent: "Europe",
        region: "Turkish",
        label: "Turkish",
        sampleText: "Merhaba, görevler başarıyla tamamlandı."
    },
    "ca_ES-upc_ona-medium": {
        key: "ca_ES-upc_ona-medium",
        language: "Other languages",
        continent: "Europe",
        region: "Catalan",
        label: "Catalan",
        sampleText: "Hola, les tasques s'han completat."
    },

    // Asia
    "zh_CN-huayan-medium": {
        key: "zh_CN-huayan-medium",
        language: "Other languages",
        continent: "Asia",
        region: "Chinese",
        label: "Chinese",
        sampleText: "你好，任务已成功完成。"
    },
    "ja_JP-takumi-medium": {
        key: "ja_JP-takumi-medium",
        language: "Other languages",
        continent: "Asia",
        region: "Japanese",
        label: "Japanese",
        sampleText: "こんにちは、タスクが正常に完了しました。"
    },
    "ko_KR-kss-medium": {
        key: "ko_KR-kss-medium",
        language: "Other languages",
        continent: "Asia",
        region: "Korean",
        label: "Korean",
        sampleText: "안녕하세요, 작업이 성공적으로 완료되었습니다."
    },
    "hi_IN-hindi_medium": {
        key: "hi_IN-hindi_medium",
        language: "Other languages",
        continent: "Asia",
        region: "Hindi",
        label: "Hindi",
        sampleText: "नमस्ते, कार्य सफलतापूर्वक पूरा हो गया है।"
    },
    "vi_VN-vbee-medium": {
        key: "vi_VN-vbee-medium",
        language: "Other languages",
        continent: "Asia",
        region: "Vietnamese",
        label: "Vietnamese",
        sampleText: "Xin chào, các nhiệm vụ đã hoàn thành."
    },
    "th_TH-siam-medium": {
        key: "th_TH-siam-medium",
        language: "Other languages",
        continent: "Asia",
        region: "Thai",
        label: "Thai",
        sampleText: "สวัสดี งานเสร็จสมบูรณ์แล้ว"
    },

    // Middle East
    "ar_JO-kareem-medium": {
        key: "ar_JO-kareem-medium",
        language: "Other languages",
        continent: "Middle East",
        region: "Arabic",
        label: "Arabic",
        sampleText: "مرحبا، تم إكمال المهام بنجاح."
    },
    "he_IL-heb_medium": {
        key: "he_IL-heb_medium",
        language: "Other languages",
        continent: "Middle East",
        region: "Hebrew",
        label: "Hebrew",
        sampleText: "שלום, המשימות הושלמו בהצלחה."
    },
    "fa_IR-amir-medium": {
        key: "fa_IR-amir-medium",
        language: "Other languages",
        continent: "Middle East",
        region: "Persian",
        label: "Persian",
        sampleText: "سلام، وظایف با موفقیت انجام شد."
    },

    // Africa
    "sw_CD-lanza-medium": {
        key: "sw_CD-lanza-medium",
        language: "Other languages",
        continent: "Africa",
        region: "Swahili",
        label: "Swahili",
        sampleText: "Jambo, kazi zimekamilika kwa mafanikio."
    },
    "am_ET-amharic_medium": {
        key: "am_ET-amharic_medium",
        language: "Other languages",
        continent: "Africa",
        region: "Amharic",
        label: "Amharic",
        sampleText: "ሰላም፣ ስራዎች በተሳካ ሁኔታ ተጠናቀዋል።"
    },
    "yo_NG-yoruba_medium": {
        key: "yo_NG-yoruba_medium",
        language: "Other languages",
        continent: "Africa",
        region: "Yoruba",
        label: "Yoruba",
        sampleText: "Bawo, awon ise ti pari si rere."
    },
    "ha_NG-hausa_medium": {
        key: "ha_NG-hausa_medium",
        language: "Other languages",
        continent: "Africa",
        region: "Hausa",
        label: "Hausa",
        sampleText: "Sannu, ayyuka sun kammala cikin nasara."
    }
};
