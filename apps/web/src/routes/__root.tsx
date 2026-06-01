import {
    HeadContent,
    Outlet,
    Scripts,
    createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";
import { initErrorMonitoring } from "@/lib/error-monitoring";
import { initTheme } from "@/components/theme-toggle";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                charSet: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            {
                title: "PrepPilot - AI Mock Interview Coach",
            },
            {
                name: "description",
                content:
                    "Practice interviews with AI. Get instant feedback, scoring, and model answers tailored to your role.",
            },
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss,
            },
        ],
        scripts: [
            {
                src: "https://checkout.razorpay.com/v1/checkout.js",
                async: true,
            },
        ],
    }),
    component: RootComponent,
    shellComponent: RootDocument,
});

function RootComponent() {
    useEffect(() => {
        initTheme();
        initAnalytics();
        initErrorMonitoring();
    }, []);

    return <Outlet />;
}

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                <TanStackDevtools
                    config={{
                        position: "bottom-right",
                    }}
                    plugins={[
                        {
                            name: "Tanstack Router",
                            render: <TanStackRouterDevtoolsPanel />,
                        },
                    ]}
                />
                <Scripts />
            </body>
        </html>
    );
}
