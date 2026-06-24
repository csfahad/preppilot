import { and, asc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
    interviewCredits,
    interviews,
    questions,
    users,
} from "../db/schema.js";
import { callClaudeJSON } from "../ai/llm-calls.js";
import {
    buildAdaptiveFollowUpPrompt,
    type AdaptiveDecision,
} from "../ai/prompts.js";

interface CreateInterviewParams {
    userId: string;
    roleTitle: string;
    industry: string;
    functionCategory: string;
    seniority: string;
    interviewTypes: string[];
    interviewerTone: string;
    voiceAccent: string;
    durationMinutes: number;
    targetCompany?: string;
    jobDescription?: string;
    skills?: string[];
    experienceYears?: number;
}

export async function createInterview(
    params: CreateInterviewParams & { consumePackCredit?: boolean },
) {
    // create the interview record
    const [interview] = await db
        .insert(interviews)
        .values({
            userId: params.userId,
            roleTitle: params.roleTitle,
            industry: params.industry,
            functionCategory: params.functionCategory,
            seniority: params.seniority,
            interviewTypes: params.interviewTypes,
            interviewerTone: params.interviewerTone as any,
            voiceAccent: params.voiceAccent,
            durationMinutes: params.durationMinutes,
            targetCompany: params.targetCompany,
            jobDescription: params.jobDescription,
        })
        .returning();

    if (!interview) throw new Error("Failed to create interview");

    if (params.consumePackCredit) {
        const now = new Date();
        const [creditPack] = await db
            .select()
            .from(interviewCredits)
            .where(
                and(
                    eq(interviewCredits.userId, params.userId),
                    gt(
                        sql`${interviewCredits.totalCredits} - ${interviewCredits.usedCredits}`,
                        0,
                    ),
                    or(
                        isNull(interviewCredits.expiresAt),
                        gt(interviewCredits.expiresAt, now),
                    ),
                ),
            )
            .orderBy(asc(interviewCredits.purchasedAt))
            .limit(1);

        if (!creditPack) {
            throw new Error("NO_ACTIVE_CREDITS");
        }

        await db
            .update(interviewCredits)
            .set({ usedCredits: creditPack.usedCredits + 1 })
            .where(eq(interviewCredits.id, creditPack.id));
    }

    // increment total interview count for free limits and usage analytics
    await db
        .update(users)
        .set({ interviewCount: sql`${users.interviewCount} + 1` })
        .where(eq(users.id, params.userId));

    return interview;
}

export async function startInterview(interviewId: string, userId: string) {
    const [updated] = await db
        .update(interviews)
        .set({ status: "active", startedAt: new Date() })
        .where(
            and(eq(interviews.id, interviewId), eq(interviews.userId, userId)),
        )
        .returning();

    return updated;
}

export async function endInterview(interviewId: string) {
    const [updated] = await db
        .update(interviews)
        .set({ status: "processing", endedAt: new Date() })
        .where(eq(interviews.id, interviewId))
        .returning();

    return updated;
}

export async function cancelInterview(interviewId: string) {
    const [updated] = await db
        .update(interviews)
        .set({ status: "cancelled", endedAt: new Date() })
        .where(eq(interviews.id, interviewId))
        .returning();

    return updated;
}

export async function getInterviewById(interviewId: string) {
    const result = await db.query.interviews.findFirst({
        where: eq(interviews.id, interviewId),
        with: {
            questions: {
                orderBy: (q, { asc }) => [asc(q.order)],
            },
            report: true,
            user: true,
            recording: true,
        },
    });

    return result;
}

export async function getUserInterviews(
    userId: string,
    page = 1,
    pageSize = 10,
) {
    const offset = (page - 1) * pageSize;

    const results = await db.query.interviews.findMany({
        where: eq(interviews.userId, userId),
        with: { report: true, recording: true },
        orderBy: (i, { desc }) => [desc(i.createdAt)],
        limit: pageSize,
        offset,
    });

    const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(interviews)
        .where(eq(interviews.userId, userId));

    return {
        interviews: results,
        total: Number(countResult?.count ?? 0),
        page,
        pageSize,
    };
}

// adaptive follow-up logic
export async function decideAdaptiveFollowUp(params: {
    question: string;
    answer: string;
    currentScore: number;
    roleTitle: string;
    seniority: string;
    interviewId: string;
    currentOrder: number;
}): Promise<AdaptiveDecision & { savedQuestion?: any }> {
    const prompt = buildAdaptiveFollowUpPrompt({
        question: params.question,
        answer: params.answer,
        currentScore: params.currentScore,
        roleTitle: params.roleTitle,
        seniority: params.seniority,
    });

    const decision = await callClaudeJSON<AdaptiveDecision>(prompt.system, [
        { role: "user", content: prompt.user },
    ]);

    // if a follow-up is needed, save it as a new question
    if (decision.action !== "next_question" && decision.followUpQuestion) {
        const [savedQuestion] = await db
            .insert(questions)
            .values({
                interviewId: params.interviewId,
                text: decision.followUpQuestion,
                type: "situational",
                order: params.currentOrder + 1,
                difficulty: decision.action === "follow_up_easier" ? 3 : 8,
                expectedDurationSeconds: 90,
            })
            .returning();

        return { ...decision, savedQuestion };
    }

    return decision;
}
