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

async function uploadRequest<T = any>(
    endpoint: string,
    file: Blob,
    headers: Record<string, string>,
): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers,
        body: file,
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ error: { message: "Upload failed" } }));
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
    createReportShare: (id: string) =>
        request<{ token: string }>(`/api/interviews/${id}/share`, {
            method: "POST",
        }),
    getSharedReport: (token: string) =>
        request(`/api/interviews/shared/${token}`),
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
    cancelPlan: () => request("/api/payments/cancel-plan", { method: "POST" }),
    getUserPlan: () =>
        request<{ plan: string; interviewCount: number }>(
            "/api/profiles/user-plan",
        ),

    getUploadUrl: (filename: string, contentType: string, folder = "resumes") =>
        request("/api/upload/presign", {
            method: "POST",
            body: { filename, contentType, folder },
        }),
    uploadFile: (file: File, folder = "resumes") =>
        uploadRequest<{ fileUrl: string; key: string }>(
            "/api/upload/file",
            file,
            {
                "Content-Type": file.type || "application/octet-stream",
                "X-Filename": encodeURIComponent(file.name),
                "X-Folder": folder,
            },
        ),

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

    // Realtime interview sessions
    startRealtimeSession: (interviewId: string) =>
        request(`/api/interviews/${interviewId}/realtime/start`, {
            method: "POST",
        }),
    endRealtimeSession: (interviewId: string) =>
        request(`/api/interviews/${interviewId}/realtime/end`, {
            method: "POST",
        }),
    getTranscript: (interviewId: string) =>
        request(`/api/interviews/${interviewId}/transcript`),

    // Recording upload
    getRecordingUploadUrl: (interviewId: string, contentType: string) =>
        request("/api/upload/recording-url", {
            method: "POST",
            body: { interviewId, contentType },
        }),
    uploadRecording: (
        interviewId: string,
        blob: Blob,
        contentType: string,
        durationSeconds?: number,
    ) =>
        uploadRequest<{ fileUrl: string; key: string }>(
            "/api/upload/recording",
            blob,
            {
                "Content-Type": contentType,
                "X-Interview-Id": interviewId,
                ...(durationSeconds
                    ? { "X-Duration-Seconds": String(durationSeconds) }
                    : {}),
            },
        ),

    // Credits
    getCredits: () => request("/api/payments/credits"),
    purchasePack: (packType: string) =>
        request("/api/payments/create-pack-order", {
            method: "POST",
            body: { packType },
        }),

    health: () => request("/api/health"),
};
