import express from "express";
import { createServer } from "http";
import { webcrypto } from "node:crypto";

// Polyfill crypto for older Node.js versions or environments where it's not global
if (!globalThis.crypto) {
    // @ts-ignore
    globalThis.crypto = webcrypto;
}

import { setupVite, serveStatic } from "./vite";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers/index";
import cors from "cors";
import "dotenv/config";

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

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

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        // Notify others in room
        socket.to(roomId).emit("user-connected", socket.id);
    });

    socket.on("offer", (payload) => {
        socket.to(payload.roomId).emit("offer", payload);
    });

    socket.on("answer", (payload) => {
        socket.to(payload.roomId).emit("answer", payload);
    });

    socket.on("ice-candidate", (payload) => {
        socket.to(payload.roomId).emit("ice-candidate", payload);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
