import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
    component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isPending && !session) {
            navigate({ to: "/auth/login" });
        }
    }, [session, isPending, navigate]);

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

    return <Outlet />;
}
