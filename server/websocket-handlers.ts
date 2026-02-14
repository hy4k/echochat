import { Socket } from "socket.io";
import { Server } from "socket.io";

/**
 * WebSocket event handlers for real-time communication
 * Manages drawing sync, presence, learning rooms, sessions, matching, and partnerships
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface DrawingStroke {
  id: string;
  userId: number;
  points: Array<{ x: number; y: number }>;
  color: string;
  brushSize: number;
  opacity: number;
  timestamp: number;
}

export interface UserPresence {
  userId: number;
  username: string;
  isOnline: boolean;
  status: "online" | "away" | "busy";
  cursorX?: number;
  cursorY?: number;
  lastSeen?: Date;
}

export interface WhiteboardSession {
  sessionId: string;
  user1Id: number;
  user2Id: number;
  strokes: DrawingStroke[];
  isActive: boolean;
  createdAt: Date;
}

// Learning Room Types
export interface LearningRoom {
  roomId: string;
  name: string;
  topic: string;
  participants: Map<number, { username: string; joinedAt: Date }>;
  createdAt: Date;
}

export interface LearningRoomMessage {
  id: string;
  roomId: string;
  userId: number;
  username: string;
  content: string;
  timestamp: Date;
  type: "text" | "system";
}

// Session Types
export interface LearningSession {
  sessionId: string;
  roomId: string;
  hostId: number;
  participants: Map<number, { username: string; joinedAt: Date; isHost: boolean }>;
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
}

export interface SessionChatMessage {
  id: string;
  sessionId: string;
  userId: number;
  username: string;
  content: string;
  timestamp: Date;
}

// Match & Partnership Types
export interface MatchNotification {
  id: string;
  fromUserId: number;
  fromUsername: string;
  toUserId: number;
  skillOffered: string;
  skillWanted: string;
  timestamp: Date;
}

export interface PartnershipUpdate {
  id: string;
  userId: number;
  partnerId: number;
  status: "pending" | "accepted" | "rejected" | "ended";
  timestamp: Date;
}

// ============================================================================
// In-Memory Stores
// ============================================================================

// Store active whiteboard sessions
const whiteboardSessions = new Map<string, WhiteboardSession>();

// Store user socket mappings
const userSockets = new Map<number, Socket>();

// Learning Rooms Store
const learningRooms = new Map<string, LearningRoom>();
const learningRoomMessages = new Map<string, LearningRoomMessage[]>();

// Learning Sessions Store
const learningSessions = new Map<string, LearningSession>();
const sessionChatMessages = new Map<string, SessionChatMessage[]>();

// User Presence Store
const onlineUsers = new Map<number, UserPresence>();

// Match Subscriptions
const matchSubscriptions = new Map<number, Socket>();

// Partnership Subscriptions
const partnershipSubscriptions = new Map<number, Socket>();

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getOnlineUsersList(): UserPresence[] {
  return Array.from(onlineUsers.values());
}

// ============================================================================
// Main WebSocket Handler Setup
// ============================================================================

export function setupWebSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`[WebSocket] User connected: ${socket.id}`);

    // ========================================================================
    // User Authentication & Basic Events
    // ========================================================================

    // User joins with their ID
    socket.on("user:join", (userId: number, username: string) => {
      userSockets.set(userId, socket);
      socket.data.userId = userId;
      socket.data.username = username;
      
      // Initialize user presence
      onlineUsers.set(userId, {
        userId,
        username,
        isOnline: true,
        status: "online",
        lastSeen: new Date(),
      });
      
      socket.broadcast.emit("user:online", { userId, username });
      console.log(`[WebSocket] User ${userId} (${username}) joined`);
    });

    // ========================================================================
    // Whiteboard Events (Existing)
    // ========================================================================

    // Whiteboard: User creates or joins a session
    socket.on("whiteboard:join", (sessionId: string, user1Id: number, user2Id: number) => {
      socket.join(`whiteboard:${sessionId}`);

      let session = whiteboardSessions.get(sessionId);
      if (!session) {
        session = {
          sessionId,
          user1Id,
          user2Id,
          strokes: [],
          isActive: true,
          createdAt: new Date(),
        };
        whiteboardSessions.set(sessionId, session);
      }

      // Notify others in the session
      socket.to(`whiteboard:${sessionId}`).emit("whiteboard:user-joined", {
        userId: socket.data.userId,
        username: socket.data.username,
      });

      // Send existing strokes to the joining user
      socket.emit("whiteboard:sync", { strokes: session.strokes });

      console.log(`[WebSocket] User ${socket.data.userId} joined whiteboard ${sessionId}`);
    });

    // Whiteboard: Broadcast drawing stroke
    socket.on("whiteboard:stroke", (sessionId: string, stroke: DrawingStroke) => {
      const session = whiteboardSessions.get(sessionId);
      if (session) {
        session.strokes.push(stroke);
        socket.to(`whiteboard:${sessionId}`).emit("whiteboard:stroke-received", stroke);
      }
    });

    // Whiteboard: Broadcast cursor position
    socket.on("whiteboard:cursor", (sessionId: string, x: number, y: number) => {
      socket.to(`whiteboard:${sessionId}`).emit("whiteboard:cursor-moved", {
        userId: socket.data.userId,
        username: socket.data.username,
        x,
        y,
      });
    });

    // Whiteboard: Clear canvas
    socket.on("whiteboard:clear", (sessionId: string) => {
      const session = whiteboardSessions.get(sessionId);
      if (session) {
        session.strokes = [];
        socket.to(`whiteboard:${sessionId}`).emit("whiteboard:cleared");
      }
    });

    // Whiteboard: Save session
    socket.on("whiteboard:save", (sessionId: string, content: string, thumbnail: string) => {
      const session = whiteboardSessions.get(sessionId);
      if (session) {
        socket.to(`whiteboard:${sessionId}`).emit("whiteboard:saved", {
          content,
          thumbnail,
          timestamp: new Date(),
        });
      }
    });

    // ========================================================================
    // WebRTC Call Events (Existing)
    // ========================================================================

    // WebRTC: Initiate call
    socket.on("call:initiate", (targetUserId: number, callType: "audio" | "video") => {
      const targetSocket = userSockets.get(targetUserId);
      if (targetSocket) {
        targetSocket.emit("call:incoming", {
          callerId: socket.data.userId,
          callerName: socket.data.username,
          callType,
        });
        console.log(`[WebSocket] Call initiated from ${socket.data.userId} to ${targetUserId}`);
      }
    });

    // WebRTC: Accept call
    socket.on("call:accept", (callerId: number) => {
      const callerSocket = userSockets.get(callerId);
      if (callerSocket) {
        callerSocket.emit("call:accepted", {
          accepterId: socket.data.userId,
          accepterName: socket.data.username,
        });
        console.log(`[WebSocket] Call accepted by ${socket.data.userId}`);
      }
    });

    // WebRTC: Reject call
    socket.on("call:reject", (callerId: number) => {
      const callerSocket = userSockets.get(callerId);
      if (callerSocket) {
        callerSocket.emit("call:rejected", {
          rejecterId: socket.data.userId,
        });
        console.log(`[WebSocket] Call rejected by ${socket.data.userId}`);
      }
    });

    // WebRTC: Send SDP offer
    socket.on("webrtc:offer", (targetUserId: number, offer: RTCSessionDescriptionInit) => {
      const targetSocket = userSockets.get(targetUserId);
      if (targetSocket) {
        targetSocket.emit("webrtc:offer-received", {
          senderId: socket.data.userId,
          offer,
        });
      }
    });

    // WebRTC: Send SDP answer
    socket.on("webrtc:answer", (targetUserId: number, answer: RTCSessionDescriptionInit) => {
      const targetSocket = userSockets.get(targetUserId);
      if (targetSocket) {
        targetSocket.emit("webrtc:answer-received", {
          senderId: socket.data.userId,
          answer,
        });
      }
    });

    // WebRTC: Send ICE candidate
    socket.on("webrtc:ice-candidate", (targetUserId: number, candidate: RTCIceCandidateInit) => {
      const targetSocket = userSockets.get(targetUserId);
      if (targetSocket) {
        targetSocket.emit("webrtc:ice-candidate-received", {
          senderId: socket.data.userId,
          candidate,
        });
      }
    });

    // WebRTC: End call
    socket.on("call:end", (targetUserId: number) => {
      const targetSocket = userSockets.get(targetUserId);
      if (targetSocket) {
        targetSocket.emit("call:ended", {
          enderId: socket.data.userId,
        });
        console.log(`[WebSocket] Call ended by ${socket.data.userId}`);
      }
    });

    // ========================================================================
    // LEARNING ROOM EVENTS
    // ========================================================================

    // Join a learning room
    socket.on("join-learning-room", (roomId: string, roomName: string, topic: string) => {
      const userId = socket.data.userId;
      const username = socket.data.username;
      
      if (!userId || !username) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      // Join the socket room
      socket.join(`learning-room:${roomId}`);

      // Create or get the room
      let room = learningRooms.get(roomId);
      if (!room) {
        room = {
          roomId,
          name: roomName,
          topic,
          participants: new Map(),
          createdAt: new Date(),
        };
        learningRooms.set(roomId, room);
      }

      // Add participant to room
      room.participants.set(userId, { username, joinedAt: new Date() });

      // Store room reference on socket
      socket.data.currentLearningRoom = roomId;

      // Get message history
      const messages = learningRoomMessages.get(roomId) || [];

      // Notify others in the room
      io.to(`learning-room:${roomId}`).emit("user-joined", {
        roomId,
        userId,
        username,
        participants: Array.from(room.participants.entries()).map(([id, data]) => ({
          userId: id,
          username: data.username,
          joinedAt: data.joinedAt,
        })),
      });

      // Send room state to joining user
      socket.emit("learning-room-presence", {
        roomId,
        participants: Array.from(room.participants.entries()).map(([id, data]) => ({
          userId: id,
          username: data.username,
          joinedAt: data.joinedAt,
        })),
        messages: messages.slice(-50), // Last 50 messages
      });

      console.log(`[WebSocket] User ${userId} joined learning room ${roomId}`);
    });

    // Leave a learning room
    socket.on("leave-learning-room", (roomId: string) => {
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!userId) return;

      // Leave the socket room
      socket.leave(`learning-room:${roomId}`);

      // Remove participant from room
      const room = learningRooms.get(roomId);
      if (room) {
        room.participants.delete(userId);

        // Clean up empty rooms
        if (room.participants.size === 0) {
          learningRooms.delete(roomId);
          learningRoomMessages.delete(roomId);
        }
      }

      // Clear room reference from socket
      delete socket.data.currentLearningRoom;

      // Notify others in the room
      io.to(`learning-room:${roomId}`).emit("user-left", {
        roomId,
        userId,
        username,
        participants: room ? Array.from(room.participants.entries()).map(([id, data]) => ({
          userId: id,
          username: data.username,
        })) : [],
      });

      console.log(`[WebSocket] User ${userId} left learning room ${roomId}`);
    });

    // Send message in learning room
    socket.on("learning-room-message", (roomId: string, content: string) => {
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!userId || !username) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      const message: LearningRoomMessage = {
        id: generateId(),
        roomId,
        userId,
        username,
        content,
        timestamp: new Date(),
        type: "text",
      };

      // Store message
      const messages = learningRoomMessages.get(roomId) || [];
      messages.push(message);
      // Keep only last 100 messages
      if (messages.length > 100) {
        messages.shift();
      }
      learningRoomMessages.set(roomId, messages);

      // Broadcast to room
      io.to(`learning-room:${roomId}`).emit("new-message", message);

      console.log(`[WebSocket] Message in room ${roomId} from ${username}`);
    });

    // Typing indicator in learning room
    socket.on("learning-room-typing", (roomId: string, isTyping: boolean) => {
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!userId) return;

      // Broadcast to others in the room
      socket.to(`learning-room:${roomId}`).emit("learning-room-typing", {
        roomId,
        userId,
        username,
        isTyping,
      });
    });

    // ========================================================================
    // SESSION EVENTS
    // ========================================================================

    // Join a learning session
    socket.on("join-session", (sessionId: string, roomId: string, isHost: boolean = false) => {
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!userId || !username) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      // Join the socket room
      socket.join(`session:${sessionId}`);

      // Create or get the session
      let session = learningSessions.get(sessionId);
      if (!session) {
        session = {
          sessionId,
          roomId,
          hostId: isHost ? userId : 0,
          participants: new Map(),
          isActive: true,
          startedAt: new Date(),
        };
        learningSessions.set(sessionId, session);
      }

      // Add participant to session
      session.participants.set(userId, { 
        username, 
        joinedAt: new Date(),
        isHost: isHost || session.hostId === userId,
      });

      // Store session reference on socket
      socket.data.currentSession = sessionId;

      // Get chat history
      const chatMessages = sessionChatMessages.get(sessionId) || [];

      // Notify others in the session
      io.to(`session:${sessionId}`).emit("participant-joined", {
        sessionId,
        userId,
        username,
        isHost: session.participants.get(userId)?.isHost || false,
        participants: Array.from(session.participants.entries()).map(([id, data]) => ({
          userId: id,
          username: data.username,
          isHost: data.isHost,
          joinedAt: data.joinedAt,
        })),
      });

      // Send session state to joining user
      socket.emit("session-state", {
        sessionId,
        roomId,
        isActive: session.isActive,
        participants: Array.from(session.participants.entries()).map(([id, data]) => ({
          userId: id,
          username: data.username,
          isHost: data.isHost,
          joinedAt: data.joinedAt,
        })),
        chatMessages: chatMessages.slice(-50),
      });

      // If this is the first participant and they're host, emit session-started
      if (session.participants.size === 1 && isHost) {
        io.to(`session:${sessionId}`).emit("session-started", {
          sessionId,
          hostId: userId,
          startedAt: session.startedAt,
        });
      }

      console.log(`[WebSocket] User ${userId} joined session ${sessionId}`);
    });

    // Leave a learning session
    socket.on("leave-session", (sessionId: string) => {
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!userId) return;

      // Leave the socket room
      socket.leave(`session:${sessionId}`);

      // Remove participant from session
      const session = learningSessions.get(sessionId);
      if (session) {
        session.participants.delete(userId);

        // End session if empty or host left
        if (session.participants.size === 0 || session.hostId === userId) {
          session.isActive = false;
          session.endedAt = new Date();
          
          io.to(`session:${sessionId}`).emit("session-ended", {
            sessionId,
            endedAt: session.endedAt,
            reason: session.participants.size === 0 ? "empty" : "host-left",
          });
          
          // Clean up after a delay
          setTimeout(() => {
            learningSessions.delete(sessionId);
            sessionChatMessages.delete(sessionId);
          }, 60000);
        }
      }

      // Clear session reference from socket
      delete socket.data.currentSession;

      // Notify others in the session
      io.to(`session:${sessionId}`).emit("participant-left", {
        sessionId,
        userId,
        username,
        participants: session ? Array.from(session.participants.entries()).map(([id, data]) => ({
          userId: id,
          username: data.username,
        })) : [],
      });

      console.log(`[WebSocket] User ${userId} left session ${sessionId}`);
    });

    // WebRTC signaling for session
    socket.on("session-signal", (sessionId: string, targetUserId: number, signal: any) => {
      const userId = socket.data.userId;

      if (!userId) return;

      // Send to specific user in session
      const targetSocket = userSockets.get(targetUserId);
      if (targetSocket) {
        targetSocket.emit("session-signal-received", {
          sessionId,
          senderId: userId,
          signal,
        });
      } else {
        // Broadcast to session if target not found directly
        socket.to(`session:${sessionId}`).emit("session-signal-broadcast", {
          sessionId,
          senderId: userId,
          targetUserId,
          signal,
        });
      }
    });

    // Session chat
    socket.on("session-chat", (sessionId: string, content: string) => {
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!userId || !username) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      const message: SessionChatMessage = {
        id: generateId(),
        sessionId,
        userId,
        username,
        content,
        timestamp: new Date(),
      };

      // Store message
      const messages = sessionChatMessages.get(sessionId) || [];
      messages.push(message);
      if (messages.length > 100) {
        messages.shift();
      }
      sessionChatMessages.set(sessionId, messages);

      // Broadcast to session
      io.to(`session:${sessionId}`).emit("session-chat-message", message);

      console.log(`[WebSocket] Session chat in ${sessionId} from ${username}`);
    });

    // ========================================================================
    // MATCHING NOTIFICATIONS
    // ========================================================================

    // Subscribe to match notifications
    socket.on("subscribe-matches", () => {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      matchSubscriptions.set(userId, socket);
      console.log(`[WebSocket] User ${userId} subscribed to match notifications`);
    });

    // Unsubscribe from match notifications
    socket.on("unsubscribe-matches", () => {
      const userId = socket.data.userId;
      if (userId) {
        matchSubscriptions.delete(userId);
        console.log(`[WebSocket] User ${userId} unsubscribed from match notifications`);
      }
    });

    // Server-side: Notify user of new match (called from backend logic)
    // This function is exported so other parts of the server can trigger it
    const notifyNewMatch = (toUserId: number, matchData: {
      fromUserId: number;
      fromUsername: string;
      skillOffered: string;
      skillWanted: string;
    }) => {
      const targetSocket = matchSubscriptions.get(toUserId);
      if (targetSocket) {
        const notification: MatchNotification = {
          id: generateId(),
          fromUserId: matchData.fromUserId,
          fromUsername: matchData.fromUsername,
          toUserId,
          skillOffered: matchData.skillOffered,
          skillWanted: matchData.skillWanted,
          timestamp: new Date(),
        };
        targetSocket.emit("new-match", notification);
        console.log(`[WebSocket] New match notification sent to user ${toUserId}`);
      }
    };

    // Match response notification
    socket.on("match-response", (toUserId: number, accepted: boolean) => {
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!userId || !username) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      const targetSocket = matchSubscriptions.get(toUserId);
      if (targetSocket) {
        targetSocket.emit("match-response-received", {
          fromUserId: userId,
          fromUsername: username,
          accepted,
          timestamp: new Date(),
        });
      }
    });

    // ========================================================================
    // PARTNERSHIP EVENTS
    // ========================================================================

    // Subscribe to partnership updates
    socket.on("subscribe-partnership", () => {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      partnershipSubscriptions.set(userId, socket);
      console.log(`[WebSocket] User ${userId} subscribed to partnership updates`);
    });

    // Unsubscribe from partnership updates
    socket.on("unsubscribe-partnership", () => {
      const userId = socket.data.userId;
      if (userId) {
        partnershipSubscriptions.delete(userId);
        console.log(`[WebSocket] User ${userId} unsubscribed from partnership updates`);
      }
    });

    // Server-side: Notify of partnership update (called from backend logic)
    const notifyPartnershipUpdate = (userId: number, partnerId: number, status: "pending" | "accepted" | "rejected" | "ended") => {
      const targetSocket = partnershipSubscriptions.get(userId);
      if (targetSocket) {
        const update: PartnershipUpdate = {
          id: generateId(),
          userId,
          partnerId,
          status,
          timestamp: new Date(),
        };
        targetSocket.emit("partnership-update", update);
        console.log(`[WebSocket] Partnership update sent to user ${userId}: ${status}`);
      }
    };

    // ========================================================================
    // PRESENCE SYSTEM
    // ========================================================================

    // Update user presence status
    socket.on("update-presence", (status: "online" | "away" | "busy") => {
      const userId = socket.data.userId;
      const username = socket.data.username;

      if (!userId) return;

      // Update presence in store
      const existingPresence = onlineUsers.get(userId);
      if (existingPresence) {
        existingPresence.status = status;
        existingPresence.lastSeen = new Date();
        onlineUsers.set(userId, existingPresence);
      }

      // Broadcast to all connected users
      socket.broadcast.emit("presence-update", {
        userId,
        username,
        status,
        lastSeen: new Date(),
      });

      // If in a learning room, notify room members
      if (socket.data.currentLearningRoom) {
        io.to(`learning-room:${socket.data.currentLearningRoom}`).emit("learning-room-presence-update", {
          userId,
          username,
          status,
        });
      }

      // If in a session, notify session members
      if (socket.data.currentSession) {
        io.to(`session:${socket.data.currentSession}`).emit("session-presence-update", {
          userId,
          username,
          status,
        });
      }

      console.log(`[WebSocket] User ${userId} presence updated to ${status}`);
    });

    // Get online users
    socket.on("get-online-users", (callback?: (users: UserPresence[]) => void) => {
      const users = getOnlineUsersList();
      
      if (callback) {
        callback(users);
      } else {
        socket.emit("online-users-list", users);
      }
    });

    // Legacy presence: Update online status (keep for backward compatibility)
    socket.on("presence:update", (isOnline: boolean) => {
      const status = isOnline ? "online" : "away";
      socket.emit("presence:changed", {
        userId: socket.data.userId,
        isOnline,
      });
      
      // Also update with new presence system
      const userId = socket.data.userId;
      if (userId) {
        const existingPresence = onlineUsers.get(userId);
        if (existingPresence) {
          existingPresence.status = status;
          existingPresence.isOnline = isOnline;
          existingPresence.lastSeen = new Date();
          onlineUsers.set(userId, existingPresence);
        }
      }
    });

    // ========================================================================
    // DISCONNECT HANDLING
    // ========================================================================

    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      const username = socket.data.username;

      // Clean up from user sockets
      if (userId) {
        userSockets.delete(userId);
        
        // Update presence to offline
        const existingPresence = onlineUsers.get(userId);
        if (existingPresence) {
          existingPresence.isOnline = false;
          existingPresence.status = "away";
          existingPresence.lastSeen = new Date();
          onlineUsers.set(userId, existingPresence);
        }

        // Clean up subscriptions
        matchSubscriptions.delete(userId);
        partnershipSubscriptions.delete(userId);

        // Notify learning room if user was in one
        if (socket.data.currentLearningRoom) {
          const roomId = socket.data.currentLearningRoom;
          const room = learningRooms.get(roomId);
          if (room) {
            room.participants.delete(userId);
            io.to(`learning-room:${roomId}`).emit("user-left", {
              roomId,
              userId,
              username,
              participants: Array.from(room.participants.entries()).map(([id, data]) => ({
                userId: id,
                username: data.username,
              })),
            });
            if (room.participants.size === 0) {
              learningRooms.delete(roomId);
            }
          }
        }

        // Notify session if user was in one
        if (socket.data.currentSession) {
          const sessionId = socket.data.currentSession;
          const session = learningSessions.get(sessionId);
          if (session) {
            session.participants.delete(userId);
            io.to(`session:${sessionId}`).emit("participant-left", {
              sessionId,
              userId,
              username,
              participants: Array.from(session.participants.entries()).map(([id, data]) => ({
                userId: id,
                username: data.username,
              })),
            });
          }
        }

        // Broadcast offline status
        socket.broadcast.emit("user:offline", { userId });
        
        console.log(`[WebSocket] User ${userId} disconnected`);
      } else {
        console.log(`[WebSocket] Anonymous user disconnected: ${socket.id}`);
      }
    });
  });
}

// Export functions for external use
export function getWhiteboardSession(sessionId: string): WhiteboardSession | undefined {
  return whiteboardSessions.get(sessionId);
}

export function deleteWhiteboardSession(sessionId: string): void {
  whiteboardSessions.delete(sessionId);
}

export function getLearningRoom(roomId: string): LearningRoom | undefined {
  return learningRooms.get(roomId);
}

export function getLearningSession(sessionId: string): LearningSession | undefined {
  return learningSessions.get(sessionId);
}

export function getOnlineUsers(): UserPresence[] {
  return getOnlineUsersList();
}
