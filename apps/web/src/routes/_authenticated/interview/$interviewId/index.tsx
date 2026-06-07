import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "@/lib/api-client";
import { useInterviewStore } from "@/stores/interview";
import { VoicePanel } from "@/components/voice-panel";
import {
    IconSend,
    IconRotate,
    IconChevronRight,
    IconClock,
    IconCheck,
    IconPlayerStop,
} from "@tabler/icons-react";

export const Route = createFileRoute("/_authenticated/interview/$interviewId/")(
    {
        component: InterviewRoom,
    },
);

function InterviewRoom() {
    const { interviewId } = Route.useParams();
    const navigate = useNavigate();
    const store = useInterviewStore();

    const [loading, setLoading] = useState(true);
    const [answerText, setAnswerText] = useState("");
    const [voiceAccent, setVoiceAccent] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [lastScore, setLastScore] = useState<any>(null);
    const [hasRedone, setHasRedone] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await api.getInterview(interviewId);
                if (res.data?.questions) {
                    store.setInterview(
                        interviewId,
                        res.data.questions,
                        res.data.mode,
                        res.data.timerEnabled ?? true,
                    );
                    setVoiceAccent(res.data.voiceAccent ?? null);
                }
            } catch (err) {
                console.error("Failed to load interview:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [interviewId]);

    useEffect(() => {
        const currentQ = store.questions[store.currentQuestionIndex];
        if (!currentQ.timeLimitSeconds || !store.timerEnabled) {
            setTimeLeft(null);
            return;
        }
        setTimeLeft(currentQ.timeLimitSeconds);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 0) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [store.currentQuestionIndex, store.timerEnabled]);

    const currentQuestion = store.questions[store.currentQuestionIndex];
    const totalQuestions = store.questions.length;

    const handleSubmitAnswer = useCallback(
        async (isRedo = false) => {
            if (!answerText.trim()) return;
            setSubmitting(true);
            setLastScore(null);
            try {
                const res = await api.submitAnswer({
                    questionId: currentQuestion.id,
                    text: answerText,
                    isRedo,
                });
                store.submitAnswer(currentQuestion.id, {
                    questionId: currentQuestion.id,
                    text: answerText,
                    score: res.data?.score,
                });
                setLastScore(res.data?.score);
                if (isRedo) setHasRedone(true);
            } catch (err) {
                console.error("Submit answer error:", err);
            } finally {
                setSubmitting(false);
            }
        },
        [answerText, currentQuestion, store],
    );

    const handleNext = () => {
        if (store.currentQuestionIndex < totalQuestions - 1) {
            store.nextQuestion();
            setAnswerText("");
            setLastScore(null);
            setHasRedone(false);
        }
    };

    const handleEndInterview = async () => {
        try {
            await api.endInterview(interviewId);
            navigate({ to: `/interview/${interviewId}/processing` });
        } catch (err) {
            console.error("End interview error:", err);
        }
    };

    const formatTime = (seconds: number) =>
        `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground">
                        Loading interview...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main className="flex min-h-[calc(100vh-4rem)] flex-col">
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                            Question {store.currentQuestionIndex + 1} of{" "}
                            {totalQuestions}
                        </span>
                        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{
                                    width: `${((store.currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {timeLeft !== null && (
                            <span
                                className={`flex items-center gap-1 text-sm font-mono font-medium ${timeLeft <= 30 ? "text-red-500" : timeLeft <= 60 ? "text-yellow-500" : "text-muted-foreground"}`}
                            >
                                <IconClock className="w-4 h-4" />{" "}
                                {formatTime(timeLeft)}
                            </span>
                        )}
                        <button
                            onClick={handleEndInterview}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                            <IconPlayerStop className="w-4 h-4" /> End
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="mb-8"
                    >
                        <>
                            <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-3 ${
                                    currentQuestion.type === "behavioral"
                                        ? "bg-blue-500/10 text-blue-600"
                                        : currentQuestion.type ===
                                            "technical_coding"
                                          ? "bg-purple-500/10 text-purple-600"
                                          : currentQuestion.type ===
                                              "domain_knowledge"
                                            ? "bg-green-500/10 text-green-600"
                                            : "bg-muted text-muted-foreground"
                                }`}
                            >
                                {currentQuestion.type.replace("_", " ")}
                            </span>
                            <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground leading-relaxed">
                                {currentQuestion.text}
                            </h2>
                        </>
                    </motion.div>
                </AnimatePresence>

                <div className="flex-1 flex flex-col">
                    {store.mode === "voice" ? (
                        <VoicePanel
                            interviewId={interviewId}
                            voiceAccent={voiceAccent}
                            onTranscript={(text) => setAnswerText(text)}
                            disabled={submitting}
                        />
                    ) : (
                        <textarea
                            ref={textareaRef}
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            placeholder="Type your answer here... Be specific, use examples, and structure your response."
                            disabled={submitting}
                            rows={8}
                            className="flex-1 w-full px-5 py-4 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none text-base leading-relaxed"
                        />
                    )}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            {!lastScore && (
                                <button
                                    onClick={() => handleSubmitAnswer(false)}
                                    disabled={!answerText.trim() || submitting}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    ) : (
                                        <IconSend className="w-4 h-4" />
                                    )}
                                    Submit Answer
                                </button>
                            )}
                            {lastScore && !hasRedone && (
                                <button
                                    onClick={() => {
                                        setAnswerText("");
                                        setLastScore(null);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                                >
                                    <IconRotate className="w-4 h-4" /> Re-answer
                                </button>
                            )}
                        </div>
                        {lastScore && (
                            <button
                                onClick={
                                    store.currentQuestionIndex <
                                    totalQuestions - 1
                                        ? handleNext
                                        : handleEndInterview
                                }
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all cursor-pointer"
                            >
                                {store.currentQuestionIndex <
                                totalQuestions - 1 ? (
                                    <>
                                        Next Question{" "}
                                        <IconChevronRight className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        Finish Interview{" "}
                                        <IconCheck className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {lastScore && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-5 rounded-2xl border border-border bg-card"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <span
                                className={`text-2xl font-bold ${lastScore.overall >= 7 ? "text-green-500" : lastScore.overall >= 5 ? "text-yellow-500" : "text-red-500"}`}
                            >
                                {lastScore.overall}/10
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Quick Score
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {lastScore.feedbackText}
                        </p>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
