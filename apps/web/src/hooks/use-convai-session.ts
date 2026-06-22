import { useState, useRef, useCallback, useEffect } from "react";
import { Conversation } from "@11labs/client";
import type { TranscriptEntry } from "@/stores/interview";

interface UseConvaiSessionOptions {
    signedUrl: string | null;
    overrides?: {
        systemPrompt: string;
        voiceId: string;
        firstMessage: string;
        maxDurationSeconds: number;
    } | null;
    onTranscript?: (entry: TranscriptEntry) => void;
    onAISpeakingChange?: (speaking: boolean) => void;
}

interface ConvaiSessionState {
    isConnected: boolean;
    isAISpeaking: boolean;
    error: string | null;
}

export function useConvaiSession(options: UseConvaiSessionOptions) {
    const { signedUrl, overrides, onTranscript, onAISpeakingChange } = options;

    const [state, setState] = useState<ConvaiSessionState>({
        isConnected: false,
        isAISpeaking: false,
        error: null,
    });

    const conversationRef = useRef<Conversation | null>(null);
    // Track if the hook is still mounted to prevent state updates after unmount
    const mountedRef = useRef(true);
    // Track if disconnect was intentional (user/cleanup) vs server-initiated
    const intentionalCloseRef = useRef(false);

    // Stable callback refs (no re-renders when these change)
    const onTranscriptRef = useRef(onTranscript);
    onTranscriptRef.current = onTranscript;
    const onAISpeakingChangeRef = useRef(onAISpeakingChange);
    onAISpeakingChangeRef.current = onAISpeakingChange;

    // Store overrides in a ref so connect() always has the latest value
    // without needing to be in its dependency array
    const overridesRef = useRef(overrides);
    overridesRef.current = overrides;

    // Store signedUrl in a ref for the same reason
    const signedUrlRef = useRef(signedUrl);
    signedUrlRef.current = signedUrl;

    // Connect
    const connect = useCallback(async () => {
        const url = signedUrlRef.current;
        if (!url) {
            setState((s) => ({ ...s, error: "No signed URL provided" }));
            return;
        }

        // Prevent double-connect
        if (conversationRef.current) {
            console.log("[ConvAI] Already connected, skipping");
            return;
        }

        intentionalCloseRef.current = false;
        setState({ isConnected: false, isAISpeaking: false, error: null });

        try {
            // Request mic permission (required by the SDK)
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Check if we were unmounted while waiting for mic
            if (!mountedRef.current) {
                console.log("[ConvAI] Unmounted during mic request, aborting");
                return;
            }

            // Build session config
            const sessionConfig: Parameters<
                typeof Conversation.startSession
            >[0] = {
                signedUrl: url,

                onConnect: ({ conversationId }) => {
                    console.log(
                        "[ConvAI] Connected, conversationId:",
                        conversationId,
                    );
                    if (mountedRef.current) {
                        setState((s) => ({
                            ...s,
                            isConnected: true,
                            error: null,
                        }));
                    }
                },

                onDisconnect: () => {
                    const wasIntentional = intentionalCloseRef.current;
                    console.log(
                        "[ConvAI] Disconnected (intentional:",
                        wasIntentional,
                        ")",
                    );
                    conversationRef.current = null;

                    if (mountedRef.current) {
                        setState((s) => ({
                            ...s,
                            isConnected: false,
                            isAISpeaking: false,
                        }));
                    }
                },

                onMessage: (message: { message: string; source: string }) => {
                    if (message.source === "ai") {
                        onTranscriptRef.current?.({
                            speaker: "ai",
                            text: message.message,
                            timestamp: Date.now(),
                        });
                    } else if (message.source === "user") {
                        onTranscriptRef.current?.({
                            speaker: "user",
                            text: message.message,
                            timestamp: Date.now(),
                        });
                    }
                },

                onModeChange: ({ mode }: { mode: string }) => {
                    const isSpeaking = mode === "speaking";
                    if (mountedRef.current) {
                        setState((s) => ({ ...s, isAISpeaking: isSpeaking }));
                    }
                    onAISpeakingChangeRef.current?.(isSpeaking);
                },

                onError: (error: unknown) => {
                    const msg =
                        error instanceof Error
                            ? error.message
                            : typeof error === "string"
                              ? error
                              : "Conversational AI error";
                    console.error("[ConvAI] Error:", msg);
                    if (mountedRef.current) {
                        setState((s) => ({ ...s, error: msg }));
                    }
                },
            };

            // Add overrides if provided (only valid values)
            const currentOverrides = overridesRef.current;
            if (currentOverrides) {
                const configOverrides: Record<string, unknown> = {};

                if (
                    currentOverrides.systemPrompt ||
                    currentOverrides.firstMessage
                ) {
                    const agentOverride: Record<string, unknown> = {};
                    if (currentOverrides.systemPrompt) {
                        agentOverride.prompt = {
                            prompt: currentOverrides.systemPrompt,
                        };
                    }
                    if (currentOverrides.firstMessage) {
                        agentOverride.firstMessage =
                            currentOverrides.firstMessage;
                    }
                    configOverrides.agent = agentOverride;
                }

                if (currentOverrides.voiceId) {
                    configOverrides.tts = {
                        voiceId: currentOverrides.voiceId,
                    };
                }

                if (Object.keys(configOverrides).length > 0) {
                    sessionConfig.overrides =
                        configOverrides as typeof sessionConfig.overrides;
                    console.log("[ConvAI] Sending overrides:", {
                        hasPrompt: !!currentOverrides.systemPrompt,
                        hasVoice: !!currentOverrides.voiceId,
                        promptLength:
                            currentOverrides.systemPrompt?.length || 0,
                    });
                }
            }

            // Check mounted again before starting session
            if (!mountedRef.current) {
                console.log(
                    "[ConvAI] Unmounted before session start, aborting",
                );
                return;
            }

            console.log("[ConvAI] Starting session...");
            const conversation = await Conversation.startSession(sessionConfig);

            // Check if we were unmounted during startSession
            if (!mountedRef.current) {
                console.log(
                    "[ConvAI] Unmounted during session start, ending session",
                );
                intentionalCloseRef.current = true;
                conversation.endSession().catch(() => {});
                return;
            }

            conversationRef.current = conversation;
            console.log("[ConvAI] Session started successfully");
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Failed to start session";
            console.error("[ConvAI] Failed to start:", msg, err);
            if (mountedRef.current) {
                setState((s) => ({
                    ...s,
                    isConnected: false,
                    error: msg,
                }));
            }
        }
        // No dependencies - uses refs for all external values
    }, []);

    // Disconnect (user-initiated)
    const disconnect = useCallback(async () => {
        intentionalCloseRef.current = true;

        if (conversationRef.current) {
            try {
                await conversationRef.current.endSession();
            } catch {
                // Session may already be ended
            }
            conversationRef.current = null;
        }

        if (mountedRef.current) {
            setState({
                isConnected: false,
                isAISpeaking: false,
                error: null,
            });
        }
    }, []);

    // Track mount status
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            intentionalCloseRef.current = true;
            if (conversationRef.current) {
                console.log("[ConvAI] Cleanup: ending session");
                conversationRef.current.endSession().catch(() => {});
                conversationRef.current = null;
            }
        };
    }, []);

    return {
        isConnected: state.isConnected,
        isAISpeaking: state.isAISpeaking,
        aiAudioLevel: 0,
        userAudioLevel: 0,
        error: state.error,
        connect,
        disconnect,
    };
}
