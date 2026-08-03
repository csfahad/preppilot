import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    IconArrowRight,
    IconBrandGithub,
    IconBrandLinkedin,
    IconBrandX,
    IconMail,
} from "@tabler/icons-react";

const FOOTER_GROUPS = [
    {
        title: "Product",
        links: [
            { label: "Features", href: "/#features" },
            { label: "How it works", href: "/#how-it-works" },
            { label: "Question library", to: "/interview-questions" },
            { label: "Pricing", to: "/pricing" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "Contact", href: "mailto:support@preppilot.csfahad.in" },
            { label: "Privacy Policy", to: "/privacy" },
            { label: "Terms of Service", to: "/terms" },
        ],
    },
] as const;

const SOCIAL_LINKS = [
    {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/csfahad",
        icon: IconBrandLinkedin,
    },
    { label: "X", href: "https://x.com/csfahad_x", icon: IconBrandX },
    {
        label: "GitHub",
        href: "https://github.com/csfahad",
        icon: IconBrandGithub,
    },
] as const;

export default function PublicFooter() {
    return (
        <footer className="border-t border-border bg-card">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
                    <div>
                        <Link
                            to="/"
                            className="font-heading text-2xl font-bold tracking-tight"
                        >
                            Prep<span className="text-primary">Pilot</span>
                        </Link>
                        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                            Camera-on AI interview practice with adaptive
                            follow-ups, saved recordings, transcript evidence,
                            and role-specific feedback.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                to="/auth/login"
                                search={{ error: undefined }}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                            >
                                Start practicing
                                <IconArrowRight className="h-4 w-4" />
                            </Link>
                            <a
                                href="mailto:support@preppilot.csfahad.in"
                                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                            >
                                <IconMail className="h-4 w-4" />
                                Contact
                            </a>
                        </div>
                    </div>

                    {FOOTER_GROUPS.map((group) => (
                        <nav key={group.title} aria-label={group.title}>
                            <h2 className="font-heading text-sm font-semibold text-foreground">
                                {group.title}
                            </h2>
                            <ul className="mt-4 space-y-3">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        {"to" in link ? (
                                            <Link
                                                to={link.to}
                                                className="text-sm text-muted-foreground hover:text-foreground"
                                            >
                                                {link.label}
                                            </Link>
                                        ) : (
                                            <a
                                                href={link.href}
                                                className="text-sm text-muted-foreground hover:text-foreground"
                                            >
                                                {link.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>

                <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} PrepPilot. All rights
                        reserved.
                    </p>
                    <div className="flex items-center gap-2">
                        {SOCIAL_LINKS.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={item.label}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                            >
                                <item.icon className="h-3.5 w-3.5" />
                            </a>
                        ))}
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </footer>
    );
}
