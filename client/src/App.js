import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import ChatWindow from "./Component/ChatWindow";
import Sidebar from "./Component/Sidebar";
import Login from "./Component/Login";
import Register from "./Component/Register";

const socket = io("http://localhost:5000");

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [showRegister, setShowRegister] = useState(false);
  console.log("🔎 Current user state:", user);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [contacts] = useState([
    { name: "friend 1", room: "room1" },
    { name: "friend 2", room: "room2" },
    { name: "friend 3", room: "room3" },
  ]);
  const [messages, setMessages] = useState({});

  // ✅ Debug connection
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  // 🔹 Join room
  useEffect(() => {
    if (currentRoom) {
      socket.emit("joinRoom", currentRoom);
    }
  }, [currentRoom]);

  // 🔹 Listen for socket events
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      console.log("📩 received from socket:", msg);
      setMessages((prev) => ({
        ...prev,
        [msg.room]: [...(prev[msg.room] || []), msg],
      }));
    };

    const handleLoadMessages = (msgs) => {
      setMessages((prev) => ({
        ...prev,
        [currentRoom]: msgs,
      }));
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("loadMessages", handleLoadMessages);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("loadMessages", handleLoadMessages);
    };
  }, [currentRoom]);

  // 🔹 Send message
  const handleSend = (text) => {
    if (!currentRoom) return;

    const msg = {
      text,
      sender: user?.username || "me",
      room: currentRoom,
    };

    socket.emit("sendMessage", msg);
  };

  // 🔹 Auth check
  if (!user) {
    return showRegister ? (
      <Register setUser={setUser} setShowRegister={setShowRegister} />
    ) : (
      <Login setUser={setUser} setShowRegister={setShowRegister} />
    );
  }

  return (
     
    <div className="flex h-screen">
      <Sidebar
        contacts={contacts}
        setCurrentRoom={setCurrentRoom}
        currentRoom={currentRoom}
      />

      <div className="flex-1">
        {currentRoom ? (
          <ChatWindow
            messages={messages[currentRoom] || []}
            onSend={handleSend}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a friend to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default App;


