import React, {
  useEffect,
  useRef,
} from "react";

import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

function ChatWindow({
  messages,
  onSend,
  currentUser,
  currentRoom,
  currentContact,
  onlineUsers = [],
  appearance,
}) {
  const scrollRef = useRef(null);

  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // =====================================================
  // ONLINE STATUS
  // =====================================================

  const isContactOnline =
    currentContact &&
    onlineUsers.some(
      (id) =>
        String(id) ===
        String(currentContact._id)
    );

  // =====================================================
  // ACCENT COLOR
  // =====================================================

  const accentColors = {
    blue: "#3b82f6",
    purple: "#8b5cf6",
    green: "#22c55e",
    pink: "#ec4899",
    orange: "#f97316",
  };

  const accent =
    accentColors[
      appearance?.accentColor
    ] || "#3b82f6";

  // =====================================================
  // CHAT BACKGROUND
  // =====================================================

  const backgrounds = {
    default:
      appearance?.theme === "dark"
        ? "#111827"
        : "#f9fafb",

    white: "#ffffff",

    gray:
      appearance?.theme === "dark"
        ? "#1f2937"
        : "#f3f4f6",

    blue:
      appearance?.theme === "dark"
        ? "#172033"
        : "#eff6ff",
  };

  const chatBackground =
    backgrounds[
      appearance?.chatBackground
    ] || backgrounds.default;

  return (
    <div
      className={`flex flex-col flex-1 h-screen rounded-l-2xl shadow-xl overflow-hidden ${
        appearance?.theme === "dark"
          ? "bg-gray-900"
          : "bg-white"
      }`}
    >

      {/* HEADER */}

      <div
        style={{
          backgroundColor: accent,
        }}
        className="text-white px-5 py-4 font-semibold text-lg flex items-center gap-3 shadow"
      >

        {/* FRIEND PROFILE */}

        {currentContact?.profilePicture ? (
          <img
            src={
              currentContact.profilePicture
            }
            alt={
              currentContact.username
            }
            className="w-10 h-10 rounded-full object-cover border-2 border-white"
          />
        ) : (
          <div
            style={{
              color: accent,
            }}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold"
          >
            {currentContact?.username
              ?.charAt(0)
              ?.toUpperCase() || "?"}
          </div>
        )}

        <div>
          <div>
            {currentContact?.username ||
              currentRoom}
          </div>

          <div
            className={`text-xs font-normal ${
              isContactOnline
                ? "text-green-200"
                : "text-white/70"
            }`}
          >
            {isContactOnline
              ? "Online"
              : "Offline"}
          </div>
        </div>
      </div>

      {/* MESSAGES */}

      <div
        ref={scrollRef}
        style={{
          backgroundColor:
            chatBackground,
        }}
        className="flex-1 p-4 space-y-3 overflow-y-auto"
      >
        {messages.map((m, idx) => (
          <MessageBubble
            key={m._id || idx}
            text={m.text}
            sender={m.sender}
            isOwn={
              m.sender === currentUser
            }
            profilePicture={
              m.sender === currentUser
                ? null
                : currentContact?.profilePicture
            }
            appearance={appearance}
          />
        ))}
      </div>

      {/* INPUT */}

      <div
        className={`border-t ${
          appearance?.theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white"
        }`}
      >
        <MessageInput
          onSend={onSend}
        />
      </div>
    </div>
  );
}

export default ChatWindow;
