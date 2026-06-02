import { useState, useRef, useCallback, useEffect } from "react";

import audioRecorderWorkletUrl from "@/lib/audio-recorder-worklet.ts?url";

interface UseVoiceRecorderOptions {
    interviewId?: string;
    voiceAccent?: string | null;
    onTranscript?: (text: string) => void;
    onAudioData?: (data: Float32Array) => void;
    wsUrl?: string;
}

interface VoiceRecorderState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    volume: number;
    transcript: string;
    connectionStatus: "idle" | "connecting" | "connected" | "error";
    error: string | null;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
    const [state, setState] = useState<VoiceRecorderState>({
        isRecording: false,
        isPaused: false,
        duration: 0,
        volume: 0,
        transcript: "",
        connectionStatus: "idle",
        error: null,
    });

    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const processorRef = useRef<AudioWorkletNode | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const sessionStartedRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const animFrameRef = useRef<number | null>(null);

    const cleanupRecordingResources = useCallback(() => {
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        processorRef.current?.port.close();
        processorRef.current?.disconnect();
        audioContextRef.current?.close();
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "end_session" }));
        }
        wsRef.current?.close();

        if (timerRef.current) clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        mediaStreamRef.current = null;
        audioContextRef.current = null;
        analyserRef.current = null;
        processorRef.current = null;
        wsRef.current = null;
        sessionStartedRef.current = false;
    }, []);

    const updateVolume = useCallback(() => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
        setState((s) => ({ ...s, volume: Math.min(avg / 128, 1) }));
        animFrameRef.current = requestAnimationFrame(updateVolume);
    }, []);

    const connectVoiceSession = useCallback(
        () =>
            new Promise<WebSocket | null>((resolve, reject) => {
                if (!options.wsUrl) {
                    resolve(null);
                    return;
                }

                const ws = new WebSocket(options.wsUrl);
                wsRef.current = ws;

                const timeout = window.setTimeout(() => {
                    ws.close();
                    reject(new Error("Voice service connection timed out"));
                }, 10000);

                ws.onopen = () => {
                    ws.send(
                        JSON.stringify({
                            type: "start_session",
                            interviewId: options.interviewId,
                            voiceAccent: options.voiceAccent,
                        }),
                    );
                };

                ws.onmessage = (event) => {
                    if (typeof event.data !== "string") {
                        if (event.data instanceof Blob) {
                            const audio = new Audio(
                                URL.createObjectURL(event.data),
                            );
                            audio.play().catch(() => {});
                        }
                        return;
                    }

                    const msg = JSON.parse(event.data);
                    if (msg.type === "session_started") {
                        window.clearTimeout(timeout);
                        sessionStartedRef.current = true;
                        setState((s) => ({
                            ...s,
                            connectionStatus: "connected",
                        }));
                        resolve(ws);
                        return;
                    }

                    if (msg.type === "transcript") {
                        setState((s) => ({ ...s, transcript: msg.text }));
                        options.onTranscript?.(msg.text);
                        return;
                    }

                    if (msg.type === "error") {
                        setState((s) => ({
                            ...s,
                            connectionStatus: "error",
                            error: msg.message ?? "Voice transcription failed",
                        }));
                    }
                };

                ws.onerror = () => {
                    window.clearTimeout(timeout);
                    reject(new Error("Voice service connection failed"));
                };
            }),
        [
            options.interviewId,
            options.onTranscript,
            options.voiceAccent,
            options.wsUrl,
        ],
    );

    const startRecording = useCallback(async () => {
        try {
            setState((s) => ({
                ...s,
                connectionStatus: options.wsUrl ? "connecting" : "idle",
                error: null,
                transcript: "",
            }));
            sessionStartedRef.current = false;
            await connectVoiceSession();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                },
            });
            mediaStreamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            source.connect(analyser);

            await audioContext.audioWorklet.addModule(audioRecorderWorkletUrl);
            const processor = new AudioWorkletNode(
                audioContext,
                "audio-recorder-processor",
                {
                    channelCount: 1,
                    numberOfInputs: 1,
                    numberOfOutputs: 0,
                },
            );
            processorRef.current = processor;
            source.connect(processor);

            processor.port.onmessage = (event: MessageEvent<Float32Array>) => {
                const inputData = event.data;
                options.onAudioData?.(inputData);

                // send to websocket only after the backend STT session is ready
                if (
                    sessionStartedRef.current &&
                    wsRef.current?.readyState === WebSocket.OPEN
                ) {
                    const pcm16 = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        pcm16[i] = Math.max(
                            -32768,
                            Math.min(32767, inputData[i] * 32768),
                        );
                    }
                    wsRef.current.send(pcm16.buffer);
                }
            };

            // start duration timer
            timerRef.current = setInterval(() => {
                setState((s) => ({ ...s, duration: s.duration + 1 }));
            }, 1000);

            // start volume monitoring
            updateVolume();

            setState((s) => ({
                ...s,
                isRecording: true,
                isPaused: false,
                duration: 0,
            }));
        } catch (err) {
            console.error("Voice recording failed:", err);
            cleanupRecordingResources();
            setState((s) => ({
                ...s,
                isRecording: false,
                isPaused: false,
                connectionStatus: "error",
                error:
                    err instanceof Error
                        ? err.message
                        : "Voice recording failed",
            }));
        }
    }, [cleanupRecordingResources, connectVoiceSession, options, updateVolume]);

    const stopRecording = useCallback(() => {
        cleanupRecordingResources();

        setState((s) => ({
            ...s,
            isRecording: false,
            isPaused: false,
            volume: 0,
            connectionStatus: "idle",
        }));
    }, [cleanupRecordingResources]);

    const togglePause = useCallback(() => {
        if (!mediaStreamRef.current) return;
        const tracks = mediaStreamRef.current.getAudioTracks();
        const shouldPause = !state.isPaused;
        tracks.forEach((t) => {
            t.enabled = !shouldPause;
        });
        setState((s) => ({ ...s, isPaused: shouldPause }));
    }, [state.isPaused]);

    useEffect(
        () => () => {
            stopRecording();
        },
        [stopRecording],
    );

    return {
        ...state,
        startRecording,
        stopRecording,
        togglePause,
    };
}
