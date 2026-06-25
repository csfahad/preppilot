import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/landing")({
    beforeLoad: () => {
        throw redirect({ to: "/" });
    },
});
