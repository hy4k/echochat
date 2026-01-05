import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Messages table for real-time chat
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull().references(() => users.id),
  receiverId: int("receiverId").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["text", "voice", "video"]).default("text").notNull(),
  status: mysqlEnum("status", ["sent", "delivered", "read"]).default("sent").notNull(),
  isOffline: int("isOffline").default(0).notNull(), // 1 if sent while receiver was offline
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// Offline messages table for storing messages when user is away
export const offlineMessages = mysqlTable("offlineMessages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull().references(() => users.id),
  receiverId: int("receiverId").notNull().references(() => users.id),
  content: text("content"),
  mediaUrl: text("mediaUrl"), // URL to voice/video file in S3
  messageType: mysqlEnum("messageType", ["text", "voice", "video"]).notNull(),
  viewed: int("viewed").default(0).notNull(), // 1 if receiver has viewed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OfflineMessage = typeof offlineMessages.$inferSelect;
export type InsertOfflineMessage = typeof offlineMessages.$inferInsert;

// Digital Keepsakes - pinned favorite moments
export const keepsakes = mysqlTable("keepsakes", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").references(() => messages.id),
  userId: int("userId").notNull().references(() => users.id), // User who pinned it
  title: text("title"),
  description: text("description"),
  pinnedAt: timestamp("pinnedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Keepsake = typeof keepsakes.$inferSelect;
export type InsertKeepsake = typeof keepsakes.$inferInsert;

// User presence and location data
export const userPresence = mysqlTable("userPresence", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  isOnline: int("isOnline").default(0).notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  timezone: varchar("timezone", { length: 50 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPresence = typeof userPresence.$inferSelect;
export type InsertUserPresence = typeof userPresence.$inferInsert;

// Shared Horizon - weather and time sync data
export const sharedHorizon = mysqlTable("sharedHorizon", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  weatherCondition: varchar("weatherCondition", { length: 50 }), // sunny, cloudy, rainy, etc
  temperature: varchar("temperature", { length: 10 }),
  timeOfDay: varchar("timeOfDay", { length: 20 }), // dawn, morning, noon, afternoon, sunset, dusk, night
  backgroundColor: varchar("backgroundColor", { length: 7 }), // hex color
  accentColor: varchar("accentColor", { length: 7 }), // hex color
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SharedHorizon = typeof sharedHorizon.$inferSelect;
export type InsertSharedHorizon = typeof sharedHorizon.$inferInsert;