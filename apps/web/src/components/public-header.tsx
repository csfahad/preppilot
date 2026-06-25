import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PublicHeader() {
    return (
        <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="max-w-full mx-auto px-4 h-16 flex items-center justify-between">
                <Link
                    to="/"
                    className="font-heading text-xl font-bold tracking-tight"
                >
                    Prep<span className="text-primary">Pilot</span>
                </Link>
                <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
                    <a
                        href="/#features"
                        className="hover:text-foreground transition-colors"
                    >
                        Features
                    </a>
                    <a
                        href="/#how-it-works"
                        className="hover:text-foreground transition-colors"
                    >
                        How It Works
                    </a>
                    <Link
                        to="/interview-questions"
                        className="hover:text-foreground transition-colors"
                    >
                        Questions
                    </Link>
                    <Link
                        to="/pricing"
                        className="hover:text-foreground transition-colors"
                    >
                        Pricing
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Link
                        to="/auth/login"
                        search={{ error: undefined }}
                        className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
}
