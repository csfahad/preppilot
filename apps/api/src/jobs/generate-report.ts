import { Worker, Queue } from "bullmq";
import { db } from "../db/index.js";
import {
    interviewReports,
    interviews,
    questions,
    scores,
    conversationTurns,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import { callClaudeJSON } from "../ai/llm-calls.js";
import {
    buildReportSummaryPrompt,
    buildEvaluationPrompt,
} from "../ai/prompts.js";
import { sendFeedbackReadyEmail } from "../lib/email.js";
import { createRedisConnection } from "../lib/redis.js";
import { processRealtimeTranscript } from "../realtime/transcript-collector.js";

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

interface AnswerScore {
    overall: number;
    clarity: number;
    relevance: number;
    depth: number;
    structure: number;
    technicalAccuracy: number;
    confidence: number;
    feedbackText: string;
    modelAnswer: string;
    improvementTips: string[];
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

/**
 * Check if this interview has conversation turns (i.e. was a realtime interview).
 */
async function hasRealtimeTranscript(interviewId: string): Promise<boolean> {
    const [turn] = await db
        .select({ id: conversationTurns.id })
        .from(conversationTurns)
        .where(eq(conversationTurns.interviewId, interviewId))
        .limit(1);

    return !!turn;
}

/**
 * Score a single answer using AI.
 */
async function scoreAnswer(params: {
    questionText: string;
    questionType: string;
    answerText: string;
    roleTitle: string;
    seniority: string;
    industry: string;
}): Promise<AnswerScore> {
    const prompt = buildEvaluationPrompt({
        question: params.questionText,
        questionType: params.questionType,
        answer: params.answerText,
        roleTitle: params.roleTitle,
        seniority: params.seniority,
        industry: params.industry,
    });

    return callClaudeJSON<AnswerScore>(prompt.system, [
        { role: "user", content: prompt.user },
    ]);
}

export async function generateInterviewReport(data: GenerateReportJobData) {
    const { interviewId, userId, userEmail, userName } = data;

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

    // Realtime interviews: process transcript first
    const isRealtime = await hasRealtimeTranscript(interviewId);
    if (isRealtime) {
        console.log(
            `[Report] Realtime interview detected. Processing transcript...`,
        );
        await processRealtimeTranscript(interviewId, userId);
    }

    // Fetch interview details
    const interview = await db.query.interviews.findFirst({
        where: eq(interviews.id, interviewId),
    });

    if (!interview) throw new Error("Interview not found");

    // Fetch questions with their answers
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

    // Score unscored answers (common for realtime interviews)
    for (const q of interviewQuestions) {
        const latestAnswer = q.answers[0];
        if (latestAnswer && !latestAnswer.score) {
            try {
                const scoreResult = await scoreAnswer({
                    questionText: q.text,
                    questionType: q.type,
                    answerText: latestAnswer.text,
                    roleTitle: interview.roleTitle,
                    seniority: interview.seniority,
                    industry: interview.industry,
                });

                await db.insert(scores).values({
                    answerId: latestAnswer.id,
                    overall: scoreResult.overall,
                    clarity: scoreResult.clarity,
                    relevance: scoreResult.relevance,
                    depth: scoreResult.depth,
                    structure: scoreResult.structure ?? 5,
                    technicalAccuracy: scoreResult.technicalAccuracy ?? 5,
                    confidence: scoreResult.confidence ?? 5,
                    feedbackText: scoreResult.feedbackText,
                    modelAnswer: scoreResult.modelAnswer,
                    improvementTips: scoreResult.improvementTips,
                });
            } catch (scoreErr) {
                console.error(
                    `[Report] Error scoring answer ${latestAnswer.id}:`,
                    scoreErr,
                );
            }
        }
    }

    // Re-fetch with scores (may have just been created)
    const scoredQuestions = await db.query.questions.findMany({
        where: eq(questions.interviewId, interviewId),
        with: {
            answers: {
                with: { score: true },
                orderBy: (a, { desc }) => [desc(a.createdAt)],
                limit: 1,
            },
        },
        orderBy: (q, { asc }) => [asc(q.order)],
    });

    // build scores summary for AI
    const questionsAndScores = scoredQuestions
        .filter((q) => q.answers.length > 0 && q.answers[0]!.score)
        .map((q) => ({
            question: q.text,
            type: q.type,
            score: q.answers[0]!.score!.overall,
            feedbackText: q.answers[0]!.score!.feedbackText,
        }));

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
