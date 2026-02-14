import express from "express";
import { createServer } from "http";
import { webcrypto } from "node:crypto";

// Polyfill crypto for older Node.js versions or environments where it's not global
if (!globalThis.crypto) {
    // @ts-ignore
    globalThis.crypto = webcrypto;
}

import { setupVite, serveStatic } from "./vite";
import { bootstrapDb } from "../db";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers/index";
import cors from "cors";
import "dotenv/config";

console.log("[Server] process started, initializing...");

const app = express();
const httpServer = createServer(app);

// Bootstrap Database in production
if (process.env.NODE_ENV === "production") {
    console.log("[Server] Production mode detected, bootstrapping database (non-blocking)...");
    bootstrapDb().catch(err => console.error("[Server] Critical bootstrap error:", err));
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check and diagnostics
app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
app.get("/api", (_req, res) => res.json({ message: "EchoChat API is online", version: "1.0.0" }));
app.get("/api/debug", async (_req, res) => {
    const { getDb, getLastError } = await import("../db");
    const db = await getDb();
    let tables: any[] = [];
    if (db) {
        try {
            // @ts-ignore - access inner client to run raw query
            const result = await db.session.client.unsafe(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);
            tables = result.map((t: any) => t.table_name);
        } catch (e) { }
    }
    res.json({
        env: process.env.NODE_ENV,
        dbConnected: !!db,
        dbError: getLastError(),
        tables,
        timestamp: new Date().toISOString()
    });
});

app.use(
    "/api/trpc",
    createExpressMiddleware({
        router: appRouter,
        createContext: async ({ req }) => {
            try {
                const { sdk } = await import("./sdk");
                const user = await sdk.authenticateRequest(req);
                return { req, user };
            } catch (e) {
                return { req, user: null };
            }
        },
    })
);

if (process.env.NODE_ENV !== "production") {
    await setupVite(app, httpServer);
} else {
    serveStatic(app);
}

const PORT = Number(process.env.PORT || 3003);

import { Server } from "socket.io";

import { setupWebSocketHandlers } from "../websocket-handlers";

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Setup all WebSocket handlers
setupWebSocketHandlers(io);

httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
