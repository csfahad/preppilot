function trimTrailingSlash(value: string) {
    return value.replace(/\/+$/, "");
}

export const API_URL = trimTrailingSlash(import.meta.env.VITE_API_URL!);

export const WS_URL = API_URL.replace(/^http/, "ws");
