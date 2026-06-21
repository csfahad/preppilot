/* realtime interview: transcript collection and post-processing
 * collects conversation turns during the interview and processes them afterward
 * into structured Q&A pairs compatible with the existing scoring pipeline
 */

import { eq, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import {
    conversationTurns,
    interviews,
    questions,
    answers,
} from "../db/schema.js";
import { callClaudeJSON } from "../ai/llm-calls.js";
import { buildTranscriptExtractionPrompt } from "./interview-prompt.js";

/*
 * Add a single conversation turn to the database.
 * Called by the LLM proxy as messages flow through.
 */
export async function addConversationTurn(params: {
    interviewId: string;
    speaker: "user" | "ai";
    text: string;
    turnIndex: number;
    startedAt: Date;
    durationMs?: number;
    metadata?: Record<string, unknown>;
}): Promise<void> {
    await db.insert(conversationTurns).values({
        interviewId: params.interviewId,
        speaker: params.speaker,
        text: params.text,
        turnIndex: params.turnIndex,
        startedAt: params.startedAt,
        durationMs: params.durationMs ?? null,
        metadata: params.metadata ?? null,
    });
}

/* Retrieve the full transcript for an interview, ordered by turn index. */
export async function getTranscript(interviewId: string): Promise<
    Array<{
        speaker: string;
        text: string;
        turnIndex: number;
        startedAt: Date;
    }>
> {
    const turns = await db
        .select({
            speaker: conversationTurns.speaker,
            text: conversationTurns.text,
            turnIndex: conversationTurns.turnIndex,
            startedAt: conversationTurns.startedAt,
        })
        .from(conversationTurns)
        .where(eq(conversationTurns.interviewId, interviewId))
        .orderBy(asc(conversationTurns.turnIndex));

    return turns;
}

interface ExtractedQAPair {
    question: string;
    questionType: string;
    answer: string;
    order: number;
}

/* Use the LLM to extract structured Q&A pairs from the raw transcript. */
export async function extractQAPairs(
    interviewId: string,
    config: {
        roleTitle: string;
        seniority: string;
        industry: string;
    },
): Promise<ExtractedQAPair[]> {
    const turns = await getTranscript(interviewId);

    if (turns.length === 0) {
        return [];
    }

    // format turns into a readable transcript string
    const transcriptText = turns
        .map((t) => {
            const label = t.speaker === "ai" ? "Interviewer" : "Candidate";
            return `${label}: ${t.text}`;
        })
        .join("\n\n");

    const prompt = buildTranscriptExtractionPrompt(transcriptText, config);

    const qaPairs = await callClaudeJSON<ExtractedQAPair[]>(prompt.system, [
        { role: "user", content: prompt.user },
    ]);

    return qaPairs;
}

/**
 * Full post-interview transcript processing pipeline.
 *
 * 1. Fetches the raw transcript from conversation_turns
 * 2. Extracts Q&A pairs via LLM
 * 3. Saves questions to the `questions` table
 * 4. Saves answers to the `answers` table
 *
 * After this runs, the interview data is in the same shape as a
 * standard (non-realtime) interview, ready for the scoring + report pipeline.
 */
export async function processRealtimeTranscript(
    interviewId: string,
    userId: string,
): Promise<void> {
    // 1. Fetch interview metadata for prompt context
    const interview = await db.query.interviews.findFirst({
        where: eq(interviews.id, interviewId),
    });

    if (!interview) {
        throw new Error(`Interview not found: ${interviewId}`);
    }

    // 2. Extract Q&A pairs from the transcript
    const qaPairs = await extractQAPairs(interviewId, {
        roleTitle: interview.roleTitle,
        seniority: interview.seniority,
        industry: interview.industry,
    });

    if (qaPairs.length === 0) {
        console.warn(
            `No Q&A pairs extracted for interview ${interviewId}. Transcript may be empty.`,
        );
        return;
    }

    // 3. Save each Q&A pair as a question + answer record
    for (const qa of qaPairs) {
        // validate question type against our enum
        const validTypes = [
            "behavioral",
            "technical_coding",
            "domain_knowledge",
            "case_study",
            "hr_screening",
            "leadership",
            "situational",
            "culture_fit",
        ] as const;

        const questionType = validTypes.includes(qa.questionType as any)
            ? (qa.questionType as (typeof validTypes)[number])
            : "situational";

        // insert the question
        const [savedQuestion] = await db
            .insert(questions)
            .values({
                interviewId,
                text: qa.question,
                type: questionType,
                order: qa.order,
                difficulty: 5, // default - scoring pipeline will assess actual difficulty
                expectedDurationSeconds: 120,
            })
            .returning();

        if (!savedQuestion) {
            console.error(
                `Failed to save question for interview ${interviewId}: ${qa.question}`,
            );
            continue;
        }

        // insert the answer (skip if the candidate didn't answer)
        if (qa.answer && qa.answer.trim().length > 0) {
            await db.insert(answers).values({
                questionId: savedQuestion.id,
                userId,
                text: qa.answer,
                audioUrl: null,
                durationSeconds: null,
                isRedo: false,
            });
        }
    }

    console.log(
        `Processed ${qaPairs.length} Q&A pairs for interview ${interviewId}`,
    );
}
