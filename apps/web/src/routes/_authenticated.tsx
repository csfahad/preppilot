import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";
import Header from "@/components/header";
import { useSubscriptionStore } from "@/stores/subscription";

export const Route = createFileRoute("/_authenticated")({
    component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();
    const fetchPlan = useSubscriptionStore((s) => s.fetchPlan);

    useEffect(() => {
        if (!isPending && !session) {
            navigate({ to: "/auth/login" });
        }
    }, [session, isPending, navigate]);

    useEffect(() => {
        if (session?.user) {
            fetchPlan();
        }
    }, [session, fetchPlan]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <Outlet />
        </div>
    );
}
