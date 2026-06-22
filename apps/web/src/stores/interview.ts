import { create } from "zustand";

export interface TranscriptEntry {
    speaker: "user" | "ai";
    text: string;
    timestamp: number;
}

interface InterviewState {
    // current interview
    interviewId: string | null;
    isActive: boolean;
    voiceAccent: string;
    durationMinutes: number;

    // realtime session
    signedUrl: string | null;
    isConnected: boolean;
    isAISpeaking: boolean;
    elapsedSeconds: number;

    // transcript
    transcript: TranscriptEntry[];

    // recording
    isRecording: boolean;

    // actions
    setInterview: (
        id: string,
        config: {
            voiceAccent: string;
            durationMinutes: number;
        },
    ) => void;
    setSession: (signedUrl: string) => void;
    setConnected: (connected: boolean) => void;
    setAISpeaking: (speaking: boolean) => void;
    addTranscriptEntry: (entry: TranscriptEntry) => void;
    setElapsedSeconds: (seconds: number) => void;
    setRecording: (recording: boolean) => void;
    endInterview: () => void;
    reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
    interviewId: null,
    isActive: false,
    voiceAccent: "american",
    durationMinutes: 30,

    signedUrl: null,
    isConnected: false,
    isAISpeaking: false,
    elapsedSeconds: 0,

    transcript: [],

    isRecording: false,

    setInterview: (id, config) =>
        set({
            interviewId: id,
            isActive: true,
            voiceAccent: config.voiceAccent,
            durationMinutes: config.durationMinutes,
            transcript: [],
            elapsedSeconds: 0,
        }),

    setSession: (signedUrl) => set({ signedUrl }),

    setConnected: (connected) => set({ isConnected: connected }),

    setAISpeaking: (speaking) => set({ isAISpeaking: speaking }),

    addTranscriptEntry: (entry) =>
        set((state) => ({
            transcript: [...state.transcript, entry],
        })),

    setElapsedSeconds: (seconds) => set({ elapsedSeconds: seconds }),

    setRecording: (recording) => set({ isRecording: recording }),

    endInterview: () =>
        set({ isActive: false, isConnected: false, isAISpeaking: false }),

    reset: () =>
        set({
            interviewId: null,
            isActive: false,
            voiceAccent: "american",
            durationMinutes: 30,
            signedUrl: null,
            isConnected: false,
            isAISpeaking: false,
            elapsedSeconds: 0,
            transcript: [],
            isRecording: false,
        }),
}));
