export interface VoiceModel {
    key: string;
    label: string;
    sampleText: string;
}

export const VOICE_CATALOG: Record<string, VoiceModel> = {
    "es_AR-daniela-high": {
        key: "es_AR-daniela-high",
        label: "Spanish (Argentina) - Daniela High",
        sampleText: "Hola, la extensión nativa de valentinIA está lista y operando."
    },
    "es_ES-mls_10246-low": {
        key: "es_ES-mls_10246-low",
        label: "Spanish (Spain) - MLS Female",
        sampleText: "Hola, las tareas se han completado correctamente."
    },
    "es_MX-claude-high": {
        key: "es_MX-claude-high",
        label: "Spanish (Mexico) - Claude High",
        sampleText: "Hola, la ejecución ha finalizado exitosamente."
    },
    "en_US-ljspeech-high": {
        key: "en_US-ljspeech-high",
        label: "English (USA) - LJ Speech High",
        sampleText: "Hello, valentinIA native IDE extension is active and ready."
    },
    "en_GB-cori-high": {
        key: "en_GB-cori-high",
        label: "English (UK) - Cori High",
        sampleText: "Hello, tasks have completed successfully."
    },
    "pt_BR-faber-medium": {
        key: "pt_BR-faber-medium",
        label: "Portuguese (Brazil) - Faber Medium",
        sampleText: "Olá, as tarefas foram concluídas com sucesso."
    },
    "fr_FR-siwis-medium": {
        key: "fr_FR-siwis-medium",
        label: "French (France) - Siwis Medium",
        sampleText: "Bonjour, toutes les tâches sont terminées."
    },
    "de_DE-kerstin-low": {
        key: "de_DE-kerstin-low",
        label: "German (Germany) - Kerstin Low",
        sampleText: "Hallo, alle Aufgaben wurden abgeschlossen."
    },
    "it_IT-paola-medium": {
        key: "it_IT-paola-medium",
        label: "Italian (Italy) - Paola Medium",
        sampleText: "Ciao, tutti i compiti sono stati completati."
    }
};
