// deepgram speech-to-text (streaming)

import { DeepgramClient } from "@deepgram/sdk";

const deepgramApiKey = process.env.DEEPGRAM_API_KEY!;
const deepgram = new DeepgramClient({ apiKey: deepgramApiKey });

interface DeepgramStreamOptions {
    onTranscript: (text: string, isFinal: boolean) => void;
    onError: (error: Error) => void;
}

export async function createDeepgramStream(options: DeepgramStreamOptions) {
    const connection = await deepgram.listen.v1.connect({
        Authorization: `Token ${deepgramApiKey}`,
        model: "nova-2",
        language: "en",
        smart_format: "true",
        punctuate: "true",
        interim_results: "true",
        utterance_end_ms: 1000,
        vad_events: "true",
        encoding: "linear16",
        sample_rate: 16000,
    });

    connection.on("message", (data) => {
        if (data.type !== "Results") return;

        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript && transcript.trim().length > 0) {
            const isFinal = data.is_final ?? false;
            options.onTranscript(transcript, isFinal);
        }
    });

    connection.on("error", (err: any) => {
        console.error("[Deepgram] Stream error:", err);
        options.onError(new Error(err.message || "Deepgram stream error"));
    });

    connection.on("close", () => {
        console.log("[Deepgram] Stream closed");
    });

    return {
        send: (data: ArrayBuffer | Blob | ArrayBufferView) =>
            connection.sendMedia(data),
        close: () => connection.close(),
    };
}

export function closeDeepgramStream(
    connection: { close: () => void } | null | undefined,
) {
    try {
        if (connection) {
            connection.close();
        }
    } catch (err) {
        console.error("[Deepgram] Error closing stream:", err);
    }
}
