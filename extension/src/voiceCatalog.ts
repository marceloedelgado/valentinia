export interface VoiceModel {
    key: string;
    label: string;
    sampleText: string;
}

export const VOICE_CATALOG: Record<string, VoiceModel> = {
    "es_AR-daniela-high": {
        key: "es_AR-daniela-high",
        label: "Spanish (Argentina)",
        sampleText: "Hola, la extensión nativa de valentinIA está lista y operando."
    },
    "es_ES-sharvard-medium": {
        key: "es_ES-sharvard-medium",
        label: "Spanish (Spain)",
        sampleText: "Hola, las tareas se han completado correctamente."
    },
    "es_MX-claude-high": {
        key: "es_MX-claude-high",
        label: "Spanish (Mexico)",
        sampleText: "Hola, la ejecución ha finalizado exitosamente."
    },
    "en_US-ljspeech-high": {
        key: "en_US-ljspeech-high",
        label: "English (USA)",
        sampleText: "Hello, valentinIA native IDE extension is active and ready."
    },
    "en_GB-cori-high": {
        key: "en_GB-cori-high",
        label: "English (UK)",
        sampleText: "Hello, tasks have completed successfully."
    },
    "pt_BR-faber-medium": {
        key: "pt_BR-faber-medium",
        label: "Portuguese (Brazil)",
        sampleText: "Olá, as tarefas foram concluídas com sucesso."
    },
    "fr_FR-siwis-medium": {
        key: "fr_FR-siwis-medium",
        label: "French (France)",
        sampleText: "Bonjour, toutes les tâches sont terminées."
    },
    "de_DE-kerstin-low": {
        key: "de_DE-kerstin-low",
        label: "German (Germany)",
        sampleText: "Hallo, alle Aufgaben wurden abgeschlossen."
    },
    "it_IT-paola-medium": {
        key: "it_IT-paola-medium",
        label: "Italian (Italy)",
        sampleText: "Ciao, tutti i compiti sono stati completati."
    }
};
