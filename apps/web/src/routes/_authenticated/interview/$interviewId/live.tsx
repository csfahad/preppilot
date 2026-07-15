import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/lib/api-client";
import { useInterviewStore } from "@/stores/interview";
import { useConvaiSession } from "@/hooks/use-convai-session";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { AIAvatar } from "@/components/interview-room/ai-avatar";
import { UserCamera } from "@/components/interview-room/user-camera";
import { LiveTranscript } from "@/components/interview-room/live-transcript";
import { ControlsBar } from "@/components/interview-room/controls-bar";
import { IconLoader2, IconAlertTriangle, IconVideo } from "@tabler/icons-react";

import type { TranscriptEntry } from "@/stores/interview";

export const Route = createFileRoute(
    "/_authenticated/interview/$interviewId/live",
)({
    component: LiveInterviewRoom,
});

const INTERVIEWER_NAMES: Record<string, string> = {
    american: "Lucas",
    british: "Cedric M",
    australian: "Hannah",
    indian: "Simran",
    european: "Lauren",
    african: "Mike",
};

function getInterviewerName(accent?: string): string {
    return (
        INTERVIEWER_NAMES[accent || "american"] || INTERVIEWER_NAMES.american
    );
}

function LiveInterviewRoom() {
    const { interviewId } = Route.useParams();
    const navigate = useNavigate();
    const store = useInterviewStore();

    const [phase, setPhase] = useState<
        "loading" | "permission" | "connecting" | "active" | "ending" | "error"
    >("loading");
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
    const [showEndDialog, setShowEndDialog] = useState(false);
    const [interviewData, setInterviewData] = useState<any>(null);
    const [sessionOverrides, setSessionOverrides] = useState<{
        systemPrompt: string;
        voiceId: string;
        firstMessage: string;
        maxDurationSeconds: number;
    } | null>(null);

    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const elapsedTimeRef = useRef(0);
    const recordingStartedRef = useRef(false);

    const {
        isRecording,
        startRecording,
        stopRecording,
        getStream,
        setMicrophoneEnabled,
    } = useMediaRecorder();

    const handleRecordingAudioStream = useCallback(
        async (aiAudioSource: {
            stream: MediaStream;
            context: AudioContext;
        }) => {
            if (recordingStartedRef.current) return;

            recordingStartedRef.current = true;
            try {
                await startRecording(aiAudioSource);
            } catch (recordingError) {
                recordingStartedRef.current = false;
                console.warn(
                    "Camera permission denied, continuing without recording",
                    recordingError,
                );
            }
        },
        [startRecording],
    );

    // ConvAI session
    const handleTranscript = useCallback(
        (entry: TranscriptEntry) => {
            store.addTranscriptEntry(entry);
        },
        [store],
    );

    const handleAISpeakingChange = useCallback(
        (speaking: boolean) => {
            store.setAISpeaking(speaking);
        },
        [store],
    );

    const convai = useConvaiSession({
        signedUrl: store.signedUrl,
        overrides: sessionOverrides,
        onTranscript: handleTranscript,
        onAISpeakingChange: handleAISpeakingChange,
        onRecordingAudioStream: handleRecordingAudioStream,
    });

    // Init: Load interview data and start session
    useEffect(() => {
        const abortController = new AbortController();
        const isAborted = () => abortController.signal.aborted;

        async function init() {
            try {
                // 1. Load interview data
                const interviewRes = await api.getInterview(interviewId);
                if (isAborted()) return;

                const data = interviewRes.data;
                setInterviewData(data);

                store.setInterview(interviewId, {
                    voiceAccent: data.voiceAccent || "american",
                    durationMinutes: data.durationMinutes || 30,
                });

                // 2. Get signed URL from server. Recording starts after the
                // AI output stream is available so both sides are captured.
                setPhase("connecting");
                const sessionRes = await api.startRealtimeSession(interviewId);
                if (isAborted()) return;

                const signedUrl = sessionRes.data?.signedUrl;
                const overrides = sessionRes.data?.overrides;
                if (!signedUrl) {
                    throw new Error("No signed URL returned from server");
                }

                // 3. Store session data and update overrides
                if (overrides) {
                    setSessionOverrides(overrides);
                }
                store.setSession(signedUrl);

                // 4. Mark as active and start timer
                setPhase("active");
                store.setRecording(true);

                timerRef.current = setInterval(() => {
                    setElapsedTime((previous) => {
                        const next = previous + 1;
                        elapsedTimeRef.current = next;
                        return next;
                    });
                }, 1000);
            } catch (err) {
                if (isAborted()) return;
                console.error("Failed to start interview:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to start interview session",
                );
                setPhase("error");
            }
        }

        init();

        return () => {
            abortController.abort();
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [interviewId]);

    // Connect to ConvAI when signedUrl + overrides are ready
    const hasConnectedRef = useRef(false);
    useEffect(() => {
        if (
            store.signedUrl &&
            sessionOverrides &&
            phase === "active" &&
            !hasConnectedRef.current
        ) {
            hasConnectedRef.current = true;
            convai.connect();
        }
    }, [store.signedUrl, sessionOverrides, phase]);

    // Sync connection status
    useEffect(() => {
        store.setConnected(convai.isConnected);
    }, [convai.isConnected]);

    // Mute handling
    const handleToggleMute = useCallback(() => {
        const nextMuted = !isMuted;
        setMicrophoneEnabled(!nextMuted);
        convai.setMicMuted(nextMuted);
        setIsMuted((prev) => !prev);
    }, [convai, isMuted, setMicrophoneEnabled]);

    // Camera handling
    const handleToggleCamera = useCallback(() => {
        const stream = getStream();
        if (stream) {
            stream.getVideoTracks().forEach((track) => {
                track.enabled = isCameraOff; // toggle
            });
        }
        setIsCameraOff((prev) => !prev);
    }, [isCameraOff, getStream]);

    // End interview
    const handleEndInterview = useCallback(async () => {
        setShowEndDialog(false);
        setPhase("ending");

        // Stop timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        try {
            // 1. Stop recording while the AI audio stream is still attached.
            const blob = await stopRecording();
            if (blob && blob.size > 0) {
                try {
                    await api.uploadRecording(
                        interviewId,
                        blob,
                        blob.type || "video/webm",
                        elapsedTimeRef.current,
                    );
                } catch (uploadErr) {
                    console.error("Recording upload failed:", uploadErr);
                    // Non-critical, continue
                }
            }

            // 2. Disconnect the conversation after its final audio is saved.
            await convai.disconnect();

            // 3. End session on backend
            await api.endRealtimeSession(interviewId);

            // 4. Navigate to processing
            store.endInterview();
            navigate({
                to: "/interview/$interviewId/processing",
                params: { interviewId },
            });
        } catch (err) {
            console.error("Error ending interview:", err);
            // Still navigate to processing
            navigate({
                to: "/interview/$interviewId/processing",
                params: { interviewId },
            });
        }
    }, [interviewId, convai, stopRecording, navigate, store]);

    // Render phases
    if (
        phase === "loading" ||
        phase === "permission" ||
        phase === "connecting"
    ) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-5 text-center max-w-md px-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <IconVideo className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                            {phase === "loading" && "Preparing interview..."}
                            {phase === "permission" &&
                                "Setting up camera & mic..."}
                            {phase === "connecting" &&
                                "Connecting to AI interviewer..."}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {phase === "permission"
                                ? "Please allow camera and microphone access when prompted"
                                : "This will only take a moment"}
                        </p>
                    </div>
                    <IconLoader2 className="w-6 h-6 text-primary animate-spin" />
                </motion.div>
            </div>
        );
    }

    if (phase === "error") {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-5 text-center max-w-md px-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                        <IconAlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <div>
                        <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                            Connection Failed
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {error ||
                                "Could not connect to the interview session."}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all cursor-pointer"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate({ to: "/dashboard" })}
                            className="px-6 py-2.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-accent transition-all cursor-pointer"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (phase === "ending") {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <IconLoader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-foreground font-medium">
                        Saving interview...
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Uploading recording and processing your session
                    </p>
                </motion.div>
            </div>
        );
    }

    // Active interview room
    return (
        <>
            {/* Full-screen overlay to escape the sidebar layout */}
            <div className="fixed inset-0 z-50 bg-background flex flex-col">
                {/* Top bar */}
                <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <IconVideo className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-foreground leading-tight">
                                {interviewData?.roleTitle || "Live Interview"}
                            </h1>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                {interviewData?.seniority} •{" "}
                                {interviewData?.interviewerTone} tone
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Duration indicator */}
                        <div className="px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                            {elapsedTime > 0
                                ? `${Math.floor(elapsedTime / 60)}m`
                                : "0m"}{" "}
                            / {store.durationMinutes}m
                        </div>

                        {/* Connection dot */}
                        <div className="flex items-center gap-1.5">
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    convai.isConnected
                                        ? "bg-emerald-500"
                                        : "bg-yellow-500 animate-pulse"
                                }`}
                            />
                            <span className="text-[11px] text-muted-foreground">
                                {convai.isConnected ? "Live" : "Reconnecting"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main content area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* AI interviewer (60%) */}
                    <div className="flex-3 flex items-center justify-center p-6 bg-linear-to-br from-background to-muted/20">
                        <div className="w-full max-w-lg">
                            <AIAvatar
                                name={getInterviewerName(
                                    interviewData?.voiceAccent,
                                )}
                                role="AI Interviewer"
                                isSpeaking={store.isAISpeaking}
                                audioLevel={convai.aiAudioLevel}
                                isThinking={
                                    !store.isAISpeaking &&
                                    store.transcript.length > 0 &&
                                    store.transcript[
                                        store.transcript.length - 1
                                    ]?.speaker === "user"
                                }
                                isListening={
                                    !store.isAISpeaking &&
                                    convai.userAudioLevel > 0.1
                                }
                            />
                        </div>
                    </div>

                    {/* User camera (40%) */}
                    <div className="flex-2 p-4">
                        <UserCamera
                            stream={getStream()}
                            isMuted={isMuted}
                            isCameraOff={isCameraOff}
                            audioLevel={convai.userAudioLevel}
                            userName={interviewData?.user?.name}
                            isRecording={isRecording}
                        />
                    </div>
                </div>

                {/* Live transcript (collapsible) */}
                <LiveTranscript
                    entries={store.transcript}
                    isExpanded={isTranscriptExpanded}
                    onToggle={() => setIsTranscriptExpanded((prev) => !prev)}
                />

                {/* Controls bar */}
                <ControlsBar
                    isMuted={isMuted}
                    isCameraOff={isCameraOff}
                    isConnected={convai.isConnected}
                    elapsedTime={elapsedTime}
                    onToggleMute={handleToggleMute}
                    onToggleCamera={handleToggleCamera}
                    onEndInterview={() => setShowEndDialog(true)}
                />
            </div>

            {/* End interview confirmation dialog */}
            <AnimatePresence>
                {showEndDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl"
                        >
                            <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                                End Interview?
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Your interview recording will be saved and your
                                responses will be analyzed by AI. You can view
                                the detailed report once processing is complete.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEndDialog(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-accent transition-all cursor-pointer"
                                >
                                    Continue
                                </button>
                                <button
                                    onClick={handleEndInterview}
                                    className="flex-1 py-2.5 rounded-xl bg-destructive text-white font-medium text-sm hover:bg-destructive/90 transition-all cursor-pointer"
                                >
                                    End Interview
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
