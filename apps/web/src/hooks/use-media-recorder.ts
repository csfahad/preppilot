import { useState, useRef, useCallback, useEffect } from "react";

interface UseMediaRecorderOptions {
    onDataAvailable?: (blob: Blob) => void;
}

interface InterviewerAudioSource {
    stream: MediaStream;
    context: AudioContext;
}

function getSupportedMimeType(): string {
    const types = [
        "video/webm; codecs=vp9,opus",
        "video/webm; codecs=vp8,opus",
        "video/webm; codecs=vp9",
        "video/webm; codecs=vp8",
        "video/webm",
    ];
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "video/webm";
}

function getRecordingContentType(
    mimeType: string,
): "video/webm" | "audio/webm" {
    return mimeType.split(";", 1)[0].trim().toLowerCase() === "audio/webm"
        ? "audio/webm"
        : "video/webm";
}

async function repairWebmDuration(
    blob: Blob,
    durationMs: number,
): Promise<Blob> {
    // This package is CommonJS and only requires browser APIs. Loading it when a
    // recording ends keeps it out of the application's startup path.
    const { default: fixWebmDuration } = await import("fix-webm-duration");
    return fixWebmDuration(blob, durationMs);
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recordingStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<{
        context: AudioContext;
        closeOnCleanup: boolean;
    } | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mimeTypeRef = useRef<string>("");
    const durationRef = useRef(0);
    const startedAtRef = useRef<number | null>(null);

    // Stable callback ref
    const onDataAvailableRef = useRef(options.onDataAvailable);
    onDataAvailableRef.current = options.onDataAvailable;

    const cleanupTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const cleanupStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (recordingStreamRef.current) {
            recordingStreamRef.current
                .getTracks()
                .forEach((track) => track.stop());
            recordingStreamRef.current = null;
        }
        if (audioContextRef.current) {
            if (audioContextRef.current.closeOnCleanup) {
                audioContextRef.current.context.close().catch(() => {});
            }
            audioContextRef.current = null;
        }
    }, []);

    const startRecording = useCallback(
        async (aiAudioSource?: InterviewerAudioSource) => {
            try {
                // Request camera + audio
                const cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        facingMode: "user",
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                    },
                });
                streamRef.current = cameraStream;

                let recordingStream = cameraStream;
                const microphoneTracks = cameraStream.getAudioTracks();
                const interviewerTracks =
                    aiAudioSource?.stream.getAudioTracks() ?? [];

                // Mix the microphone and the AI's digital output into one audio
                // track. Capturing the speaker output would be browser-dependent
                // and would also introduce room echo into the recording.
                if (
                    microphoneTracks.length > 0 &&
                    interviewerTracks.length > 0
                ) {
                    const audioContext =
                        aiAudioSource?.context ?? new AudioContext();
                    const destination =
                        audioContext.createMediaStreamDestination();
                    const microphoneSource =
                        audioContext.createMediaStreamSource(
                            new MediaStream(microphoneTracks),
                        );
                    const interviewerSource =
                        audioContext.createMediaStreamSource(
                            aiAudioSource!.stream,
                        );

                    microphoneSource.connect(destination);
                    interviewerSource.connect(destination);
                    await audioContext.resume();

                    audioContextRef.current = {
                        context: audioContext,
                        closeOnCleanup: !aiAudioSource,
                    };
                    recordingStream = new MediaStream([
                        ...cameraStream.getVideoTracks(),
                        ...destination.stream.getAudioTracks(),
                    ]);
                }
                recordingStreamRef.current = recordingStream;

                // Set up MediaRecorder
                const mimeType = getSupportedMimeType();
                mimeTypeRef.current = mimeType;

                const recorder = new MediaRecorder(recordingStream, {
                    mimeType,
                    videoBitsPerSecond: 4_000_000, // 4.0 Mbps (recommended for 1080p)
                });
                mediaRecorderRef.current = recorder;
                chunksRef.current = [];

                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunksRef.current.push(event.data);
                        onDataAvailableRef.current?.(event.data);
                    }
                };

                recorder.onerror = (event) => {
                    console.error("MediaRecorder error:", event);
                };

                // Collect data every 1 second for progressive access
                recorder.start(1000);

                // Duration timer
                setDuration(0);
                durationRef.current = 0;
                startedAtRef.current = Date.now();
                timerRef.current = setInterval(() => {
                    setDuration((d) => {
                        const nextDuration = d + 1;
                        durationRef.current = nextDuration;
                        return nextDuration;
                    });
                }, 1000);

                setIsRecording(true);
            } catch (err) {
                console.error("Failed to start media recording:", err);
                cleanupStream();
                throw err;
            }
        },
        [cleanupStream],
    );

    const stopRecording = useCallback((): Promise<Blob | null> => {
        cleanupTimer();

        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === "inactive") {
            cleanupStream();
            setIsRecording(false);
            return Promise.resolve(null);
        }

        // Return a promise-resolved blob via collected chunks
        return new Promise<Blob | null>((resolve) => {
            recorder.onstop = async () => {
                const contentType = getRecordingContentType(
                    mimeTypeRef.current,
                );
                const rawBlob =
                    chunksRef.current.length > 0
                        ? new Blob(chunksRef.current, {
                              type: contentType,
                          })
                        : null;
                const durationMs = startedAtRef.current
                    ? Date.now() - startedAtRef.current
                    : durationRef.current * 1000;

                let blob = rawBlob;
                if (
                    rawBlob &&
                    durationMs > 0 &&
                    mimeTypeRef.current.includes("webm")
                ) {
                    try {
                        blob = await repairWebmDuration(rawBlob, durationMs);
                    } catch (err) {
                        console.warn(
                            "Failed to write WebM duration metadata:",
                            err,
                        );
                    }
                }

                // fix-webm-duration may return an untyped Blob. Keep the recording
                // contract stable for upload and playback regardless of browser codec.
                if (blob) {
                    blob = new Blob([blob], { type: contentType });
                }

                chunksRef.current = [];
                mediaRecorderRef.current = null;
                startedAtRef.current = null;
                cleanupStream();
                setIsRecording(false);
                resolve(blob);
            };

            recorder.stop();
        });
    }, [cleanupTimer, cleanupStream]);

    const getStream = useCallback((): MediaStream | null => {
        return streamRef.current;
    }, []);

    const setMicrophoneEnabled = useCallback((enabled: boolean) => {
        streamRef.current?.getAudioTracks().forEach((track) => {
            track.enabled = enabled;
        });
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupTimer();
            if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state !== "inactive"
            ) {
                mediaRecorderRef.current.stop();
            }
            cleanupStream();
        };
    }, [cleanupTimer, cleanupStream]);

    return {
        isRecording,
        duration,
        startRecording,
        stopRecording,
        getStream,
        setMicrophoneEnabled,
    };
}
