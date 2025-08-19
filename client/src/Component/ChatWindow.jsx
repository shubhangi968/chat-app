import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

function ChatWindow({ messages, onSend, currentUser, currentRoom }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col flex-1 bg-white rounded-l-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white px-5 py-4 font-semibold text-lg flex items-center gap-2 shadow">
        <span className="text-xl">💬</span>
        <span>{currentRoom ? currentRoom : "Select a Contact"}</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 bg-gray-50 p-4 space-y-3 overflow-y-auto"
      >
        {messages.map((m, idx) => (
          <MessageBubble
            key={m._id || idx}
            text={m.text}
            sender={m.sender}
            isOwn={m.sender === currentUser || m.isOwn === true}
          />
        ))}
      </div>

      {/* Input */}
      <div className="border-t bg-white">
        <MessageInput onSend={onSend} />
      </div>
    </div>
  );
}

export default ChatWindow;
