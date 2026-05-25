// elevenLabs text-to-speech (streaming)
// streams AI interviewer voice with regional accent support

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY!,
});

const VOICE_MAP: Record<string, string> = {
    american: process.env.ELEVENLABS_VOICE_AMERICAN!,
    british: process.env.ELEVENLABS_VOICE_BRITISH!,
    australian: process.env.ELEVENLABS_VOICE_AUSTRALIAN!,
    indian: process.env.ELEVENLABS_VOICE_INDIAN!,
    european: process.env.ELEVENLABS_VOICE_EUROPEAN!,
    african: process.env.ELEVENLABS_VOICE_AFRICAN!,
};

export async function streamTTS(
    text: string,
    accentId: string,
): Promise<AsyncIterable<Uint8Array>> {
    const voiceId = VOICE_MAP[accentId]!;

    const audioStream = await elevenlabs.textToSpeech.stream(voiceId, {
        text,
        modelId: "eleven_flash_v2_5",
        outputFormat: "mp3_44100_128",
    });

    return audioStream;
}

// generate a one-shot audio buffer (for shorter responses)
export async function generateTTS(
    text: string,
    accentId: string,
): Promise<Buffer> {
    const voiceId = VOICE_MAP[accentId]!;

    const audioStream = await elevenlabs.textToSpeech.stream(voiceId, {
        text,
        modelId: "eleven_flash_v2_5",
        outputFormat: "mp3_44100_128",
    });

    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
        chunks.push(chunk);
    }

    return Buffer.concat(chunks);
}
