import type { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "../lib/redis.js";

const RATE_LIMIT_TIMEOUT_MS = 750;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeout: ReturnType<typeof setTimeout>;

    return Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
            timeout = setTimeout(() => {
                reject(new Error("Rate limit check timed out"));
            }, timeoutMs);
        }),
    ]).finally(() => clearTimeout(timeout!));
}

export function rateLimit(maxRequests: number, windowSeconds: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const identifier = req.user?.id || req.ip;
        const key = `rate_limit:${req.path}:${identifier}`;

        try {
            const result = await withTimeout(
                checkRateLimit(key, maxRequests, windowSeconds),
                RATE_LIMIT_TIMEOUT_MS,
            );

            res.set("X-RateLimit-Limit", String(maxRequests));
            res.set("X-RateLimit-Remaining", String(result.remaining));
            res.set("X-RateLimit-Reset", String(result.resetIn));

            if (!result.allowed) {
                res.status(429).json({
                    success: false,
                    error: {
                        code: "RATE_LIMITED",
                        message: `Too many requests. Try again in ${result.resetIn} seconds.`,
                    },
                });
                return;
            }

            next();
        } catch (error) {
            console.warn(
                "[RateLimit] Redis unavailable, skipping rate limit check:",
                error instanceof Error ? error.message : error,
            );
            next();
        }
    };
}
