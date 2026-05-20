import type { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth.js";

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AuthSessionUser = {
    id: string;
    email: string;
    name?: string | null;
};

async function findOrCreateAppUser(sessionUser: AuthSessionUser) {
    const idIsUuid = UUID_RE.test(sessionUser.id);

    if (idIsUuid) {
        const [appUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, sessionUser.id))
            .limit(1);

        if (appUser) return appUser;
    }

    const [userByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, sessionUser.email))
        .limit(1);

    if (userByEmail) return userByEmail;

    const values = {
        ...(idIsUuid ? { id: sessionUser.id } : {}),
        email: sessionUser.email,
        name: sessionUser.name || sessionUser.email,
        plan: "free" as const,
        interviewCount: 0,
    };

    try {
        const [newUser] = await db.insert(users).values(values).returning();
        return newUser;
    } catch (error) {
        const [createdConcurrently] = await db
            .select()
            .from(users)
            .where(eq(users.email, sessionUser.email))
            .limit(1);

        if (createdConcurrently) return createdConcurrently;
        throw error;
    }
}

function attachRequestUser(
    req: Request,
    appUser: NonNullable<Awaited<ReturnType<typeof findOrCreateAppUser>>>,
) {
    req.user = {
        id: appUser.id,
        email: appUser.email,
        name: appUser.name,
        plan: appUser.plan,
        interviewCount: appUser.interviewCount,
    };
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name: string;
                plan: string;
                interviewCount: number;
            };
        }
    }
}

/*
 * Auth middleware that verifies the BetterAuth session.
 * Uses the local BetterAuth instance directly (no HTTP call needed).
 */
export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const cookieHeader = req.headers.cookie;
        const authHeader = req.headers.authorization;

        if (!cookieHeader && !authHeader) {
            res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "No authentication token provided",
                },
            });
            return;
        }

        // Build a web Request to pass to BetterAuth's session validator
        const headers = new Headers();
        if (cookieHeader) headers.set("cookie", cookieHeader);
        if (authHeader) headers.set("authorization", authHeader);

        const session = await auth.api.getSession({
            headers,
        });

        if (!session?.user?.id) {
            res.status(401).json({
                success: false,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Invalid or expired session",
                },
            });
            return;
        }

        const appUser = await findOrCreateAppUser(session.user);
        if (!appUser) {
            res.status(500).json({
                success: false,
                error: {
                    code: "AUTH_ERROR",
                    message: "Failed to initialize user",
                },
            });
            return;
        }

        attachRequestUser(req, appUser);

        next();
    } catch (error) {
        console.error("[Auth] Session verification failed:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "AUTH_ERROR",
                message: "Authentication service unavailable",
            },
        });
    }
}

// Optional auth - attaches user if present, continues without if not
export async function optionalAuth(
    req: Request,
    _res: Response,
    next: NextFunction,
) {
    try {
        const cookieHeader = req.headers.cookie;
        const authHeader = req.headers.authorization;

        if (!cookieHeader && !authHeader) {
            return next();
        }

        const headers = new Headers();
        if (cookieHeader) headers.set("cookie", cookieHeader);
        if (authHeader) headers.set("authorization", authHeader);

        const session = await auth.api.getSession({
            headers,
        });

        if (session?.user?.id) {
            const appUser = await findOrCreateAppUser(session.user);
            if (appUser) attachRequestUser(req, appUser);
        }
    } catch {
        // silently continue without auth
    }

    next();
}
