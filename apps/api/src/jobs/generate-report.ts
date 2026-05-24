import { Worker, Queue } from "bullmq";
import { db } from "../db/index.js";
import {
    interviewReports,
    interviews,
    questions,
    answers,
    scores,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import { callClaudeJSON } from "../ai/llm-calls.js";
import { buildReportSummaryPrompt } from "../ai/prompts.js";
import { sendFeedbackReadyEmail } from "../lib/email.js";
import { createRedisConnection } from "../lib/redis.js";

const QUEUE_NAME = "generate-report";

export const reportQueue = new Queue(QUEUE_NAME, {
    connection: createRedisConnection(),
});

interface ReportSummary {
    summaryText: string;
    strengths: string[];
    weaknesses: string[];
    radarScores: Record<string, number>;
    overallScore: number;
}

export interface GenerateReportJobData {
    interviewId: string;
    userId: string;
    userEmail: string;
    userName: string;
}

async function saveReport(interviewId: string, summary: ReportSummary) {
    await db
        .insert(interviewReports)
        .values({
            interviewId,
            summaryText: summary.summaryText,
            radarScores: summary.radarScores,
            strengths: summary.strengths,
            weaknesses: summary.weaknesses,
            overallScore: summary.overallScore,
        })
        .onConflictDoUpdate({
            target: interviewReports.interviewId,
            set: {
                summaryText: summary.summaryText,
                radarScores: summary.radarScores,
                strengths: summary.strengths,
                weaknesses: summary.weaknesses,
                overallScore: summary.overallScore,
            },
        });
}

export async function generateInterviewReport(data: GenerateReportJobData) {
    const { interviewId, userEmail, userName } = data;

    console.log(`[Report] Generating report for interview ${interviewId}`);

    const existingReport = await db.query.interviewReports.findFirst({
        where: eq(interviewReports.interviewId, interviewId),
    });

    if (existingReport) {
        await db
            .update(interviews)
            .set({ status: "completed" })
            .where(eq(interviews.id, interviewId));
        console.log(
            `[Report] Existing report found for interview ${interviewId}`,
        );
        return;
    }

    // fetch all questions with their best answers and scores
    const interviewQuestions = await db.query.questions.findMany({
        where: eq(questions.interviewId, interviewId),
        with: {
            answers: {
                with: { score: true },
                orderBy: (a, { desc }) => [desc(a.createdAt)],
                limit: 1, // get the latest (or redo) answer
            },
        },
        orderBy: (q, { asc }) => [asc(q.order)],
    });

    // build scores summary for AI
    const questionsAndScores = interviewQuestions
        .filter((q) => q.answers.length > 0 && q.answers[0]!.score)
        .map((q) => ({
            question: q.text,
            type: q.type,
            score: q.answers[0]!.score!.overall,
            feedbackText: q.answers[0]!.score!.feedbackText,
        }));

    // get interview details for role context
    const interview = await db.query.interviews.findFirst({
        where: eq(interviews.id, interviewId),
    });

    if (!interview) throw new Error("Interview not found");

    if (questionsAndScores.length === 0) {
        console.warn(`[Report] No scored answers for interview ${interviewId}`);
        await saveReport(interviewId, {
            summaryText: "No scored answers were available for this interview.",
            strengths: [],
            weaknesses: [
                "Submit at least one scored answer to generate personalized feedback.",
            ],
            radarScores: {
                Communication: 0,
                Technical: 0,
                "Problem Solving": 0,
                Leadership: 0,
                "Culture Fit": 0,
            },
            overallScore: 0,
        });
        await db
            .update(interviews)
            .set({ status: "completed" })
            .where(eq(interviews.id, interviewId));
        return;
    }

    const overallAverage =
        questionsAndScores.reduce((sum, q) => sum + q.score, 0) /
        questionsAndScores.length;

    // generate summary via AI
    const prompt = buildReportSummaryPrompt({
        roleTitle: interview.roleTitle,
        seniority: interview.seniority,
        questionsAndScores,
        overallAverage,
    });

    const summary = await callClaudeJSON<ReportSummary>(prompt.system, [
        { role: "user", content: prompt.user },
    ]);

    // save the report
    await saveReport(interviewId, summary);

    // update interview status to completed
    await db
        .update(interviews)
        .set({ status: "completed" })
        .where(eq(interviews.id, interviewId));

    // send email notification
    try {
        await sendFeedbackReadyEmail(userEmail, userName, interviewId);
    } catch (emailErr) {
        console.error("[Report] Failed to send email:", emailErr);
    }

    console.log(`[Report] Report generated for interview ${interviewId}`);
}

export async function enqueueReportGeneration(data: GenerateReportJobData) {
    const job = await reportQueue.add("generate", data, {
        jobId: `report-${data.interviewId}`,
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5_000,
        },
        removeOnComplete: {
            age: 24 * 60 * 60,
            count: 1_000,
        },
        removeOnFail: {
            age: 7 * 24 * 60 * 60,
        },
    });

    return { mode: "queue" as const, jobId: job.id };
}

export function startReportWorker() {
    const worker = new Worker(
        QUEUE_NAME,
        async (job) => {
            await generateInterviewReport(job.data as GenerateReportJobData);
        },
        {
            connection: createRedisConnection(),
            concurrency: 3,
        },
    );

    worker.on("completed", (job) => {
        console.log(`[ReportWorker] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
        console.error(`[ReportWorker] Job ${job?.id} failed:`, err.message);
    });

    return worker;
}
