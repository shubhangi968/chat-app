import React from "react";

function MessageBubble({
  text,
  sender,
  isOwn,
  profilePicture,
  appearance,
}) {
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
  // FONT SIZE
  // =====================================================

  const fontSizes = {
    small: "13px",
    medium: "15px",
    large: "18px",
  };

  const fontSize =
    fontSizes[
      appearance?.fontSize
    ] || "15px";

  // =====================================================
  // BUBBLE STYLE
  // =====================================================

  let bubbleClass =
    "px-4 py-2 shadow max-w-xs";

  if (
    appearance?.bubbleStyle ===
    "rounded"
  ) {
    bubbleClass +=
      " rounded-2xl";
  }

  if (
    appearance?.bubbleStyle ===
    "compact"
  ) {
    bubbleClass +=
      " rounded-lg px-3 py-1.5";
  }

  if (
    appearance?.bubbleStyle ===
    "minimal"
  ) {
    bubbleClass +=
      " rounded-md shadow-none";
  }

  return (
    <div
      className={`flex items-end gap-2 ${
        isOwn
          ? "justify-end"
          : "justify-start"
      }`}
    >

      {/* OTHER USER PROFILE */}

      {!isOwn &&
        (profilePicture ? (
          <img
            src={profilePicture}
            alt={sender}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            style={{
              backgroundColor:
                appearance?.theme === "dark"
                  ? "#374151"
                  : "#dbeafe",
              color: accent,
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          >
            {sender
              ?.charAt(0)
              ?.toUpperCase()}
          </div>
        ))}

      {/* MESSAGE */}

      <div
        style={{
          fontSize,
          ...(isOwn
            ? {
                backgroundColor: accent,
                color: "#ffffff",
              }
            : {}),
        }}
        className={`${bubbleClass} ${
          !isOwn
            ? appearance?.theme ===
              "dark"
              ? "bg-gray-700 text-white"
              : "bg-gray-200 text-black"
            : ""
        }`}
      >

        {/* SENDER */}

        {!isOwn && (
          <span
            className={`block text-xs mb-1 ${
              appearance?.theme ===
              "dark"
                ? "text-gray-300"
                : "text-gray-500"
            }`}
          >
            {sender}
          </span>
        )}

        <span>
          {text}
        </span>

      </div>
    </div>
  );
}

export default MessageBubble;
