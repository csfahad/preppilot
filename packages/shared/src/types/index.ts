export type {
    Industry,
    FunctionCategory,
    SeniorityLevel,
    VoiceAccentId,
    InterviewerToneId,
    UserPlan,
} from "../constants/taxonomy.ts";
export type {
    InterviewTypeId,
    InterviewStatus,
    InterviewMode,
    ScoringDimensionId,
    RadarCategory,
} from "../constants/interview-types.ts";
export type { ProfileInput, ProfileUpdateInput } from "../schemas/profile.ts";
export type {
    CreateInterviewInput,
    SubmitAnswerInput,
} from "../schemas/interview.ts";
export type {
    CreateSubscriptionInput,
    VerifyPaymentInput,
} from "../schemas/payment.ts";

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    plan: string;
    interviewCount: number;
    createdAt: string;
}

export interface Profile {
    id: string;
    userId: string;
    industry: string;
    functionCategory: string;
    subFunction: string;
    seniority: string;
    experienceYears: number;
    resumeUrl: string | null;
    resumeParsedData: Record<string, unknown> | null;
    targetCompanies: string[];
    careerGoal: string | null;
    skills: string[];
    createdAt: string;
}

export interface Interview {
    id: string;
    userId: string;
    roleTitle: string;
    industry: string;
    functionCategory: string;
    seniority: string;
    interviewTypes: string[];
    status: string;
    interviewerTone: string;
    mode: string;
    voiceAccent: string | null;
    timerEnabled: boolean;
    warmupMode: boolean;
    targetCompany: string | null;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
}

export interface Question {
    id: string;
    interviewId: string;
    text: string;
    type: string;
    order: number;
    timeLimitSeconds: number | null;
    difficulty: number;
    expectedDurationSeconds: number;
    followUpTo: string | null;
}

export interface Answer {
    id: string;
    questionId: string;
    userId: string;
    text: string;
    audioUrl: string | null;
    durationSeconds: number | null;
    isRedo: boolean;
    fillerWordCount: number | null;
    paceWpm: number | null;
    createdAt: string;
}

export interface Score {
    id: string;
    answerId: string;
    clarity: number;
    relevance: number;
    depth: number;
    structure: number;
    technicalAccuracy: number;
    confidence: number;
    overall: number;
    starCompliance: boolean | null;
    feedbackText: string;
    modelAnswer: string | null;
    improvementTips: string[];
}

export interface InterviewReport {
    id: string;
    interviewId: string;
    summaryText: string;
    radarScores: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
    overallScore: number;
    createdAt: string;
}

export interface Subscription {
    id: string;
    userId: string;
    razorpaySubscriptionId: string;
    razorpayPlanId: string;
    plan: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    createdAt: string;
}
