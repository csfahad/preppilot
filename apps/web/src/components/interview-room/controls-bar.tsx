import { motion } from "motion/react";
import {
    IconMicrophone,
    IconMicrophoneOff,
    IconCamera,
    IconCameraOff,
    IconPhoneOff,
    IconWifi,
} from "@tabler/icons-react";

interface ControlsBarProps {
    isMuted: boolean;
    isCameraOff: boolean;
    isConnected: boolean;
    elapsedTime: number;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    onEndInterview: () => void;
}

function formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ControlsBar({
    isMuted,
    isCameraOff,
    isConnected,
    elapsedTime,
    onToggleMute,
    onToggleCamera,
    onEndInterview,
}: ControlsBarProps) {
    return (
        <div className="grid min-h-20 w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-t border-border bg-card/80 px-4 py-3 backdrop-blur-xl sm:px-6">
            {/* Left: connection status */}
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <div
                    className={`w-2.5 h-2.5 rounded-full ${
                        isConnected
                            ? "bg-emerald-500 shadow-[0_0_6px_oklch(0.7_0.2_160)]"
                            : "bg-yellow-500 animate-pulse"
                    }`}
                />
                <span className="hidden truncate text-xs font-medium text-muted-foreground min-[390px]:inline">
                    {isConnected ? "Connected" : "Connecting..."}
                </span>
                {isConnected && (
                    <IconWifi className="hidden h-3.5 w-3.5 shrink-0 text-emerald-500 sm:block" />
                )}
            </div>

            {/* Center: controls */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Mute toggle */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        isMuted
                            ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                            : "bg-muted hover:bg-accent text-foreground"
                    }`}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? (
                        <IconMicrophoneOff className="w-5 h-5" />
                    ) : (
                        <IconMicrophone className="w-5 h-5" />
                    )}
                </motion.button>

                {/* Camera toggle */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleCamera}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        isCameraOff
                            ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                            : "bg-muted hover:bg-accent text-foreground"
                    }`}
                    title={isCameraOff ? "Turn camera on" : "Turn camera off"}
                >
                    {isCameraOff ? (
                        <IconCameraOff className="w-5 h-5" />
                    ) : (
                        <IconCamera className="w-5 h-5" />
                    )}
                </motion.button>

                {/* End interview */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onEndInterview}
                    className="w-14 h-14 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors cursor-pointer shadow-lg shadow-destructive/20"
                    title="End Interview"
                >
                    <IconPhoneOff className="w-6 h-6" />
                </motion.button>
            </div>

            {/* Right: elapsed time */}
            <div className="flex min-w-0 items-center justify-end">
                <div className="rounded-lg bg-muted px-2 py-1.5 text-sm font-mono font-medium tabular-nums text-foreground sm:px-3">
                    {formatElapsed(elapsedTime)}
                </div>
            </div>
        </div>
    );
}
