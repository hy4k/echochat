import { and, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, messages, InsertMessage, offlineMessages, InsertOfflineMessage, keepsakes, InsertKeepsake, userPresence, InsertUserPresence, sharedHorizon, InsertSharedHorizon } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Message queries
export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data);
  return result;
}

export async function getMessagesBetweenUsers(userId1: number, userId2: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);
  return result.reverse();
}

export async function updateMessageStatus(messageId: number, status: "sent" | "delivered" | "read") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messages).set({ status }).where(eq(messages.id, messageId));
}

// Offline message queries
export async function createOfflineMessage(data: InsertOfflineMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(offlineMessages).values(data);
  return result;
}

export async function getOfflineMessagesForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(offlineMessages)
    .where(eq(offlineMessages.receiverId, userId))
    .orderBy(desc(offlineMessages.createdAt));
  return result;
}

export async function markOfflineMessageAsViewed(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(offlineMessages).set({ viewed: 1 }).where(eq(offlineMessages.id, messageId));
}

// Keepsake queries
export async function createKeepsake(data: InsertKeepsake) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(keepsakes).values(data);
  return result;
}

export async function getKeepsakesBetweenUsers(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(keepsakes)
    .where(or(eq(keepsakes.userId, userId1), eq(keepsakes.userId, userId2)))
    .orderBy(desc(keepsakes.pinnedAt));
  return result;
}

export async function deleteKeepsake(keepsakeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(keepsakes).where(eq(keepsakes.id, keepsakeId));
}

// User presence queries
export async function updateUserPresence(userId: number, isOnline: boolean, latitude?: string, longitude?: string, timezone?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const data: any = { isOnline: isOnline ? 1 : 0, lastSeenAt: new Date() };
  if (latitude) data.latitude = latitude;
  if (longitude) data.longitude = longitude;
  if (timezone) data.timezone = timezone;
  
  await db.insert(userPresence).values({ userId, ...data }).onDuplicateKeyUpdate({
    set: data,
  });
}

export async function getUserPresence(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(userPresence).where(eq(userPresence.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getBothUsersPresence(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const results = await db.select().from(userPresence).where(or(eq(userPresence.userId, userId1), eq(userPresence.userId, userId2)));
  return results;
}

// Shared Horizon queries
export async function updateSharedHorizon(data: InsertSharedHorizon) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(sharedHorizon).values(data).onDuplicateKeyUpdate({
    set: {
      weatherCondition: data.weatherCondition,
      temperature: data.temperature,
      timeOfDay: data.timeOfDay,
      backgroundColor: data.backgroundColor,
      accentColor: data.accentColor,
    },
  });
}

export async function getSharedHorizonForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(sharedHorizon).where(eq(sharedHorizon.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getBothUsersSharedHorizon(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const results = await db.select().from(sharedHorizon).where(or(eq(sharedHorizon.userId, userId1), eq(sharedHorizon.userId, userId2)));
  return results;
}
