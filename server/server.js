import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";
import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import Message from "./models/Message.js";
import User from "./models/User.js";
dotenv.config();

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: true,
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

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// SOCKET AUTHENTICATION
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(
        new Error("Authentication required")
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.userId = String(decoded.id);

    next();

  } catch (error) {

    console.error(
      "Socket authentication error:",
      error
    );

    next(
      new Error("Invalid or expired token")
    );
  }
});

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

    // REGISTER AUTHENTICATED USER
    socket.on("registerUser", () => {
      const id = socket.userId;

      if (!id) return;

      const currentCount =
        onlineUsers.get(id) || 0;

      onlineUsers.set(
        id,
        currentCount + 1
      );

      socket.join(`user_${id}`);

      io.emit(
        "onlineUsers",
        Array.from(onlineUsers.keys())
      );

      console.log(
        "🟢 User online:",
        id
      );
    });

    // ===================================================
    // JOIN CHAT ROOM
    // ===================================================

    socket.on(
      "joinRoom",
      async (room) => {
        try {
          if (!room) return;

          // ---------------------------------------------
          // VERIFY ROOM FORMAT
          // ---------------------------------------------

          const roomUsers = room.split("_");

          if (roomUsers.length !== 2) {
            console.log(
              "❌ Invalid room:",
              room
            );

            return;
          }

          // ---------------------------------------------
          // VERIFY AUTHENTICATED USER
          // ---------------------------------------------

          const currentUserId =
            String(socket.userId);

          if (!roomUsers.includes(currentUserId)) {
            console.log(
              "🚫 Unauthorized room access:",
              currentUserId,
              "->",
              room
            );

            return;
          }

          // ---------------------------------------------
          // GET OTHER USER
          // ---------------------------------------------

          const otherUserId =
            roomUsers.find(
              (id) => id !== currentUserId
            );

          if (!otherUserId) {
            console.log(
              "❌ Other user not found in room:",
              room
            );

            return;
          }

          // ---------------------------------------------
          // VERIFY OTHER USER EXISTS
          // ---------------------------------------------

          const currentUser =
            await User.findById(
              currentUserId
            ).select("friends");

          const otherUser =
            await User.findById(
              otherUserId
            ).select("_id");

          if (!currentUser || !otherUser) {
            console.log(
              "❌ User not found"
            );

            return;
          }

          // ---------------------------------------------
          // VERIFY THEY ARE FRIENDS
          // ---------------------------------------------

          const areFriends =
            currentUser.friends.some(
              (friendId) =>
                String(friendId) ===
                String(otherUserId)
            );

          if (!areFriends) {
            console.log(
              "🚫 Chat access denied. Users are not friends:",
              currentUserId,
              "->",
              otherUserId
            );

            return;
          }

          // ---------------------------------------------
          // JOIN PRIVATE ROOM
          // ---------------------------------------------

          socket.join(room);

          console.log(
            `👤 ${socket.id} joined room: ${room}`
          );

          // ---------------------------------------------
          // LOAD LAST 100 MESSAGES
          // ---------------------------------------------

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
            {
              room,
              messages: oldMessages,
            }
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

    socket.on("sendMessage", async (message) => {
      try {
        if (
          !message ||
          !message.room ||
          !message.text?.trim()
        ) {
          return;
        }

        // ---------------------------------------------
        // VERIFY ROOM BELONGS TO AUTHENTICATED USER
        // ---------------------------------------------

        const roomUsers =
          message.room.split("_");

        if (roomUsers.length !== 2) {
          console.log(
            "❌ Invalid message room:",
            message.room
          );

          return;
        }

        const currentUserId =
          String(socket.userId);

        if (!roomUsers.includes(currentUserId)) {
          console.log(
            "🚫 Unauthorized message attempt:",
            currentUserId,
            "->",
            message.room
          );

          return;
        }

        // ---------------------------------------------
        // GET AUTHENTICATED USER
        // ---------------------------------------------

        const user = await User.findById(
          socket.userId
        ).select("_id username");

        if (!user) {
          console.log(
            "❌ Authenticated user not found:",
            socket.userId
          );

          return;
        }

        // ---------------------------------------------
        // SAVE MESSAGE
        // ---------------------------------------------

        const newMessage =
          await Message.create({
            room: message.room,

            // Authenticated user's ID
            senderId: user._id,

            // Authenticated user's username
            // Do NOT trust frontend username
            sender: user.username,

            text: message.text.trim(),

            status: "sent",
          });

        // ---------------------------------------------
        // SEND TO BOTH USERS IN THE ROOM
        // ---------------------------------------------

        io.to(message.room).emit(
          "receiveMessage",
          newMessage
        );

        console.log(
          "📤 Message sent by:",
          user.username,
          "|",
          newMessage.text
        );

      } catch (error) {

        console.error(
          "❌ Error saving message:",
          error
        );

      }
    });
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
  PORT, "0.0.0.0", () => {

    console.log(
      `🚀 Server running on ${PORT}`
    );

  }
);