
import React from "react";

function MessageBubble({
  text,
  sender,
  isOwn,
  profilePicture,
}) {
  return (
    <div
      className={`flex items-end gap-2 ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >

      {/* OTHER USER PROFILE PICTURE */}
      {!isOwn && (
        profilePicture ? (
          <img
            src={profilePicture}
            alt={sender}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {sender?.charAt(0)?.toUpperCase()}
          </div>
        )
      )}

      {/* MESSAGE */}
      <div
        className={`px-4 py-2 rounded-2xl shadow max-w-xs ${
          isOwn
            ? "bg-blue-500 text-white rounded-br-sm"
            : "bg-gray-200 text-black rounded-bl-sm"
        }`}
      >
        {!isOwn && (
          <span className="block text-xs text-gray-500 mb-1">
            {sender}
          </span>
        )}

        <span>{text}</span>
      </div>

    </div>
  );
}

export default MessageBubble;

