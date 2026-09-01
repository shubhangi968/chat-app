import React, {
  useState,
} from "react";


function MessageInput({
  onSend,
}) {

  const [text, setText] =
    useState("");

  const [showEmoji, setShowEmoji] =
    useState(false);


  // ====================================================
  // SEND
  // ====================================================

  const handleSend = () => {

    if (text.trim() === "") {
      return;
    }

    onSend(text.trim());

    setText("");

  };


  // ====================================================
  // EMOJI
  // ====================================================

  const addEmoji = (emoji) => {

    setText(
      (prev) =>
        prev + emoji
    );

    setShowEmoji(false);

  };


  const emojis = [
    "😀",
    "😂",
    "😍",
    "👍",
    "🔥",
    "🥳",
    "😎",
    "❤️",
    "😭",
    "🙏",
  ];


  return (

    <div className="relative flex items-center p-3 border-t bg-white">


      {/* =================================================
          EMOJI BUTTON
      ================================================= */}

      <button

        type="button"

        onClick={() =>
          setShowEmoji(
            !showEmoji
          )
        }

        className="mr-2 text-2xl hover:scale-110 transition"

      >
        😀
      </button>


      {/* =================================================
          EMOJI PICKER
      ================================================= */}

      {showEmoji && (

        <div className="absolute bottom-16 left-3 bg-white shadow-xl border rounded-xl p-3 grid grid-cols-5 gap-2 z-10">

          {emojis.map(
            (emoji) => (

              <button

                key={emoji}

                type="button"

                onClick={() =>
                  addEmoji(
                    emoji
                  )
                }

                className="text-2xl hover:scale-125 transition"

              >
                {emoji}

              </button>

            )
          )}

        </div>

      )}


      {/* =================================================
          INPUT
      ================================================= */}

      <input

        type="text"

        value={text}

        onChange={(e) =>
          setText(
            e.target.value
          )
        }

        placeholder="Type a message..."

        className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"

        onKeyDown={(e) => {

          if (
            e.key === "Enter"
          ) {

            e.preventDefault();

            handleSend();

          }

        }}

      />


      {/* =================================================
          SEND BUTTON
      ================================================= */}

      <button

        type="button"

        onClick={handleSend}

        className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-full transition"

      >
        Send
      </button>

    </div>

  );

}


export default MessageInput;