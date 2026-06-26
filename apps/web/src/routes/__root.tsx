import {
    HeadContent,
    Outlet,
    Scripts,
    createRootRoute,
    Link,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";
import { initErrorMonitoring } from "@/lib/error-monitoring";
import { initTheme } from "@/components/theme-toggle";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import {
    IconArrowRight,
    IconCompass,
    IconDashboard,
    IconSearch,
} from "@tabler/icons-react";

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
    notFoundComponent: NotFoundPage,
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

function NotFoundPage() {
    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />
            <main className="relative overflow-hidden border-b border-border">
                <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] bg-size-[44px_44px]" />
                <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
                    <div>
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                            <IconCompass className="h-4 w-4" />
                            404 · Route not found
                        </div>
                        <h1 className="font-heading text-5xl font-bold tracking-tight text-foreground lg:text-6xl">
                            This page left the interview room.
                        </h1>
                        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                            The link may be outdated, mistyped, or moved. Head
                            back to the product, browse pricing, or open your
                            dashboard if you are already signed in.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                to="/"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                            >
                                Go home
                                <IconArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                to="/pricing"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium text-foreground hover:bg-accent"
                            >
                                View packs
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5 shadow-xl shadow-black/5">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <IconSearch className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-heading text-sm font-semibold text-foreground">
                                        Suggested routes
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Useful places to recover from here
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                PrepPilot
                            </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {[
                                {
                                    label: "Question library",
                                    to: "/interview-questions",
                                },
                                { label: "Pricing", to: "/pricing" },
                                { label: "Sign in", to: "/auth/login" },
                                { label: "Dashboard", to: "/dashboard" },
                            ].map((item) => (
                                <Link
                                    key={item.label}
                                    to={item.to}
                                    className="rounded-lg border border-border bg-background p-4 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5"
                                >
                                    <span className="flex items-center justify-between gap-3">
                                        {item.label}
                                        {item.to === "/dashboard" ? (
                                            <IconDashboard className="h-4 w-4 text-primary" />
                                        ) : (
                                            <IconArrowRight className="h-4 w-4 text-primary" />
                                        )}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <PublicFooter />
        </div>
    );
}
