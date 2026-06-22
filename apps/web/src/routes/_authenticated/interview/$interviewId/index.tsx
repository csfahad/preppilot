import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { IconLoader2 } from "@tabler/icons-react";

export const Route = createFileRoute("/_authenticated/interview/$interviewId/")(
    {
        component: InterviewRedirect,
    },
);

function InterviewRedirect() {
    const { interviewId } = Route.useParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function redirect() {
            try {
                const res = await api.getInterview(interviewId);
                const interview = res.data;
                const status = interview?.status;

                switch (status) {
                    case "configuring":
                    case "active":
                        navigate({
                            to: "/interview/$interviewId/live",
                            params: { interviewId },
                            replace: true,
                        });
                        break;
                    case "processing":
                        navigate({
                            to: "/interview/$interviewId/processing",
                            params: { interviewId },
                            replace: true,
                        });
                        break;
                    case "completed":
                        navigate({
                            to: "/interview/$interviewId/report",
                            params: { interviewId },
                            replace: true,
                        });
                        break;
                    case "cancelled":
                    default:
                        navigate({ to: "/dashboard", replace: true });
                        break;
                }
            } catch (err) {
                console.error("Failed to load interview:", err);
                setError("Interview not found");
            }
        }

        redirect();
    }, [interviewId, navigate]);

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive font-medium mb-2">{error}</p>
                    <button
                        onClick={() => navigate({ to: "/dashboard" })}
                        className="text-sm text-primary hover:underline cursor-pointer"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <IconLoader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
        </div>
    );
}
