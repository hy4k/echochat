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
        guestLogin: publicProcedure
            .input(z.object({ userId: z.number().min(1).max(2).default(1) }))
            .mutation(async ({ input }) => {
                const openId = `guest-${input.userId}`;
                const name = input.userId === 1 ? "The One" : "The Other"; // Feature naming

                const { sdk } = await import("../_core/sdk");
                const token = await sdk.createSessionToken(openId, { name });

                await db.upsertUser({
                    openId,
                    name,
                    email: `${openId}@echochat.space`,
                    lastSignedIn: new Date(),
                });

                return { token, user: { id: input.userId, name, openId } };
            }),
        logout: publicProcedure.mutation(async ({ ctx }) => {
            return { success: true };
        }),
    }),
    chat: router({
        getMessages: protectedProcedure
            .query(async ({ ctx }) => {
                // For simplicity in this demo/MVP, we just get all messages for the current user
                return await db.getMessagesForUser(ctx.user.id);
            }),
        sendMessage: protectedProcedure
            .input(z.object({ receiverId: z.number(), content: z.string() }))
            .mutation(async ({ input, ctx }) => {
                return await db.createMessage({
                    senderId: ctx.user.id,
                    receiverId: input.receiverId,
                    content: input.content,
                    messageType: "text",
                });
            }),
    }),
});

export type AppRouter = typeof appRouter;
