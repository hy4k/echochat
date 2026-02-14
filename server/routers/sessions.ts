import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc } from "drizzle-orm";
import {
  scheduledSessions,
  sessionAttendees,
  sessionFeedback,
  type ScheduledSession,
  type SessionAttendee,
  type SessionFeedback,
  type InsertScheduledSession,
  type InsertSessionAttendee,
  type InsertSessionFeedback,
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

export const sessionsRouter = router({
  // Schedule a learning session
  createSession: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      roomId: z.number().optional(),
      skillId: z.number().optional(),
      startTime: z.string(), // ISO date string
      endTime: z.string(), // ISO date string
      timezone: z.string().default("UTC"),
      sessionType: z.enum(["one_on_one", "group", "workshop", "review"]).default("one_on_one"),
      maxAttendees: z.number().default(2),
      isRecurring: z.boolean().default(false),
      recurringPattern: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      const session: InsertScheduledSession = {
        title: input.title,
        description: input.description,
        hostId: ctx.user.id,
        roomId: input.roomId || null,
        skillId: input.skillId || null,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        timezone: input.timezone,
        sessionType: input.sessionType,
        maxAttendees: input.maxAttendees,
        currentAttendees: 1,
        status: "scheduled",
        isRecurring: input.isRecurring,
        recurringPattern: input.recurringPattern || null,
      };

      const result = await db.insert(scheduledSessions).values(session).returning();
      const createdSession = result[0];

      // Add host as attendee
      const attendee: InsertSessionAttendee = {
        sessionId: createdSession.id,
        userId: ctx.user.id,
        role: "host",
        status: "confirmed",
        joinedAt: new Date(),
      };

      await db.insert(sessionAttendees).values(attendee);

      return createdSession;
    }),

  // Get user's sessions
  getSessions: protectedProcedure
    .input(z.object({
      status: z.enum(["scheduled", "in_progress", "completed", "cancelled", "no_show"]).optional(),
      role: z.enum(["host", "participant"]).optional(),
      limit: z.number().default(20),
      upcoming: z.boolean().default(true),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) return [];

      // Get sessions where user is host or attendee
      let hostQuery: any;
      let attendeeQuery: any;

      if (input.upcoming) {
        hostQuery = db
          .select()
          .from(scheduledSessions)
          .where(and(
            eq(scheduledSessions.hostId, ctx.user.id),
            eq(scheduledSessions.status, "scheduled"),
            eq(scheduledSessions.startTime, new Date())
          ))
          .orderBy(scheduledSessions.startTime)
          .limit(input.limit);

        attendeeQuery = db
          .select({ session: scheduledSessions })
          .from(sessionAttendees)
          .innerJoin(scheduledSessions, eq(sessionAttendees.sessionId, scheduledSessions.id))
          .where(and(
            eq(sessionAttendees.userId, ctx.user.id),
            eq(scheduledSessions.status, "scheduled")
          ))
          .orderBy(scheduledSessions.startTime)
          .limit(input.limit);
      } else {
        hostQuery = db
          .select()
          .from(scheduledSessions)
          .where(eq(scheduledSessions.hostId, ctx.user.id))
          .orderBy(desc(scheduledSessions.startTime))
          .limit(input.limit);

        attendeeQuery = db
          .select({ session: scheduledSessions })
          .from(sessionAttendees)
          .innerJoin(scheduledSessions, eq(sessionAttendees.sessionId, scheduledSessions.id))
          .where(eq(sessionAttendees.userId, ctx.user.id))
          .orderBy(desc(scheduledSessions.startTime))
          .limit(input.limit);
      }

      if (input.status) {
        hostQuery = db
          .select()
          .from(scheduledSessions)
          .where(and(
            eq(scheduledSessions.hostId, ctx.user.id),
            eq(scheduledSessions.status, input.status)
          ))
          .orderBy(desc(scheduledSessions.startTime))
          .limit(input.limit);
      }

      return hostQuery;
    }),

  // Get session details
  getSessionById: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) return null;

      const session = await db
        .select()
        .from(scheduledSessions)
        .where(eq(scheduledSessions.id, input.sessionId))
        .limit(1);

      if (session.length === 0) {
        throw new Error("Session not found");
      }

      // Check if user has access
      if (session[0].hostId !== ctx.user.id) {
        const attendee = await db
          .select()
          .from(sessionAttendees)
          .where(and(
            eq(sessionAttendees.sessionId, input.sessionId),
            eq(sessionAttendees.userId, ctx.user.id)
          ))
          .limit(1);

        if (attendee.length === 0) {
          throw new Error("Access denied");
        }
      }

      return session[0];
    }),

  // Update session (reschedule)
  updateSession: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      timezone: z.string().optional(),
      maxAttendees: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      const { sessionId, ...updateData } = input;

      // Verify host
      const session = await db
        .select()
        .from(scheduledSessions)
        .where(and(
          eq(scheduledSessions.id, sessionId),
          eq(scheduledSessions.hostId, ctx.user.id)
        ))
        .limit(1);

      if (session.length === 0) {
        throw new Error("Session not found or access denied");
      }

      // Don't allow updating past sessions
      if (session[0].status !== "scheduled") {
        throw new Error("Cannot update a session that is not scheduled");
      }

      const result = await db
        .update(scheduledSessions)
        .set({ 
          ...updateData,
          startTime: updateData.startTime ? new Date(updateData.startTime) : undefined,
          endTime: updateData.endTime ? new Date(updateData.endTime) : undefined,
          updatedAt: new Date() 
        })
        .where(eq(scheduledSessions.id, sessionId))
        .returning();

      return result[0];
    }),

  // Cancel a session
  cancelSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify host
      const session = await db
        .select()
        .from(scheduledSessions)
        .where(and(
          eq(scheduledSessions.id, input.sessionId),
          eq(scheduledSessions.hostId, ctx.user.id)
        ))
        .limit(1);

      if (session.length === 0) {
        throw new Error("Session not found or access denied");
      }

      const result = await db
        .update(scheduledSessions)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(scheduledSessions.id, input.sessionId))
        .returning();

      // Notify attendees
      await db
        .update(sessionAttendees)
        .set({ status: "cancelled", leftAt: new Date() })
        .where(and(
          eq(sessionAttendees.sessionId, input.sessionId),
          eq(sessionAttendees.userId, ctx.user.id)
        ));

      return result[0];
    }),

  // Join a session as attendee
  joinSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Get session
      const session = await db
        .select()
        .from(scheduledSessions)
        .where(eq(scheduledSessions.id, input.sessionId))
        .limit(1);

      if (session.length === 0) {
        throw new Error("Session not found");
      }

      if (session[0].status !== "scheduled") {
        throw new Error("Session is not available for joining");
      }

      if (session[0].currentAttendees >= session[0].maxAttendees) {
        throw new Error("Session is at capacity");
      }

      if (session[0].hostId === ctx.user.id) {
        throw new Error("You are already the host");
      }

      // Check if already joined
      const existing = await db
        .select()
        .from(sessionAttendees)
        .where(and(
          eq(sessionAttendees.sessionId, input.sessionId),
          eq(sessionAttendees.userId, ctx.user.id)
        ))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("You have already joined this session");
      }

      // Add attendee
      const attendee: InsertSessionAttendee = {
        sessionId: input.sessionId,
        userId: ctx.user.id,
        role: "participant",
        status: "confirmed",
        joinedAt: new Date(),
      };

      await db.insert(sessionAttendees).values(attendee);

      // Update attendee count
      await db
        .update(scheduledSessions)
        .set({ currentAttendees: session[0].currentAttendees + 1 })
        .where(eq(scheduledSessions.id, input.sessionId));

      return { success: true };
    }),

  // Leave a session
  leaveSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Get attendee
      const attendee = await db
        .select()
        .from(sessionAttendees)
        .where(and(
          eq(sessionAttendees.sessionId, input.sessionId),
          eq(sessionAttendees.userId, ctx.user.id)
        ))
        .limit(1);

      if (attendee.length === 0) {
        throw new Error("You are not in this session");
      }

      // Update attendee
      await db
        .update(sessionAttendees)
        .set({ status: "cancelled", leftAt: new Date() })
        .where(eq(sessionAttendees.id, attendee[0].id));

      // Update session attendee count
      const session = await db
        .select()
        .from(scheduledSessions)
        .where(eq(scheduledSessions.id, input.sessionId))
        .limit(1);

      if (session.length > 0) {
        await db
          .update(scheduledSessions)
          .set({ currentAttendees: Math.max(0, session[0].currentAttendees - 1) })
          .where(eq(scheduledSessions.id, input.sessionId));
      }

      return { success: true };
    }),

  // Submit session feedback
  submitSessionFeedback: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      revieweeId: z.number(),
      rating: z.number().min(1).max(5),
      teachingRating: z.number().min(1).max(5).optional(),
      engagementRating: z.number().min(1).max(5).optional(),
      punctualityRating: z.number().min(1).max(5).optional(),
      comment: z.string().optional(),
      wouldRecommend: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify session exists and is completed
      const session = await db
        .select()
        .from(scheduledSessions)
        .where(eq(scheduledSessions.id, input.sessionId))
        .limit(1);

      if (session.length === 0) {
        throw new Error("Session not found");
      }

      if (session[0].status !== "completed") {
        throw new Error("Can only submit feedback for completed sessions");
      }

      // Verify user was part of the session
      const attendee = await db
        .select()
        .from(sessionAttendees)
        .where(and(
          eq(sessionAttendees.sessionId, input.sessionId),
          eq(sessionAttendees.userId, ctx.user.id)
        ))
        .limit(1);

      if (attendee.length === 0) {
        throw new Error("You were not part of this session");
      }

      // Check if feedback already exists
      const existing = await db
        .select()
        .from(sessionFeedback)
        .where(and(
          eq(sessionFeedback.sessionId, input.sessionId),
          eq(sessionFeedback.reviewerId, ctx.user.id)
        ))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("You have already submitted feedback");
      }

      const feedback: InsertSessionFeedback = {
        sessionId: input.sessionId,
        reviewerId: ctx.user.id,
        revieweeId: input.revieweeId,
        rating: input.rating,
        teachingRating: input.teachingRating || null,
        engagementRating: input.engagementRating || null,
        punctualityRating: input.punctualityRating || null,
        comment: input.comment,
        wouldRecommend: input.wouldRecommend || null,
      };

      const result = await db.insert(sessionFeedback).values(feedback).returning();
      return result[0];
    }),
});

export type SessionsRouter = typeof sessionsRouter;
