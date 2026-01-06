import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, or, and, desc, sql } from "drizzle-orm";
import {
  users,
  messages,
  offlineMessages,
  keepsakes,
  userPresence,
  sharedHorizon,
  type User,
  type InsertUser,
  type Message,
  type InsertMessage,
  type OfflineMessage,
  type InsertOfflineMessage,
  type Keepsake,
  type InsertKeepsake,
  type UserPresence,
  type InsertUserPresence,
  type SharedHorizon,
  type InsertSharedHorizon,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: any = null;

export async function bootstrapDb() {
  if (process.env.NODE_ENV !== "production") return;

  const client = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
  const db = drizzle(client);

  console.log("[Database] Bootstrapping schema...");
  try {
    // Ensure users table exists with the unique constraint Drizzle expects
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "openId" VARCHAR(64) NOT NULL,
        "name" TEXT,
        "email" VARCHAR(320),
        "loginMethod" VARCHAR(64),
        "role" TEXT DEFAULT 'user' NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        "lastSignedIn" TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_openId_unique') THEN
          CREATE UNIQUE INDEX "users_openId_unique" ON "users" ("openId");
        END IF;
      END $$;
    `);
    console.log("[Database] Schema boostrapped successfully.");
  } catch (err) {
    console.error("[Database] Bootstrap failed:", err);
  } finally {
    await client.end();
  }
}

// In-memory mock storage for development when DB is unavailable
const mockStore = {
  users: [
    { id: 1, openId: "dev-user", name: "Echo Partner", email: "dev@echochat.space", createdAt: new Date(), lastSignedIn: new Date(), role: "user" }
  ] as User[],
  messages: [] as any[],
  keepsakes: [] as any[],
  presence: new Map<number, any>(),
  horizon: new Map<number, any>(),
};

export async function getDb() {
  if (!_db && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
    try {
      _client = postgres(process.env.DATABASE_URL, { ssl: 'require' });
      _db = drizzle(_client);
      console.log("[Database] Connected to PostgreSQL (SSL)");
    } catch (error) {
      console.warn("[Database] Failed to connect, falling back to mock storage.");
      _db = null;
    }
  }
  return _db;
}

// Helper to determine if we should use mock or real DB
const useMock = async () => !(await getDb());

export async function upsertUser(values: InsertUser) {
  if (await useMock()) {
    const existing = mockStore.users.findIndex(u => u.openId === values.openId);
    if (existing !== -1) {
      mockStore.users[existing] = { ...mockStore.users[existing], ...values } as User;
    } else {
      mockStore.users.push({ id: mockStore.users.length + 1, createdAt: new Date(), ...values } as User);
    }
    return;
  }
  const db = (await getDb())!;

  const updateSet: Partial<InsertUser> = { ...values };
  delete updateSet.openId;

  try {
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error: any) {
    console.error("[Database Error] Upsert failed:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      query: error.query,
      params: error.params
    });
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  if (await useMock()) {
    return mockStore.users.find(u => u.openId === openId);
  }
  const db = (await getDb())!;
  // @ts-ignore
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMessage(data: InsertMessage) {
  if (await useMock()) {
    const msg = { id: mockStore.messages.length + 1, createdAt: new Date(), ...data };
    mockStore.messages.push(msg);
    return [msg];
  }
  const db = (await getDb())!;
  // @ts-ignore
  return await db.insert(messages).values(data);
}

export async function getMessagesForUser(userId: number, limit = 50) {
  if (await useMock()) {
    return mockStore.messages
      .filter(m => m.senderId === userId || m.receiverId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  const db = (await getDb())!;
  // @ts-ignore
  return await db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
    // @ts-ignore
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function createOfflineMessage(data: InsertOfflineMessage) {
  const db = (await getDb())!;
  // @ts-ignore
  return await db.insert(offlineMessages).values(data);
}

export async function getOfflineMessages(userId: number) {
  const db = (await getDb())!;
  // @ts-ignore
  return await db
    .select()
    .from(offlineMessages)
    .where(and(eq(offlineMessages.receiverId, userId), eq(offlineMessages.viewed, 0)));
}

export async function createKeepsake(data: InsertKeepsake) {
  if (await useMock()) {
    const k = { id: mockStore.keepsakes.length + 1, pinnedAt: new Date(), createdAt: new Date(), ...data };
    mockStore.keepsakes.push(k);
    return [k];
  }
  const db = (await getDb())!;
  // @ts-ignore
  return await db.insert(keepsakes).values(data);
}

export async function getKeepsakesBetweenUsers(userId1: number, userId2: number) {
  if (await useMock()) {
    return mockStore.keepsakes
      .filter(k => k.userId === userId1 || k.userId === userId2)
      .sort((a, b) => b.pinnedAt.getTime() - a.pinnedAt.getTime());
  }
  const db = (await getDb())!;
  // @ts-ignore
  return await db
    .select()
    .from(keepsakes)
    .where(or(eq(keepsakes.userId, userId1), eq(keepsakes.userId, userId2)))
    // @ts-ignore
    .orderBy(desc(keepsakes.pinnedAt));
}

export async function getKeepsakesForUser(userId: number) {
  if (await useMock()) {
    return mockStore.keepsakes
      .filter(k => k.userId === userId)
      .sort((a, b) => b.pinnedAt.getTime() - a.pinnedAt.getTime());
  }
  const db = (await getDb())!;
  // @ts-ignore
  return await db.select().from(keepsakes).where(eq(keepsakes.userId, userId)).orderBy(desc(keepsakes.pinnedAt));
}

export async function updatePresence(userId: number, data: Partial<InsertUserPresence>) {
  if (await useMock()) {
    mockStore.presence.set(userId, { userId, ...data, updatedAt: new Date() });
    return;
  }
  const db = (await getDb())!;
  // @ts-ignore
  await db.insert(userPresence).values({ userId, ...data }).onConflictDoUpdate({
    // @ts-ignore
    target: userPresence.userId,
    set: data,
  });
}

export async function getUserPresence(userId: number) {
  if (await useMock()) {
    return mockStore.presence.get(userId) || null;
  }
  const db = (await getDb())!;
  // @ts-ignore
  const result = await db.select().from(userPresence).where(eq(userPresence.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSharedHorizon(userId: number, data: Partial<InsertSharedHorizon>) {
  if (await useMock()) {
    mockStore.horizon.set(userId, { userId, ...data, updatedAt: new Date() });
    return;
  }
  const db = (await getDb())!;
  // @ts-ignore
  await db.insert(sharedHorizon).values({ userId, ...data }).onConflictDoUpdate({
    // @ts-ignore
    target: sharedHorizon.userId,
    set: data as any,
  });
}

export async function getSharedHorizonForUser(userId: number) {
  if (await useMock()) {
    return mockStore.horizon.get(userId) || {
      userId,
      weatherCondition: "Clear",
      temperature: "22°C",
      timeOfDay: "Morning",
      backgroundColor: "#1a1a2e",
      accentColor: "#ebcfc4",
    };
  }
  const db = (await getDb())!;
  // @ts-ignore
  const result = await db.select().from(sharedHorizon).where(eq(sharedHorizon.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getMessageStats(userId: number) {
  if (await useMock()) {
    const userMessages = mockStore.messages.filter(m => m.senderId === userId || m.receiverId === userId);
    return {
      sent: mockStore.messages.filter(m => m.senderId === userId).length,
      received: mockStore.messages.filter(m => m.receiverId === userId).length,
      keepsakes: mockStore.keepsakes.filter(k => k.userId === userId).length,
      lastMessageAt: userMessages.length > 0 ? userMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt : null,
    };
  }
  const db = (await getDb())!;

  // @ts-ignore
  const totalSent = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    // @ts-ignore
    .where(eq(messages.senderId, userId));

  // @ts-ignore
  const totalReceived = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    // @ts-ignore
    .where(eq(messages.receiverId, userId));

  // @ts-ignore
  const totalKeepsakes = await db
    .select({ count: sql<number>`count(*)` })
    .from(keepsakes)
    // @ts-ignore
    .where(eq(keepsakes.userId, userId));

  // @ts-ignore
  const lastMessage = await db
    .select()
    .from(messages)
    // @ts-ignore
    .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
    // @ts-ignore
    .orderBy(desc(messages.createdAt))
    .limit(1);

  return {
    sent: Number(totalSent[0]?.count || 0),
    received: Number(totalReceived[0]?.count || 0),
    keepsakes: Number(totalKeepsakes[0]?.count || 0),
    lastMessageAt: lastMessage[0]?.createdAt || null,
  };
}

export async function getDailyActivity(userId: number) {
  if (await useMock()) {
    return [{ date: new Date().toISOString().split('T')[0], count: mockStore.messages.length }];
  }
  const db = (await getDb())!;

  // Get message counts per day for the last 7 days
  const result = await db.execute(sql`
    SELECT 
      DATE(createdAt AT TIME ZONE 'UTC') as date,
      COUNT(*) as count
    FROM messages
    WHERE (senderId = ${userId} OR receiverId = ${userId})
      AND createdAt > NOW() - INTERVAL '7 days'
    GROUP BY DATE(createdAt AT TIME ZONE 'UTC')
    ORDER BY date ASC
  `);

  return result as unknown as { date: string; count: number }[];
}
