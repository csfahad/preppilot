import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconChevronUp, IconChevronDown, IconRobot } from "@tabler/icons-react";

interface TranscriptEntry {
    speaker: "user" | "ai";
    text: string;
    timestamp: number;
}

interface LiveTranscriptProps {
    entries: TranscriptEntry[];
    isExpanded: boolean;
    onToggle: () => void;
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function LiveTranscript({
    entries,
    isExpanded,
    onToggle,
}: LiveTranscriptProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastEntry = entries[entries.length - 1];

    // auto-scroll to bottom when new entries arrive
    useEffect(() => {
        if (scrollRef.current && isExpanded) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [entries.length, isExpanded]);

    return (
        <div className="w-full border-t border-border bg-card/80 backdrop-blur-sm">
            {/* Toggle bar */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                        Live Transcript
                    </span>
                    {!isExpanded && lastEntry && (
                        <span className="text-xs text-muted-foreground truncate">
                            —{" "}
                            <span
                                className={
                                    lastEntry.speaker === "ai"
                                        ? "text-primary"
                                        : "text-foreground"
                                }
                            >
                                {lastEntry.speaker === "ai" ? "AI: " : "You: "}
                            </span>
                            {lastEntry.text.slice(0, 80)}
                            {lastEntry.text.length > 80 ? "..." : ""}
                        </span>
                    )}
                </div>
                {isExpanded ? (
                    <IconChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                    <IconChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
            </button>

            {/* Transcript content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 200, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div
                            ref={scrollRef}
                            className="h-[200px] overflow-y-auto px-5 py-3 space-y-3"
                        >
                            {entries.length === 0 && (
                                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                    Conversation will appear here...
                                </div>
                            )}
                            {entries.map((entry, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex gap-2.5 ${
                                        entry.speaker === "user"
                                            ? "flex-row-reverse"
                                            : ""
                                    }`}
                                >
                                    {entry.speaker === "ai" && (
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <IconRobot className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[75%] ${
                                            entry.speaker === "ai"
                                                ? "text-left"
                                                : "text-right"
                                        }`}
                                    >
                                        <div
                                            className={`inline-block px-3 py-2 rounded-xl text-sm ${
                                                entry.speaker === "ai"
                                                    ? "bg-muted text-foreground rounded-tl-sm"
                                                    : "bg-primary/10 text-foreground rounded-tr-sm"
                                            }`}
                                        >
                                            {entry.text}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                                            {formatTime(entry.timestamp)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
