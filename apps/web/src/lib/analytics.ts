let posthog: any = null;

export async function initAnalytics() {
    if (typeof window === "undefined") return;

    const key = import.meta.env.VITE_POSTHOG_KEY!;
    const host = import.meta.env.VITE_POSTHOG_HOST!;

    if (!key) {
        console.warn(
            "[analytics] VITE_POSTHOG_KEY not set — analytics disabled",
        );
        return;
    }

    try {
        const { default: PostHog } = await import("posthog-js");
        posthog = PostHog;
        posthog.init(key, {
            api_host: host,
            capture_pageview: true,
            capture_pageleave: true,
            persistence: "localStorage+cookie",
            autocapture: false,
        });
    } catch {
        console.warn("[analytics] Failed to load PostHog");
    }
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
    posthog?.identify(userId, traits);
}

export function resetAnalytics() {
    posthog?.reset();
}

// typed event tracking

export function trackInterviewStarted(data: {
    interviewId: string;
    mode: "text" | "voice";
    types: string[];
    seniority: string;
}) {
    posthog?.capture("interview_started", data);
}

export function trackInterviewCompleted(data: {
    interviewId: string;
    score: number;
    questionsAnswered: number;
    durationMinutes: number;
}) {
    posthog?.capture("interview_completed", data);
}

export function trackAnswerSubmitted(data: {
    questionType: string;
    score: number;
    isRedo: boolean;
}) {
    posthog?.capture("answer_submitted", data);
}

export function trackPaywallViewed(data: {
    trigger:
        | "interview_limit"
        | "model_answer"
        | "voice_mode"
        | "upgrade_button";
}) {
    posthog?.capture("paywall_viewed", data);
}

export function trackSubscriptionStarted(data: {
    plan: string;
    source: string;
}) {
    posthog?.capture("subscription_started", data);
}

export function trackOnboardingCompleted(data: {
    industry: string;
    functionCategory: string;
    seniority: string;
    hasResume: boolean;
}) {
    posthog?.capture("onboarding_completed", data);
}

export function trackPageView(page: string) {
    posthog?.capture("$pageview", { $current_url: page });
}
