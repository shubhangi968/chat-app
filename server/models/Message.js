import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sender: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      default: "sent",
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({
  room: 1,
  createdAt: 1,
});

const Message = mongoose.model(
  "Message",
  messageSchema
);

export default Message;