import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL!;

export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

// create a new ioredis connection for BullMQ queues and workers
export function createRedisConnection() {
    return new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
    });
}

redis.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
});

redis.on("connect", () => {
    console.log("[Redis] Connected successfully");
});

export async function checkRateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const current = await redis.incr(key);

    if (current === 1) {
        await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);

    return {
        allowed: current <= maxRequests,
        remaining: Math.max(0, maxRequests - current),
        resetIn: ttl > 0 ? ttl : windowSeconds,
    };
}

export async function getCached<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
}

export async function setCache(
    key: string,
    value: unknown,
    ttlSeconds: number,
): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
}
