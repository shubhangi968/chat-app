import React, { useState } from "react";

function MessageInput({ onSend }) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const handleSend = () => {
    if (text.trim() !== "") {
      onSend(text);
      setText("");
    }
  };

  const addEmoji = (emoji) => {
    setText(text + emoji);
    setShowEmoji(false);
  };

  return (
    <div className="flex items-center p-3 border-t bg-white">
      <button
        onClick={() => setShowEmoji(!showEmoji)}
        className="mr-2 text-xl"
      >
        😀
      </button>

      {showEmoji && (
        <div className="absolute bottom-14 bg-white shadow-lg border rounded p-2 grid grid-cols-5 gap-2">
          {["😀", "😂", "😍", "👍", "🔥", "🥳", "😎", "❤️", "😭", "🙏"].map(
            (e) => (
              <button
                key={e}
                onClick={() => addEmoji(e)}
                className="text-2xl hover:scale-110"
              >
                {e}
              </button>
            )
          )}
        </div>
      )}

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 border rounded-full px-4 py-2 outline-none"
      />
      <button
        onClick={handleSend}
        className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-full"
      >
        Send
      </button>
    </div>
  );
}

export default MessageInput;
