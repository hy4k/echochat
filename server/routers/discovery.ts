import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, sql, not, inArray, or } from "drizzle-orm";
import {
  users,
  userSkills,
  userProfiles,
  userInterests,
  skillCategories,
  type User,
  type UserSkill,
  type UserProfile,
  type UserInterest,
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

export const discoveryRouter = router({
  // Search for users by skills/interests
  searchUsers: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      skillIds: z.array(z.number()).optional(),
      categoryIds: z.array(z.number()).optional(),
      proficiencyLevel: z.enum(["beginner", "intermediate", "advanced", "expert", "master"]).optional(),
      teachingEnabled: z.boolean().optional(),
      learningEnabled: z.boolean().optional(),
      timezone: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) return [];

      // Start with users who have public profiles
      let baseQuery = db
        .select({ user: users, profile: userProfiles })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(
          and(
            not(eq(users.id, ctx.user.id)),
            or(
              eq(userProfiles.isPublicProfile, true),
              sql`${userProfiles.isPublicProfile} IS NULL`
            )
          )
        )
        .limit(input.limit * 2);

      let usersWithSkills = await baseQuery;

      // Filter by skills if specified
      if (input.skillIds && input.skillIds.length > 0) {
        const userIdsWithSkills = await db
          .select({ userId: userSkills.userId })
          .from(userSkills)
          .where(
            input.skillIds.length > 0
              ? sql`${userSkills.id} IN ${input.skillIds}`
              : sql`1=0`
          );

        const userIdSet = new Set(userIdsWithSkills.map(u => u.userId));
        usersWithSkills = usersWithSkills.filter(u => userIdSet.has(u.user.id));
      }

      // Get skills for each user
      const enrichedUsers = [];
      for (const userData of usersWithSkills.slice(0, input.limit)) {
        const skills = await db
          .select()
          .from(userSkills)
          .where(and(
            eq(userSkills.userId, userData.user.id),
            eq(userSkills.isLearnEnabled, true)
          ));

        // Filter by query if specified
        if (input.query) {
          const queryLower = input.query.toLowerCase();
          const matchesQuery = 
            userData.user.name?.toLowerCase().includes(queryLower) ||
            skills.some(s => s.name.toLowerCase().includes(queryLower));

          if (!matchesQuery) continue;
        }

        enrichedUsers.push({
          ...userData,
          skills,
        });
      }

      return enrichedUsers;
    }),

  // Get recommended learners/teachers
  getRecommendedUsers: protectedProcedure
    .input(z.object({
      type: z.enum(["learners", "teachers", "both"]).default("both"),
      limit: z.number().default(10),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) return [];

      // Get current user's interests
      const userInterestsList = await db
        .select()
        .from(userInterests)
        .where(and(
          eq(userInterests.userId, ctx.user.id),
          eq(userInterests.isActive, true)
        ));

      const interestCategoryIds = userInterestsList.map(i => i.categoryId);

      // Find users with matching interests who can teach
      let recommendedUsers: Array<{ user: User; profile: UserProfile | null; skills: UserSkill[] }> = [];

      if (interestCategoryIds.length > 0) {
        // Get users with skills in matching categories
        const matchingSkills = await db
          .select()
          .from(userSkills)
          .where(
            interestCategoryIds.length > 0
              ? sql`${userSkills.categoryId} IN ${interestCategoryIds}`
              : sql`1=0`
          );

        const matchingUserIds = [...new Set(matchingSkills.map(s => s.userId))];

        if (matchingUserIds.length > 0 && !matchingUserIds.includes(ctx.user.id)) {
          for (const userId of matchingUserIds.slice(0, input.limit * 2)) {
            const userData = await db
              .select()
              .from(users)
              .where(eq(users.id, userId))
              .limit(1);

            if (userData.length === 0) continue;

            const profile = await db
              .select()
              .from(userProfiles)
              .where(eq(userProfiles.userId, userId))
              .limit(1);

            const skills = await db
              .select()
              .from(userSkills)
              .where(and(
                eq(userSkills.userId, userId),
                input.type === "teachers" ? eq(userSkills.isTeachEnabled, true) :
                input.type === "learners" ? eq(userSkills.isLearnEnabled, true) :
                or(eq(userSkills.isTeachEnabled, true), eq(userSkills.isLearnEnabled, true))
              ));

            if (skills.length > 0) {
              recommendedUsers.push({
                user: userData[0],
                profile: profile.length > 0 ? profile[0] : null,
                skills,
              });
            }
          }
        }
      }

      // If not enough recommendations, get active users with skills
      if (recommendedUsers.length < input.limit) {
        const additionalUsers = await db
          .select({ user: users, profile: userProfiles })
          .from(users)
          .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
          .where(
            and(
              not(eq(users.id, ctx.user.id)),
              sql`${users.id} NOT IN ${recommendedUsers.map(u => u.user.id)}`
            )
          )
          .limit(input.limit - recommendedUsers.length);

        for (const userData of additionalUsers) {
          const skills = await db
            .select()
            .from(userSkills)
            .where(and(
              eq(userSkills.userId, userData.user.id),
              input.type === "teachers" ? eq(userSkills.isTeachEnabled, true) :
              input.type === "learners" ? eq(userSkills.isLearnEnabled, true) :
              or(eq(userSkills.isTeachEnabled, true), eq(userSkills.isLearnEnabled, true))
            ));

          if (skills.length > 0) {
            recommendedUsers.push({
              user: userData.user,
              profile: userData.profile,
              skills,
            });
          }
        }
      }

      return recommendedUsers.slice(0, input.limit);
    }),

  // Get featured/top users
  getFeaturedUsers: protectedProcedure
    .input(z.object({
      limit: z.number().default(10),
      period: z.enum(["week", "month", "all_time"]).default("week"),
    }))
    .query(async ({ input }) => {
      const db = await getLearningDb();
      if (!db) return [];

      // Get users with most endorsements in the period
      // For now, we'll get users with verified skills and good profiles
      const featuredUsers = await db
        .select({ user: users, profile: userProfiles })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .orderBy(desc(users.createdAt))
        .limit(input.limit * 2);

      const enrichedUsers = [];
      for (const userData of featuredUsers) {
        // Skip users without profiles or private profiles
        if (!userData.profile || !userData.profile.isPublicProfile) continue;

        const skills = await db
          .select()
          .from(userSkills)
          .where(and(
            eq(userSkills.userId, userData.user.id),
            eq(userSkills.isLearnEnabled, true)
          ));

        // Count endorsements
        const endorsementCount = await db.execute(sql`
          SELECT COUNT(*) as count FROM skill_endorsements 
          WHERE endorseeId = ${userData.user.id}
        `);
        const count = Number((endorsementCount as any)[0]?.count || 0);

        enrichedUsers.push({
          ...userData,
          skills,
          endorsementCount: count,
        });
      }

      // Sort by endorsement count
      enrichedUsers.sort((a, b) => b.endorsementCount - a.endorsementCount);

      return enrichedUsers.slice(0, input.limit);
    }),
});

export type DiscoveryRouter = typeof discoveryRouter;
