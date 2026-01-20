import { Socket } from "socket.io";
import { Server } from "socket.io";

/**
 * WebSocket event handlers for real-time communication
 * Manages drawing sync, presence, and WebRTC signaling
 */

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
  cursorX?: number;
  cursorY?: number;
}

export interface WhiteboardSession {
  sessionId: string;
  user1Id: number;
  user2Id: number;
  strokes: DrawingStroke[];
  isActive: boolean;
  createdAt: Date;
}

// Store active whiteboard sessions
const whiteboardSessions = new Map<string, WhiteboardSession>();

// Store user socket mappings
const userSockets = new Map<number, Socket>();

export function setupWebSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`[WebSocket] User connected: ${socket.id}`);

    // User joins with their ID
    socket.on("user:join", (userId: number, username: string) => {
      userSockets.set(userId, socket);
      socket.data.userId = userId;
      socket.data.username = username;
      socket.broadcast.emit("user:online", { userId, username });
      console.log(`[WebSocket] User ${userId} (${username}) joined`);
    });

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
        // Broadcast to all users in the session except sender
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

    // Presence: Update online status
    socket.on("presence:update", (isOnline: boolean) => {
      socket.broadcast.emit("presence:changed", {
        userId: socket.data.userId,
        isOnline,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      userSockets.delete(userId);
      socket.broadcast.emit("user:offline", { userId });
      console.log(`[WebSocket] User ${userId} disconnected`);
    });
  });
}

export function getWhiteboardSession(sessionId: string): WhiteboardSession | undefined {
  return whiteboardSessions.get(sessionId);
}

export function deleteWhiteboardSession(sessionId: string): void {
  whiteboardSessions.delete(sessionId);
}
