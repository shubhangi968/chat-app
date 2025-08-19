import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import messageRoutes from "./routes/messageRoutes.js";
import Message from "./models/Message.js"; 
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);


// Routes
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// MongoDB

mongoose
  mongoose.connect("mongodb://127.0.0.1:27017/chatapp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error(err));

// Save message
app.post("/api/messages", async (req, res) => {
  try {
    const msg = await Message.create(req.body);
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a room
app.get("/api/messages/:room", async (req, res) => {
  try {
    const msgs = await Message.find({ room: req.params.room });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("⚡ A user connected:", socket.id);

  socket.on("joinRoom", async (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);

    // 🔹 Send old messages to user who joined
    const oldMessages = await Message.find({ room }).sort({ createdAt: 1 });
    socket.emit("loadMessages", oldMessages);
  });

  socket.on("sendMessage", async (message) => {
  try {
    // Save message in MongoDB
    const newMessage = new Message(message);
    await newMessage.save();

    // ✅ Broadcast the saved message (with _id, createdAt, etc.)
    io.to(message.room).emit("receiveMessage", newMessage);
    console.log("📤 broadcasted:", newMessage); 
  } catch (error) {
    console.error("Error saving message:", error);
    
  }
});


  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
