import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Archive, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: number) => void;
  onArchive: (id: number) => void;
  onClearAll: () => void;
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onArchive,
  onClearAll,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => n.read === 0).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "offline_message":
        return "💌";
      case "call_missed":
        return "📞";
      case "message_received":
        return "💬";
      default:
        return "🔔";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors"
      >
        <Bell className="w-5 h-5 text-accent" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 max-h-[500px] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 px-4 py-3 border-b border-white/10 bg-white/50 backdrop-blur-md flex items-center justify-between">
                <h3 className="font-serif text-lg text-foreground">Notifications</h3>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Notifications List */}
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-accent/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  <AnimatePresence initial={false}>
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`px-4 py-3 hover:bg-accent/5 transition-colors ${
                          notification.read === 0 ? "bg-accent/5" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className="text-xl flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-foreground truncate">
                              {notification.title}
                            </h4>
                            {notification.content && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {notification.content}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground/60 mt-2">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 flex-shrink-0">
                            {notification.read === 0 && (
                              <button
                                onClick={() => onMarkAsRead(notification.id)}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4 text-accent" />
                              </button>
                            )}
                            <button
                              onClick={() => onArchive(notification.id)}
                              className="p-1 hover:bg-white/20 rounded transition-colors"
                              title="Archive"
                            >
                              <Archive className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
