const DEFAULT_WEB_ORIGIN = process.env.WEB_ORIGINS!;

function normalizeOrigin(origin: string) {
    const trimmed = origin.trim();
    if (!trimmed) return null;

    try {
        return new URL(trimmed).origin;
    } catch {
        return trimmed.replace(/\/+$/, "");
    }
}

function parseOrigins(value: string | undefined) {
    return (value ?? "")
        .split(",")
        .map(normalizeOrigin)
        .filter((origin): origin is string => Boolean(origin));
}

export const webOrigins = [
    ...new Set([
        ...parseOrigins(process.env.WEB_ORIGINS),
        ...parseOrigins(process.env.WEB_URL),
    ]),
];

if (webOrigins.length === 0) {
    webOrigins.push(DEFAULT_WEB_ORIGIN);
}

export function isAllowedWebOrigin(origin: string | undefined) {
    if (!origin) return true;
    return webOrigins.includes(normalizeOrigin(origin) ?? origin);
}
