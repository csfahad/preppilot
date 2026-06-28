import { create } from "zustand";
import { api } from "@/lib/api-client";

interface SubscriptionState {
    plan: string;
    status: string | null;
    interviewCount: number;
    maxInterviews: number;
    modelAnswers: boolean;
    fullFeedback: boolean;
    currentPeriodEnd: string | null;
    currentPeriodStart: string | null;
    hasFetched: boolean;

    // actions
    setPlan: (plan: string, interviewCount: number) => void;
    setSubscription: (sub: {
        plan: string;
        status: string;
        currentPeriodEnd: string;
        currentPeriodStart: string;
    }) => void;
    incrementInterviewCount: () => void;
    fetchPlan: () => Promise<void>;
    canStartInterview: () => boolean;
}

const PLAN_LIMITS: Record<
    string,
    {
        maxInterviews: number;
        modelAnswers: boolean;
        fullFeedback: boolean;
    }
> = {
    free: {
        maxInterviews: 1,
        modelAnswers: false,
        fullFeedback: false,
    },
    mini_pack: {
        maxInterviews: Infinity,
        modelAnswers: true,
        fullFeedback: false,
    },
    standard_pack: {
        maxInterviews: Infinity,
        modelAnswers: true,
        fullFeedback: true,
    },
    premium_pack: {
        maxInterviews: Infinity,
        modelAnswers: true,
        fullFeedback: true,
    },
    enterprise: {
        maxInterviews: Infinity,
        modelAnswers: true,
        fullFeedback: true,
    },
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    plan: "free",
    status: null,
    interviewCount: 0,
    maxInterviews: 1,
    modelAnswers: false,
    fullFeedback: false,
    currentPeriodEnd: null,
    currentPeriodStart: null,
    hasFetched: false,

    setPlan: (plan, interviewCount) => {
        const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
        set({
            plan,
            interviewCount,
            ...limits,
        });
    },

    setSubscription: (sub) => {
        const limits = PLAN_LIMITS[sub.plan] ?? PLAN_LIMITS.free;
        set({
            plan: sub.plan,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            currentPeriodStart: sub.currentPeriodStart,
            ...limits,
        });
    },

    incrementInterviewCount: () =>
        set((state) => ({ interviewCount: state.interviewCount + 1 })),

    fetchPlan: async () => {
        try {
            const [planRes, subRes] = await Promise.all([
                api.getUserPlan(),
                api.getSubscription().catch(() => ({ data: null })),
            ]);
            if (planRes.data) {
                const isFreePlan = planRes.data.plan === "free";
                const limits =
                    PLAN_LIMITS[planRes.data.plan] ?? PLAN_LIMITS.free;
                set({
                    plan: planRes.data.plan,
                    interviewCount: planRes.data.interviewCount,
                    hasFetched: true,
                    ...limits,
                    ...(subRes.data && !isFreePlan
                        ? {
                              status: subRes.data.status,
                              currentPeriodStart:
                                  subRes.data.currentPeriodStart,
                              currentPeriodEnd: subRes.data.currentPeriodEnd,
                          }
                        : {
                              status: null,
                              currentPeriodStart: null,
                              currentPeriodEnd: null,
                          }),
                });
            }
        } catch (err) {
            console.error("Failed to fetch user plan:", err);
        }
    },

    canStartInterview: () => {
        const state = get();
        const limits = PLAN_LIMITS[state.plan] ?? PLAN_LIMITS.free;
        return state.interviewCount < limits.maxInterviews;
    },
}));
