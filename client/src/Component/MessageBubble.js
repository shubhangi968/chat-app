import React from "react";

function MessageBubble({ text, sender, isOwn }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} w-full`}>
      <div
        className={`px-4 py-2 rounded-2xl shadow text-sm md:text-base ${
          isOwn
            ? "bg-blue-500 text-white rounded-br-none max-w-md"
            : "bg-gray-200 text-gray-900 rounded-bl-none max-w-md"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export default MessageBubble;
