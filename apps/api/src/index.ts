import express from "express";
import { createServer } from "http";
import "dotenv/config";
import cors from "cors";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";

import profilesRouter from "./routes/profiles.js";
import interviewsRouter from "./routes/interviews.js";
import answersRouter from "./routes/answers.js";
import paymentsRouter from "./routes/payments.js";
import uploadRouter from "./routes/upload.js";
import teamsRouter from "./routes/teams.js";

import { auth } from "./lib/auth.js";

import { startReportWorker } from "./jobs/generate-report.js";
import { startResumeWorker } from "./jobs/parse-resume.js";
import { startEmailWorker } from "./jobs/send-email.js";

import { setupVoiceWebSocket } from "./voice/ws-server.js";

const app = express();
const PORT = parseInt(process.env.PORT!);

// middlewares
app.use(
    cors({
        origin: process.env.WEB_URL!,
        credentials: true,
    }),
);
app.use(helmet());

// betterAuth handler
app.all("/api/auth/{*splat}", toNodeHandler(auth));

// parse JSON for all routes except webhooks and auth (which handle their own body)
app.use((req, res, next) => {
    if (req.path.startsWith("/api/auth")) {
        return next();
    }
    if (req.path === "/api/payments/webhook") {
        express.json({
            verify: (req: any, _res, buf) => {
                req.rawBody = buf;
            },
        })(req, res, next);
    } else {
        express.json({ limit: "10mb" })(req, res, next);
    }
});

app.get("/api/health", (_req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
    });
});

// api routes
app.use("/api/profiles", profilesRouter);
app.use("/api/interviews", interviewsRouter);
app.use("/api/answers", answersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/teams", teamsRouter);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Endpoint not found" },
    });
});

// global error handler
app.use(
    (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
    ) => {
        console.error("[Server] Unhandled error:", err);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "An unexpected error occurred",
            },
        });
    },
);

// start server
const server = createServer(app);

setupVoiceWebSocket(server);

// start background workers
let workers: Array<{ close: () => Promise<void> }> = [];
try {
    workers = [startReportWorker(), startResumeWorker(), startEmailWorker()];
    console.log("[Workers] Background job workers started");
} catch (err) {
    console.warn(
        "[Workers] Failed to start workers (Redis may be unavailable):",
        err,
    );
}

server.listen(PORT, () => {
    console.log(`\nPrepPilot API running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Frontend: ${process.env.WEB_URL}\n`);
});

async function shutdown() {
    console.log("\n[Server] Shutting down gracefully...");

    server.close();

    for (const worker of workers) {
        await worker.close();
    }

    console.log("[Server] Shutdown complete");
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
