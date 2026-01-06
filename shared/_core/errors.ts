import { TRPCError } from "@trpc/server";

export function ForbiddenError(message: string = "Forbidden") {
    return new TRPCError({
        code: "FORBIDDEN",
        message,
    });
}

export function UnauthorizedError(message: string = "Unauthorized") {
    return new TRPCError({
        code: "UNAUTHORIZED",
        message,
    });
}
