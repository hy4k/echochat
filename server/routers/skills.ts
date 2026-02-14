import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import {
  skillCategories,
  userSkills,
  skillEndorsements,
  skillVerifications,
  type SkillCategory,
  type UserSkill,
  type SkillEndorsement,
  type SkillVerification,
  type InsertUserSkill,
  type InsertSkillEndorsement,
  type InsertSkillVerification,
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

export const skillsRouter = router({
  // Get all skill categories
  getCategories: protectedProcedure.query(async () => {
    const db = await getLearningDb();
    if (!db) return [];
    
    const categories = await db
      .select()
      .from(skillCategories)
      .where(eq(skillCategories.isActive, true))
      .orderBy(skillCategories.sortOrder, skillCategories.name);
    
    return categories;
  }),

  // Create a new skill for the user
  createSkill: protectedProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      proficiencyLevel: z.enum(["beginner", "intermediate", "advanced", "expert", "master"]).default("beginner"),
      teachingLevel: z.enum(["none", "beginner", "intermediate", "advanced", "expert"]).default("none"),
      learningLevel: z.enum(["none", "beginner", "intermediate", "advanced", "expert"]).default("none"),
      yearsExperience: z.number().optional(),
      isTeachEnabled: z.boolean().default(false),
      isLearnEnabled: z.boolean().default(true),
      hourlyRate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      const skill: InsertUserSkill = {
        userId: ctx.user.id,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description,
        proficiencyLevel: input.proficiencyLevel,
        teachingLevel: input.teachingLevel,
        learningLevel: input.learningLevel,
        yearsExperience: input.yearsExperience,
        isTeachEnabled: input.isTeachEnabled,
        isLearnEnabled: input.isLearnEnabled,
        hourlyRate: input.hourlyRate || null,
        isVerified: false,
        verificationStatus: "none",
      };

      const result = await db.insert(userSkills).values(skill).returning();
      return result[0];
    }),

  // Get current user's skills
  getUserSkills: protectedProcedure.query(async ({ ctx }) => {
    const db = await getLearningDb();
    if (!db) return [];

    const skills = await db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, ctx.user.id))
      .orderBy(desc(userSkills.createdAt));

    return skills;
  }),

  // Get another user's skills (public profile)
  getUserSkillsById: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getLearningDb();
      if (!db) return [];

      const skills = await db
        .select()
        .from(userSkills)
        .where(and(
          eq(userSkills.userId, input.userId),
          eq(userSkills.isLearnEnabled, true)
        ))
        .orderBy(desc(userSkills.proficiencyLevel));

      return skills;
    }),

  // Update skill proficiency
  updateSkill: protectedProcedure
    .input(z.object({
      id: z.number(),
      categoryId: z.number().optional(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      proficiencyLevel: z.enum(["beginner", "intermediate", "advanced", "expert", "master"]).optional(),
      teachingLevel: z.enum(["none", "beginner", "intermediate", "advanced", "expert"]).optional(),
      learningLevel: z.enum(["none", "beginner", "intermediate", "advanced", "expert"]).optional(),
      yearsExperience: z.number().optional(),
      isTeachEnabled: z.boolean().optional(),
      isLearnEnabled: z.boolean().optional(),
      hourlyRate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;
      
      // Verify ownership
      const existing = await db
        .select()
        .from(userSkills)
        .where(and(eq(userSkills.id, id), eq(userSkills.userId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Skill not found or access denied");
      }

      const result = await db
        .update(userSkills)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(userSkills.id, id))
        .returning();

      return result[0];
    }),

  // Delete a skill
  deleteSkill: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const existing = await db
        .select()
        .from(userSkills)
        .where(and(eq(userSkills.id, input.id), eq(userSkills.userId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Skill not found or access denied");
      }

      // Delete related endorsements and verifications first
      await db.delete(skillEndorsements).where(eq(skillEndorsements.skillId, input.id));
      await db.delete(skillVerifications).where(eq(skillVerifications.skillId, input.id));
      await db.delete(userSkills).where(eq(userSkills.id, input.id));

      return { success: true };
    }),

  // Endorse another user's skill
  endorseSkill: protectedProcedure
    .input(z.object({
      skillId: z.number(),
      endorsementType: z.enum(["teaching", "learning", "general"]).default("general"),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Get the skill to find the endorsee
      const skill = await db
        .select()
        .from(userSkills)
        .where(eq(userSkills.id, input.skillId))
        .limit(1);

      if (skill.length === 0) {
        throw new Error("Skill not found");
      }

      if (skill[0].userId === ctx.user.id) {
        throw new Error("Cannot endorse your own skill");
      }

      // Check for existing endorsement
      const existing = await db
        .select()
        .from(skillEndorsements)
        .where(and(
          eq(skillEndorsements.skillId, input.skillId),
          eq(skillEndorsements.endorserId, ctx.user.id)
        ))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("You have already endorsed this skill");
      }

      const endorsement: InsertSkillEndorsement = {
        skillId: input.skillId,
        endorserId: ctx.user.id,
        endorseeId: skill[0].userId,
        endorsementType: input.endorsementType,
        comment: input.comment,
      };

      const result = await db.insert(skillEndorsements).values(endorsement).returning();
      return result[0];
    }),

  // Request skill verification
  requestVerification: protectedProcedure
    .input(z.object({
      skillId: z.number(),
      verificationMethod: z.enum(["manual", "certificate", "portfolio", "assessment", "peer"]).default("manual"),
      documentUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const existing = await db
        .select()
        .from(userSkills)
        .where(and(eq(userSkills.id, input.skillId), eq(userSkills.userId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Skill not found or access denied");
      }

      // Check for pending verification
      const pendingVerification = await db
        .select()
        .from(skillVerifications)
        .where(and(
          eq(skillVerifications.skillId, input.skillId),
          eq(skillVerifications.status, "pending")
        ))
        .limit(1);

      if (pendingVerification.length > 0) {
        throw new Error("Verification already pending");
      }

      // Create verification request
      const verification: InsertSkillVerification = {
        skillId: input.skillId,
        verifierId: null,
        verificationMethod: input.verificationMethod,
        status: "pending",
        documentUrl: input.documentUrl,
        notes: input.notes,
      };

      const result = await db.insert(skillVerifications).values(verification).returning();

      // Update skill status
      await db
        .update(userSkills)
        .set({ verificationStatus: "pending", updatedAt: new Date() })
        .where(eq(userSkills.id, input.skillId));

      return result[0];
    }),
});

export type SkillsRouter = typeof skillsRouter;
