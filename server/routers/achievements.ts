import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  achievements,
  userAchievements,
  badges,
  userBadges,
  type Achievement,
  type UserAchievement,
  type Badge,
  type UserBadge,
  type InsertUserAchievement,
  type InsertUserBadge,
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

export const achievementsRouter = router({
  // Get all achievements
  getAchievements: protectedProcedure
    .input(z.object({
      category: z.enum(["learning", "teaching", "social", "streak", "milestone"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getLearningDb();
      if (!db) return [];

      let query = db
        .select()
        .from(achievements)
        .where(eq(achievements.isActive, true))
        .orderBy(achievements.category, achievements.name);

      if (input.category) {
        query = db
          .select()
          .from(achievements)
          .where(and(
            eq(achievements.isActive, true),
            eq(achievements.category, input.category)
          ))
          .orderBy(achievements.name);
      }

      return query;
    }),

  // Get user's earned achievements
  getUserAchievements: protectedProcedure.query(async ({ ctx }) => {
    const db = await getLearningDb();
    if (!db) return [];

    const userAchievementsList = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, ctx.user.id))
      .orderBy(desc(userAchievements.earnedAt));

    // Get achievement details
    const achievementIds = userAchievementsList.map(ua => ua.achievementId);
    if (achievementIds.length === 0) return userAchievementsList;

    const achievementDetails = await db
      .select()
      .from(achievements)
      .where(
        achievementIds.length > 0 
          ? sql`${achievements.id} IN ${achievementIds}`
          : sql`1=0`
      );

    // Merge
    return userAchievementsList.map(ua => ({
      ...ua,
      achievement: achievementDetails.find(a => a.id === ua.achievementId),
    }));
  }),

  // Check and award new achievements
  checkAndAwardAchievements: protectedProcedure
    .input(z.object({
      trigger: z.enum([
        "session_completed",
        "skill_added",
        "endorsement_received",
        "partnership_formed",
        "streak_milestone",
        "resource_shared",
      ]),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      const newlyEarned: Achievement[] = [];

      // Get all active achievements
      const allAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.isActive, true));

      // Get user's existing achievements
      const userAchievementsList = await db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, ctx.user.id),
          eq(userAchievements.isCompleted, true)
        ));

      const earnedIds = new Set(userAchievementsList.map(ua => ua.achievementId));

      // Check each achievement based on trigger
      for (const achievement of allAchievements) {
        if (earnedIds.has(achievement.id)) continue;

        const criteria = achievement.criteria as { type: string; value: number; metric: string } | null;
        if (!criteria) continue;

        let shouldAward = false;

        switch (input.trigger) {
          case "session_completed":
            if (criteria.type === "session_count") {
              // Count user's completed sessions
              const countResult = await db.execute(sql`
                SELECT COUNT(*) as count FROM scheduled_sessions 
                WHERE hostId = ${ctx.user.id} AND status = 'completed'
              `);
              const count = Number((countResult as any)[0]?.count || 0);
              shouldAward = count >= criteria.value;
            }
            break;

          case "skill_added":
            if (criteria.type === "skill_count") {
              const countResult = await db.execute(sql`
                SELECT COUNT(*) as count FROM user_skills 
                WHERE userId = ${ctx.user.id}
              `);
              const count = Number((countResult as any)[0]?.count || 0);
              shouldAward = count >= criteria.value;
            }
            break;

          case "endorsement_received":
            if (criteria.type === "endorsement_count") {
              const countResult = await db.execute(sql`
                SELECT COUNT(*) as count FROM skill_endorsements 
                WHERE endorseeId = ${ctx.user.id}
              `);
              const count = Number((countResult as any)[0]?.count || 0);
              shouldAward = count >= criteria.value;
            }
            break;

          case "partnership_formed":
            if (criteria.type === "partnership_count") {
              const countResult = await db.execute(sql`
                SELECT COUNT(*) as count FROM partnerships 
                WHERE (user1Id = ${ctx.user.id} OR user2Id = ${ctx.user.id}) 
                AND status = 'active'
              `);
              const count = Number((countResult as any)[0]?.count || 0);
              shouldAward = count >= criteria.value;
            }
            break;

          case "resource_shared":
            if (criteria.type === "resource_count") {
              const countResult = await db.execute(sql`
                SELECT COUNT(*) as count FROM resources 
                WHERE ownerId = ${ctx.user.id}
              `);
              const count = Number((countResult as any)[0]?.count || 0);
              shouldAward = count >= criteria.value;
            }
            break;

          case "streak_milestone":
            if (criteria.type === "streak_days") {
              // This would need streak tracking logic
              shouldAward = false;
            }
            break;
        }

        if (shouldAward) {
          // Award achievement
          const userAchievement: InsertUserAchievement = {
            userId: ctx.user.id,
            achievementId: achievement.id,
            earnedAt: new Date(),
            progress: criteria.value,
            isCompleted: true,
          };

          await db.insert(userAchievements).values(userAchievement);
          newlyEarned.push(achievement);
        } else {
          // Update progress if not complete
          const existingProgress = await db
            .select()
            .from(userAchievements)
            .where(and(
              eq(userAchievements.userId, ctx.user.id),
              eq(userAchievements.achievementId, achievement.id)
            ))
            .limit(1);

          if (existingProgress.length === 0) {
            // Create initial progress record
            const userAchievement: InsertUserAchievement = {
              userId: ctx.user.id,
              achievementId: achievement.id,
              progress: 0,
              isCompleted: false,
            };
            await db.insert(userAchievements).values(userAchievement);
          }
        }
      }

      return {
        newlyEarned,
        totalEarned: userAchievementsList.length + newlyEarned.length,
      };
    }),

  // Get all badges
  getBadges: protectedProcedure.query(async () => {
    const db = await getLearningDb();
    if (!db) return [];

    return await db
      .select()
      .from(badges)
      .where(eq(badges.isActive, true))
      .orderBy(badges.category, badges.name);
  }),

  // Get user's badges
  getUserBadges: protectedProcedure.query(async ({ ctx }) => {
    const db = await getLearningDb();
    if (!db) return [];

    const userBadgesList = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, ctx.user.id))
      .orderBy(desc(userBadges.earnedAt));

    // Get badge details
    const badgeIds = userBadgesList.map(ub => ub.badgeId);
    if (badgeIds.length === 0) return userBadgesList;

    const badgeDetails = await db
      .select()
      .from(badges)
      .where(
        badgeIds.length > 0 
          ? sql`${badges.id} IN ${badgeIds}`
          : sql`1=0`
      );

    // Merge
    return userBadgesList.map(ub => ({
      ...ub,
      badge: badgeDetails.find(b => b.id === ub.badgeId),
    }));
  }),
});

export type AchievementsRouter = typeof achievementsRouter;
