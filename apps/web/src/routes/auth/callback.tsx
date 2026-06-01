import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/callback")({
    component: AuthCallbackPage,
});

function AuthCallbackPage() {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        async function routeAfterSignIn() {
            if (isPending) return;

            if (!session) {
                navigate({ to: "/auth/login", replace: true });
                return;
            }

            try {
                const res = await api.getProfile();
                if (cancelled) return;

                navigate({
                    to: res.data ? "/dashboard" : "/onboarding",
                    replace: true,
                });
            } catch (err) {
                console.error("Auth callback profile check error:", err);
                if (!cancelled) navigate({ to: "/onboarding", replace: true });
            }
        }

        routeAfterSignIn();

        return () => {
            cancelled = true;
        };
    }, [session, isPending, navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-sm"
            >
                <div className="mx-auto mb-5 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
                <h1 className="font-heading text-xl font-semibold text-foreground">
                    Signing you in
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Checking your account and taking you to the right place.
                </p>
            </motion.div>
        </div>
    );
}
