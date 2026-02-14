import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc } from "drizzle-orm";
import {
  userProfiles,
  userInterests,
  learningGoals,
  type UserProfile,
  type UserInterest,
  type LearningGoal,
  type InsertUserProfile,
  type InsertUserInterest,
  type InsertLearningGoal,
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

export const profileRouter = router({
  // Get own extended profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getLearningDb();
    if (!db) return null;

    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, ctx.user.id))
      .limit(1);

    if (profile.length === 0) {
      // Create default profile
      const newProfile: InsertUserProfile = {
        userId: ctx.user.id,
        timezone: "UTC",
        isPublicProfile: true,
        isAvailableForMentoring: true,
        preferredSessionLength: 60,
      };

      const result = await db.insert(userProfiles).values(newProfile).returning();
      return result[0];
    }

    // Get interests
    const interests = await db
      .select()
      .from(userInterests)
      .where(and(
        eq(userInterests.userId, ctx.user.id),
        eq(userInterests.isActive, true)
      ));

    // Get learning goals
    const goals = await db
      .select()
      .from(learningGoals)
      .where(eq(learningGoals.userId, ctx.user.id))
      .orderBy(desc(learningGoals.createdAt));

    return {
      ...profile[0],
      interests,
      learningGoals: goals,
    };
  }),

  // Get another user's profile (public)
  getProfileById: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getLearningDb();
      if (!db) return null;

      const profile = await db
        .select()
        .from(userProfiles)
        .where(and(
          eq(userProfiles.userId, input.userId),
          eq(userProfiles.isPublicProfile, true)
        ))
        .limit(1);

      if (profile.length === 0) {
        return null;
      }

      // Get interests (only active ones)
      const interests = await db
        .select()
        .from(userInterests)
        .where(and(
          eq(userInterests.userId, input.userId),
          eq(userInterests.isActive, true)
        ));

      // Get active learning goals
      const goals = await db
        .select()
        .from(learningGoals)
        .where(and(
          eq(learningGoals.userId, input.userId),
          eq(learningGoals.status, "active")
        ))
        .orderBy(desc(learningGoals.createdAt));

      return {
        ...profile[0],
        interests,
        learningGoals: goals,
      };
    }),

  // Update extended profile
  updateProfile: protectedProcedure
    .input(z.object({
      bio: z.string().optional(),
      avatarUrl: z.string().optional(),
      headline: z.string().max(200).optional(),
      timezone: z.string().optional(),
      country: z.string().max(100).optional(),
      city: z.string().max(100).optional(),
      languages: z.array(z.string()).optional(),
      availability: z.any().optional(),
      teachingStyle: z.string().optional(),
      learningStyle: z.string().optional(),
      isPublicProfile: z.boolean().optional(),
      isAvailableForMentoring: z.boolean().optional(),
      preferredSessionLength: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Check if profile exists
      const existing = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        const result = await db
          .update(userProfiles)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(userProfiles.userId, ctx.user.id))
          .returning();
        return result[0];
      } else {
        // Create new
        const profile: InsertUserProfile = {
          userId: ctx.user.id,
          bio: input.bio,
          avatarUrl: input.avatarUrl,
          headline: input.headline,
          timezone: input.timezone || "UTC",
          country: input.country,
          city: input.city,
          languages: input.languages || null,
          availability: input.availability || null,
          teachingStyle: input.teachingStyle,
          learningStyle: input.learningStyle,
          isPublicProfile: input.isPublicProfile ?? true,
          isAvailableForMentoring: input.isAvailableForMentoring ?? true,
          preferredSessionLength: input.preferredSessionLength || 60,
        };

        const result = await db.insert(userProfiles).values(profile).returning();
        return result[0];
      }
    }),

  // Add an interest
  addInterest: protectedProcedure
    .input(z.object({
      categoryId: z.number(),
      interestLevel: z.enum(["low", "medium", "high"]).default("medium"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Ensure profile exists
      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, ctx.user.id))
        .limit(1);

      if (profile.length === 0) {
        const newProfile: InsertUserProfile = {
          userId: ctx.user.id,
          timezone: "UTC",
          isPublicProfile: true,
          isAvailableForMentoring: true,
          preferredSessionLength: 60,
        };
        await db.insert(userProfiles).values(newProfile);
      }

      // Check if interest already exists
      const existing = await db
        .select()
        .from(userInterests)
        .where(and(
          eq(userInterests.userId, ctx.user.id),
          eq(userInterests.categoryId, input.categoryId)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        const result = await db
          .update(userInterests)
          .set({ 
            interestLevel: input.interestLevel,
            isActive: true 
          })
          .where(eq(userInterests.id, existing[0].id))
          .returning();
        return result[0];
      }

      // Create new interest
      const interest: InsertUserInterest = {
        userId: ctx.user.id,
        categoryId: input.categoryId,
        interestLevel: input.interestLevel,
        isActive: true,
      };

      const result = await db.insert(userInterests).values(interest).returning();
      return result[0];
    }),

  // Remove an interest
  removeInterest: protectedProcedure
    .input(z.object({ interestId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const interest = await db
        .select()
        .from(userInterests)
        .where(and(
          eq(userInterests.id, input.interestId),
          eq(userInterests.userId, ctx.user.id)
        ))
        .limit(1);

      if (interest.length === 0) {
        throw new Error("Interest not found or access denied");
      }

      // Soft delete
      await db
        .update(userInterests)
        .set({ isActive: false })
        .where(eq(userInterests.id, input.interestId));

      return { success: true };
    }),

  // Add a learning goal
  addLearningGoal: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      targetSkillId: z.number().optional(),
      targetLevel: z.enum(["beginner", "intermediate", "advanced", "expert", "master"]).optional(),
      deadline: z.string().optional(), // ISO date string
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Ensure profile exists
      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, ctx.user.id))
        .limit(1);

      if (profile.length === 0) {
        const newProfile: InsertUserProfile = {
          userId: ctx.user.id,
          timezone: "UTC",
          isPublicProfile: true,
          isAvailableForMentoring: true,
          preferredSessionLength: 60,
        };
        await db.insert(userProfiles).values(newProfile);
      }

      const goal: InsertLearningGoal = {
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        targetSkillId: input.targetSkillId || null,
        targetLevel: input.targetLevel || null,
        deadline: input.deadline ? new Date(input.deadline) : null,
        status: "active",
      };

      const result = await db.insert(learningGoals).values(goal).returning();
      return result[0];
    }),

  // Remove a learning goal
  removeLearningGoal: protectedProcedure
    .input(z.object({ goalId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const goal = await db
        .select()
        .from(learningGoals)
        .where(and(
          eq(learningGoals.id, input.goalId),
          eq(learningGoals.userId, ctx.user.id)
        ))
        .limit(1);

      if (goal.length === 0) {
        throw new Error("Goal not found or access denied");
      }

      // Update status to abandoned
      await db
        .update(learningGoals)
        .set({ status: "abandoned", updatedAt: new Date() })
        .where(eq(learningGoals.id, input.goalId));

      return { success: true };
    }),
});

export type ProfileRouter = typeof profileRouter;
