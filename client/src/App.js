import React, {
  useEffect,
  useState,
} from "react";

import ChatWindow from "./Component/ChatWindow";
import Sidebar from "./Component/Sidebar";
import Login from "./Component/Login";
import Register from "./Component/Register";
import socket from "./Component/socket";
import Appearance from "./Component/Appearance";

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const [showRegister, setShowRegister] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentContact, setCurrentContact] =
    useState(null);

  const [showAppearance, setShowAppearance] =
    useState(false);

  // =====================================================
  // APPEARANCE SETTINGS
  // =====================================================

  const [appearance, setAppearance] = useState({
    theme: "light",
    accentColor: "blue",
    chatBackground: "default",
    fontSize: "medium",
    bubbleStyle: "rounded",
  });

  // =====================================================
  // LOAD APPEARANCE FROM BACKEND
  // =====================================================

  useEffect(() => {
    if (!user?.id) return;

    const loadAppearance = async () => {
      try {
        const token =
          localStorage.getItem("token");

        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/auth/appearance`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (res.ok) {
          setAppearance(data);
        } else {
          console.error(
            "Failed to load appearance:",
            data
          );
        }

      } catch (error) {
        console.error(
          "Appearance loading error:",
          error
        );
      }
    };

    loadAppearance();

  }, [user?.id]);

  // =====================================================
  // APPLY THEME
  // =====================================================

  useEffect(() => {
    const applyTheme = () => {
      let dark = false;

      if (appearance.theme === "dark") {
        dark = true;
      }

      if (appearance.theme === "system") {
        dark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
      }

      document.documentElement.classList.toggle(
        "dark",
        dark
      );
    };

    applyTheme();

    if (appearance.theme === "system") {
      const mediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      const handleChange = () => {
        applyTheme();
      };

      mediaQuery.addEventListener(
        "change",
        handleChange
      );

      return () => {
        mediaQuery.removeEventListener(
          "change",
          handleChange
        );
      };
    }
  }, [appearance.theme]);

  // =====================================================
  // SOCKET CONNECTION + ONLINE USERS
  // =====================================================

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const handleConnect = () => {
      console.log(
        "✅ Connected to server:",
        socket.id
      );

      // Server already identifies the user
      // using the JWT token.
      socket.emit("registerUser");
    };

    const handleOnlineUsers = (users) => {
      console.log(
        "🟢 Online users received:",
        users
      );

      setOnlineUsers(
        users.map((id) => String(id))
      );
    };

    const handleDisconnect = () => {
      console.log(
        "❌ Disconnected from server"
      );

      setOnlineUsers([]);
    };

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "onlineUsers",
      handleOnlineUsers
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    // If socket is already connected
    if (socket.connected) {
      socket.emit("registerUser");
    }

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "onlineUsers",
        handleOnlineUsers
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );
    };
  }, [user?.id]);

  // =====================================================
  // LOAD FRIENDS
  // =====================================================

  useEffect(() => {
    if (!user?.id) return;

    const loadFriends = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/auth/friends`, 
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const data = await res.json();
        console.log("FRIENDS API STATUS:", res.status);
        console.log("FRIENDS API DATA:", data);

        if (res.ok) {
          setContacts(data);
        }
      } catch (error) {
        console.error(
          "Error loading friends:",
          error
        );
      }
    };

    loadFriends();
  }, [user?.id]);

  // =====================================================
  // JOIN CHAT ROOM
  // =====================================================

  useEffect(() => {
    if (!currentRoom) return;

    socket.emit(
      "joinRoom",
      currentRoom
    );
  }, [currentRoom]);

  // =====================================================
  // RECEIVE + LOAD MESSAGES
  // =====================================================

  useEffect(() => {

    // ---------------------------------------------
    // RECEIVE NEW MESSAGE
    // ---------------------------------------------

    const handleReceiveMessage = (msg) => {
      if (!msg?.room || !msg?._id) {
        return;
      }

      setMessages((prev) => {

        const existingMessages =
          prev[msg.room] || [];

        // Prevent duplicate messages
        const alreadyExists =
          existingMessages.some(
            (existingMsg) =>
              existingMsg._id === msg._id
          );

        if (alreadyExists) {
          return prev;
        }

        return {
          ...prev,

          [msg.room]: [
            ...existingMessages,
            msg,
          ],
        };
      });
    };

    // ---------------------------------------------
    // LOAD OLD MESSAGES
    // ---------------------------------------------

    const handleLoadMessages = (data) => {
      if (
        !data?.room ||
        !Array.isArray(data.messages)
      ) {
        return;
      }

      setMessages((prev) => {

        const existingMessages =
          prev[data.room] || [];

        // Combine old + newly received messages
        const combinedMessages = [
          ...data.messages,
          ...existingMessages,
        ];

        // Remove duplicates using MongoDB _id
        const uniqueMessages = [];

        const seenIds = new Set();

        combinedMessages.forEach((msg) => {

          if (!msg?._id) {
            return;
          }

          if (!seenIds.has(msg._id)) {
            seenIds.add(msg._id);
            uniqueMessages.push(msg);
          }
        });

        // Sort chronologically
        uniqueMessages.sort(
          (a, b) =>
            new Date(a.createdAt) -
            new Date(b.createdAt)
        );

        return {
          ...prev,

          [data.room]: uniqueMessages,
        };
      });
    };

    socket.on(
      "receiveMessage",
      handleReceiveMessage
    );

    socket.on(
      "loadMessages",
      handleLoadMessages
    );

    return () => {

      socket.off(
        "receiveMessage",
        handleReceiveMessage
      );

      socket.off(
        "loadMessages",
        handleLoadMessages
      );

    };

  }, []);
  // =====================================================
  // CREATE PRIVATE ROOM
  // =====================================================

  const createRoom = (friendId) => {
    const ids = [
      String(user.id),
      String(friendId),
    ].sort();

    return `${ids[0]}_${ids[1]}`;
  };

  // =====================================================
  // SELECT FRIEND
  // =====================================================

  const handleSelectFriend = (friend) => {
    const room = createRoom(
      friend._id
    );

    setCurrentRoom(room);
    setCurrentContact(friend);
  };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSend = (text) => {
    if (
      !currentRoom ||
      !text.trim()
    ) {
      return;
    }

    const msg = {
      text: text.trim(),

      sender:
        user?.username ||
        user?.name ||
        "me",

      senderId: user.id,

      profilePicture:
        user.profilePicture || "",

      room: currentRoom,
    };

    socket.emit(
      "sendMessage",
      msg
    );
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    setContacts([]);
    setCurrentRoom(null);
    setCurrentContact(null);
    setMessages({});
    setOnlineUsers([]);
  };

  // =====================================================
  // LOGIN / REGISTER
  // =====================================================

  if (!user) {
    return showRegister ? (
      <Register
        setUser={setUser}
        setShowRegister={setShowRegister}
      />
    ) : (
      <Login
        setUser={setUser}
        setShowRegister={setShowRegister}
      />
    );
  }

  // =====================================================
  // APPEARANCE SCREEN
  // =====================================================

  if (showAppearance) {
    return (
      <Appearance
        appearance={appearance}
        setAppearance={setAppearance}
        onBack={() =>
          setShowAppearance(false)
        }
      />
    );
  }

  // =====================================================
  // MAIN APP
  // =====================================================

  return (
    <div
      className={`flex h-screen ${appearance.theme === "dark"
        ? "bg-gray-900"
        : "bg-gray-100"
        }`}
    >

      {/* SIDEBAR */}

      <Sidebar
        contacts={contacts}
        setUser={setUser}
        currentRoom={currentRoom}
        currentUser={user}
        onlineUsers={onlineUsers}
        setCurrentRoom={setCurrentRoom}
        setCurrentContact={
          setCurrentContact
        }
        onSelectFriend={
          handleSelectFriend
        }
        setContacts={setContacts}
        socket={socket}
        onOpenAppearance={() =>
          setShowAppearance(true)
        }
        appearance={appearance}
        onLogout={handleLogout}
      />

      {/* CHAT */}

      <div className="flex-1">

        {currentRoom ? (
          <ChatWindow
            messages={
              messages[currentRoom] || []
            }
            onSend={handleSend}
            currentUser={
              user?.username ||
              user?.name ||
              "me"
            }
            currentRoom={currentRoom}
            currentContact={
              currentContact
            }
            onlineUsers={onlineUsers}
            appearance={appearance}
          />
        ) : (
          <div
            className={`flex flex-col items-center justify-center h-full ${appearance.theme === "dark"
              ? "bg-gray-900 text-gray-400"
              : "bg-gray-100 text-gray-400"
              }`}
          >
            <div className="text-6xl mb-4">
              💬
            </div>

            <h2 className="text-xl font-semibold">
              Welcome to ChatApp
            </h2>

            <p className="mt-2">
              Select a friend to start chatting
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;