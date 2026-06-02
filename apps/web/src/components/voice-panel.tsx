import { motion } from "motion/react";
import {
    IconMicrophone,
    IconPlayerPause,
    IconPlayerPlay,
    IconPlayerStop,
} from "@tabler/icons-react";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { WS_URL } from "@/lib/api-url";

interface VoicePanelProps {
    interviewId: string;
    voiceAccent?: string | null;
    onTranscript: (text: string) => void;
    disabled?: boolean;
}

export function VoicePanel({
    interviewId,
    voiceAccent,
    onTranscript,
    disabled,
}: VoicePanelProps) {
    const wsUrl = `${WS_URL}/ws/voice?interviewId=${interviewId}`;

    const {
        isRecording,
        isPaused,
        duration,
        volume,
        transcript,
        connectionStatus,
        error,
        startRecording,
        stopRecording,
        togglePause,
    } = useVoiceRecorder({ interviewId, voiceAccent, wsUrl, onTranscript });

    const formatDuration = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    // generate waveform bars based on volume
    const bars = 24;
    const barHeights = Array.from({ length: bars }, (_, i) => {
        const base = Math.sin((i / bars) * Math.PI) * 0.6 + 0.4;
        return isRecording ? base * volume * 100 : 4;
    });

    return (
        <div className="rounded-2xl border border-border bg-card p-6">
            {/* Waveform visualization */}
            <div className="flex items-end justify-center gap-[3px] h-20 mb-6">
                {barHeights.map((h, i) => (
                    <motion.div
                        key={i}
                        animate={{ height: Math.max(4, h) }}
                        transition={{ duration: 0.1 }}
                        className={`w-1.5 rounded-full ${
                            isRecording && !isPaused
                                ? "bg-primary"
                                : isPaused
                                  ? "bg-yellow-500/60"
                                  : "bg-muted-foreground/20"
                        }`}
                    />
                ))}
            </div>

            {/* Transcript display */}
            {transcript && (
                <div className="mb-4 p-3 rounded-xl bg-muted/50 text-sm text-foreground min-h-12">
                    <p className="text-xs text-muted-foreground mb-1">
                        You said:
                    </p>
                    {transcript}
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        disabled={disabled || connectionStatus === "connecting"}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        <IconMicrophone className="w-5 h-5" />
                        {connectionStatus === "connecting"
                            ? "Connecting..."
                            : "Start Speaking"}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={togglePause}
                            className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"
                        >
                            {isPaused ? (
                                <IconPlayerPlay className="w-5 h-5 text-foreground" />
                            ) : (
                                <IconPlayerPause className="w-5 h-5 text-foreground" />
                            )}
                        </button>

                        <button
                            onClick={stopRecording}
                            className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                        >
                            <IconPlayerStop className="w-6 h-6 text-white" />
                        </button>

                        <span className="text-sm font-mono text-muted-foreground w-12 text-center">
                            {formatDuration(duration)}
                        </span>
                    </>
                )}
            </div>

            {/* Recording indicator */}
            {isRecording && !isPaused && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">
                        Recording...
                    </span>
                </div>
            )}
            {error && (
                <p className="mt-4 text-center text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
