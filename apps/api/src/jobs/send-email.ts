import { Worker, Queue } from "bullmq";
import {
    sendWelcomeEmail,
    sendFeedbackReadyEmail,
    sendTrialEndingEmail,
    sendTeamInvitationEmail,
    sendWeeklySummaryEmail,
    sendInterviewReminderEmail,
    sendSubscriptionConfirmationEmail,
} from "../lib/email.js";
import { createRedisConnection } from "../lib/redis.js";

const QUEUE_NAME = "send-email";

export const emailQueue = new Queue(QUEUE_NAME, {
    connection: createRedisConnection(),
});

export function enqueueEmail(
    type: string,
    data: Record<string, unknown>,
    options: Parameters<typeof emailQueue.add>[2] = {},
) {
    return emailQueue.add(
        type,
        { type, ...data },
        {
            attempts: 3,
            backoff: { type: "exponential", delay: 5_000 },
            removeOnComplete: true,
            removeOnFail: {
                age: 7 * 24 * 60 * 60,
            },
            ...options,
        },
    );
}

export function startEmailWorker() {
    const worker = new Worker(
        QUEUE_NAME,
        async (job) => {
            const { type, to, name, ...extra } = job.data;

            console.log(`[EmailWorker] Sending ${type} email to ${to}`);

            switch (type) {
                case "welcome":
                    await sendWelcomeEmail(to, name);
                    break;
                case "feedback_ready":
                    await sendFeedbackReadyEmail(to, name, extra.interviewId);
                    break;
                case "trial_ending":
                    await sendTrialEndingEmail(to, name, extra.interviewsUsed);
                    break;
                case "team_invitation":
                    await sendTeamInvitationEmail(
                        to,
                        extra.inviterName,
                        extra.teamName,
                        extra.inviteUrl,
                    );
                    break;
                case "weekly_summary":
                    await sendWeeklySummaryEmail(to, name, extra.stats);
                    break;
                case "interview_reminder":
                    await sendInterviewReminderEmail(
                        to,
                        name,
                        extra.daysSinceLastInterview,
                    );
                    break;
                case "subscription_confirmation":
                    await sendSubscriptionConfirmationEmail(
                        to,
                        name,
                        extra.planName,
                    );
                    break;
                default:
                    console.warn(`[EmailWorker] Unknown email type: ${type}`);
            }
        },
        {
            connection: createRedisConnection(),
            concurrency: 5,
        },
    );

    worker.on("completed", (job) => {
        console.log(`[EmailWorker] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
        console.error(`[EmailWorker] Job ${job?.id} failed:`, err);
    });

    return worker;
}
