import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: "", },
    appearance: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "light",
      },

      accentColor: {
        type: String,
        enum: ["blue", "purple", "green", "pink", "orange"],
        default: "blue",
      },

      chatBackground: {
        type: String,
        enum: ["default", "white", "gray", "blue"],
        default: "default",
      },

      fontSize: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
      },

      bubbleStyle: {
        type: String,
        enum: ["rounded", "compact", "minimal"],
        default: "rounded",
      },
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Friend requests received
    friendRequests: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
