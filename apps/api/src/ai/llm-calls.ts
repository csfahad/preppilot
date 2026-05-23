import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
});

const AI_PROVIDER = process.env.AI_PROVIDER!;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL!;
const GEMINI_MODEL = process.env.GEMINI_MODEL!;
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 30_000;

interface ClaudeMessage {
    role: "user" | "assistant";
    content: string;
}

type AIMessage = ClaudeMessage;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeout: ReturnType<typeof setTimeout>;

    return Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
            timeout = setTimeout(() => {
                reject(
                    new Error(`Claude API call timed out after ${timeoutMs}ms`),
                );
            }, timeoutMs);
        }),
    ]).finally(() => clearTimeout(timeout!));
}

function extractJSON<T>(text: string): T {
    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1]!.trim();
    }

    return JSON.parse(jsonStr) as T;
}

async function callAnthropicText(
    systemPrompt: string,
    messages: AIMessage[],
    options?: { maxTokens?: number; temperature?: number; timeoutMs?: number },
): Promise<string> {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const response = await withTimeout(
        anthropic.messages.create({
            model: ANTHROPIC_MODEL,
            max_tokens: options?.maxTokens ?? 4096,
            temperature: options?.temperature ?? 0.7,
            system: systemPrompt,
            messages,
        }),
        options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text content in Claude response");
    }

    return textBlock.text;
}

async function callGeminiText(
    systemPrompt: string,
    messages: AIMessage[],
    options?: {
        maxTokens?: number;
        temperature?: number;
        timeoutMs?: number;
        responseMimeType?: "application/json" | "text/plain";
    },
): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    const contents = messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
    }));

    const response = await withTimeout(
        fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents,
                    generationConfig: {
                        temperature: options?.temperature ?? 0.7,
                        maxOutputTokens: options?.maxTokens ?? 4096,
                        responseMimeType: options?.responseMimeType,
                    },
                }),
            },
        ),
        options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(
            `Gemini API error ${response.status}: ${errorBody || response.statusText}`,
        );
    }

    const data = (await response.json()) as {
        candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
        }>;
    };
    const text = data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

    if (!text) {
        throw new Error("No text content in Gemini response");
    }

    return text;
}

async function callAIText(
    systemPrompt: string,
    messages: AIMessage[],
    options?: {
        maxTokens?: number;
        temperature?: number;
        timeoutMs?: number;
        responseMimeType?: "application/json" | "text/plain";
    },
): Promise<string> {
    if (AI_PROVIDER === "gemini") {
        return callGeminiText(systemPrompt, messages, options);
    }

    if (AI_PROVIDER !== "anthropic") {
        throw new Error(`Unsupported AI_PROVIDER: ${AI_PROVIDER}`);
    }

    return callAnthropicText(systemPrompt, messages, options);
}

// backward-compatible wrapper used by existing services
export async function callClaudeJSON<T>(
    systemPrompt: string,
    messages: ClaudeMessage[],
    options?: { maxTokens?: number; temperature?: number; timeoutMs?: number },
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const text = await callAIText(systemPrompt, messages, {
                ...options,
                responseMimeType: "application/json",
            });

            return extractJSON<T>(text);
        } catch (err) {
            lastError = err as Error;
            if (attempt < MAX_RETRIES - 1) {
                await new Promise((r) =>
                    setTimeout(r, Math.pow(2, attempt) * 1000),
                );
            }
        }
    }

    throw lastError ?? new Error("AI JSON call failed after retries");
}

// backward-compatible wrapper used by existing services
export async function callClaudeText(
    systemPrompt: string,
    messages: ClaudeMessage[],
    options?: { maxTokens?: number; temperature?: number; timeoutMs?: number },
): Promise<string> {
    return callAIText(systemPrompt, messages, {
        ...options,
        responseMimeType: "text/plain",
    });
}
