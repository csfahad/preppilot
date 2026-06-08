import { API_URL } from "./api-url";

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

async function request<T = any>(
    endpoint: string,
    options: {
        method?: string;
        body?: unknown;
    } = {},
): Promise<ApiResponse<T>> {
    const { method = "GET", body } = options;

    const config: RequestInit = {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
    };

    if (body) config.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: { message: "Request failed" } }));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return response.json();
}

export const api = {
    getProfile: () => request("/api/profiles/me"),
    createProfile: (data: any) =>
        request("/api/profiles", { method: "POST", body: data }),
    updateProfile: (data: any) =>
        request("/api/profiles/me", { method: "PATCH", body: data }),

    listInterviews: (page = 1) => request(`/api/interviews?page=${page}`),
    getInterview: (id: string) => request(`/api/interviews/${id}`),
    createInterview: (data: any) =>
        request("/api/interviews", { method: "POST", body: data }),
    startInterview: (id: string) =>
        request(`/api/interviews/${id}/start`, { method: "PATCH" }),
    endInterview: (id: string) =>
        request(`/api/interviews/${id}/end`, { method: "PATCH" }),
    cancelInterview: (id: string) =>
        request(`/api/interviews/${id}/cancel`, { method: "PATCH" }),

    submitAnswer: (data: any) =>
        request("/api/answers", { method: "POST", body: data }),
    getInterviewScores: (interviewId: string) =>
        request(`/api/answers/interview/${interviewId}/scores`),
    decideAdaptive: (answerId: string, data: any) =>
        request(`/api/answers/${answerId}/adaptive`, {
            method: "POST",
            body: data,
        }),

    createSubscription: (planId: string) =>
        request("/api/payments/create-subscription", {
            method: "POST",
            body: { planId },
        }),
    verifyPayment: (data: any) =>
        request("/api/payments/verify", { method: "POST", body: data }),
    getSubscription: () => request("/api/payments/subscription"),
    getUserPlan: () =>
        request<{ plan: string; interviewCount: number }>(
            "/api/profiles/user-plan",
        ),

    getUploadUrl: (filename: string, contentType: string, folder = "resumes") =>
        request("/api/upload/presign", {
            method: "POST",
            body: { filename, contentType, folder },
        }),

    // Teams (enterprise)
    getTeam: () => request("/api/teams/me"),
    createTeam: (name: string) =>
        request("/api/teams", { method: "POST", body: { name } }),
    inviteTeamMember: (email: string, role = "member") =>
        request("/api/teams/invite", { method: "POST", body: { email, role } }),
    joinTeam: (token: string) =>
        request("/api/teams/join", { method: "POST", body: { token } }),
    removeTeamMember: (memberId: string) =>
        request(`/api/teams/members/${memberId}`, { method: "DELETE" }),
    getTeamAnalytics: () => request("/api/teams/analytics"),

    health: () => request("/api/health"),
};
