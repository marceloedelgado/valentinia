export interface VoiceModel {
    key: string;
    language: string;
    region: string;
    label: string;
    sampleText: string;
}

export const VOICE_CATALOG: Record<string, VoiceModel> = {
    "en_US-ljspeech-high": {
        key: "en_US-ljspeech-high",
        language: "English",
        region: "USA",
        label: "English (USA)",
        sampleText: "Hi, I'm valentinIA. You can change my language anytime."
    },
    "en_GB-cori-high": {
        key: "en_GB-cori-high",
        language: "English",
        region: "UK",
        label: "English (UK)",
        sampleText: "Hello, tasks have completed successfully."
    },
    "es_AR-daniela-high": {
        key: "es_AR-daniela-high",
        language: "Spanish",
        region: "Argentina",
        label: "Spanish (Argentina)",
        sampleText: "Hola, la extensión nativa de valentinIA está lista y operando."
    },
    "es_ES-mls_10246-low": {
        key: "es_ES-mls_10246-low",
        language: "Spanish",
        region: "Spain",
        label: "Spanish (Spain)",
        sampleText: "Hola, las tareas se han completado correctamente."
    },
    "es_MX-claude-high": {
        key: "es_MX-claude-high",
        language: "Spanish",
        region: "Mexico",
        label: "Spanish (Mexico)",
        sampleText: "Hola, la ejecución ha finalizado exitosamente."
    },
    "pt_BR-faber-medium": {
        key: "pt_BR-faber-medium",
        language: "Portuguese",
        region: "Brazil",
        label: "Portuguese (Brazil)",
        sampleText: "Olá, as tarefas foram concluídas com sucesso."
    },
    "fr_FR-siwis-medium": {
        key: "fr_FR-siwis-medium",
        language: "French",
        region: "France",
        label: "French (France)",
        sampleText: "Bonjour, toutes les tâches sont terminées."
    },
    "de_DE-kerstin-low": {
        key: "de_DE-kerstin-low",
        language: "German",
        region: "Germany",
        label: "German (Germany)",
        sampleText: "Hallo, alle Aufgaben wurden abgeschlossen."
    },
    "it_IT-paola-medium": {
        key: "it_IT-paola-medium",
        language: "Italian",
        region: "Italy",
        label: "Italian (Italy)",
        sampleText: "Ciao, tutti i compiti sono stati completati."
    }
};
