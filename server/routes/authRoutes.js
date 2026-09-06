import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// REGISTER
// ======================================================

router.post(
  "/register",
  async (req, res) => {

    try {

      const {
        username,
        email,
        password,
      } = req.body;

      // Check existing email
      const existingEmail =
        await User.findOne({
          email,
        });

      if (existingEmail) {
        return res.status(400).json({
          error:
            "Email already in use",
        });
      }

      // Check existing username
      const existingUsername =
        await User.findOne({
          username,
        });

      if (existingUsername) {
        return res.status(400).json({
          error:
            "Username already in use",
        });
      }

      // Hash password
      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      // Create user
      const newUser =
        await User.create({
          username,
          email,
          password:
            hashedPassword,
        });

      // Create JWT
      const token =
        jwt.sign(
          {
            id: newUser._id,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );

      res.json({
        user: {
          id: newUser._id,
          username:
            newUser.username,
          email:
            newUser.email,
          profilePicture: newUser.profilePicture || "",
        },

        token,
      });

    } catch (err) {

      console.error(
        "Register error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ======================================================
// LOGIN
// ======================================================

router.post(
  "/login",
  async (req, res) => {

    try {

      const {
        email,
        password,
      } = req.body;

      // Find user
      const user =
        await User.findOne({
          email,
        });

      if (!user) {
        return res.status(400).json({
          error:
            "User not found",
        });
      }

      // Check password
      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isMatch) {
        return res.status(400).json({
          error:
            "Invalid credentials",
        });
      }

      // Create JWT
      const token =
        jwt.sign(
          {
            id: user._id,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );

      res.json({
        user: {
          id: user._id,
          username:
            user.username,
          email:
            user.email,
          profilePicture: user.profilePicture,
        },

        token,
      });

    } catch (err) {

      console.error(
        "Login error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ======================================================
// SEARCH USERS
// ======================================================

router.get(
  "/search/:username",
  authMiddleware,
  async (req, res) => {

    try {

      const username =
        req.params.username;

      const users =
        await User.find({
          username: {
            $regex: username,
            $options: "i",
          },
        }).select(
          "_id username"
        );

      res.json(users);

    } catch (err) {

      console.error(
        "Search error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ======================================================
// SEND FRIEND REQUEST
// ======================================================

router.post(
  "/send-request",
  authMiddleware,
  async (req, res) => {

    try {

      const { friendId } = req.body;

      const userId = req.user.id;

      if (
        !userId ||
        !friendId
      ) {
        return res.status(400).json({
          error:
            "User ID and friend ID are required",
        });
      }

      if (
        userId === friendId
      ) {
        return res.status(400).json({
          error:
            "You cannot send a request to yourself",
        });
      }

      const user =
        await User.findById(
          userId
        );

      const friend =
        await User.findById(
          friendId
        );

      if (!user || !friend) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      // Already friends
      if (
        user.friends.some(
          (id) =>
            id.toString() ===
            friendId
        )
      ) {
        return res.status(400).json({
          error:
            "Already friends",
        });
      }

      // Request already exists
      if (
        friend.friendRequests.some(
          (request) =>
            request.from.toString() ===
            userId
        )
      ) {
        return res.status(400).json({
          error:
            "Friend request already sent",
        });
      }

      // Send request
      friend.friendRequests.push({
        from: user._id,
      });

      await friend.save();

      res.json({
        message:
          "Friend request sent",
      });

    } catch (err) {

      console.error(
        "Send request error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ======================================================
// GET FRIEND REQUESTS
// ======================================================

router.get(
  "/friend-requests",
  authMiddleware,
  async (req, res) => {

    try {

      const user =
        await User.findById(
          req.user.id
        ).populate(
          "friendRequests.from",
          "_id username"
        );

      if (!user) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      res.json(
        user.friendRequests
      );

    } catch (err) {

      console.error(
        "Get requests error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ======================================================
// ACCEPT FRIEND REQUEST
// ======================================================

router.post(
  "/accept-request",
  authMiddleware,
  async (req, res) => {

    try {

      const { requesterId } = req.body;

      const userId = req.user.id;

      const user =
        await User.findById(
          userId
        );

      const requester =
        await User.findById(
          requesterId
        );

      if (
        !user ||
        !requester
      ) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      // Find request
      const requestIndex =
        user.friendRequests.findIndex(
          (request) =>
            request.from.toString() ===
            requesterId
        );

      if (
        requestIndex === -1
      ) {
        return res.status(400).json({
          error:
            "Friend request not found",
        });
      }

      // Remove request
      user.friendRequests.splice(
        requestIndex,
        1
      );

      // Add requester to user's friends
      if (
        !user.friends.some(
          (id) =>
            id.toString() ===
            requesterId
        )
      ) {
        user.friends.push(
          requester._id
        );
      }

      // Add user to requester's friends
      if (
        !requester.friends.some(
          (id) =>
            id.toString() ===
            userId
        )
      ) {
        requester.friends.push(
          user._id
        );
      }

      await user.save();
      await requester.save();

      res.json({
        message:
          "Friend request accepted",
      });

    } catch (err) {

      console.error(
        "Accept request error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ======================================================
// DECLINE FRIEND REQUEST
// ======================================================

router.post(
  "/decline-request",
  authMiddleware,
  async (req, res) => {

    try {

      const { requesterId } = req.body;

      const userId = req.user.id;

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      user.friendRequests =
        user.friendRequests.filter(
          (request) =>
            request.from.toString() !==
            requesterId
        );

      await user.save();

      res.json({
        message:
          "Friend request declined",
      });

    } catch (err) {

      console.error(
        "Decline request error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ======================================================
// GET FRIENDS
// ======================================================

router.get(
  "/friends",
  authMiddleware,
  async (req, res) => {

    try {

      const user =
        await User.findById(
          req.user.id
        ).populate(
          "friends",
          "_id username profilePicture"
        );

      if (!user) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      res.json(
        user.friends
      );

    } catch (err) {

      console.error(
        "Get friends error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ======================================================
// UPDATE PROFILE
// ======================================================

router.put(
  "/profile",
  authMiddleware,
  async (req, res) => {

    try {

      const userId = req.user.id;

      const {
        username,
        profilePicture,
      } = req.body;

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      if (username && username.trim()) {
        const trimmedUsername = username.trim();

        const existingUser = await User.findOne({
          username: trimmedUsername,
          _id: { $ne: userId },
        });

        if (existingUser) {
          return res.status(400).json({
            error: "Username already in use",
          });
        }

        user.username = trimmedUsername;
      }

      if (profilePicture !== undefined) {
        user.profilePicture = profilePicture;
      }

      await user.save();

      res.json({
        message:
          "Profile updated successfully",

        user: {
          id: user._id,
          username:
            user.username,
          email:
            user.email,
          profilePicture:
            user.profilePicture,
        },
      });

    } catch (err) {

      console.error(
        "Profile update error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ===================================================
// GET APPEARANCE SETTINGS
// ===================================================

router.get(
  "/appearance",
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(
        req.user.id
      ).select("appearance");

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      res.json(
        user.appearance
      );

    } catch (err) {

      console.error(
        "Get appearance error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// ===================================================
// UPDATE APPEARANCE SETTINGS
// ===================================================

router.put(
  "/appearance",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        theme,
        accentColor,
        chatBackground,
        fontSize,
        bubbleStyle,
      } = req.body;

      const user = await User.findById(
        req.user.id
      );

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      // ---------------------------------------------
      // UPDATE ONLY VALID PROVIDED VALUES
      // ---------------------------------------------

      if (
        ["light", "dark", "system"]
          .includes(theme)
      ) {
        user.appearance.theme = theme;
      }

      if (
        [
          "blue",
          "purple",
          "green",
          "pink",
          "orange",
        ].includes(accentColor)
      ) {
        user.appearance.accentColor =
          accentColor;
      }

      if (
        [
          "default",
          "white",
          "gray",
          "blue",
        ].includes(chatBackground)
      ) {
        user.appearance.chatBackground =
          chatBackground;
      }

      if (
        [
          "small",
          "medium",
          "large",
        ].includes(fontSize)
      ) {
        user.appearance.fontSize =
          fontSize;
      }

      if (
        [
          "rounded",
          "compact",
          "minimal",
        ].includes(bubbleStyle)
      ) {
        user.appearance.bubbleStyle =
          bubbleStyle;
      }

      await user.save();

      res.json(
        user.appearance
      );

    } catch (err) {

      console.error(
        "Update appearance error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

router.get("/test", (req, res) => {
  res.json({
    message: "AUTH ROUTES ARE WORKING"
  });
});

export default router;
