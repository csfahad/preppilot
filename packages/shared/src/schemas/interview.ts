import { z } from "zod/v4";

const interviewTypeId = z.enum([
    "behavioral",
    "technical_coding",
    "domain_knowledge",
    "case_study",
    "hr_screening",
    "leadership",
    "situational",
    "culture_fit",
]);

const interviewerToneId = z.enum(["friendly", "tough", "balanced", "case"]);
const interviewMode = z.enum(["text", "voice"]);
const voiceAccentId = z.enum([
    "american",
    "british",
    "australian",
    "indian",
    "european",
    "african",
]);

export const createInterviewSchema = z.object({
    roleTitle: z.string().min(1).max(200),
    industry: z.string().min(1),
    functionCategory: z.string().min(1),
    seniority: z.string().min(1),
    interviewTypes: z.array(interviewTypeId).min(1).max(8),
    interviewerTone: interviewerToneId.default("balanced"),
    mode: interviewMode.default("text"),
    voiceAccent: voiceAccentId.optional(),
    durationMinutes: z.enum(["15", "30", "45", "60"]).default("30"),
    timerEnabled: z.boolean().default(true),
    warmupMode: z.boolean().default(false),
    targetCompany: z.string().max(200).optional(),
    jobDescription: z.string().max(5000).optional(),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;

export const submitAnswerSchema = z.object({
    questionId: z.string().uuid(),
    text: z.string().min(1).max(10000),
    audioUrl: z.string().url().optional(),
    durationSeconds: z.number().int().min(0).optional(),
    isRedo: z.boolean().default(false),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
