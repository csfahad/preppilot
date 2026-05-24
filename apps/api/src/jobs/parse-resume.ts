import { Worker, Queue } from "bullmq";
import { db } from "../db/index.js";
import { profiles } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { callClaudeJSON } from "../ai/llm-calls.js";
import { buildResumeParsingPrompt } from "../ai/prompts.js";
import { createRedisConnection } from "../lib/redis.js";

const QUEUE_NAME = "parse-resume";

export const resumeQueue = new Queue(QUEUE_NAME, {
    connection: createRedisConnection(),
});

interface ParsedResume {
    name: string;
    email?: string;
    skills: string[];
    experienceYears: number;
    currentRole?: string;
    currentCompany?: string;
    education: Array<{ degree: string; institution: string; year?: number }>;
    experiences: Array<{
        title: string;
        company: string;
        duration: string;
        highlights: string[];
    }>;
    suggestedIndustry: string;
    suggestedFunction: string;
    suggestedSubFunction: string;
    suggestedSeniority: string;
}

export function startResumeWorker() {
    const worker = new Worker(
        QUEUE_NAME,
        async (job) => {
            const { userId, resumeText } = job.data;

            console.log(`[ResumeWorker] Parsing resume for user ${userId}`);

            const prompt = buildResumeParsingPrompt(resumeText);

            const parsed = await callClaudeJSON<ParsedResume>(prompt.system, [
                { role: "user", content: prompt.user },
            ]);

            // update profile with parsed data
            await db
                .update(profiles)
                .set({
                    resumeParsedData: parsed as any,
                    skills: parsed.skills,
                    experienceYears: parsed.experienceYears,
                    industry: parsed.suggestedIndustry,
                    functionCategory: parsed.suggestedFunction,
                    subFunction: parsed.suggestedSubFunction,
                    seniority: parsed.suggestedSeniority,
                    updatedAt: new Date(),
                })
                .where(eq(profiles.userId, userId));

            console.log(
                `[ResumeWorker] Resume parsed for user ${userId}: ${parsed.skills.length} skills extracted`,
            );
        },
        {
            connection: createRedisConnection(),
            concurrency: 2,
        },
    );

    worker.on("completed", (job) => {
        console.log(`[ResumeWorker] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
        console.error(`[ResumeWorker] Job ${job?.id} failed:`, err.message);
    });

    return worker;
}
