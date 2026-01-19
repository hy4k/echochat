import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-1",
    email: "user1@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("whiteboard", () => {
  it("should create a whiteboard session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.whiteboard.createWhiteboard({
      otherUserId: 2,
      title: "Design Brainstorm",
    });

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("whiteboardId");
  });

  it("should retrieve whiteboard data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.whiteboard.getWhiteboard({
      whiteboardId: 1,
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("thumbnail");
  });

  it("should save a stroke to the whiteboard", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const strokeData = JSON.stringify([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
      { x: 50, y: 60 },
    ]);

    const result = await caller.whiteboard.saveStroke({
      whiteboardId: 1,
      strokeData,
      color: "#d4af37",
      brushSize: 3,
      opacity: 100,
    });

    expect(result).toHaveProperty("success", true);
  });

  it("should save the complete whiteboard", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const content = JSON.stringify({
      strokes: [
        {
          points: [{ x: 10, y: 20 }],
          color: "#d4af37",
          brushSize: 3,
          opacity: 100,
        },
      ],
    });

    const result = await caller.whiteboard.saveWhiteboard({
      whiteboardId: 1,
      content,
      thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    });

    expect(result).toHaveProperty("success", true);
  });

  it("should retrieve whiteboard history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.whiteboard.getWhiteboardHistory({
      otherUserId: 2,
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should validate stroke data format", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const validStrokeData = JSON.stringify([
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ]);

    const result = await caller.whiteboard.saveStroke({
      whiteboardId: 1,
      strokeData: validStrokeData,
      color: "#ffffff",
      brushSize: 5,
      opacity: 50,
    });

    expect(result.success).toBe(true);
  });

  it("should handle color values correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const colors = ["#000000", "#ffffff", "#d4af37", "#ff69b4"];

    for (const color of colors) {
      const result = await caller.whiteboard.saveStroke({
        whiteboardId: 1,
        strokeData: "[]",
        color,
        brushSize: 3,
        opacity: 100,
      });

      expect(result.success).toBe(true);
    }
  });

  it("should handle brush size within valid range", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const sizes = [1, 5, 10, 20];

    for (const size of sizes) {
      const result = await caller.whiteboard.saveStroke({
        whiteboardId: 1,
        strokeData: "[]",
        color: "#d4af37",
        brushSize: size,
        opacity: 100,
      });

      expect(result.success).toBe(true);
    }
  });

  it("should handle opacity values correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const opacities = [0, 25, 50, 75, 100];

    for (const opacity of opacities) {
      const result = await caller.whiteboard.saveStroke({
        whiteboardId: 1,
        strokeData: "[]",
        color: "#d4af37",
        brushSize: 3,
        opacity,
      });

      expect(result.success).toBe(true);
    }
  });
});
