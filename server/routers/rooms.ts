import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  learningRooms,
  roomParticipants,
  roomMessages,
  type LearningRoom,
  type RoomParticipant,
  type RoomMessage,
  type InsertLearningRoom,
  type InsertRoomParticipant,
  type InsertRoomMessage,
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

export const roomsRouter = router({
  // Create a collaborative learning room
  createRoom: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      categoryId: z.number().optional(),
      roomType: z.enum(["public", "private", "invite_only"]).default("public"),
      maxParticipants: z.number().default(10),
      isPersistent: z.boolean().default(false),
      topic: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      const room: InsertLearningRoom = {
        name: input.name,
        description: input.description,
        ownerId: ctx.user.id,
        categoryId: input.categoryId,
        roomType: input.roomType,
        maxParticipants: input.maxParticipants,
        currentParticipants: 1,
        isActive: true,
        isPersistent: input.isPersistent,
        topic: input.topic,
        tags: input.tags || null,
      };

      const result = await db.insert(learningRooms).values(room).returning();
      const createdRoom = result[0];

      // Add creator as host participant
      const participant: InsertRoomParticipant = {
        roomId: createdRoom.id,
        userId: ctx.user.id,
        role: "host",
        isActive: true,
      };

      await db.insert(roomParticipants).values(participant);

      return createdRoom;
    }),

  // List available rooms
  getRooms: protectedProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      roomType: z.enum(["public", "private", "invite_only"]).optional(),
      topic: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getLearningDb();
      if (!db) return [];

      let query = db
        .select()
        .from(learningRooms)
        .where(and(
          eq(learningRooms.isActive, true),
          eq(learningRooms.roomType, "public")
        ))
        .orderBy(desc(learningRooms.currentParticipants))
        .limit(input.limit);

      // Additional filters
      if (input.categoryId) {
        query = db
          .select()
          .from(learningRooms)
          .where(and(
            eq(learningRooms.isActive, true),
            eq(learningRooms.roomType, "public"),
            eq(learningRooms.categoryId, input.categoryId)
          ))
          .orderBy(desc(learningRooms.currentParticipants))
          .limit(input.limit);
      }

      return query;
    }),

  // Get room details
  getRoomById: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) return null;

      const room = await db
        .select()
        .from(learningRooms)
        .where(eq(learningRooms.id, input.roomId))
        .limit(1);

      if (room.length === 0) {
        throw new Error("Room not found");
      }

      // Check access for private rooms
      if (room[0].roomType === "private" || room[0].roomType === "invite_only") {
        const participant = await db
          .select()
          .from(roomParticipants)
          .where(and(
            eq(roomParticipants.roomId, input.roomId),
            eq(roomParticipants.userId, ctx.user.id),
            eq(roomParticipants.isActive, true)
          ))
          .limit(1);

        if (participant.length === 0 && room[0].ownerId !== ctx.user.id) {
          throw new Error("Access denied to this room");
        }
      }

      return room[0];
    }),

  // Join a room
  joinRoom: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Get room
      const room = await db
        .select()
        .from(learningRooms)
        .where(eq(learningRooms.id, input.roomId))
        .limit(1);

      if (room.length === 0) {
        throw new Error("Room not found");
      }

      // Check if room is at capacity
      if (room[0].currentParticipants >= room[0].maxParticipants) {
        throw new Error("Room is at capacity");
      }

      // Check if already a participant
      const existingParticipant = await db
        .select()
        .from(roomParticipants)
        .where(and(
          eq(roomParticipants.roomId, input.roomId),
          eq(roomParticipants.userId, ctx.user.id),
          eq(roomParticipants.isActive, true)
        ))
        .limit(1);

      if (existingParticipant.length > 0) {
        throw new Error("You are already in this room");
      }

      // Add participant
      const participant: InsertRoomParticipant = {
        roomId: input.roomId,
        userId: ctx.user.id,
        role: "participant",
        isActive: true,
      };

      await db.insert(roomParticipants).values(participant);

      // Update room participant count
      await db
        .update(learningRooms)
        .set({ currentParticipants: room[0].currentParticipants + 1 })
        .where(eq(learningRooms.id, input.roomId));

      // Add system message
      const systemMsg: InsertRoomMessage = {
        roomId: input.roomId,
        userId: ctx.user.id,
        content: `${ctx.user.name || 'A user'} has joined the room`,
        messageType: "system",
      };

      await db.insert(roomMessages).values(systemMsg);

      return { success: true };
    }),

  // Leave a room
  leaveRoom: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Get current participant
      const participant = await db
        .select()
        .from(roomParticipants)
        .where(and(
          eq(roomParticipants.roomId, input.roomId),
          eq(roomParticipants.userId, ctx.user.id),
          eq(roomParticipants.isActive, true)
        ))
        .limit(1);

      if (participant.length === 0) {
        throw new Error("You are not in this room");
      }

      // Update participant as inactive
      await db
        .update(roomParticipants)
        .set({ isActive: false, leftAt: new Date() })
        .where(eq(roomParticipants.id, participant[0].id));

      // Update room participant count
      const room = await db
        .select()
        .from(learningRooms)
        .where(eq(learningRooms.id, input.roomId))
        .limit(1);

      if (room.length > 0) {
        await db
          .update(learningRooms)
          .set({ currentParticipants: Math.max(0, room[0].currentParticipants - 1) })
          .where(eq(learningRooms.id, input.roomId));
      }

      // Add system message
      const systemMsg: InsertRoomMessage = {
        roomId: input.roomId,
        userId: ctx.user.id,
        content: `${ctx.user.name || 'A user'} has left the room`,
        messageType: "system",
      };

      await db.insert(roomMessages).values(systemMsg);

      return { success: true };
    }),

  // Update room settings
  updateRoom: protectedProcedure
    .input(z.object({
      roomId: z.number(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      maxParticipants: z.number().optional(),
      topic: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      const { roomId, ...updateData } = input;

      // Verify ownership
      const room = await db
        .select()
        .from(learningRooms)
        .where(and(
          eq(learningRooms.id, roomId),
          eq(learningRooms.ownerId, ctx.user.id)
        ))
        .limit(1);

      if (room.length === 0) {
        throw new Error("Room not found or access denied");
      }

      const result = await db
        .update(learningRooms)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(learningRooms.id, roomId))
        .returning();

      return result[0];
    }),

  // Delete a room
  deleteRoom: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const room = await db
        .select()
        .from(learningRooms)
        .where(and(
          eq(learningRooms.id, input.roomId),
          eq(learningRooms.ownerId, ctx.user.id)
        ))
        .limit(1);

      if (room.length === 0) {
        throw new Error("Room not found or access denied");
      }

      // Delete related data
      await db.delete(roomMessages).where(eq(roomMessages.roomId, input.roomId));
      await db.delete(roomParticipants).where(eq(roomParticipants.roomId, input.roomId));
      await db.delete(learningRooms).where(eq(learningRooms.id, input.roomId));

      return { success: true };
    }),

  // Get room chat history
  getRoomMessages: protectedProcedure
    .input(z.object({
      roomId: z.number(),
      limit: z.number().default(50),
      beforeId: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) return [];

      // Verify access
      const room = await db
        .select()
        .from(learningRooms)
        .where(eq(learningRooms.id, input.roomId))
        .limit(1);

      if (room.length === 0) {
        throw new Error("Room not found");
      }

      // Check access for private rooms
      if (room[0].roomType !== "public") {
        const participant = await db
          .select()
          .from(roomParticipants)
          .where(and(
            eq(roomParticipants.roomId, input.roomId),
            eq(roomParticipants.userId, ctx.user.id)
          ))
          .limit(1);

        if (participant.length === 0) {
          throw new Error("Access denied");
        }
      }

      let query = db
        .select()
        .from(roomMessages)
        .where(eq(roomMessages.roomId, input.roomId))
        .orderBy(desc(roomMessages.createdAt))
        .limit(input.limit);

      return query;
    }),
});

export type RoomsRouter = typeof roomsRouter;
