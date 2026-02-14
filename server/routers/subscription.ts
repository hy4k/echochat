import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import {
  subscriptionPlans,
  subscriptions,
  type SubscriptionPlan,
  type Subscription,
  type InsertSubscriptionPlan,
  type InsertSubscription,
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

export const subscriptionRouter = router({
  // Get available subscription plans
  getPlans: protectedProcedure.query(async () => {
    const db = await getLearningDb();
    if (!db) return [];

    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.price);

    return plans;
  }),

  // Get user's current subscription
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getLearningDb();
    if (!db) return null;

    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    if (subscription.length === 0) {
      return null;
    }

    // Get plan details
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscription[0].planId))
      .limit(1);

    return {
      ...subscription[0],
      plan: plan.length > 0 ? plan[0] : null,
    };
  }),

  // Create Stripe checkout session
  createCheckoutSession: protectedProcedure
    .input(z.object({
      planId: z.number(),
      successUrl: z.string(),
      cancelUrl: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Verify plan exists
      const plan = await db
        .select()
        .from(subscriptionPlans)
        .where(and(
          eq(subscriptionPlans.id, input.planId),
          eq(subscriptionPlans.isActive, true)
        ))
        .limit(1);

      if (plan.length === 0) {
        throw new Error("Plan not found");
      }
      
      // In production, this would create a Stripe checkout session
      // For now, return a mock session
      const checkoutSession = {
        id: `cs_${Date.now()}`,
        url: `${input.successUrl}?session_id=mock_session_${Date.now()}`,
        planId: input.planId,
        userId: ctx.user.id,
      };

      return checkoutSession;
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getLearningDb();
    if (!db) throw new Error("Database not available");

    // Get current subscription
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    if (subscription.length === 0) {
      throw new Error("No active subscription found");
    }

    if (subscription[0].status !== "active") {
      throw new Error("Subscription is not active");
    }

    // In production, this would cancel the Stripe subscription
    // Update to cancel at period end
    const result = await db
      .update(subscriptions)
      .set({ 
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, ctx.user.id))
      .returning();

    return result[0];
  }),

  // Verify subscription status (webhook)
  verifySubscription: protectedProcedure
    .input(z.object({
      stripeSubscriptionId: z.string(),
      status: z.enum(["active", "cancelled", "expired", "past_due", "trialing"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getLearningDb();
      if (!db) throw new Error("Database not available");

      // Find subscription by Stripe ID
      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, input.stripeSubscriptionId))
        .limit(1);

      if (subscription.length === 0) {
        throw new Error("Subscription not found");
      }

      // Update status
      const result = await db
        .update(subscriptions)
        .set({ 
          status: input.status,
          cancelAtPeriodEnd: input.status === "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription[0].id))
        .returning();

      return result[0];
    }),
});

export type SubscriptionRouter = typeof subscriptionRouter;
