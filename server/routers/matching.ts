import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, sql, not, inArray, or } from "drizzle-orm";
import {
  matches,
  matchPreferences,
  userSkills,
  users,
  type Match,
  type MatchPreference,
  type InsertMatch,
  type InsertMatchPreference,
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

export const matchingRouter = router({
  // Get user's match preferences
  getMatchPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getLearningDb();
    if (!db) return null;

    const preferences = await db
      .select()
      .from(matchPreferences)
      .where(eq(matchPreferences.userId, ctx.user.id))
      .limit(1);

    return preferences.length > 0 ? preferences[0] : null;
  }),

  // Update match preferences
  updateMatchPreferences: protectedProcedure
    .input(z.object({
      preferredSkills: z.array(z.number()).optional(),
      excludedUserIds: z.array(z.number()).optional(),
      minCompatibilityScore: z.string().optional(),
      preferredTimezones: z.array(z.string()).optional(),
      preferredSessionLength: z.number().optional(),
      teachingStylePreference: z.string().optional(),
      learningStylePreference: z.string().optional(),
      autoMatch: z.boolean().optional(),
      notificationFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(matchPreferences)
        .where(eq(matchPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        const result = await db
          .update(matchPreferences)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(matchPreferences.userId, ctx.user.id))
          .returning();
        return result[0];
      } else {
        // Create new
        const prefs: InsertMatchPreference = {
          userId: ctx.user.id,
          preferredSkills: input.preferredSkills || null,
          excludedUserIds: input.excludedUserIds || null,
          minCompatibilityScore: input.minCompatibilityScore || "50",
          preferredTimezones: input.preferredTimezones || null,
          preferredSessionLength: input.preferredSessionLength || null,
          teachingStylePreference: input.teachingStylePreference || null,
          learningStylePreference: input.learningStylePreference || null,
          autoMatch: input.autoMatch || false,
          notificationFrequency: input.notificationFrequency || "daily",
        };
        const result = await db.insert(matchPreferences).values(prefs).returning();
        return result[0];
      }
    }),

  // Generate potential matches (algorithm)
  generateMatches: protectedProcedure
    .input(z.object({
      limit: z.number().default(10),
      forceRefresh: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Get user's skills
      const userSkillsList = await db
        .select()
        .from(userSkills)
        .where(and(
          eq(userSkills.userId, ctx.user.id),
          eq(userSkills.isLearnEnabled, true)
        ));

      // Get user's preferences
      const preferences = await db
        .select()
        .from(matchPreferences)
        .where(eq(matchPreferences.userId, ctx.user.id))
        .limit(1);

      const userPref = preferences.length > 0 ? preferences[0] : null;

      // Get potential matches (users who have skills to teach)
      let potentialMatches = await db
        .select({
          user: users,
          skills: userSkills,
        })
        .from(userSkills)
        .innerJoin(users, eq(userSkills.userId, users.id))
        .where(and(
          eq(userSkills.isTeachEnabled, true),
          not(eq(userSkills.userId, ctx.user.id))
        ))
        .limit(input.limit * 2);

      // Get existing matches to exclude
      const existingMatches = await db
        .select()
        .from(matches)
        .where(or(
          eq(matches.user1Id, ctx.user.id),
          eq(matches.user2Id, ctx.user.id)
        ));

      const excludedIds = new Set([
        ctx.user.id,
        ...(userPref?.excludedUserIds || []),
        ...existingMatches.map(m => m.user1Id === ctx.user.id ? m.user2Id : m.user1Id),
      ]);

      // Filter and score matches
      const scoredMatches: Array<{
        user: typeof users.$inferSelect;
        skills: typeof userSkills.$inferSelect;
        score: number;
      }> = [];

      for (const match of potentialMatches) {
        if (excludedIds.has(match.user.id)) continue;
        
        // Calculate compatibility score (simplified algorithm)
        let score = 50; // Base score
        
        // Check skill match
        if (userSkillsList.length > 0 && userPref?.preferredSkills) {
          const hasPreferredSkill = userSkillsList.some(us => 
            userPref.preferredSkills?.includes(us.id)
          );
          if (hasPreferredSkill) score += 25;
        } else {
          score += 10; // Some bonus for having skills
        }

        // Check teaching/learning compatibility
        if (match.skills.teachingLevel !== "none" && userSkillsList.some(s => s.learningLevel !== "none")) {
          score += 15;
        }

        scoredMatches.push({
          user: match.user,
          skills: match.skills,
          score: Math.min(score, 100),
        });
      }

      // Sort by score and take top results
      scoredMatches.sort((a, b) => b.score - a.score);
      const topMatches = scoredMatches.slice(0, input.limit);

      // Create match records
      const createdMatches: Match[] = [];
      for (const match of topMatches) {
        const matchData: InsertMatch = {
          user1Id: ctx.user.id,
          user2Id: match.user.id,
          compatibilityScore: match.score.toString(),
          skillMatchScore: (match.score * 0.8).toString(),
          availabilityMatchScore: (match.score * 0.5).toString(),
          status: "suggested",
          matchedSkills: [{
            skillId: match.skills.id,
            skillName: match.skills.name,
            user1CanTeach: false,
            user2CanTeach: match.skills.teachingLevel !== "none",
          }],
          suggestedAt: new Date(),
        };

        const result = await db.insert(matches).values(matchData).returning();
        createdMatches.push(result[0]);
      }

      return createdMatches;
    }),

  // Get user's current matches
  getMatches: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "suggested", "accepted", "rejected", "expired"]).optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) return [];

      let query = db
        .select()
        .from(matches)
        .where(or(
          eq(matches.user1Id, ctx.user.id),
          eq(matches.user2Id, ctx.user.id)
        ))
        .orderBy(desc(matches.suggestedAt))
        .limit(input.limit);

      if (input.status) {
        query = db
          .select()
          .from(matches)
          .where(and(
            or(
              eq(matches.user1Id, ctx.user.id),
              eq(matches.user2Id, ctx.user.id)
            ),
            eq(matches.status, input.status)
          ))
          .orderBy(desc(matches.suggestedAt))
          .limit(input.limit);
      }

      return query;
    }),

  // Respond to a match (accept/decline)
  respondToMatch: protectedProcedure
    .input(z.object({
      matchId: z.number(),
      action: z.enum(["accepted", "rejected"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify user is part of the match
      const match = await db
        .select()
        .from(matches)
        .where(and(
          eq(matches.id, input.matchId),
          or(
            eq(matches.user1Id, ctx.user.id),
            eq(matches.user2Id, ctx.user.id)
          )
        ))
        .limit(1);

      if (match.length === 0) {
        throw new Error("Match not found or access denied");
      }

      if (match[0].status !== "pending" && match[0].status !== "suggested") {
        throw new Error("Match already responded to");
      }

      const result = await db
        .update(matches)
        .set({
          status: input.action,
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(matches.id, input.matchId))
        .returning();

      return result[0];
    }),

  // Get specific match details
  getMatchById: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) return null;

      const match = await db
        .select()
        .from(matches)
        .where(and(
          eq(matches.id, input.matchId),
          or(
            eq(matches.user1Id, ctx.user.id),
            eq(matches.user2Id, ctx.user.id)
          )
        ))
        .limit(1);

      if (match.length === 0) {
        throw new Error("Match not found or access denied");
      }

      return match[0];
    }),
});

export type MatchingRouter = typeof matchingRouter;
