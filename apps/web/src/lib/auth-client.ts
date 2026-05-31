import { createAuthClient } from "better-auth/react";
import { API_URL } from "./api-url";

export const authClient = createAuthClient({
    baseURL: API_URL,
    fetchOptions: {
        credentials: "include",
    },
});

export const { useSession, signIn, signOut, signUp } = authClient;
