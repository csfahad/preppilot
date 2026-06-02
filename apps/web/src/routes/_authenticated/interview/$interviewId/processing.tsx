import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { IconLoader2 } from "@tabler/icons-react";

export const Route = createFileRoute(
    "/_authenticated/interview/$interviewId/processing",
)({
    component: ProcessingPage,
});

const MESSAGES = [
    "Analyzing your answers…",
    "Evaluating clarity and structure…",
    "Comparing with expert-level responses…",
    "Generating personalized feedback…",
    "Building your scorecard…",
    "Almost done…",
];

function ProcessingPage() {
    const { interviewId } = Route.useParams();
    const navigate = useNavigate();
    const [messageIndex, setMessageIndex] = useState(0);

    // cycle through messages
    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // poll for completion
    useEffect(() => {
        let cancelled = false;

        async function ensureReportGenerationStarted() {
            try {
                await api.endInterview(interviewId);
            } catch (error) {
                console.error("Failed to start report generation:", error);
            }
        }

        ensureReportGenerationStarted();

        const poll = setInterval(async () => {
            try {
                const res = await api.getInterview(interviewId);
                if (!cancelled && res.data?.status === "completed") {
                    clearInterval(poll);
                    navigate({ to: `/interview/${interviewId}/report` });
                }
            } catch {
                // keep polling
            }
        }, 5000);

        return () => {
            cancelled = true;
            clearInterval(poll);
        };
    }, [interviewId, navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-md"
            >
                {/* Animated spinner */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <IconLoader2
                            className="w-8 h-8 text-primary animate-spin"
                            style={{ animationDuration: "3s" }}
                        />
                    </div>
                </div>

                <motion.p
                    key={messageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="font-heading text-xl font-semibold text-foreground mb-2"
                >
                    {MESSAGES[messageIndex]}
                </motion.p>

                <p className="text-muted-foreground text-sm">
                    This usually takes 15–30 seconds. Don't close this page.
                </p>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mt-8">
                    {MESSAGES.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                i <= messageIndex ? "bg-primary" : "bg-muted"
                            }`}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
