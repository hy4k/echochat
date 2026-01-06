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
                const username = input.username.toLowerCase();
                const allowedUsers = ["mithun", "yashika"];

                if (!allowedUsers.includes(username)) {
                    throw new Error("Access denied. Invitation only.");
                }

                const name = username.charAt(0).toUpperCase() + username.slice(1);
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
                return await db.getMessagesForUser(ctx.user.id);
            }),
        getOtherUser: protectedProcedure
            .query(async ({ ctx }) => {
                // In this two-person sanctuary, the "other user" is whoever is not me.
                // For guests, it's just swapping 1 and 2, but let's be more dynamic.
                const allUsers = await db.getAllUsers();
                return allUsers.find(u => u.id !== ctx.user.id) || null;
            }),
        sendMessage: protectedProcedure
            .input(z.object({
                receiverId: z.number().optional(),
                content: z.string().optional(),
                mediaUrl: z.string().optional(),
                messageType: z.enum(["text", "image", "file", "voice", "video"]).optional()
            }))
            .mutation(async ({ input, ctx }) => {
                let receiverId = input.receiverId;

                if (!receiverId) {
                    const allUsers = await db.getAllUsers();
                    const other = allUsers.find(u => u.id !== ctx.user.id);
                    if (!other) throw new Error("No partner found in sanctuary.");
                    receiverId = other.id;
                }

                return await db.createMessage({
                    senderId: ctx.user.id,
                    receiverId: receiverId,
                    content: input.content || "",  // Content can be empty for images
                    mediaUrl: input.mediaUrl,
                    messageType: input.messageType || "text",
                });
            }),
    }),
    bottle: router({
        sendBottle: protectedProcedure
            .input(z.object({ content: z.string() }))
            .mutation(async ({ input, ctx }) => {
                const allUsers = await db.getAllUsers();
                const other = allUsers.find(u => u.id !== ctx.user.id);
                if (!other) throw new Error("No partner found.");

                return await db.createOfflineMessage({
                    senderId: ctx.user.id,
                    receiverId: other.id,
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
});

export type AppRouter = typeof appRouter;
