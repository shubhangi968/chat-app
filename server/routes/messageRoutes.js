import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// ✅ Get all messages for a chat (already correct)
router.get("/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Send a new message (save to DB + return)
router.post("/", async (req, res) => {
  try {
    const msg = new Message(req.body);
    await msg.save();

    // 🔥 Emit message via Socket.io (if socket.io instance exists)
    if (req.app.get("io")) {
      req.app.get("io").to(msg.chatId).emit("receiveMessage", msg);
    }

    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 
   ✅ Extra API: mark message as seen 
   - Updates the `status` field in DB
   - Emits "seenMessage" via socket.io
*/
router.put("/seen/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findByIdAndUpdate(
      id,
      { status: "seen" },
      { new: true }
    );

    if (req.app.get("io") && msg) {
      req.app.get("io").to(msg.chatId).emit("seenMessage", msg);
    }

    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
