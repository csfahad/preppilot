import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { api } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { AppLoader } from "@/components/app-loader";

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
                navigate({
                    to: "/auth/login",
                    replace: true,
                    search: { error: undefined },
                });
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

    return <AppLoader label="Checking your account" />;
}
