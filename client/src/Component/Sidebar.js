import React from "react";

function Sidebar({ contacts = [], setCurrentRoom, currentRoom }) {
  return (
    <div className="w-64 bg-gray-100 border-r p-4 space-y-2">
      <h2 className="font-bold text-lg mb-4">Contacts</h2>
      {contacts.length === 0 ? (
        <p className="text-gray-500">No contacts</p>
      ) : (
        contacts.map((c, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentRoom(c.name)}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              currentRoom === c.name
                ? "bg-blue-500 text-white"
                : "hover:bg-blue-100"
            }`}
          >
            {c.name}
          </button>
        ))
      )}
    </div>
  );
}

export default Sidebar;
