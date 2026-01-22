import { getDb } from "./db";
import { notifications, notificationPreferences, offlineMessages, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export type NotificationType = "offline_message" | "call_missed" | "message_received" | "custom";

export interface NotificationPayload {
  userId: number;
  senderId: number;
  type: NotificationType;
  title: string;
  content?: string;
  messageId?: number;
  offlineMessageId?: number;
  actionUrl?: string;
}

/**
 * Create a new notification for a user
 */
export async function createNotification(payload: NotificationPayload) {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification] Database not available");
    return null;
  }

  try {
    const result = await db.insert(notifications).values({
      userId: payload.userId,
      senderId: payload.senderId,
      type: payload.type,
      title: payload.title,
      content: payload.content,
      messageId: payload.messageId,
      offlineMessageId: payload.offlineMessageId,
      actionUrl: payload.actionUrl,
      read: 0,
      archived: 0,
    });

    return result;
  } catch (error) {
    console.error("[Notification] Failed to create notification:", error);
    throw error;
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification] Database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, 0)))
      .orderBy(notifications.createdAt);

    return result;
  } catch (error) {
    console.error("[Notification] Failed to get unread notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification] Database not available");
    return null;
  }

  try {
    const result = await db
      .update(notifications)
      .set({ read: 1, readAt: new Date() })
      .where(eq(notifications.id, notificationId));

    return result;
  } catch (error) {
    console.error("[Notification] Failed to mark notification as read:", error);
    throw error;
  }
}

/**
 * Archive notification
 */
export async function archiveNotification(notificationId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification] Database not available");
    return null;
  }

  try {
    const result = await db
      .update(notifications)
      .set({ archived: 1 })
      .where(eq(notifications.id, notificationId));

    return result;
  } catch (error) {
    console.error("[Notification] Failed to archive notification:", error);
    throw error;
  }
}

/**
 * Get user notification preferences
 */
export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification] Database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Notification] Failed to get notification preferences:", error);
    return null;
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: number,
  preferences: Partial<typeof notificationPreferences.$inferInsert>
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification] Database not available");
    return null;
  }

  try {
    const result = await db
      .update(notificationPreferences)
      .set(preferences)
      .where(eq(notificationPreferences.userId, userId));

    return result;
  } catch (error) {
    console.error("[Notification] Failed to update notification preferences:", error);
    throw error;
  }
}

/**
 * Check if user should receive notifications (respects quiet hours and preferences)
 */
export async function shouldNotifyUser(userId: number): Promise<boolean> {
  const prefs = await getNotificationPreferences(userId);
  if (!prefs) return true;

  // Check if in-app notifications are enabled
  if (!prefs.enableInAppNotifications) return false;

  // Check quiet hours
  if (prefs.quietHoursStart && prefs.quietHoursEnd) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (currentTime >= prefs.quietHoursStart && currentTime <= prefs.quietHoursEnd) {
      return false;
    }
  }

  return true;
}

/**
 * Create offline message notification
 */
export async function notifyOfflineMessage(
  senderId: number,
  receiverId: number,
  offlineMessageId: number,
  messageType: "text" | "voice" | "video"
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification] Database not available");
    return null;
  }

  try {
    // Get sender info
    const senderResult = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    const senderName = senderResult[0]?.name || "Someone";

    // Create notification
    const typeLabel = messageType === "text" ? "message" : messageType === "voice" ? "voice note" : "video message";

    await createNotification({
      userId: receiverId,
      senderId,
      type: "offline_message",
      title: `New ${typeLabel} from ${senderName}`,
      content: `You received a ${typeLabel} while you were away`,
      offlineMessageId,
      actionUrl: `/chat?offlineMessage=${offlineMessageId}`,
    });
  } catch (error) {
    console.error("[Notification] Failed to create offline message notification:", error);
  }
}

/**
 * Get notification count for user
 */
export async function getNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification] Database not available");
    return 0;
  }

  try {
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, 0)));

    return result.length;
  } catch (error) {
    console.error("[Notification] Failed to get notification count:", error);
    return 0;
  }
}

/**
 * Clear all notifications for a user
 */
export async function clearAllNotifications(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification] Database not available");
    return null;
  }

  try {
    const result = await db
      .update(notifications)
      .set({ archived: 1 })
      .where(eq(notifications.userId, userId));

    return result;
  } catch (error) {
    console.error("[Notification] Failed to clear notifications:", error);
    throw error;
  }
}
