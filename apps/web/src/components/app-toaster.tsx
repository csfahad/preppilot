import { useEffect, useState } from "react";
import {
    IconCircleCheck,
    IconExclamationCircle,
    IconX,
} from "@tabler/icons-react";
import { Toaster } from "sonner";

type ResolvedTheme = "light" | "dark";

function getResolvedTheme(): ResolvedTheme {
    return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
}

export function AppToaster() {
    const [theme, setTheme] = useState<ResolvedTheme>("light");

    useEffect(() => {
        const syncTheme = () => setTheme(getResolvedTheme());
        const observer = new MutationObserver(syncTheme);

        syncTheme();
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    return (
        <Toaster
            theme={theme}
            position="top-right"
            closeButton
            visibleToasts={3}
            icons={{
                success: <IconCircleCheck className="size-4 text-primary" />,
                error: (
                    <IconExclamationCircle className="size-4 text-destructive" />
                ),
                close: <IconX className="size-3.5" />,
            }}
            toastOptions={{
                classNames: {
                    toast: "!w-[min(22rem,calc(100vw-2rem))] !rounded-lg !border !border-border !bg-popover !px-3 !py-3 !font-sans !text-popover-foreground !shadow-none",
                    content: "!gap-0",
                    title: "!text-sm !font-semibold !text-popover-foreground",
                    description:
                        "!mt-1 !text-xs !leading-5 !text-muted-foreground",
                    icon: "!mr-2.5 !self-start !pt-0.5",
                    closeButton:
                        "!left-auto !right-2 !top-2 !size-6 !rounded-md !border-border !bg-transparent !text-muted-foreground hover:!bg-accent hover:!text-accent-foreground",
                    success: "!border-primary/30",
                    error: "!border-destructive/40",
                },
            }}
        />
    );
}
