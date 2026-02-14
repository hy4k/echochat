import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  resources,
  resourceTags,
  resourceRatings,
  type Resource,
  type ResourceTag,
  type ResourceRating,
  type InsertResource,
  type InsertResourceTag,
  type InsertResourceRating,
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

export const resourcesRouter = router({
  // Upload/share a resource
  createResource: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      categoryId: z.number().optional(),
      resourceType: z.enum(["document", "video", "audio", "link", "code", "image"]),
      url: z.string().optional(),
      content: z.string().optional(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      isPublic: z.boolean().default(true),
      isPremium: z.boolean().default(false),
      language: z.string().default("en"),
      difficulty: z.enum(["beginner", "intermediate", "advanced", "all"]).default("all"),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      const resource: InsertResource = {
        title: input.title,
        description: input.description,
        ownerId: ctx.user.id,
        categoryId: input.categoryId || null,
        resourceType: input.resourceType,
        url: input.url || null,
        content: input.content || null,
        fileSize: input.fileSize || null,
        mimeType: input.mimeType || null,
        isPublic: input.isPublic,
        isPremium: input.isPremium,
        language: input.language,
        difficulty: input.difficulty,
      };

      const result = await db.insert(resources).values(resource).returning();
      const createdResource = result[0];

      // Add tags
      if (input.tags && input.tags.length > 0) {
        for (const tag of input.tags) {
          const resourceTag: InsertResourceTag = {
            resourceId: createdResource.id,
            tag,
          };
          await db.insert(resourceTags).values(resourceTag);
        }
      }

      return createdResource;
    }),

  // Search/list resources
  getResources: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      categoryId: z.number().optional(),
      resourceType: z.enum(["document", "video", "audio", "link", "code", "image"]).optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced", "all"]).optional(),
      language: z.string().optional(),
      tags: z.array(z.string()).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
      sortBy: z.enum(["newest", "popular", "rating"]).default("newest"),
    }))
    .query(async ({ input }) => {
      const db = await getLearningDb();
      if (!db) return [];

      // Base query - only public resources
      let query = db
        .select()
        .from(resources)
        .where(eq(resources.isPublic, true));

      if (input.categoryId) {
        query = db
          .select()
          .from(resources)
          .where(and(
            eq(resources.isPublic, true),
            eq(resources.categoryId, input.categoryId)
          ));
      }

      if (input.resourceType) {
        query = db
          .select()
          .from(resources)
          .where(and(
            eq(resources.isPublic, true),
            eq(resources.resourceType, input.resourceType)
          ));
      }

      if (input.difficulty) {
        query = db
          .select()
          .from(resources)
          .where(and(
            eq(resources.isPublic, true),
            eq(resources.difficulty, input.difficulty)
          ));
      }

      // Sort
      let orderedQuery = query;
      switch (input.sortBy) {
        case "popular":
          orderedQuery = query.orderBy(desc(resources.downloadCount));
          break;
        case "rating":
          orderedQuery = query.orderBy(desc(resources.rating));
          break;
        default:
          orderedQuery = query.orderBy(desc(resources.createdAt));
      }

      let result = await orderedQuery.limit(input.limit).offset(input.offset);

      // Filter by search query if provided
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        result = result.filter(r => 
          r.title.toLowerCase().includes(searchLower) ||
          (r.description && r.description.toLowerCase().includes(searchLower))
        );
      }

      // Filter by tags if provided
      if (input.tags && input.tags.length > 0) {
        const resourceIds = result.map(r => r.id);
        if (resourceIds.length > 0) {
          const taggedResources = await db
            .select()
            .from(resourceTags)
            .where(
              resourceIds.length > 0
                ? sql`${resourceTags.resourceId} IN ${resourceIds} AND ${resourceTags.tag} IN ${input.tags}`
                : sql`1=0`
            );

          const taggedIds = new Set(taggedResources.map(t => t.resourceId));
          result = result.filter(r => taggedIds.has(r.id));
        }
      }

      return result;
    }),

  // Get resource details
  getResourceById: protectedProcedure
    .input(z.object({ resourceId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) return null;

      const resource = await db
        .select()
        .from(resources)
        .where(eq(resources.id, input.resourceId))
        .limit(1);

      if (resource.length === 0) {
        throw new Error("Resource not found");
      }

      // Check access for private resources
      if (!resource[0].isPublic && resource[0].ownerId !== ctx.user.id) {
        throw new Error("Access denied");
      }

      // Get tags
      const tags = await db
        .select()
        .from(resourceTags)
        .where(eq(resourceTags.resourceId, input.resourceId));

      return {
        ...resource[0],
        tags: tags.map(t => t.tag),
      };
    }),

  // Update resource
  updateResource: protectedProcedure
    .input(z.object({
      resourceId: z.number(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      categoryId: z.number().optional(),
      url: z.string().optional(),
      content: z.string().optional(),
      isPublic: z.boolean().optional(),
      isPremium: z.boolean().optional(),
      language: z.string().optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced", "all"]).optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      const { resourceId, tags, ...updateData } = input;

      // Verify ownership
      const resource = await db
        .select()
        .from(resources)
        .where(and(
          eq(resources.id, resourceId),
          eq(resources.ownerId, ctx.user.id)
        ))
        .limit(1);

      if (resource.length === 0) {
        throw new Error("Resource not found or access denied");
      }

      // Update resource
      const result = await db
        .update(resources)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(resources.id, resourceId))
        .returning();

      // Update tags if provided
      if (tags) {
        // Delete existing tags
        await db.delete(resourceTags).where(eq(resourceTags.resourceId, resourceId));

        // Add new tags
        for (const tag of tags) {
          const resourceTag: InsertResourceTag = {
            resourceId,
            tag,
          };
          await db.insert(resourceTags).values(resourceTag);
        }
      }

      return result[0];
    }),

  // Delete resource
  deleteResource: protectedProcedure
    .input(z.object({ resourceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const resource = await db
        .select()
        .from(resources)
        .where(and(
          eq(resources.id, input.resourceId),
          eq(resources.ownerId, ctx.user.id)
        ))
        .limit(1);

      if (resource.length === 0) {
        throw new Error("Resource not found or access denied");
      }

      // Delete related data
      await db.delete(resourceRatings).where(eq(resourceRatings.resourceId, input.resourceId));
      await db.delete(resourceTags).where(eq(resourceTags.resourceId, input.resourceId));
      await db.delete(resources).where(eq(resources.id, input.resourceId));

      return { success: true };
    }),

  // Rate a resource
  rateResource: protectedProcedure
    .input(z.object({
      resourceId: z.number(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Check if resource exists
      const resource = await db
        .select()
        .from(resources)
        .where(eq(resources.id, input.resourceId))
        .limit(1);

      if (resource.length === 0) {
        throw new Error("Resource not found");
      }

      // Check if user already rated
      const existing = await db
        .select()
        .from(resourceRatings)
        .where(and(
          eq(resourceRatings.resourceId, input.resourceId),
          eq(resourceRatings.userId, ctx.user.id)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing rating
        const result = await db
          .update(resourceRatings)
          .set({ rating: input.rating, comment: input.comment, updatedAt: new Date() })
          .where(eq(resourceRatings.id, existing[0].id))
          .returning();

        // Recalculate average rating
        await recalculateResourceRating(db, input.resourceId);

        return result[0];
      }

      // Create new rating
      const rating: InsertResourceRating = {
        resourceId: input.resourceId,
        userId: ctx.user.id,
        rating: input.rating,
        comment: input.comment,
      };

      const result = await db.insert(resourceRatings).values(rating).returning();

      // Update resource rating stats
      await recalculateResourceRating(db, input.resourceId);

      return result[0];
    }),

  // Track downloads
  downloadResource: protectedProcedure
    .input(z.object({ resourceId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Increment download count
      const resource = await db
        .select()
        .from(resources)
        .where(eq(resources.id, input.resourceId))
        .limit(1);

      if (resource.length === 0) {
        throw new Error("Resource not found");
      }

      await db
        .update(resources)
        .set({ downloadCount: resource[0].downloadCount + 1 })
        .where(eq(resources.id, input.resourceId));

      return { success: true };
    }),
});

// Helper function to recalculate resource rating
async function recalculateResourceRating(db: ReturnType<typeof drizzle>, resourceId: number) {
  const ratings = await db
    .select()
    .from(resourceRatings)
    .where(eq(resourceRatings.resourceId, resourceId));

  if (ratings.length > 0) {
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    await db
      .update(resources)
      .set({ 
        rating: avgRating.toFixed(2),
        ratingCount: ratings.length 
      })
      .where(eq(resources.id, resourceId));
  }
}

export type ResourcesRouter = typeof resourcesRouter;
