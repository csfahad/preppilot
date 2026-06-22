const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

/** Voice IDs mapped to accent preferences */
const VOICE_MAP: Record<string, string> = {
    american: process.env.ELEVENLABS_VOICE_AMERICAN!,
    british: process.env.ELEVENLABS_VOICE_BRITISH!,
    australian: process.env.ELEVENLABS_VOICE_AUSTRALIAN!,
    indian: process.env.ELEVENLABS_VOICE_INDIAN!,
    european: process.env.ELEVENLABS_VOICE_EUROPEAN!,
    african: process.env.ELEVENLABS_VOICE_AFRICAN!,
};

export interface ConvAISessionConfig {
    interviewId: string;
    userId: string;
    voiceAccent: string;
    systemPrompt: string;
    durationMinutes: number;
    roleTitle: string;
}

export interface ConvAISession {
    agentId: string;
    signedUrl: string;
    overrides: {
        systemPrompt: string;
        voiceId: string;
        firstMessage: string;
        maxDurationSeconds: number;
    };
}

export async function createConvAISession(
    config: ConvAISessionConfig,
): Promise<ConvAISession> {
    const agentId = process.env.ELEVENLABS_CONVAI_AGENT_ID;
    if (!agentId) {
        throw new Error(
            "ELEVENLABS_CONVAI_AGENT_ID is not configured. Create a ConvAI agent in the ElevenLabs dashboard first.",
        );
    }

    const voiceId = VOICE_MAP[config.voiceAccent] || VOICE_MAP["american"]!;

    if (voiceId) {
        await patchAgentVoice(agentId, voiceId);
    }

    const firstMessage = `Hi there! Welcome to your mock interview for the ${config.roleTitle} position. I'll be your interviewer today. Are you ready to begin?`;

    // get a signed, single-use WebSocket URL
    const signedUrl = await getSignedUrl(agentId);

    return {
        agentId,
        signedUrl,
        overrides: {
            systemPrompt: config.systemPrompt,
            voiceId,
            firstMessage,
            maxDurationSeconds: config.durationMinutes * 60,
        },
    };
}

export async function endConvAISession(conversationId: string): Promise<void> {
    if (!conversationId) return;

    try {
        const response = await fetch(
            `${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`,
            {
                method: "DELETE",
                headers: {
                    "xi-api-key": process.env.ELEVENLABS_API_KEY!,
                },
            },
        );

        if (!response.ok && response.status !== 404) {
            const errorBody = await response.text().catch(() => "");
            console.error(
                `Failed to end ConvAI conversation ${conversationId}: ${response.status} ${errorBody}`,
            );
        }
    } catch (error) {
        console.error(
            `Error ending ConvAI conversation ${conversationId}:`,
            error,
        );
    }
}

export async function getConversationHistory(
    conversationId: string,
): Promise<Array<{ role: string; message: string }>> {
    const response = await fetch(
        `${ELEVENLABS_API_BASE}/convai/conversations/${conversationId}`,
        {
            method: "GET",
            headers: {
                "xi-api-key": process.env.ELEVENLABS_API_KEY!,
            },
        },
    );

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(
            `Failed to fetch ConvAI conversation history: ${response.status} ${errorBody}`,
        );
    }

    const data = (await response.json()) as {
        transcript?: Array<{ role: string; message: string }>;
    };

    return data.transcript ?? [];
}

/*
 * PATCH the agent's TTS voice before a session starts.
 * This is the only reliable way to change the voice per-session,
 * as client-side `tts.voiceId` overrides via `conversation_initiation_client_data`
 * are silently ignored by ElevenLabs ConvAI.
 */
async function patchAgentVoice(
    agentId: string,
    voiceId: string,
): Promise<void> {
    const response = await fetch(
        `${ELEVENLABS_API_BASE}/convai/agents/${agentId}`,
        {
            method: "PATCH",
            headers: {
                "xi-api-key": process.env.ELEVENLABS_API_KEY!,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                conversation_config: {
                    tts: {
                        voice_id: voiceId,
                    },
                },
            }),
        },
    );

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        console.error(
            `[ConvAI] Failed to PATCH agent voice (${response.status}): ${errorBody}`,
        );
        // don't throw - fall back to the agent's existing voice
    } else {
        //
    }
}

async function getSignedUrl(agentId: string): Promise<string> {
    const response = await fetch(
        `${ELEVENLABS_API_BASE}/convai/conversation/get_signed_url?agent_id=${agentId}`,
        {
            method: "GET",
            headers: {
                "xi-api-key": process.env.ELEVENLABS_API_KEY!,
            },
        },
    );

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(
            `Failed to get ConvAI signed URL: ${response.status} ${errorBody}`,
        );
    }

    const data = (await response.json()) as { signed_url: string };

    if (!data.signed_url) {
        throw new Error("No signed_url returned from ElevenLabs ConvAI API");
    }

    return data.signed_url;
}
