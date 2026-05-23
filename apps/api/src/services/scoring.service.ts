import { db } from "../db/index.js";
import { answers, scores, questions } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { callClaudeJSON } from "../ai/llm-calls.js";
import { buildEvaluationPrompt, type EvaluationResult } from "../ai/prompts.js";

interface SubmitAnswerParams {
    questionId: string;
    userId: string;
    text: string;
    audioUrl?: string;
    durationSeconds?: number;
    isRedo?: boolean;
}

export async function submitAndScoreAnswer(params: SubmitAnswerParams) {
    // get the question details from db
    const question = await db.query.questions.findFirst({
        where: eq(questions.id, params.questionId),
        with: { interview: true },
    });

    if (!question) throw new Error("Question not found");
    if (question.interview.userId !== params.userId) {
        throw new Error("Question does not belong to this user");
    }

    // if this is a redo, mark previous answers as superseded
    if (params.isRedo) {
        const existingAnswers = await db
            .select()
            .from(answers)
            .where(eq(answers.questionId, params.questionId));

        if (existingAnswers.length >= 1) {
            // Only one redo allowed — check count
            const nonRedoAnswers = existingAnswers.filter((a) => !a.isRedo);
            if (existingAnswers.length > nonRedoAnswers.length) {
                throw new Error("You can only redo an answer once");
            }
        }
    }

    // save the answer
    const [answer] = await db
        .insert(answers)
        .values({
            questionId: params.questionId,
            userId: params.userId,
            text: params.text,
            audioUrl: params.audioUrl,
            durationSeconds: params.durationSeconds,
            isRedo: params.isRedo ?? false,
        })
        .returning();

    if (!answer) throw new Error("Failed to save answer");

    // evaluate via LLM
    const prompt = buildEvaluationPrompt({
        question: question.text,
        questionType: question.type,
        answer: params.text,
        roleTitle: question.interview.roleTitle,
        seniority: question.interview.seniority,
        industry: question.interview.industry,
    });

    const evaluation = await callClaudeJSON<EvaluationResult>(prompt.system, [
        { role: "user", content: prompt.user },
    ]);

    // update filler word count on answer
    if (
        evaluation.fillerWordsDetected &&
        evaluation.fillerWordsDetected.length > 0
    ) {
        await db
            .update(answers)
            .set({ fillerWordCount: evaluation.fillerWordsDetected.length })
            .where(eq(answers.id, answer.id));
    }

    // save score
    const [score] = await db
        .insert(scores)
        .values({
            answerId: answer.id,
            clarity: evaluation.clarity,
            relevance: evaluation.relevance,
            depth: evaluation.depth,
            structure: evaluation.structure,
            technicalAccuracy: evaluation.technicalAccuracy,
            confidence: evaluation.confidence,
            overall: evaluation.overall,
            starCompliance: evaluation.starCompliance,
            feedbackText: evaluation.feedbackText,
            modelAnswer: evaluation.modelAnswer,
            improvementTips: evaluation.improvementTips,
        })
        .returning();

    return {
        answer,
        score,
        evaluation,
    };
}

export async function getInterviewScores(interviewId: string) {
    const interviewQuestions = await db.query.questions.findMany({
        where: eq(questions.interviewId, interviewId),
        with: {
            answers: {
                with: { score: true },
                orderBy: (a, { desc }) => [desc(a.createdAt)],
            },
        },
        orderBy: (q, { asc }) => [asc(q.order)],
    });

    return interviewQuestions;
}
