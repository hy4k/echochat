/**
 * Shared types for EchoChat application
 */

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  messageType: "text" | "voice" | "video";
  status: "sent" | "delivered" | "read";
  isOffline: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfflineMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string | null;
  mediaUrl: string | null;
  messageType: "text" | "voice" | "video";
  viewed: number;
  createdAt: Date;
}

export interface UserPresence {
  id: number;
  userId: number;
  isOnline: number;
  latitude: string | null;
  longitude: string | null;
  timezone: string | null;
  lastSeen: Date;
  updatedAt: Date;
}

export interface SharedHorizon {
  id: number;
  userId: number;
  weatherCondition: string | null;
  temperature: string | null;
  timeOfDay: string | null;
  backgroundColor: string | null;
  accentColor: string | null;
  updatedAt: Date;
}

export interface Keepsake {
  id: number;
  userId1: number;
  userId2: number;
  messageId: number;
  title: string | null;
  description: string | null;
  createdAt: Date;
}

export interface Whiteboard {
  id: number;
  userId1: number;
  userId2: number;
  title: string;
  content: string | null;
  thumbnail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteboardStroke {
  id: number;
  whiteboardId: number;
  userId: number;
  strokeData: string;
  color: string;
  brushSize: number;
  opacity: number;
  createdAt: Date;
}
