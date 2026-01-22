import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@echochat.space`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Notifications Router", () => {
  it("should return empty unread notifications list", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.getUnread();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  it("should mark notification as read", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.markAsRead({ id: 1 });

    expect(result).toEqual({ success: true });
  });

  it("should archive notification", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.archive({ id: 1 });

    expect(result).toEqual({ success: true });
  });

  it("should clear all notifications", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.clearAll();

    expect(result).toEqual({ success: true });
  });

  it("should return notification preferences", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.getPreferences();

    expect(result).toHaveProperty("enableBrowserNotifications");
    expect(result).toHaveProperty("enableInAppNotifications");
    expect(result).toHaveProperty("enableSoundAlerts");
    expect(result).toHaveProperty("enableVibration");
    expect(result).toHaveProperty("notifyOfflineMessages");
    expect(result).toHaveProperty("notifyMissedCalls");
    expect(result.enableBrowserNotifications).toBe(true);
    expect(result.enableInAppNotifications).toBe(true);
    expect(result.enableSoundAlerts).toBe(true);
    expect(result.enableVibration).toBe(true);
    expect(result.notifyOfflineMessages).toBe(true);
    expect(result.notifyMissedCalls).toBe(true);
  });

  it("should update notification preferences", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.updatePreferences({
      enableBrowserNotifications: false,
      enableSoundAlerts: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
    });

    expect(result).toEqual({ success: true });
  });

  it("should handle partial preference updates", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.updatePreferences({
      enableVibration: false,
    });

    expect(result).toEqual({ success: true });
  });

  it("should validate notification preference values", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.getPreferences();

    expect(typeof result.enableBrowserNotifications).toBe("boolean");
    expect(typeof result.enableInAppNotifications).toBe("boolean");
    expect(typeof result.enableSoundAlerts).toBe("boolean");
    expect(typeof result.enableVibration).toBe("boolean");
    expect(typeof result.notifyOfflineMessages).toBe("boolean");
    expect(typeof result.notifyMissedCalls).toBe("boolean");
  });

  it("should handle quiet hours format", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.updatePreferences({
      quietHoursStart: "23:30",
      quietHoursEnd: "07:30",
    });

    expect(result).toEqual({ success: true });
  });
});
