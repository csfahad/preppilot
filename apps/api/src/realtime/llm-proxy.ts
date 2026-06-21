import { Router } from "express";
import { randomUUID } from "crypto";
import { callClaudeText } from "../ai/llm-calls.js";
import { addConversationTurn } from "./transcript-collector.js";

const router = Router();

interface OpenAIMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface OpenAIChatCompletionRequest {
    model?: string;
    messages: OpenAIMessage[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
}

router.post("/v1/chat/completions", async (req, res) => {
    try {
        const body = req.body as OpenAIChatCompletionRequest;
        const { messages, stream, temperature, max_tokens } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            res.status(400).json({
                error: {
                    message: "messages array is required and must not be empty",
                    type: "invalid_request_error",
                },
            });
            return;
        }

        // separate system prompt from conversation messages
        const systemMessage = messages.find((m) => m.role === "system");
        const systemPrompt = systemMessage?.content ?? "";

        const conversationMessages = messages
            .filter((m) => m.role !== "system")
            .map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            }));

        // extract interview ID from a custom header (set by the frontend/session manager)
        const interviewId = req.headers["x-interview-id"] as string | undefined;

        if (stream) {
            await handleStreamingResponse(res, {
                systemPrompt,
                conversationMessages,
                temperature,
                maxTokens: max_tokens,
                interviewId,
            });
        } else {
            await handleRegularResponse(res, {
                systemPrompt,
                conversationMessages,
                temperature,
                maxTokens: max_tokens,
                interviewId,
            });
        }
    } catch (error) {
        console.error("LLM proxy error:", error);
        const message =
            error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({
            error: {
                message,
                type: "server_error",
            },
        });
    }
});

// regular (non-streaming) response
async function handleRegularResponse(
    res: any,
    params: {
        systemPrompt: string;
        conversationMessages: Array<{
            role: "user" | "assistant";
            content: string;
        }>;
        temperature?: number;
        maxTokens?: number;
        interviewId?: string;
    },
): Promise<void> {
    const responseText = await callClaudeText(
        params.systemPrompt,
        params.conversationMessages,
        {
            temperature: params.temperature ?? 0.7,
            maxTokens: params.maxTokens ?? 1024,
            timeoutMs: 15_000,
        },
    );

    // store the AI turn for transcript collection
    if (params.interviewId) {
        const lastUserMessage = [...params.conversationMessages]
            .reverse()
            .find((m) => m.role === "user");

        // store user turn (the latest user message that triggered this response)
        if (lastUserMessage) {
            const userTurnIndex = params.conversationMessages.filter(
                (m) => m.role === "user",
            ).length;
            await addConversationTurn({
                interviewId: params.interviewId,
                speaker: "user",
                text: lastUserMessage.content,
                turnIndex: (userTurnIndex - 1) * 2,
                startedAt: new Date(),
            }).catch((err) => console.error("Failed to store user turn:", err));
        }

        // store AI turn
        const aiTurnIndex = params.conversationMessages.filter(
            (m) => m.role === "assistant",
        ).length;
        await addConversationTurn({
            interviewId: params.interviewId,
            speaker: "ai",
            text: responseText,
            turnIndex: aiTurnIndex * 2 + 1,
            startedAt: new Date(),
        }).catch((err) => console.error("Failed to store AI turn:", err));
    }

    const completionId = `chatcmpl-${randomUUID()}`;

    res.json({
        id: completionId,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "prep-pilot-interviewer",
        choices: [
            {
                index: 0,
                message: {
                    role: "assistant",
                    content: responseText,
                },
                finish_reason: "stop",
            },
        ],
        usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
        },
    });
}

// streaming (SSE) response
async function handleStreamingResponse(
    res: any,
    params: {
        systemPrompt: string;
        conversationMessages: Array<{
            role: "user" | "assistant";
            content: string;
        }>;
        temperature?: number;
        maxTokens?: number;
        interviewId?: string;
    },
): Promise<void> {
    // set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const completionId = `chatcmpl-${randomUUID()}`;

    // get the full response from our LLM (Claude/Gemini don't expose token-level
    // streaming through our callClaudeText wrapper, so we simulate chunked SSE)
    const responseText = await callClaudeText(
        params.systemPrompt,
        params.conversationMessages,
        {
            temperature: params.temperature ?? 0.7,
            maxTokens: params.maxTokens ?? 1024,
            timeoutMs: 15_000,
        },
    );

    // chunk the response into word-level pieces for SSE streaming
    const words = responseText.split(/(\s+)/);
    const chunkSize = 3; // send ~3 tokens at a time for natural pacing

    for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join("");
        if (!chunk) continue;

        const sseData = {
            id: completionId,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: "prep-pilot-interviewer",
            choices: [
                {
                    index: 0,
                    delta: {
                        ...(i === 0 ? { role: "assistant" } : {}),
                        content: chunk,
                    },
                    finish_reason: null,
                },
            ],
        };

        res.write(`data: ${JSON.stringify(sseData)}\n\n`);
    }

    // send the final chunk with finish_reason
    const finalData = {
        id: completionId,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: "prep-pilot-interviewer",
        choices: [
            {
                index: 0,
                delta: {},
                finish_reason: "stop",
            },
        ],
    };
    res.write(`data: ${JSON.stringify(finalData)}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();

    // store turns for transcript collection (fire-and-forget)
    if (params.interviewId) {
        const lastUserMessage = [...params.conversationMessages]
            .reverse()
            .find((m) => m.role === "user");

        if (lastUserMessage) {
            const userTurnIndex = params.conversationMessages.filter(
                (m) => m.role === "user",
            ).length;
            addConversationTurn({
                interviewId: params.interviewId,
                speaker: "user",
                text: lastUserMessage.content,
                turnIndex: (userTurnIndex - 1) * 2,
                startedAt: new Date(),
            }).catch((err) => console.error("Failed to store user turn:", err));
        }

        const aiTurnIndex = params.conversationMessages.filter(
            (m) => m.role === "assistant",
        ).length;
        addConversationTurn({
            interviewId: params.interviewId,
            speaker: "ai",
            text: responseText,
            turnIndex: aiTurnIndex * 2 + 1,
            startedAt: new Date(),
        }).catch((err) => console.error("Failed to store AI turn:", err));
    }
}

export default router;
