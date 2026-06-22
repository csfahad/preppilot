import { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { IconCameraOff, IconMicrophoneOff } from "@tabler/icons-react";

interface UserCameraProps {
    stream: MediaStream | null;
    isMuted: boolean;
    isCameraOff: boolean;
    audioLevel: number;
    userName?: string;
    isRecording?: boolean;
}

export function UserCamera({
    stream,
    isMuted,
    isCameraOff,
    audioLevel,
    userName,
    isRecording,
}: UserCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const initials = userName
        ? userName
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "You";

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-card border border-border">
            {/* Audio level glow border */}
            <motion.div
                className="absolute inset-0 rounded-2xl z-10 pointer-events-none"
                animate={{
                    boxShadow: `inset 0 0 0 ${2 + audioLevel * 3}px oklch(0.768 0.233 130.85 / ${0.1 + audioLevel * 0.4})`,
                }}
                transition={{ duration: 0.1 }}
            />

            {isCameraOff ? (
                /* Camera off placeholder */
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-muted/50 to-muted">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <span className="font-heading text-2xl font-bold text-primary">
                            {initials}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <IconCameraOff className="w-3.5 h-3.5" />
                        Camera off
                    </div>
                </div>
            ) : (
                /* Video feed */
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                />
            )}

            {/* Mute indicator */}
            {isMuted && (
                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/90 text-white text-xs font-medium backdrop-blur-sm">
                    <IconMicrophoneOff className="w-3.5 h-3.5" />
                    Muted
                </div>
            )}

            {/* Name label */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-lg bg-background/60 backdrop-blur-sm text-xs font-medium text-foreground">
                {userName || "You"}
            </div>

            {/* Recording indicator */}
            {isRecording && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/60 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-foreground">
                        REC
                    </span>
                </div>
            )}
        </div>
    );
}
