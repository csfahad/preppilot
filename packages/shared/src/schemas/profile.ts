import { z } from "zod/v4";
import {
    INDUSTRIES,
    SENIORITY_LEVELS,
    FUNCTION_CATEGORIES,
} from "../constants/taxonomy.ts";

export const profileSchema = z.object({
    industry: z.enum(INDUSTRIES),
    functionCategory: z.enum(FUNCTION_CATEGORIES),
    subFunction: z.string().min(1),
    seniority: z.enum(SENIORITY_LEVELS),
    experienceYears: z.number().int().min(0).max(40),
    resumeUrl: z.string().url().optional(),
    targetCompanies: z.array(z.string().min(1)).max(10).default([]),
    careerGoal: z.string().max(500).optional(),
    skills: z.array(z.string().min(1)).default([]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const profileUpdateSchema = profileSchema.partial();

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
