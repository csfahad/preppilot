import { useState, useRef, useCallback, useEffect } from "react";

import audioRecorderWorkletUrl from "@/lib/audio-recorder-worklet.ts?url";

interface UseVoiceRecorderOptions {
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
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
    const [state, setState] = useState<VoiceRecorderState>({
        isRecording: false,
        isPaused: false,
        duration: 0,
        volume: 0,
        transcript: "",
    });

    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const processorRef = useRef<AudioWorkletNode | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const animFrameRef = useRef<number | null>(null);

    const updateVolume = useCallback(() => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
        setState((s) => ({ ...s, volume: Math.min(avg / 128, 1) }));
        animFrameRef.current = requestAnimationFrame(updateVolume);
    }, []);

    const startRecording = useCallback(async () => {
        try {
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

                // send to websocket if connected
                if (wsRef.current?.readyState === WebSocket.OPEN) {
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

            // connect websocket if URL provided
            if (options.wsUrl) {
                const ws = new WebSocket(options.wsUrl);
                wsRef.current = ws;
                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.type === "transcript") {
                            setState((s) => ({ ...s, transcript: msg.text }));
                            options.onTranscript?.(msg.text);
                        }
                    } catch {
                        // binary audio data from TTS - play it
                        if (event.data instanceof Blob) {
                            const audio = new Audio(
                                URL.createObjectURL(event.data),
                            );
                            audio.play().catch(() => {});
                        }
                    }
                };
            }

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
            console.error("Microphone access denied:", err);
        }
    }, [options, updateVolume]);

    const stopRecording = useCallback(() => {
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        processorRef.current?.port.close();
        processorRef.current?.disconnect();
        audioContextRef.current?.close();
        wsRef.current?.close();

        if (timerRef.current) clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        mediaStreamRef.current = null;
        audioContextRef.current = null;
        analyserRef.current = null;
        processorRef.current = null;
        wsRef.current = null;

        setState((s) => ({
            ...s,
            isRecording: false,
            isPaused: false,
            volume: 0,
        }));
    }, []);

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
