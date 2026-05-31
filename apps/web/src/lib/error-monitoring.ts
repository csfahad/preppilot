let Sentry: any = null;

export async function initErrorMonitoring() {
    if (typeof window === "undefined") return;

    const dsn = import.meta.env.VITE_SENTRY_DSN!;
    if (!dsn) {
        console.warn(
            "[sentry] VITE_SENTRY_DSN not set — error monitoring disabled",
        );
        return;
    }

    try {
        Sentry = await import("@sentry/react");
        Sentry.init({
            dsn,
            environment: import.meta.env.NODE_ENV!,
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0.01,
            replaysOnErrorSampleRate: 1.0,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration({
                    maskAllText: false,
                    blockAllMedia: false,
                }),
            ],
        });
    } catch {
        console.warn("[sentry] Failed to load Sentry");
    }
}

export function setSentryUser(userId: string, email?: string) {
    Sentry?.setUser({ id: userId, email });
}

export function clearSentryUser() {
    Sentry?.setUser(null);
}

export function captureError(error: Error, context?: Record<string, any>) {
    if (Sentry) {
        Sentry.withScope((scope: any) => {
            if (context) {
                Object.entries(context).forEach(([key, value]) => {
                    scope.setExtra(key, value);
                });
            }
            Sentry.captureException(error);
        });
    } else {
        console.error("[sentry:fallback]", error, context);
    }
}

export function captureMessage(
    message: string,
    level: "info" | "warning" | "error" = "info",
) {
    Sentry?.captureMessage(message, level);
}

export function addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, any>,
) {
    Sentry?.addBreadcrumb({
        message,
        category,
        data,
        level: "info",
    });
}
