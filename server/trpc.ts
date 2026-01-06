import { initTRPC } from "@trpc/server";
import { sdk } from "./_core/sdk";
import superjson from "superjson";
import type { Request } from "express";

export interface Context {
    req: Request;
    user: any;
}

const t = initTRPC.context<Context>().create({
    transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user) {
        const user = await sdk.authenticateRequest(ctx.req);
        return next({
            ctx: {
                ...ctx,
                user,
            },
        });
    }
    return next();
});
