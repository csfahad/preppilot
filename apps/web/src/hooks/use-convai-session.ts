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
    onRecordingAudioStream?: (source: {
        stream: MediaStream;
        context: AudioContext;
    }) => void;
}

interface ConvaiSessionState {
    isConnected: boolean;
    isAISpeaking: boolean;
    aiAudioLevel: number;
    userAudioLevel: number;
    error: string | null;
}

type VoiceConversation = Conversation & {
    output?: {
        context: AudioContext;
        gain: GainNode;
    };
};

export function useConvaiSession(options: UseConvaiSessionOptions) {
    const {
        signedUrl,
        overrides,
        onTranscript,
        onAISpeakingChange,
        onRecordingAudioStream,
    } = options;

    const [state, setState] = useState<ConvaiSessionState>({
        isConnected: false,
        isAISpeaking: false,
        aiAudioLevel: 0,
        userAudioLevel: 0,
        error: null,
    });

    const conversationRef = useRef<Conversation | null>(null);
    // Track if the hook is still mounted to prevent state updates after unmount
    const mountedRef = useRef(true);
    const isMounted = useCallback(() => mountedRef.current, []);
    // Track if disconnect was intentional (user/cleanup) vs server-initiated
    const intentionalCloseRef = useRef(false);
    const audioMeterRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recordingDestinationRef = useRef<{
        gain: GainNode;
        destination: MediaStreamAudioDestinationNode;
    } | null>(null);

    // Stable callback refs (no re-renders when these change)
    const onTranscriptRef = useRef(onTranscript);
    onTranscriptRef.current = onTranscript;
    const onAISpeakingChangeRef = useRef(onAISpeakingChange);
    onAISpeakingChangeRef.current = onAISpeakingChange;
    const onRecordingAudioStreamRef = useRef(onRecordingAudioStream);
    onRecordingAudioStreamRef.current = onRecordingAudioStream;

    // Store overrides in a ref so connect() always has the latest value
    // without needing to be in its dependency array
    const overridesRef = useRef(overrides);
    overridesRef.current = overrides;

    // Store signedUrl in a ref for the same reason
    const signedUrlRef = useRef(signedUrl);
    signedUrlRef.current = signedUrl;

    const stopAudioMeter = useCallback(() => {
        if (audioMeterRef.current) {
            clearInterval(audioMeterRef.current);
            audioMeterRef.current = null;
        }
    }, []);

    const detachRecordingAudio = useCallback(() => {
        const recordingDestination = recordingDestinationRef.current;
        if (!recordingDestination) return;

        recordingDestination.gain.disconnect(recordingDestination.destination);
        recordingDestination.destination.stream
            .getTracks()
            .forEach((track) => track.stop());
        recordingDestinationRef.current = null;
    }, []);

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
        setState({
            isConnected: false,
            isAISpeaking: false,
            aiAudioLevel: 0,
            userAudioLevel: 0,
            error: null,
        });

        try {
            // Request mic permission (required by the SDK)
            await navigator.mediaDevices.getUserMedia({ audio: true });

            // Check if we were unmounted while waiting for mic
            if (!isMounted()) {
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
                    if (isMounted()) {
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
                    stopAudioMeter();
                    detachRecordingAudio();

                    if (isMounted()) {
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
                    if (isMounted()) {
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
                    if (isMounted()) {
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
                    sessionConfig.overrides = configOverrides;
                    console.log("[ConvAI] Sending overrides:", {
                        hasPrompt: !!currentOverrides.systemPrompt,
                        hasVoice: !!currentOverrides.voiceId,
                        promptLength: currentOverrides.systemPrompt.length,
                    });
                }
            }

            if (!isMounted()) {
                console.log(
                    "[ConvAI] Unmounted before session start, aborting",
                );
                return;
            }

            console.log("[ConvAI] Starting session...");
            const conversation = await Conversation.startSession(sessionConfig);

            if (!isMounted()) {
                console.log(
                    "[ConvAI] Unmounted during session start, ending session",
                );
                intentionalCloseRef.current = true;
                conversation.endSession().catch(() => {});
                return;
            }

            conversationRef.current = conversation;
            const voiceConversation = conversation as VoiceConversation;
            if (voiceConversation.output) {
                const destination =
                    voiceConversation.output.context.createMediaStreamDestination();
                voiceConversation.output.gain.connect(destination);
                recordingDestinationRef.current = {
                    gain: voiceConversation.output.gain,
                    destination,
                };
                onRecordingAudioStreamRef.current?.({
                    stream: destination.stream,
                    context: voiceConversation.output.context,
                });
            }

            audioMeterRef.current = setInterval(() => {
                if (!isMounted() || !conversationRef.current) return;
                setState((current) => ({
                    ...current,
                    aiAudioLevel: conversationRef.current!.getOutputVolume(),
                    userAudioLevel: conversationRef.current!.getInputVolume(),
                }));
            }, 100);
            console.log("[ConvAI] Session started successfully");
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Failed to start session";
            console.error("[ConvAI] Failed to start:", msg, err);
            if (isMounted()) {
                setState((s) => ({
                    ...s,
                    isConnected: false,
                    error: msg,
                }));
            }
        }
    }, [detachRecordingAudio, isMounted, stopAudioMeter]);

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

        stopAudioMeter();
        detachRecordingAudio();

        if (isMounted()) {
            setState({
                isConnected: false,
                isAISpeaking: false,
                aiAudioLevel: 0,
                userAudioLevel: 0,
                error: null,
            });
        }
    }, [detachRecordingAudio, isMounted, stopAudioMeter]);

    const setMicMuted = useCallback((isMuted: boolean) => {
        conversationRef.current?.setMicMuted(isMuted);
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
            stopAudioMeter();
            detachRecordingAudio();
        };
    }, [detachRecordingAudio, stopAudioMeter]);

    return {
        isConnected: state.isConnected,
        isAISpeaking: state.isAISpeaking,
        aiAudioLevel: state.aiAudioLevel,
        userAudioLevel: state.userAudioLevel,
        error: state.error,
        connect,
        disconnect,
        setMicMuted,
    };
}
