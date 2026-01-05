import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { Socket } from "socket.io";
import { createMessage, updateMessageStatus, updateUserPresence, getMessagesBetweenUsers } from "./db";
import type { InsertMessage } from "../drizzle/schema";

interface ConnectedUser {
  userId: number;
  socketId: string;
  isOnline: boolean;
}

const connectedUsers = new Map<number, ConnectedUser>();

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? process.env.VITE_FRONTEND_URL : "*",
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("[WebSocket] User connected:", socket.id);

    // User joins - register their connection
    socket.on("user:join", async (data: any) => {
      const { userId, otherUserId } = data;
      
      connectedUsers.set(userId, {
        userId,
        socketId: socket.id,
        isOnline: true,
      });

      // Update user presence in database
      await updateUserPresence(userId, true);

      // Notify other user that this user is online
      const otherUserConnection = connectedUsers.get(otherUserId);
      if (otherUserConnection) {
        io.to(otherUserConnection.socketId).emit("user:online", { userId });
      }

      // Send current online status to the joining user
      socket.emit("user:status", {
        otherUserId,
        isOnline: !!otherUserConnection,
      });

      console.log(`[WebSocket] User ${userId} joined`);
    });

    // Handle text message
    socket.on("message:send", async (data: any) => {
      const { senderId, receiverId, content } = data;

      try {
        // Save message to database
        const message: InsertMessage = {
          senderId,
          receiverId,
          content,
          messageType: "text",
          status: "sent",
          isOffline: 0,
        };

        await createMessage(message);
        // In a real implementation, we'd get the actual message ID from the database
        // For now, we'll generate a temporary ID
        const messageId = Math.floor(Math.random() * 1000000);

        // Check if receiver is online
        const receiverConnection = connectedUsers.get(receiverId);

        if (receiverConnection) {
          // Send to receiver in real-time
          io.to(receiverConnection.socketId).emit("message:receive", {
            id: messageId,
            senderId,
            content,
            messageType: "text",
            timestamp: new Date(),
            status: "delivered",
          });

          // Update status to delivered
          await updateMessageStatus(messageId, "delivered");

          // Notify sender that message was delivered
          socket.emit("message:status", {
            messageId,
            status: "delivered",
          });
        } else {
          // Receiver is offline - message will be stored as offline message
          console.log(`[WebSocket] User ${receiverId} is offline, message stored`);
        }
      } catch (error) {
        console.error("[WebSocket] Error sending message:", error);
        socket.emit("message:error", { error: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing:start", (data: any) => {
      const { senderId, receiverId } = data;
      const receiverConnection = connectedUsers.get(receiverId);

      if (receiverConnection) {
        io.to(receiverConnection.socketId).emit("typing:start", { senderId });
      }
    });

    socket.on("typing:stop", (data: any) => {
      const { senderId, receiverId } = data;
      const receiverConnection = connectedUsers.get(receiverId);

      if (receiverConnection) {
        io.to(receiverConnection.socketId).emit("typing:stop", { senderId });
      }
    });

    // Handle message read receipt
    socket.on("message:read", async (data: any) => {
      const { messageId, receiverId } = data;

      try {
        await updateMessageStatus(messageId, "read");

        // Notify sender that message was read
        const senderConnection = Array.from(connectedUsers.values()).find(
          (u) => u.userId !== receiverId
        );

        if (senderConnection) {
          io.to(senderConnection.socketId).emit("message:status", {
            messageId,
            status: "read",
          });
        }
      } catch (error) {
        console.error("[WebSocket] Error marking message as read:", error);
      }
    });

    // Handle voice/video call initiation
    socket.on("call:initiate", (data: any) => {
      const { senderId, receiverId, callType } = data;
      const receiverConnection = connectedUsers.get(receiverId);

      if (receiverConnection) {
        io.to(receiverConnection.socketId).emit("call:incoming", {
          senderId,
          callType,
          callId: `${senderId}-${receiverId}-${Date.now()}`,
        });
      } else {
        socket.emit("call:error", { error: "User is offline" });
      }
    });

    // Handle call acceptance
    socket.on("call:accept", (data: any) => {
      const { callId, receiverId, senderId } = data;
      const senderConnection = connectedUsers.get(senderId);

      if (senderConnection) {
        io.to(senderConnection.socketId).emit("call:accepted", {
          callId,
          receiverId,
        });
      }
    });

    // Handle call rejection
    socket.on("call:reject", (data: any) => {
      const { callId, receiverId, senderId } = data;
      const senderConnection = connectedUsers.get(senderId);

      if (senderConnection) {
        io.to(senderConnection.socketId).emit("call:rejected", {
          callId,
        });
      }
    });

    // Handle WebRTC offer
    socket.on("webrtc:offer", (data: any) => {
      const { to, offer, callId } = data;
      const targetConnection = connectedUsers.get(to);

      if (targetConnection) {
        io.to(targetConnection.socketId).emit("webrtc:offer", {
          offer,
          callId,
          from: Array.from(connectedUsers.entries()).find(([_, u]) => u.socketId === socket.id)?.[0],
        });
      }
    });

    // Handle WebRTC answer
    socket.on("webrtc:answer", (data: any) => {
      const { to, answer, callId } = data;
      const targetConnection = connectedUsers.get(to);

      if (targetConnection) {
        io.to(targetConnection.socketId).emit("webrtc:answer", {
          answer,
          callId,
        });
      }
    });

    // Handle ICE candidate
    socket.on("webrtc:ice-candidate", (data: any) => {
      const { to, candidate, callId } = data;
      const targetConnection = connectedUsers.get(to);

      if (targetConnection) {
        io.to(targetConnection.socketId).emit("webrtc:ice-candidate", {
          candidate,
          callId,
        });
      }
    });

    // User disconnects
    socket.on("disconnect", async () => {
      const user = Array.from(connectedUsers.entries()).find(([_, u]) => u.socketId === socket.id);

      if (user) {
        const [userId] = user;
        connectedUsers.delete(userId);

        // Update user presence in database
        await updateUserPresence(userId, false);

        // Notify other user that this user is offline
        const otherUsers = Array.from(connectedUsers.values());
        otherUsers.forEach((u) => {
          io.to(u.socketId).emit("user:offline", { userId });
        });

        console.log(`[WebSocket] User ${userId} disconnected`);
      }
    });
  });

  return io;
}

export function getConnectedUsers() {
  return Array.from(connectedUsers.values());
}

export function isUserOnline(userId: number) {
  return connectedUsers.has(userId);
}
