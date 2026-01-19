import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import * as db from "../db";

export const appRouter = router({
    auth: router({
        me: publicProcedure.query(async ({ ctx }) => {
            try {
                const { sdk } = await import("../_core/sdk");
                const user = await sdk.authenticateRequest(ctx.req);
                return user;
            } catch (e) {
                return null;
            }
        }),
        login: publicProcedure
            .input(z.object({ username: z.string() }))
            .mutation(async ({ input }) => {
                const username = input.username.toLowerCase().trim();

                if (!username || username.length === 0) {
                    throw new Error("Username cannot be empty.");
                }

                const name = input.username.trim();
                const openId = username;

                const { sdk } = await import("../_core/sdk");
                const token = await sdk.createSessionToken(openId, { name });

                const user = await db.upsertUser({
                    openId,
                    name,
                    email: `${openId}@echochat.space`,
                    lastSignedIn: new Date(),
                });

                return { token, user: { id: user.id, name: user.name, openId: user.openId } };
            }),
        logout: publicProcedure.mutation(async ({ ctx }) => {
            return { success: true };
        }),
    }),
    chat: router({
        getMessages: protectedProcedure
            .query(async ({ ctx }) => {
                const partner = await db.getPartner(ctx.user.id);
                if (!partner) return [];
                return await db.getMessagesForUser(ctx.user.id);
            }),
        getOtherUser: protectedProcedure
            .query(async ({ ctx }) => {
                return await db.getPartner(ctx.user.id) || null;
            }),
        sendMessage: protectedProcedure
            .input(z.object({
                receiverId: z.number().optional(),
                content: z.string().optional(),
                mediaUrl: z.string().optional(),
                messageType: z.enum(["text", "image", "file", "voice", "video"]).optional()
            }))
            .mutation(async ({ input, ctx }) => {
                const partner = await db.getPartner(ctx.user.id);
                if (!partner) throw new Error("No partner connected.");

                return await db.createMessage({
                    senderId: ctx.user.id,
                    receiverId: partner.id,
                    content: input.content || "",
                    mediaUrl: input.mediaUrl,
                    messageType: input.messageType || "text",
                });
            }),
    }),
    bottle: router({
        sendBottle: protectedProcedure
            .input(z.object({ content: z.string() }))
            .mutation(async ({ input, ctx }) => {
                const partner = await db.getPartner(ctx.user.id);
                if (!partner) throw new Error("No partner connected.");

                return await db.createOfflineMessage({
                    senderId: ctx.user.id,
                    receiverId: partner.id,
                    content: input.content,
                    messageType: "text",
                    viewed: 0
                });
            }),
        getBottles: protectedProcedure
            .query(async ({ ctx }) => {
                const messages = await db.getOfflineMessages(ctx.user.id);
                return messages;
            }),
        openBottle: protectedProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }) => {
                await db.markOfflineMessageAsViewed(input.id);
                return { success: true };
            }),
    }),
    whiteboard: router({
        createWhiteboard: protectedProcedure
            .input(z.object({
                otherUserId: z.number(),
                title: z.string().optional(),
            }))
            .mutation(async ({ ctx, input }) => {
                return { success: true, whiteboardId: 1 };
            }),
        getWhiteboard: protectedProcedure
            .input(z.object({
                whiteboardId: z.number(),
            }))
            .query(async ({ input }) => {
                return { id: input.whiteboardId, content: null, thumbnail: null };
            }),
        saveStroke: protectedProcedure
            .input(z.object({
                whiteboardId: z.number(),
                strokeData: z.string(),
                color: z.string().optional(),
                brushSize: z.number().optional(),
                opacity: z.number().optional(),
            }))
            .mutation(async ({ ctx, input }) => {
                return { success: true };
            }),
        saveWhiteboard: protectedProcedure
            .input(z.object({
                whiteboardId: z.number(),
                content: z.string(),
                thumbnail: z.string().optional(),
            }))
            .mutation(async ({ input }) => {
                return { success: true };
            }),
        getWhiteboardHistory: protectedProcedure
            .input(z.object({
                otherUserId: z.number(),
                limit: z.number().default(10),
            }))
            .query(async ({ ctx, input }) => {
                return [];
            }),
    }),
});

export type AppRouter = typeof appRouter;
