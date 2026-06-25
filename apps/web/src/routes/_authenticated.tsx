import {
    createFileRoute,
    Outlet,
    useNavigate,
    Link,
    useMatchRoute,
} from "@tanstack/react-router";
import { signOut, useSession } from "@/lib/auth-client";
import { useEffect, useState, useCallback } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSubscriptionStore } from "@/stores/subscription";
import {
    IconLayoutDashboard,
    IconPlus,
    IconBook2,
    IconChartBar,
    IconUsers,
    IconCrown,
    IconLogout,
    IconUser,
    IconMenu2,
    IconX,
    IconChevronRight,
    IconSettings,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";

export const Route = createFileRoute("/_authenticated")({
    component: AuthenticatedLayout,
});

const NAV_ITEMS = [
    { to: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
    { to: "/interview/new", label: "New Interview", icon: IconPlus },
    { to: "/questions", label: "Questions", icon: IconBook2 },
    { to: "/analytics", label: "Analytics", icon: IconChartBar },
    { to: "/team", label: "Team", icon: IconUsers },
] as const;

function AuthenticatedLayout() {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();
    const matchRoute = useMatchRoute();
    const { plan, fetchPlan } = useSubscriptionStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isPending && !session) {
            navigate({ to: "/auth/login", search: { error: undefined } });
        }
    }, [session, isPending, navigate]);

    useEffect(() => {
        if (session?.user) {
            fetchPlan();
        }
    }, [session, fetchPlan]);

    const handleSignOut = useCallback(() => {
        signOut({
            fetchOptions: {
                onSuccess: () =>
                    navigate({
                        to: "/auth/login",
                        search: { error: undefined },
                    }),
            },
        });
    }, [navigate]);

    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

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

    const planLabel =
        plan === "mini_pack"
            ? "Mini"
            : plan === "standard_pack"
              ? "Standard"
              : plan === "premium_pack"
                ? "Premium"
                : plan === "enterprise"
                  ? "Enterprise"
                  : "Free";

    const isPro = plan !== "free";

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                        onClick={closeSidebar}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-out lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Logo */}
                <div className="h-16 px-5 flex items-center justify-between border-b border-sidebar-border">
                    <Link
                        to="/dashboard"
                        onClick={closeSidebar}
                        className="font-heading text-xl font-bold tracking-tight text-sidebar-foreground"
                    >
                        Prep<span className="text-primary">Pilot</span>
                    </Link>
                    <button
                        onClick={closeSidebar}
                        className="lg:hidden p-1 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
                    >
                        <IconX className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = matchRoute({
                            to: item.to,
                            fuzzy: true,
                        });
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={closeSidebar}
                                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                                }`}
                            >
                                <item.icon
                                    className={`w-[18px] h-[18px] shrink-0 ${
                                        isActive
                                            ? "text-primary"
                                            : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                                    }`}
                                />
                                {item.label}
                                {item.to === "/interview/new" && (
                                    <span className="ml-auto w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
                                        <IconChevronRight className="w-3 h-3 text-primary" />
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Upgrade CTA for free users */}
                {!isPro && (
                    <div className="px-3 pb-2">
                        <Link
                            to="/pricing"
                            onClick={closeSidebar}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                <IconCrown className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground">
                                    Upgrade to Pro
                                </p>
                                <p className="text-[10px] text-muted-foreground leading-tight">
                                    Unlock voice, full feedback & more
                                </p>
                            </div>
                        </Link>
                    </div>
                )}

                {/* User section */}
                <div className="px-3 py-3 border-t border-sidebar-border">
                    <div className="flex items-center gap-3 px-2 mb-3">
                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0 ring-2 ring-primary/10">
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || ""}
                                    className="w-9 h-9 rounded-full object-cover"
                                />
                            ) : (
                                <IconUser className="w-4 h-4 text-primary" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                                {session.user.name || "User"}
                            </p>
                            <div className="flex items-center gap-1.5">
                                <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                        isPro
                                            ? "bg-primary/15 text-primary"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    {planLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 px-1">
                        <Link
                            to="/account"
                            onClick={closeSidebar}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors flex-1 text-xs font-medium cursor-pointer"
                        >
                            <IconSettings className="w-3.5 h-3.5" />
                            Settings
                        </Link>
                        <ThemeToggle />
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sidebar-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors text-xs font-medium cursor-pointer"
                            title="Sign out"
                        >
                            <IconLogout className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Mobile header */}
                <header className="lg:hidden sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-xl flex items-center px-4 gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-1.5 rounded-lg text-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                        <IconMenu2 className="w-5 h-5" />
                    </button>
                    <Link
                        to="/dashboard"
                        className="font-heading text-lg font-bold tracking-tight"
                    >
                        Prep<span className="text-primary">Pilot</span>
                    </Link>
                </header>

                {/* Page content */}
                <Outlet />
            </div>
        </div>
    );
}
