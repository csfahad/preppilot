import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function AppLoader({
    label = "Loading PrepPilot",
    className,
}: {
    label?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex min-h-screen items-center justify-center bg-background p-6",
                className,
            )}
        >
            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="relative flex w-full max-w-sm flex-col items-center text-center"
            >
                <div className="absolute -inset-10 rounded-full bg-primary/5 blur-3xl" />
                <div className="relative mb-5 grid h-20 w-20 place-items-center rounded-2xl border border-primary/20 bg-card shadow-lg shadow-primary/10">
                    <motion.div
                        aria-hidden="true"
                        className="absolute inset-2 rounded-xl border border-primary/20"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 2.8,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                    />
                    <img
                        src="/preppilot-logo.png"
                        alt=""
                        className="relative h-9 w-10.5 rounded-md object-cover"
                    />
                </div>
                <p className="relative font-heading text-lg font-semibold text-foreground">
                    Prep<span className="text-primary">Pilot</span>
                </p>
                <p className="relative mt-1 text-sm text-muted-foreground">
                    {label}
                </p>
                <div className="relative mt-5 h-1 w-40 overflow-hidden rounded-full bg-muted">
                    <motion.div
                        className="h-full w-16 rounded-full bg-primary"
                        animate={{ x: [-64, 160] }}
                        transition={{
                            duration: 1.1,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
}
