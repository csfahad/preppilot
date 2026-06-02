import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { IconCheck, IconX, IconUsers } from "@tabler/icons-react";

export const Route = createFileRoute("/_authenticated/team/join")({
    component: JoinTeamPage,
});

function JoinTeamPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<
        "loading" | "success" | "error" | "expired"
    >("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
            setStatus("error");
            setErrorMessage("No invitation token provided");
            return;
        }

        api.joinTeam(token)
            .then(() => {
                setStatus("success");
                setTimeout(() => navigate({ to: "/team" }), 2000);
            })
            .catch((err) => {
                if (err.message.includes("expired")) {
                    setStatus("expired");
                } else {
                    setStatus("error");
                    setErrorMessage(err.message);
                }
            });
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center"
            >
                {status === "loading" && (
                    <>
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                        <h2 className="font-heading text-xl font-semibold text-foreground">
                            Joining team...
                        </h2>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                            <IconCheck className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                            Welcome to the team!
                        </h2>
                        <p className="text-muted-foreground">
                            Redirecting to team dashboard...
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <IconX className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                            Unable to join
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            {errorMessage}
                        </p>
                        <button
                            onClick={() => navigate({ to: "/dashboard" })}
                            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all cursor-pointer"
                        >
                            Go to Dashboard
                        </button>
                    </>
                )}

                {status === "expired" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                            <IconUsers className="w-8 h-8 text-yellow-500" />
                        </div>
                        <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                            Invitation expired
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            Ask the team admin to send a new invitation.
                        </p>
                        <button
                            onClick={() => navigate({ to: "/dashboard" })}
                            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all cursor-pointer"
                        >
                            Go to Dashboard
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
