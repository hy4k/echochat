import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createMessage, 
  getMessagesBetweenUsers, 
  updateMessageStatus,
  createOfflineMessage,
  getOfflineMessagesForUser,
  markOfflineMessageAsViewed,
  createKeepsake,
  getKeepsakesBetweenUsers,
  deleteKeepsake,
  updateUserPresence,
  getUserPresence,
  getBothUsersPresence,
  updateSharedHorizon,
  getSharedHorizonForUser,
  getBothUsersSharedHorizon,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Chat and messaging procedures
  chat: router({
    getMessages: protectedProcedure
      .input(z.object({ 
        otherUserId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        const messages = await getMessagesBetweenUsers(
          ctx.user.id,
          input.otherUserId,
          input.limit,
          input.offset
        );
        return messages;
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        receiverId: z.number(),
        content: z.string().min(1),
        messageType: z.enum(["text", "voice", "video"]).default("text"),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createMessage({
          senderId: ctx.user.id,
          receiverId: input.receiverId,
          content: input.content,
          messageType: input.messageType,
          status: "sent",
          isOffline: 0,
        });
        return { success: true };
      }),

    updateMessageStatus: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        status: z.enum(["sent", "delivered", "read"]),
      }))
      .mutation(async ({ input }) => {
        await updateMessageStatus(input.messageId, input.status);
        return { success: true };
      }),
  }),

  // Offline messaging procedures
  offlineMessages: router({
    getOfflineMessages: protectedProcedure
      .query(async ({ ctx }) => {
        const messages = await getOfflineMessagesForUser(ctx.user.id);
        return messages;
      }),

    createOfflineMessage: protectedProcedure
      .input(z.object({
        receiverId: z.number(),
        content: z.string().optional(),
        mediaUrl: z.string().optional(),
        messageType: z.enum(["text", "voice", "video"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await createOfflineMessage({
          senderId: ctx.user.id,
          receiverId: input.receiverId,
          content: input.content,
          mediaUrl: input.mediaUrl,
          messageType: input.messageType,
          viewed: 0,
        });
        return { success: true };
      }),

    markAsViewed: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input }) => {
        await markOfflineMessageAsViewed(input.messageId);
        return { success: true };
      }),
  }),

  // Digital Keepsakes procedures
  keepsakes: router({
    getKeepsakes: protectedProcedure
      .input(z.object({ otherUserId: z.number() }))
      .query(async ({ ctx, input }) => {
        const keepsakes = await getKeepsakesBetweenUsers(ctx.user.id, input.otherUserId);
        return keepsakes;
      }),

    createKeepsake: protectedProcedure
      .input(z.object({
        messageId: z.number().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createKeepsake({
          messageId: input.messageId,
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
        });
        return { success: true };
      }),

    deleteKeepsake: protectedProcedure
      .input(z.object({ keepsakeId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteKeepsake(input.keepsakeId);
        return { success: true };
      }),
  }),

  // User presence procedures
  presence: router({
    setOnline: protectedProcedure
      .input(z.object({
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        timezone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserPresence(
          ctx.user.id,
          true,
          input.latitude,
          input.longitude,
          input.timezone
        );
        return { success: true };
      }),

    setOffline: protectedProcedure
      .mutation(async ({ ctx }) => {
        await updateUserPresence(ctx.user.id, false);
        return { success: true };
      }),

    getPresence: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const presence = await getUserPresence(input.userId);
        return presence;
      }),

    getBothPresence: protectedProcedure
      .input(z.object({ otherUserId: z.number() }))
      .query(async ({ ctx, input }) => {
        const presences = await getBothUsersPresence(ctx.user.id, input.otherUserId);
        return presences;
      }),
  }),

  // Shared Horizon procedures
  sharedHorizon: router({
    updateHorizon: protectedProcedure
      .input(z.object({
        weatherCondition: z.string().optional(),
        temperature: z.string().optional(),
        timeOfDay: z.string().optional(),
        backgroundColor: z.string().optional(),
        accentColor: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateSharedHorizon({
          userId: ctx.user.id,
          weatherCondition: input.weatherCondition,
          temperature: input.temperature,
          timeOfDay: input.timeOfDay,
          backgroundColor: input.backgroundColor,
          accentColor: input.accentColor,
        });
        return { success: true };
      }),

    getHorizon: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const horizon = await getSharedHorizonForUser(input.userId);
        return horizon;
      }),

    getBothHorizons: protectedProcedure
      .input(z.object({ otherUserId: z.number() }))
      .query(async ({ ctx, input }) => {
        const horizons = await getBothUsersSharedHorizon(ctx.user.id, input.otherUserId);
        return horizons;
      }),
  }),
});

export type AppRouter = typeof appRouter;
