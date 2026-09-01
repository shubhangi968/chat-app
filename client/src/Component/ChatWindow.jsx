
import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

function ChatWindow({
  messages,
  onSend,
  currentUser,
  currentRoom,
  currentContact,
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 bg-white rounded-l-2xl shadow-xl overflow-hidden">

      {/* HEADER */}
      <div className="bg-blue-600 text-white px-5 py-4 font-semibold text-lg flex items-center gap-3 shadow">

        {/* Friend Profile Picture */}
        {currentContact?.profilePicture ? (
          <img
            src={currentContact.profilePicture}
            alt={currentContact.username}
            className="w-10 h-10 rounded-full object-cover border-2 border-white"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold">
            {currentContact?.username
              ?.charAt(0)
              ?.toUpperCase() || "?"}
          </div>
        )}

        <div>
          <div>
            {currentContact?.username || currentRoom}
          </div>

          <div className="text-xs font-normal text-blue-100">
            {currentContact ? "Friend" : ""}
          </div>
        </div>

      </div>

      {/* MESSAGES */}
      <div
        ref={scrollRef}
        className="flex-1 bg-gray-50 p-4 space-y-3 overflow-y-auto"
      >
        {messages.map((m, idx) => (
          <MessageBubble
            key={m._id || idx}
            text={m.text}
            sender={m.sender}
            isOwn={m.sender === currentUser}
            profilePicture={
              m.sender === currentUser
                ? null
                : currentContact?.profilePicture
            }
          />
        ))}
      </div>

      {/* INPUT */}
      <div className="border-t bg-white">
        <MessageInput onSend={onSend} />
      </div>

    </div>
  );
}

export default ChatWindow;

