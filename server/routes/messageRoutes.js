import express from "express";
import Message from "../models/Message.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ===================================================
// GET MESSAGES FOR A CHAT ROOM
// ===================================================

router.get(
  "/:room",
  authMiddleware,
  async (req, res) => {
    try {
      const { room } = req.params;

      // Verify room format
      const roomUsers = room.split("_");

      if (roomUsers.length !== 2) {
        return res.status(400).json({
          error: "Invalid room",
        });
      }

      // Verify authenticated user belongs to room
      const currentUserId = String(req.user.id);

      if (!roomUsers.includes(currentUserId)) {
        return res.status(403).json({
          error: "You are not allowed to access this chat",
        });
      }

      const messages = await Message.find({
        room,
      }).sort({
        createdAt: 1,
      });

      res.json(messages);

    } catch (err) {

      console.error(
        "Error fetching messages:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ===================================================
// SAVE MESSAGE
// ===================================================

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const { room, text } = req.body;

      if (!room || !text?.trim()) {
        return res.status(400).json({
          error: "Room and message text are required",
        });
      }

      // Verify room format
      const roomUsers = room.split("_");

      if (roomUsers.length !== 2) {
        return res.status(400).json({
          error: "Invalid room",
        });
      }

      // Verify authenticated user belongs to room
      const currentUserId = String(req.user.id);

      if (!roomUsers.includes(currentUserId)) {
        return res.status(403).json({
          error: "You are not allowed to send messages in this chat",
        });
      }

      const newMessage = new Message({
        room,

        // ALWAYS use authenticated user's ID
        senderId: req.user.id,

        // Keep existing username-based UI working
        sender: req.body.sender,

        text: text.trim(),

        status: "sent",
      });

      await newMessage.save();

      res.status(201).json(newMessage);

    } catch (err) {

      console.error(
        "Error saving message:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ===================================================
// MARK MESSAGE AS SEEN
// ===================================================

router.put(
  "/seen/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const msg = await Message.findById(id);

      if (!msg) {
        return res.status(404).json({
          error: "Message not found",
        });
      }

      // Verify the authenticated user belongs
      // to the message's private room
      const roomUsers = msg.room.split("_");
      const currentUserId = String(req.user.id);

      if (
        roomUsers.length !== 2 ||
        !roomUsers.includes(currentUserId)
      ) {
        return res.status(403).json({
          error: "You are not allowed to modify this message",
        });
      }

      msg.status = "seen";

      await msg.save();

      res.json(msg);

    } catch (err) {

      console.error(
        "Error updating message:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

export default router;