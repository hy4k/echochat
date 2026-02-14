import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc } from "drizzle-orm";
import {
  partnerships,
  partnershipFeedback,
  users,
  type Partnership,
  type PartnershipFeedback,
  type InsertPartnership,
  type InsertPartnershipFeedback,
} from "../../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: any = null;

async function getLearningDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (url && !url.includes("[YOUR-PASSWORD]")) {
      try {
        _client = postgres(url, { ssl: 'require', connect_timeout: 10, max: 1 });
        _db = drizzle(_client);
      } catch {
        _client = postgres(url, { connect_timeout: 10, max: 1 });
        _db = drizzle(_client);
      }
    }
  }
  return _db;
}

export const partnershipsRouter = router({
  // Get user's established partnerships
  getPartnerships: protectedProcedure
    .input(z.object({
      status: z.enum(["active", "paused", "completed", "cancelled"]).optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) return [];

      let query = db
        .select()
        .from(partnerships)
        .where(or(
          eq(partnerships.user1Id, ctx.user.id),
          eq(partnerships.user2Id, ctx.user.id)
        ))
        .orderBy(desc(partnerships.startDate))
        .limit(input.limit);

      if (input.status) {
        query = db
          .select()
          .from(partnerships)
          .where(and(
            or(
              eq(partnerships.user1Id, ctx.user.id),
              eq(partnerships.user2Id, ctx.user.id)
            ),
            eq(partnerships.status, input.status)
          ))
          .orderBy(desc(partnerships.startDate))
          .limit(input.limit);
      }

      return query;
    }),

  // Get partnership details by ID
  getPartnershipById: protectedProcedure
    .input(z.object({ partnershipId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) return null;

      const partnership = await db
        .select()
        .from(partnerships)
        .where(and(
          eq(partnerships.id, input.partnershipId),
          or(
            eq(partnerships.user1Id, ctx.user.id),
            eq(partnerships.user2Id, ctx.user.id)
          )
        ))
        .limit(1);

      if (partnership.length === 0) {
        throw new Error("Partnership not found or access denied");
      }

      return partnership[0];
    }),

  // End a partnership
  endPartnership: protectedProcedure
    .input(z.object({
      partnershipId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify user is part of the partnership
      const partnership = await db
        .select()
        .from(partnerships)
        .where(and(
          eq(partnerships.id, input.partnershipId),
          or(
            eq(partnerships.user1Id, ctx.user.id),
            eq(partnerships.user2Id, ctx.user.id)
          )
        ))
        .limit(1);

      if (partnership.length === 0) {
        throw new Error("Partnership not found or access denied");
      }

      const result = await db
        .update(partnerships)
        .set({
          status: "cancelled",
          endDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(partnerships.id, input.partnershipId))
        .returning();

      return result[0];
    }),

  // Submit partnership feedback
  submitFeedback: protectedProcedure
    .input(z.object({
      partnershipId: z.number(),
      revieweeId: z.number(),
      rating: z.number().min(1).max(5),
      teachingRating: z.number().min(1).max(5).optional(),
      communicationRating: z.number().min(1).max(5).optional(),
      reliabilityRating: z.number().min(1).max(5).optional(),
      comment: z.string().optional(),
      feedbackType: z.enum(["positive", "neutral", "negative"]).default("positive"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify the partnership exists and user is part of it
      const partnership = await db
        .select()
        .from(partnerships)
        .where(and(
          eq(partnerships.id, input.partnershipId),
          or(
            eq(partnerships.user1Id, ctx.user.id),
            eq(partnerships.user2Id, ctx.user.id)
          )
        ))
        .limit(1);

      if (partnership.length === 0) {
        throw new Error("Partnership not found or access denied");
      }

      if (partnership[0].user1Id !== ctx.user.id && partnership[0].user2Id !== ctx.user.id) {
        throw new Error("You are not part of this partnership");
      }

      // Check if feedback already exists
      const existingFeedback = await db
        .select()
        .from(partnershipFeedback)
        .where(and(
          eq(partnershipFeedback.partnershipId, input.partnershipId),
          eq(partnershipFeedback.reviewerId, ctx.user.id)
        ))
        .limit(1);

      if (existingFeedback.length > 0) {
        throw new Error("You have already submitted feedback for this partnership");
      }

      const feedback: InsertPartnershipFeedback = {
        partnershipId: input.partnershipId,
        reviewerId: ctx.user.id,
        revieweeId: input.revieweeId,
        rating: input.rating,
        teachingRating: input.teachingRating || null,
        communicationRating: input.communicationRating || null,
        reliabilityRating: input.reliabilityRating || null,
        comment: input.comment,
        feedbackType: input.feedbackType,
      };

      const result = await db.insert(partnershipFeedback).values(feedback).returning();
      return result[0];
    }),
});

export type PartnershipsRouter = typeof partnershipsRouter;
