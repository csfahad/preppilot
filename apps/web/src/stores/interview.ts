import { create } from "zustand";

interface InterviewQuestion {
    id: string;
    text: string;
    type: string;
    order: number;
    timeLimitSeconds: number | null;
    difficulty: number;
}

interface InterviewAnswer {
    questionId: string;
    text: string;
    score?: {
        overall: number;
        clarity: number;
        relevance: number;
        depth: number;
        structure: number;
        feedbackText: string;
    };
}

interface InterviewState {
    // current interview
    interviewId: string | null;
    questions: InterviewQuestion[];
    currentQuestionIndex: number;
    answers: Map<string, InterviewAnswer>;
    isActive: boolean;
    mode: "text" | "voice";

    // timer
    timerEnabled: boolean;
    timeRemaining: number | null;

    // actions
    setInterview: (
        id: string,
        questions: InterviewQuestion[],
        mode: "text" | "voice",
        timerEnabled: boolean,
    ) => void;
    submitAnswer: (questionId: string, answer: InterviewAnswer) => void;
    nextQuestion: () => void;
    previousQuestion: () => void;
    setTimeRemaining: (seconds: number | null) => void;
    endInterview: () => void;
    reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
    interviewId: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: new Map(),
    isActive: false,
    mode: "text",
    timerEnabled: true,
    timeRemaining: null,

    setInterview: (id, questions, mode, timerEnabled) =>
        set({
            interviewId: id,
            questions,
            currentQuestionIndex: 0,
            answers: new Map(),
            isActive: true,
            mode,
            timerEnabled,
            timeRemaining:
                timerEnabled && questions[0]?.timeLimitSeconds
                    ? questions[0].timeLimitSeconds
                    : null,
        }),

    submitAnswer: (questionId, answer) =>
        set((state) => {
            const newAnswers = new Map(state.answers);
            newAnswers.set(questionId, answer);
            return { answers: newAnswers };
        }),

    nextQuestion: () =>
        set((state) => {
            const next = Math.min(
                state.currentQuestionIndex + 1,
                state.questions.length - 1,
            );
            const nextQ = state.questions[next];
            return {
                currentQuestionIndex: next,
                timeRemaining:
                    state.timerEnabled && nextQ?.timeLimitSeconds
                        ? nextQ.timeLimitSeconds
                        : null,
            };
        }),

    previousQuestion: () =>
        set((state) => ({
            currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
        })),

    setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),

    endInterview: () => set({ isActive: false }),

    reset: () =>
        set({
            interviewId: null,
            questions: [],
            currentQuestionIndex: 0,
            answers: new Map(),
            isActive: false,
            mode: "text",
            timerEnabled: true,
            timeRemaining: null,
        }),
}));
