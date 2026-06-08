import { Link, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "#/components/theme-toggle";
import { signOut } from "#/lib/auth-client";
import { useSubscriptionStore } from "#/stores/subscription";
import {
    IconBook2,
    IconChartBar,
    IconCrown,
    IconLogout,
    IconUser,
    IconUsers,
} from "@tabler/icons-react";

export default function Header() {
    const navigate = useNavigate();
    const { plan } = useSubscriptionStore();

    const handleSignOut = () => {
        signOut({
            fetchOptions: { onSuccess: () => navigate({ to: "/auth/login" }) },
        });
    };

    return (
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link
                    to="/dashboard"
                    className="font-heading text-xl font-bold tracking-tight"
                >
                    Prep<span className="text-primary">Pilot</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link
                        to="/interview-questions"
                        className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
                    >
                        <IconBook2 className="w-4 h-4" /> Questions
                    </Link>
                    <Link
                        to="/team"
                        className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
                    >
                        <IconUsers className="w-4 h-4" /> Team
                    </Link>
                    <Link
                        to="/analytics"
                        className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
                    >
                        <IconChartBar className="w-4 h-4" /> Analytics
                    </Link>
                    {plan === "free" && (
                        <Link
                            to="/pricing"
                            className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                        >
                            <IconCrown className="w-4 h-4" /> Upgrade
                        </Link>
                    )}
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <IconUser className="w-4 h-4 text-primary" />
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Sign out"
                        >
                            <IconLogout className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
