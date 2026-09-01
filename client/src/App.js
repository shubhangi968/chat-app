import React, {
  useEffect,
  useState,
} from "react";

import ChatWindow from "./Component/ChatWindow";
import Sidebar from "./Component/Sidebar";
import Login from "./Component/Login";
import Register from "./Component/Register";
import socket from "./Component/socket";

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const [showRegister, setShowRegister] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentContact, setCurrentContact] = useState(null);

  // =====================================================
  // SOCKET CONNECTION + ONLINE USERS
  // =====================================================

  useEffect(() => {
    const handleConnect = () => {
      console.log(
        "✅ Connected to server:",
        socket.id
      );

      if (user?.id) {
        socket.emit(
          "registerUser",
          String(user.id)
        );
      }
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

    // Register listeners FIRST
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
    if (
      socket.connected &&
      user?.id
    ) {
      socket.emit(
        "registerUser",
        String(user.id)
      );
    }

    // Cleanup
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
          `http://localhost:5000/api/auth/friends/${user.id}`
        );

        const data = await res.json();

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
  // RECEIVE MESSAGES
  // =====================================================

  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      console.log(
        "📩 Received:",
        msg
      );

      setMessages((prev) => ({
        ...prev,

        [msg.room]: [
          ...(prev[msg.room] || []),
          msg,
        ],
      }));
    };

    const handleLoadMessages = (msgs) => {
      console.log(
        "📜 History:",
        msgs
      );

      if (!currentRoom) return;

      setMessages((prev) => ({
        ...prev,

        [currentRoom]: msgs,
      }));
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
  }, [currentRoom]);

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
  // OPEN FRIEND CHAT
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
  // MAIN APP
  // =====================================================

  return (
    <div className="flex h-screen bg-gray-100">

      {/* SIDEBAR */}

      <Sidebar
        contacts={contacts}
        setUser={setUser}
        currentRoom={currentRoom}
        currentUser={user}
        onlineUsers={onlineUsers}
        setCurrentRoom={setCurrentRoom}
        setCurrentContact={setCurrentContact}
        onSelectFriend={handleSelectFriend}
        setContacts={setContacts}
        socket={socket}
      />

      {/* CHAT AREA */}

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
            currentContact={currentContact}
            onlineUsers={onlineUsers}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">

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