import { pgTable, serial, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const messages = pgTable("messages", {
    id: serial("id").primaryKey(),
    senderId: integer("senderId").notNull().references(() => users.id),
    receiverId: integer("receiverId").notNull().references(() => users.id),
    content: text("content").notNull(),
    messageType: text("messageType", { enum: ["text", "voice", "video"] }).default("text").notNull(),
    status: text("status", { enum: ["sent", "delivered", "read"] }).default("sent").notNull(),
    isOffline: integer("isOffline").default(0).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export const offlineMessages = pgTable("offlineMessages", {
    id: serial("id").primaryKey(),
    senderId: integer("senderId").notNull().references(() => users.id),
    receiverId: integer("receiverId").notNull().references(() => users.id),
    content: text("content"),
    mediaUrl: text("mediaUrl"),
    messageType: text("messageType", { enum: ["text", "voice", "video"] }).notNull(),
    viewed: integer("viewed").default(0).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type OfflineMessage = typeof offlineMessages.$inferSelect;
export type InsertOfflineMessage = typeof offlineMessages.$inferInsert;

export const keepsakes = pgTable("keepsakes", {
    id: serial("id").primaryKey(),
    messageId: integer("messageId").references(() => messages.id),
    userId: integer("userId").notNull().references(() => users.id),
    title: text("title"),
    description: text("description"),
    pinnedAt: timestamp("pinnedAt", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Keepsake = typeof keepsakes.$inferSelect;
export type InsertKeepsake = typeof keepsakes.$inferInsert;

export const userPresence = pgTable("userPresence", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().unique().references(() => users.id),
    isOnline: integer("isOnline").default(0).notNull(),
    lastSeenAt: timestamp("lastSeenAt", { withTimezone: true }).defaultNow().notNull(),
    latitude: varchar("latitude", { length: 20 }),
    longitude: varchar("longitude", { length: 20 }),
    timezone: varchar("timezone", { length: 50 }),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type UserPresence = typeof userPresence.$inferSelect;
export type InsertUserPresence = typeof userPresence.$inferInsert;

export const sharedHorizon = pgTable("sharedHorizon", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().unique().references(() => users.id),
    weatherCondition: varchar("weatherCondition", { length: 50 }),
    temperature: varchar("temperature", { length: 10 }),
    timeOfDay: varchar("timeOfDay", { length: 20 }),
    backgroundColor: varchar("backgroundColor", { length: 7 }),
    accentColor: varchar("accentColor", { length: 7 }),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type SharedHorizon = typeof sharedHorizon.$inferSelect;
export type InsertSharedHorizon = typeof sharedHorizon.$inferInsert;
