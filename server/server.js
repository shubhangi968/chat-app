import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import Message from "./models/Message.js";

dotenv.config();

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

// =====================================================
// ROUTES
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/messages",
  messageRoutes
);

const PORT =
  process.env.PORT || 5000;

// =====================================================
// MONGODB
// =====================================================

mongoose
  .connect(
    "mongodb://127.0.0.1:27017/chatapp"
  )
  .then(() => {
    console.log(
      "✅ MongoDB Connected"
    );
  })
  .catch((err) => {
    console.error(
      "❌ MongoDB Error:",
      err
    );
  });

// =====================================================
// SOCKET.IO
// =====================================================

const httpServer =
  createServer(app);

const io = new Server(
  httpServer,
  {
    cors: {
      origin:
        "http://localhost:3000",
      methods: [
        "GET",
        "POST",
        "PUT",
        "DELETE",
      ],
    },
  }
);

// =====================================================
// ONLINE USERS
// userId -> number of connected sockets
// =====================================================

const onlineUsers = new Map();

// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on(
  "connection",
  (socket) => {

    console.log(
      "⚡ Socket connected:",
      socket.id
    );

    // ===================================================
    // REGISTER USER
    // ===================================================

    socket.on(
      "registerUser",
      (userId) => {

        if (!userId) return;

        // Always use string IDs
        const id =
          String(userId);

        // Prevent duplicate registration
        if (
          socket.userId === id
        ) {
          return;
        }

        socket.userId = id;

        // Increase connection count
        const currentCount =
          onlineUsers.get(id) || 0;

        onlineUsers.set(
          id,
          currentCount + 1
        );

        // Private room for user
        socket.join(
          `user_${id}`
        );

        // Broadcast online users
        io.emit(
          "onlineUsers",
          Array.from(
            onlineUsers.keys()
          )
        );

        console.log(
          "🟢 User online:",
          id
        );
      }
    );

    // ===================================================
    // JOIN CHAT ROOM
    // ===================================================

    socket.on(
      "joinRoom",
      async (room) => {

        try {

          if (!room) return;

          socket.join(room);

          console.log(
            `👤 ${socket.id} joined room: ${room}`
          );

          // Load last 100 messages
          const oldMessages =
            await Message.find({
              room,
            })
              .sort({
                createdAt: -1,
              })
              .limit(100)
              .lean();

          oldMessages.reverse();

          socket.emit(
            "loadMessages",
            oldMessages
          );

        } catch (error) {

          console.error(
            "❌ Error loading messages:",
            error
          );

        }
      }
    );

    // ===================================================
    // SEND MESSAGE
    // ===================================================

    socket.on(
      "sendMessage",
      async (message) => {

        try {

          if (
            !message ||
            !message.room ||
            !message.text ||
            !message.sender
          ) {
            return;
          }

          const newMessage =
            await Message.create({
              room: message.room,
              sender: message.sender,
              text: message.text,
              status: "sent",
            });

          // Send ONLY once to everyone in room
          io.to(
            message.room
          ).emit(
            "receiveMessage",
            newMessage
          );

          console.log(
            "📤 Message sent:",
            newMessage.text
          );

        } catch (error) {

          console.error(
            "❌ Error saving message:",
            error
          );

        }
      }
    );

    // ===================================================
    // FRIEND REQUEST NOTIFICATION
    // ===================================================

    socket.on(
      "friendRequestSent",
      ({
        senderId,
        receiverId,
        senderUsername,
      }) => {

        if (!receiverId) return;

        const receiver =
          String(receiverId);

        // Send only to receiver
        io.to(
          `user_${receiver}`
        ).emit(
          "newFriendRequest",
          {
            from: String(senderId),
            username:
              senderUsername,
          }
        );

        console.log(
          `📩 Friend request notification sent to ${receiver}`
        );
      }
    );

    // ===================================================
    // DISCONNECT
    // ===================================================

    socket.on(
      "disconnect",
      () => {

        const userId =
          socket.userId;

        if (userId) {

          const currentCount =
            onlineUsers.get(
              userId
            ) || 0;

          if (currentCount <= 1) {

            onlineUsers.delete(
              userId
            );

          } else {

            onlineUsers.set(
              userId,
              currentCount - 1
            );

          }

          // Broadcast updated list
          const users =
            Array.from(
              onlineUsers.keys()
            );

          io.emit(
            "onlineUsers",
            users
          );

          console.log(
            "🔴 User offline:",
            userId
          );
        }

        console.log(
          "❌ Socket disconnected:",
          socket.id
        );
      }
    );
  }
);

// =====================================================
// START SERVER
// =====================================================

httpServer.listen(
  PORT,
  () => {

    console.log(
      `🚀 Server running on http://localhost:${PORT}`
    );

  }
);