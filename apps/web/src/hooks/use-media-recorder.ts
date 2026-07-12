import { useState, useRef, useCallback, useEffect } from "react";
import fixWebmDuration from "fix-webm-duration";

interface UseMediaRecorderOptions {
    onDataAvailable?: (blob: Blob) => void;
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

export function useMediaRecorder(options: UseMediaRecorderOptions = {}) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
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
    }, []);

    const startRecording = useCallback(async () => {
        try {
            // Request camera + audio
            const stream = await navigator.mediaDevices.getUserMedia({
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
            streamRef.current = stream;

            // Set up MediaRecorder
            const mimeType = getSupportedMimeType();
            mimeTypeRef.current = mimeType;

            const recorder = new MediaRecorder(stream, {
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
    }, [cleanupStream]);

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
                const rawBlob =
                    chunksRef.current.length > 0
                        ? new Blob(chunksRef.current, {
                              type: mimeTypeRef.current,
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
                        blob = await fixWebmDuration(rawBlob, durationMs);
                    } catch (err) {
                        console.warn(
                            "Failed to write WebM duration metadata:",
                            err,
                        );
                    }
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
    };
}
