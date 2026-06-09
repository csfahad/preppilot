import { useState, useEffect, useCallback } from "react";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";

type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function applyTheme(theme: Theme) {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    const root = document.documentElement;

    if (resolved === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
}

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === "undefined") return "light";
        return (localStorage.getItem("preppilot-theme") as Theme) || "light";
    });

    const isDark =
        theme === "dark" || (theme === "system" && getSystemTheme() === "dark");

    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem("preppilot-theme", theme);
    }, [theme]);

    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => applyTheme("system");
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const toggle = useCallback(() => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }, []);

    return (
        <button
            onClick={toggle}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                    <motion.div
                        key="moon"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <IconMoon className="w-4 h-4 text-foreground" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <IconSun className="w-4 h-4 text-foreground" />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}

export function initTheme() {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.classList.add("no-transition");
    const saved = localStorage.getItem("preppilot-theme") as Theme | null;
    applyTheme(saved || "light");
    // force reflow then remove no-transition
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            root.classList.remove("no-transition");
        });
    });
}
