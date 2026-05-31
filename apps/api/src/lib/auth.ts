import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { webOrigins } from "./origins.js";

const apiUrl = process.env.API_URL!;
const useCrossSiteCookies =
    process.env.AUTH_CROSS_SITE_COOKIES === "true" ||
    (process.env.AUTH_CROSS_SITE_COOKIES !== "false" &&
        (process.env.NODE_ENV === "production" ||
            apiUrl.startsWith("https://")));

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: apiUrl,
    basePath: "/api/auth",
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5,
        },
    },
    trustedOrigins: webOrigins,
    advanced: {
        database: {
            generateId: () => crypto.randomUUID(),
        },
        crossSubDomainCookies: {
            enabled: false,
        },
        defaultCookieAttributes: {
            sameSite: useCrossSiteCookies ? "none" : "lax",
            secure: useCrossSiteCookies,
            path: "/",
        },
    },
});
