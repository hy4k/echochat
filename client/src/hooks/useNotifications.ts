import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface Notification {
  id: number;
  userId: number;
  senderId: number;
  type: "offline_message" | "call_missed" | "message_received" | "custom";
  title: string;
  content?: string;
  read: number;
  archived: number;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const unreadQuery = trpc.notifications.getUnread.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      unreadQuery.refetch();
    },
  });

  const archiveMutation = trpc.notifications.archive.useMutation({
    onSuccess: () => {
      unreadQuery.refetch();
    },
  });

  const clearAllMutation = trpc.notifications.clearAll.useMutation({
    onSuccess: () => {
      unreadQuery.refetch();
    },
  });

  const preferencesQuery = trpc.notifications.getPreferences.useQuery();

  const updatePreferencesMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences updated");
    },
  });

  useEffect(() => {
    if (unreadQuery.data && Array.isArray(unreadQuery.data)) {
      const notifs = unreadQuery.data as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => n.read === 0).length);
    }
  }, [unreadQuery.data]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && preferencesQuery.data?.enableBrowserNotifications) {
      const latestNotification = notifications[0];
      if (latestNotification && latestNotification.read === 0) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(latestNotification.title, {
            body: latestNotification.content || "You have a new notification",
            icon: "/echochat-icon.png",
            tag: `notification-${latestNotification.id}`,
          });
        }
      }
    }
  }, [notifications, preferencesQuery.data?.enableBrowserNotifications]);

  const handleMarkAsRead = useCallback((id: number) => {
    markAsReadMutation.mutate({ id });
  }, [markAsReadMutation]);

  const handleArchive = useCallback((id: number) => {
    archiveMutation.mutate({ id });
  }, [archiveMutation]);

  const handleClearAll = useCallback(() => {
    clearAllMutation.mutate();
  }, [clearAllMutation]);

  const handleUpdatePreferences = useCallback(
    (prefs: any) => {
      updatePreferencesMutation.mutate(prefs);
    },
    [updatePreferencesMutation]
  );

  return {
    notifications,
    unreadCount,
    preferences: preferencesQuery.data,
    isLoading: unreadQuery.isLoading,
    handleMarkAsRead,
    handleArchive,
    handleClearAll,
    handleUpdatePreferences,
  };
}
