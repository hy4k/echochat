import { pgTable, serial, text, timestamp, varchar, integer, boolean, jsonb, index, uniqueIndex, decimal } from "drizzle-orm/pg-core";

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
    content: text("content"),
    mediaUrl: text("mediaUrl"),
    messageType: text("messageType", { enum: ["text", "voice", "video", "image", "file"] }).default("text").notNull(),
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

export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    senderId: integer("senderId").notNull().references(() => users.id),
    messageId: integer("messageId").references(() => messages.id),
    offlineMessageId: integer("offlineMessageId").references(() => offlineMessages.id),
    type: text("type", { enum: ["offline_message", "call_missed", "message_received", "custom"] }).notNull(),
    title: text("title").notNull(),
    content: text("content"),
    read: integer("read").default(0).notNull(),
    archived: integer("archived").default(0).notNull(),
    actionUrl: text("actionUrl"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    readAt: timestamp("readAt", { withTimezone: true }),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const notificationPreferences = pgTable("notificationPreferences", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().unique().references(() => users.id),
    enableBrowserNotifications: integer("enableBrowserNotifications").default(1).notNull(),
    enableInAppNotifications: integer("enableInAppNotifications").default(1).notNull(),
    enableSoundAlerts: integer("enableSoundAlerts").default(1).notNull(),
    enableVibration: integer("enableVibration").default(1).notNull(),
    notifyOfflineMessages: integer("notifyOfflineMessages").default(1).notNull(),
    notifyMissedCalls: integer("notifyMissedCalls").default(1).notNull(),
    quietHoursStart: varchar("quietHoursStart", { length: 5 }),
    quietHoursEnd: varchar("quietHoursEnd", { length: 5 }),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

// ============================================
// PHASE 2: PEER-TO-PEER LEARNING PLATFORM
// ============================================

// ------------------------------------------
// 1. Skill Profiling Tables
// ------------------------------------------

// Predefined categories for skills (academic, creative, athletic, professional, etc.)
export const skillCategories = pgTable("skill_categories", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }),
    parentId: integer("parentId").references(() => skillCategories.id),
    isActive: boolean().default(true).notNull(),
    sortOrder: integer("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    nameIdx: index("skill_categories_name_idx").on(table.name),
    parentIdx: index("skill_categories_parent_idx").on(table.parentId),
}));

export type SkillCategory = typeof skillCategories.$inferSelect;
export type InsertSkillCategory = typeof skillCategories.$inferInsert;

// Skills users can teach/learn with proficiency levels
export const userSkills = pgTable("user_skills", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    categoryId: integer("categoryId").references(() => skillCategories.id),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    proficiencyLevel: text("proficiencyLevel", { 
        enum: ["beginner", "intermediate", "advanced", "expert", "master"] 
    }).default("beginner").notNull(),
    teachingLevel: text("teachingLevel", { 
        enum: ["none", "beginner", "intermediate", "advanced", "expert"] 
    }).default("none").notNull(),
    learningLevel: text("learningLevel", { 
        enum: ["none", "beginner", "intermediate", "advanced", "expert"] 
    }).default("none").notNull(),
    yearsExperience: integer("yearsExperience"),
    isTeachEnabled: boolean().default(false).notNull(),
    isLearnEnabled: boolean().default(true).notNull(),
    hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
    isVerified: boolean().default(false).notNull(),
    verificationStatus: text("verificationStatus", { 
        enum: ["none", "pending", "verified", "rejected"] 
    }).default("none").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: index("user_skills_user_idx").on(table.userId),
    categoryIdx: index("user_skills_category_idx").on(table.categoryId),
    teachIdx: index("user_skills_teach_idx").on(table.isTeachEnabled),
    learnIdx: index("user_skills_learn_idx").on(table.isLearnEnabled),
}));

export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = typeof userSkills.$inferInsert;

// Peer endorsements for skills
export const skillEndorsements = pgTable("skill_endorsements", {
    id: serial("id").primaryKey(),
    skillId: integer("skillId").notNull().references(() => userSkills.id),
    endorserId: integer("endorserId").notNull().references(() => users.id),
    endorseeId: integer("endorseeId").notNull().references(() => users.id),
    endorsementType: text("endorsementType", { 
        enum: ["teaching", "learning", "general"] 
    }).default("general").notNull(),
    comment: text("comment"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    skillIdx: index("skill_endorsements_skill_idx").on(table.skillId),
    endorserIdx: index("skill_endorsements_endorser_idx").on(table.endorserId),
    endorseeIdx: index("skill_endorsements_endorsee_idx").on(table.endorseeId),
    uniqueEndorsement: uniqueIndex("unique_endorsement_idx").on(table.skillId, table.endorserId),
}));

export type SkillEndorsement = typeof skillEndorsements.$inferSelect;
export type InsertSkillEndorsement = typeof skillEndorsements.$inferInsert;

// Verification status for skills
export const skillVerifications = pgTable("skill_verifications", {
    id: serial("id").primaryKey(),
    skillId: integer("skillId").notNull().references(() => userSkills.id),
    verifierId: integer("verifierId").references(() => users.id),
    verificationMethod: text("verificationMethod", { 
        enum: ["manual", "certificate", "portfolio", "assessment", "peer"] 
    }).default("manual").notNull(),
    status: text("status", { 
        enum: ["pending", "approved", "rejected", "expired"] 
    }).default("pending").notNull(),
    documentUrl: text("documentUrl"),
    notes: text("notes"),
    verifiedAt: timestamp("verifiedAt", { withTimezone: true }),
    expiresAt: timestamp("expiresAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    skillIdx: index("skill_verifications_skill_idx").on(table.skillId),
    statusIdx: index("skill_verifications_status_idx").on(table.status),
}));

export type SkillVerification = typeof skillVerifications.$inferSelect;
export type InsertSkillVerification = typeof skillVerifications.$inferInsert;

// ------------------------------------------
// 2. User Profile Extensions
// ------------------------------------------

// Extended profile with bio, avatar, timezone, availability
export const userProfiles = pgTable("user_profiles", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().unique().references(() => users.id),
    bio: text("bio"),
    avatarUrl: text("avatarUrl"),
    headline: varchar("headline", { length: 200 }),
    timezone: varchar("timezone", { length: 50 }).default("UTC"),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    languages: jsonb("languages").$type<string[]>(),
    availability: jsonb("availability").$type<{
        weekdays: boolean[];
        timezone: string;
        slots: { start: string; end: string }[];
    }>(),
    teachingStyle: text("teachingStyle"),
    learningStyle: text("learningStyle"),
    isPublicProfile: boolean().default(true).notNull(),
    isAvailableForMentoring: boolean().default(true).notNull(),
    preferredSessionLength: integer("preferredSessionLength").default(60),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: index("user_profiles_user_idx").on(table.userId),
}));

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// User's learning objectives
export const learningGoals = pgTable("learning_goals", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    targetSkillId: integer("targetSkillId").references(() => userSkills.id),
    targetLevel: text("targetLevel", { 
        enum: ["beginner", "intermediate", "advanced", "expert", "master"] 
    }),
    deadline: timestamp("deadline", { withTimezone: true }),
    status: text("status", { 
        enum: ["active", "completed", "paused", "abandoned"] 
    }).default("active").notNull(),
    progress: integer("progress").default(0).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: index("learning_goals_user_idx").on(table.userId),
    statusIdx: index("learning_goals_status_idx").on(table.status),
}));

export type LearningGoal = typeof learningGoals.$inferSelect;
export type InsertLearningGoal = typeof learningGoals.$inferInsert;

// Topic interests for matching
export const userInterests = pgTable("user_interests", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    categoryId: integer("categoryId").references(() => skillCategories.id),
    interestLevel: text("interestLevel", { 
        enum: ["low", "medium", "high"] 
    }).default("medium").notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: index("user_interests_user_idx").on(table.userId),
    categoryIdx: index("user_interests_category_idx").on(table.categoryId),
    uniqueInterest: uniqueIndex("unique_user_interest_idx").on(table.userId, table.categoryId),
}));

export type UserInterest = typeof userInterests.$inferSelect;
export type InsertUserInterest = typeof userInterests.$inferInsert;

// ------------------------------------------
// 3. Matching System Tables
// ------------------------------------------

// Learning partnerships with compatibility scores
export const matches = pgTable("matches", {
    id: serial("id").primaryKey(),
    user1Id: integer("user1Id").notNull().references(() => users.id),
    user2Id: integer("user2Id").notNull().references(() => users.id),
    compatibilityScore: decimal("compatibilityScore", { precision: 5, scale: 2 }).notNull(),
    skillMatchScore: decimal("skillMatchScore", { precision: 5, scale: 2 }),
    availabilityMatchScore: decimal("availabilityMatchScore", { precision: 5, scale: 2 }),
    status: text("status", { 
        enum: ["pending", "suggested", "accepted", "rejected", "expired"] 
    }).default("pending").notNull(),
    matchedSkills: jsonb("matchedSkills").$type<{
        skillId: number;
        skillName: string;
        user1CanTeach: boolean;
        user2CanTeach: boolean;
    }[]>(),
    suggestedAt: timestamp("suggestedAt", { withTimezone: true }).defaultNow().notNull(),
    respondedAt: timestamp("respondedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    user1Idx: index("matches_user1_idx").on(table.user1Id),
    user2Idx: index("matches_user2_idx").on(table.user2Id),
    statusIdx: index("matches_status_idx").on(table.status),
    scoreIdx: index("matches_score_idx").on(table.compatibilityScore),
}));

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

// User preferences for matching
export const matchPreferences = pgTable("match_preferences", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().unique().references(() => users.id),
    preferredSkills: jsonb("preferredSkills").$type<number[]>(),
    excludedUserIds: jsonb("excludedUserIds").$type<number[]>(),
    minCompatibilityScore: decimal("minCompatibilityScore", { precision: 5, scale: 2 }).default("50"),
    preferredTimezones: jsonb("preferredTimezones").$type<string[]>(),
    preferredSessionLength: integer("preferredSessionLength"),
    teachingStylePreference: text("teachingStylePreference"),
    learningStylePreference: text("learningStylePreference"),
    autoMatch: boolean().default(false).notNull(),
    notificationFrequency: text("notificationFrequency", { 
        enum: ["immediate", "daily", "weekly"] 
    }).default("daily").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: index("match_preferences_user_idx").on(table.userId),
}));

export type MatchPreference = typeof matchPreferences.$inferSelect;
export type InsertMatchPreference = typeof matchPreferences.$inferInsert;

// Established learning relationships
export const partnerships = pgTable("partnerships", {
    id: serial("id").primaryKey(),
    user1Id: integer("user1Id").notNull().references(() => users.id),
    user2Id: integer("user2Id").notNull().references(() => users.id),
    matchId: integer("matchId").references(() => matches.id),
    status: text("status", { 
        enum: ["active", "paused", "completed", "cancelled"] 
    }).default("active").notNull(),
    role: text("role", { 
        enum: ["teacher_student", "mutual", "peer"] 
    }).default("peer").notNull(),
    startDate: timestamp("startDate", { withTimezone: true }).defaultNow().notNull(),
    endDate: timestamp("endDate", { withTimezone: true }),
    sessionsCompleted: integer("sessionsCompleted").default(0).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    user1Idx: index("partnerships_user1_idx").on(table.user1Id),
    user2Idx: index("partnerships_user2_idx").on(table.user2Id),
    statusIdx: index("partnerships_status_idx").on(table.status),
}));

export type Partnership = typeof partnerships.$inferSelect;
export type InsertPartnership = typeof partnerships.$inferInsert;

// Feedback after partnerships
export const partnershipFeedback = pgTable("partnership_feedback", {
    id: serial("id").primaryKey(),
    partnershipId: integer("partnershipId").notNull().references(() => partnerships.id),
    reviewerId: integer("reviewerId").notNull().references(() => users.id),
    revieweeId: integer("revieweeId").notNull().references(() => users.id),
    rating: integer("rating").notNull(),
    teachingRating: integer("teachingRating"),
    communicationRating: integer("communicationRating"),
    reliabilityRating: integer("reliabilityRating"),
    comment: text("comment"),
    feedbackType: text("feedbackType", { 
        enum: ["positive", "neutral", "negative"] 
    }).default("positive").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    partnershipIdx: index("partnership_feedback_partnership_idx").on(table.partnershipId),
    reviewerIdx: index("partnership_feedback_reviewer_idx").on(table.reviewerId),
    uniqueFeedback: uniqueIndex("unique_partnership_feedback_idx").on(table.partnershipId, table.reviewerId),
}));

export type PartnershipFeedback = typeof partnershipFeedback.$inferSelect;
export type InsertPartnershipFeedback = typeof partnershipFeedback.$inferInsert;

// ------------------------------------------
// 4. Learning Rooms
// ------------------------------------------

// Collaborative study rooms
export const learningRooms = pgTable("learning_rooms", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    ownerId: integer("ownerId").notNull().references(() => users.id),
    categoryId: integer("categoryId").references(() => skillCategories.id),
    roomType: text("roomType", { 
        enum: ["public", "private", "invite_only"] 
    }).default("public").notNull(),
    maxParticipants: integer("maxParticipants").default(10),
    currentParticipants: integer("currentParticipants").default(0).notNull(),
    isActive: boolean().default(true).notNull(),
    isPersistent: boolean().default(false).notNull(),
    topic: varchar("topic", { length: 200 }),
    tags: jsonb("tags").$type<string[]>(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    ownerIdx: index("learning_rooms_owner_idx").on(table.ownerId),
    categoryIdx: index("learning_rooms_category_idx").on(table.categoryId),
    typeIdx: index("learning_rooms_type_idx").on(table.roomType),
}));

export type LearningRoom = typeof learningRooms.$inferSelect;
export type InsertLearningRoom = typeof learningRooms.$inferInsert;

// Users in rooms
export const roomParticipants = pgTable("room_participants", {
    id: serial("id").primaryKey(),
    roomId: integer("roomId").notNull().references(() => learningRooms.id),
    userId: integer("userId").notNull().references(() => users.id),
    role: text("role", { 
        enum: ["host", "moderator", "participant", "observer"] 
    }).default("participant").notNull(),
    joinedAt: timestamp("joinedAt", { withTimezone: true }).defaultNow().notNull(),
    leftAt: timestamp("leftAt", { withTimezone: true }),
    isActive: boolean().default(true).notNull(),
}, (table) => ({
    roomIdx: index("room_participants_room_idx").on(table.roomId),
    userIdx: index("room_participants_user_idx").on(table.userId),
    uniqueParticipant: uniqueIndex("unique_room_participant_idx").on(table.roomId, table.userId),
}));

export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertRoomParticipant = typeof roomParticipants.$inferInsert;

// Chat within rooms
export const roomMessages = pgTable("room_messages", {
    id: serial("id").primaryKey(),
    roomId: integer("roomId").notNull().references(() => learningRooms.id),
    userId: integer("userId").notNull().references(() => users.id),
    content: text("content").notNull(),
    messageType: text("messageType", { 
        enum: ["text", "system", "file"] 
    }).default("text").notNull(),
    mediaUrl: text("mediaUrl"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    roomIdx: index("room_messages_room_idx").on(table.roomId),
    userIdx: index("room_messages_user_idx").on(table.userId),
    createdIdx: index("room_messages_created_idx").on(table.createdAt),
}));

export type RoomMessage = typeof roomMessages.$inferSelect;
export type InsertRoomMessage = typeof roomMessages.$inferInsert;

// ------------------------------------------
// 5. Sessions & Scheduling
// ------------------------------------------

// Learning session bookings
export const scheduledSessions = pgTable("scheduled_sessions", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    hostId: integer("hostId").notNull().references(() => users.id),
    roomId: integer("roomId").references(() => learningRooms.id),
    skillId: integer("skillId").references(() => userSkills.id),
    startTime: timestamp("startTime", { withTimezone: true }).notNull(),
    endTime: timestamp("endTime", { withTimezone: true }).notNull(),
    timezone: varchar("timezone", { length: 50 }).default("UTC"),
    sessionType: text("sessionType", { 
        enum: ["one_on_one", "group", "workshop", "review"] 
    }).default("one_on_one").notNull(),
    maxAttendees: integer("maxAttendees").default(2),
    currentAttendees: integer("currentAttendees").default(0).notNull(),
    status: text("status", { 
        enum: ["scheduled", "in_progress", "completed", "cancelled", "no_show"] 
    }).default("scheduled").notNull(),
    meetingUrl: text("meetingUrl"),
    isRecurring: boolean().default(false).notNull(),
    recurringPattern: text("recurringPattern"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    hostIdx: index("scheduled_sessions_host_idx").on(table.hostId),
    roomIdx: index("scheduled_sessions_room_idx").on(table.roomId),
    skillIdx: index("scheduled_sessions_skill_idx").on(table.skillId),
    statusIdx: index("scheduled_sessions_status_idx").on(table.status),
    startTimeIdx: index("scheduled_sessions_start_idx").on(table.startTime),
}));

export type ScheduledSession = typeof scheduledSessions.$inferSelect;
export type InsertScheduledSession = typeof scheduledSessions.$inferInsert;

// Participants in sessions
export const sessionAttendees = pgTable("session_attendees", {
    id: serial("id").primaryKey(),
    sessionId: integer("sessionId").notNull().references(() => scheduledSessions.id),
    userId: integer("userId").notNull().references(() => users.id),
    role: text("role", { 
        enum: ["host", "presenter", "participant", "observer"] 
    }).default("participant").notNull(),
    status: text("status", { 
        enum: ["pending", "confirmed", "attended", "no_show", "cancelled"] 
    }).default("pending").notNull(),
    joinedAt: timestamp("joinedAt", { withTimezone: true }),
    leftAt: timestamp("leftAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    sessionIdx: index("session_attendees_session_idx").on(table.sessionId),
    userIdx: index("session_attendees_user_idx").on(table.userId),
    uniqueAttendee: uniqueIndex("unique_session_attendee_idx").on(table.sessionId, table.userId),
}));

export type SessionAttendee = typeof sessionAttendees.$inferSelect;
export type InsertSessionAttendee = typeof sessionAttendees.$inferInsert;

// Post-session ratings
export const sessionFeedback = pgTable("session_feedback", {
    id: serial("id").primaryKey(),
    sessionId: integer("sessionId").notNull().references(() => scheduledSessions.id),
    reviewerId: integer("reviewerId").notNull().references(() => users.id),
    revieweeId: integer("revieweeId").notNull().references(() => users.id),
    rating: integer("rating").notNull(),
    teachingRating: integer("teachingRating"),
    engagementRating: integer("engagementRating"),
    punctualityRating: integer("punctualityRating"),
    comment: text("comment"),
    wouldRecommend: boolean(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    sessionIdx: index("session_feedback_session_idx").on(table.sessionId),
    reviewerIdx: index("session_feedback_reviewer_idx").on(table.reviewerId),
    uniqueFeedback: uniqueIndex("unique_session_feedback_idx").on(table.sessionId, table.reviewerId),
}));

export type SessionFeedback = typeof sessionFeedback.$inferSelect;
export type InsertSessionFeedback = typeof sessionFeedback.$inferInsert;

// ------------------------------------------
// 6. Achievement System
// ------------------------------------------

// Achievement definitions
export const achievements = pgTable("achievements", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description").notNull(),
    iconUrl: text("iconUrl"),
    category: text("category", { 
        enum: ["learning", "teaching", "social", "streak", "milestone"] 
    }).notNull(),
    criteria: jsonb("criteria").$type<{
        type: string;
        value: number;
        metric: string;
    }>(),
    xpReward: integer("xpReward").default(0).notNull(),
    badgeId: integer("badgeId").references(() => badges.id),
    tier: text("tier", { 
        enum: ["bronze", "silver", "gold", "platinum", "diamond"] 
    }).default("bronze").notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    categoryIdx: index("achievements_category_idx").on(table.category),
}));

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

// Earned achievements
export const userAchievements = pgTable("user_achievements", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    achievementId: integer("achievementId").notNull().references(() => achievements.id),
    earnedAt: timestamp("earnedAt", { withTimezone: true }).defaultNow().notNull(),
    progress: integer("progress").default(0).notNull(),
    isCompleted: boolean().default(false).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: index("user_achievements_user_idx").on(table.userId),
    achievementIdx: index("user_achievements_achievement_idx").on(table.achievementId),
    uniqueAchievement: uniqueIndex("unique_user_achievement_idx").on(table.userId, table.achievementId),
}));

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// Skill badges
export const badges = pgTable("badges", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description").notNull(),
    iconUrl: text("iconUrl"),
    category: text("category", { 
        enum: ["skill", "teaching", "learning", "community", "special"] 
    }).notNull(),
    tier: text("tier", { 
        enum: ["bronze", "silver", "gold", "platinum", "diamond"] 
    }).default("bronze").notNull(),
    requirements: jsonb("requirements").$type<{
        skillLevel: string;
        endorsementCount: number;
        sessionCount: number;
    }>(),
    xpReward: integer("xpReward").default(0).notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    categoryIdx: index("badges_category_idx").on(table.category),
}));

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

// Earned badges
export const userBadges = pgTable("user_badges", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().references(() => users.id),
    badgeId: integer("badgeId").notNull().references(() => badges.id),
    skillId: integer("skillId").references(() => userSkills.id),
    earnedAt: timestamp("earnedAt", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: index("user_badges_user_idx").on(table.userId),
    badgeIdx: index("user_badges_badge_idx").on(table.badgeId),
    uniqueUserBadge: uniqueIndex("unique_user_badge_idx").on(table.userId, table.badgeId, table.skillId),
}));

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

// ------------------------------------------
// 7. Resource Library
// ------------------------------------------

// Shared learning materials
export const resources = pgTable("resources", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    ownerId: integer("ownerId").notNull().references(() => users.id),
    categoryId: integer("categoryId").references(() => skillCategories.id),
    resourceType: text("resourceType", { 
        enum: ["document", "video", "audio", "link", "code", "image"] 
    }).notNull(),
    url: text("url"),
    content: text("content"),
    fileSize: integer("fileSize"),
    mimeType: varchar("mimeType", { length: 100 }),
    isPublic: boolean().default(true).notNull(),
    isPremium: boolean().default(false).notNull(),
    isFeatured: boolean().default(false).notNull(),
    viewCount: integer("viewCount").default(0).notNull(),
    downloadCount: integer("downloadCount").default(0).notNull(),
    rating: decimal("rating", { precision: 3, scale: 2 }),
    ratingCount: integer("ratingCount").default(0).notNull(),
    language: varchar("language", { length: 10 }).default("en"),
    difficulty: text("difficulty", { 
        enum: ["beginner", "intermediate", "advanced", "all"] 
    }).default("all").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    ownerIdx: index("resources_owner_idx").on(table.ownerId),
    categoryIdx: index("resources_category_idx").on(table.categoryId),
    typeIdx: index("resources_type_idx").on(table.resourceType),
    publicIdx: index("resources_public_idx").on(table.isPublic),
}));

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

// Tagging system
export const resourceTags = pgTable("resource_tags", {
    id: serial("id").primaryKey(),
    resourceId: integer("resourceId").notNull().references(() => resources.id),
    tag: varchar("tag", { length: 50 }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    resourceIdx: index("resource_tags_resource_idx").on(table.resourceId),
    tagIdx: index("resource_tags_tag_idx").on(table.tag),
    uniqueTag: uniqueIndex("unique_resource_tag_idx").on(table.resourceId, table.tag),
}));

export type ResourceTag = typeof resourceTags.$inferSelect;
export type InsertResourceTag = typeof resourceTags.$inferInsert;

// User ratings
export const resourceRatings = pgTable("resource_ratings", {
    id: serial("id").primaryKey(),
    resourceId: integer("resourceId").notNull().references(() => resources.id),
    userId: integer("userId").notNull().references(() => users.id),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    resourceIdx: index("resource_ratings_resource_idx").on(table.resourceId),
    userIdx: index("resource_ratings_user_idx").on(table.userId),
    uniqueRating: uniqueIndex("unique_resource_rating_idx").on(table.resourceId, table.userId),
}));

export type ResourceRating = typeof resourceRatings.$inferSelect;
export type InsertResourceRating = typeof resourceRatings.$inferInsert;

// ------------------------------------------
// 8. Premium/Subscription
// ------------------------------------------

// Plan definitions
export const subscriptionPlans = pgTable("subscription_plans", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    billingCycle: text("billingCycle", { 
        enum: ["monthly", "yearly", "lifetime"] 
    }).default("monthly").notNull(),
    features: jsonb("features").$type<string[]>(),
    maxSkills: integer("maxSkills").default(5),
    maxSessionsPerMonth: integer("maxSessionsPerMonth").default(10),
    maxStorage: integer("maxStorage").default(1073741824),
    isPremium: boolean().default(false).notNull(),
    isActive: boolean().default(true).notNull(),
    tier: text("tier", { 
        enum: ["free", "basic", "pro", "enterprise"] 
    }).default("free").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    tierIdx: index("subscription_plans_tier_idx").on(table.tier),
}));

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

// User subscription status
export const subscriptions = pgTable("subscriptions", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull().unique().references(() => users.id),
    planId: integer("planId").notNull().references(() => subscriptionPlans.id),
    status: text("status", { 
        enum: ["active", "cancelled", "expired", "past_due", "trialing"] 
    }).default("trialing").notNull(),
    startDate: timestamp("startDate", { withTimezone: true }).defaultNow().notNull(),
    endDate: timestamp("endDate", { withTimezone: true }),
    cancelAtPeriodEnd: boolean().default(false).notNull(),
    autoRenew: boolean().default(true).notNull(),
    stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
    stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
    paymentMethod: text("paymentMethod"),
    lastPaymentAt: timestamp("lastPaymentAt", { withTimezone: true }),
    nextPaymentAt: timestamp("nextPaymentAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: index("subscriptions_user_idx").on(table.userId),
    planIdx: index("subscriptions_plan_idx").on(table.planId),
    statusIdx: index("subscriptions_status_idx").on(table.status),
}));

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
