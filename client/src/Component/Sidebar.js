import React, { useState, useEffect } from "react";
import Profile from "./Profile";

function Sidebar({
  contacts = [],
  setUser,
  currentRoom,
  currentUser,
  setCurrentRoom,
  setCurrentContact,
  onSelectFriend,
  setContacts,
  onlineUsers = [],
  socket,

}) {
  const [username, setUsername] = useState("");
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  // ====================================================
  // SEARCH USERS
  // ====================================================

  const searchUsers = async () => {
    if (!username.trim()) return;

    try {
      setSearching(true);

      const res = await fetch(
        `http://localhost:5000/api/auth/search/${username}`
      );

      const data = await res.json();

      if (res.ok) {
        // Don't show yourself
        const filtered = data.filter(
          (u) => u._id !== currentUser.id
        );

        setSearchResults(filtered);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  // ====================================================
  // ADD FRIEND
  // ====================================================

  const sendRequest = async (friendId) => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/send-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.id,
            friendId: friendId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      // Send real-time notification to receiver
      socket.emit("friendRequestSent", {
        senderId: currentUser.id,
        receiverId: friendId,
        senderUsername: currentUser.username,
      });

      alert("Friend request sent! 📩");

      setSearchResults([]);
      setUsername("");
    } catch (error) {
      console.error("Send request error:", error);
    }
  };

  // ====================================================
  // LOAD FRIEND REQUESTS
  // ====================================================

  const loadFriendRequests = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/friend-requests/${currentUser.id}`
      );

      const data = await res.json();

      if (res.ok) {
        setFriendRequests(data);
      }
    } catch (error) {
      console.error("Error loading requests:", error);
    }
  };

  // ====================================================
  // FRIEND REQUESTS - INITIAL + REAL-TIME
  // ====================================================

  useEffect(() => {
    // Load requests already waiting
    loadFriendRequests();

    // Listen for a new request
    const handleNewFriendRequest = () => {
      console.log("📩 New friend request received");

      loadFriendRequests();
    };

    socket.on(
      "newFriendRequest",
      handleNewFriendRequest
    );

    return () => {
      socket.off(
        "newFriendRequest",
        handleNewFriendRequest
      );
    };
  }, [currentUser.id]);

  // ====================================================
  // ACCEPT REQUEST
  // ====================================================

  const acceptRequest = async (requesterId) => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/accept-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.id,
            requesterId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("Friend request accepted! 🎉");

      await loadFriendRequests();

      // Reload friends
      const friendsRes = await fetch(
        `http://localhost:5000/api/auth/friends/${currentUser.id}`
      );

      const friendsData = await friendsRes.json();

      if (friendsRes.ok) {
        setContacts(friendsData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ====================================================
  // DECLINE REQUEST
  // ====================================================

  const declineRequest = async (requesterId) => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/decline-request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.id,
            requesterId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      await loadFriendRequests();
    } catch (error) {
      console.error(error);
    }
  };

  // ====================================================
  // CHECK IF ALREADY FRIEND
  // ====================================================

  const isFriend = (userId) => {
    return contacts.some(
      (friend) => friend._id === userId
    );
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="w-72 bg-white border-r flex flex-col">

      {/* SIDEBAR HEADER */}

      <div className="p-4 border-b">
        <h2 className="font-bold text-xl">
          💬 ChatApp
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {currentUser.username}
        </p>
      </div>


      {/* SEARCH */}

      <div className="p-3 border-b">

        <div className="flex gap-2">

          <input
            type="text"
            placeholder="Search username..."
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                searchUsers();
              }
            }}
            className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            onClick={searchUsers}
            disabled={searching}
            className="bg-blue-500 text-white px-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {searching ? "..." : "🔍"}
          </button>

        </div>


        {/* SEARCH RESULTS */}

        {searchResults.length > 0 && (

          <div className="mt-3 space-y-2">

            <p className="text-xs text-gray-500">
              Search Results
            </p>

            {searchResults.map((u) => (

              <div
                key={u._id}
                className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
              >

                <span className="text-sm font-medium truncate">
                  {u.username}
                </span>

                {isFriend(u._id) ? (

                  <span className="text-xs text-green-600">
                    ✓ Added
                  </span>

                ) : (

                  <button
                    onClick={() =>
                      sendRequest(u._id)
                    }
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    + Add
                  </button>

                )}

              </div>

            ))}

          </div>

        )}


        {username &&
          !searching &&
          searchResults.length === 0 && (

            <p className="text-xs text-gray-500 mt-2">
              No user found
            </p>

          )}

      </div>


      {/* FRIEND REQUESTS */}

      {friendRequests.length > 0 && (

        <div className="p-3 border-b">

          <div className="flex items-center justify-between mb-2">

            <h3 className="text-sm font-semibold">
              Friend Requests
            </h3>

            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {friendRequests.length}
            </span>

          </div>


          <div className="space-y-2">

            {friendRequests.map((request) => (

              <div
                key={request._id}
                className="bg-gray-50 p-2 rounded-lg"
              >

                <p className="font-medium text-sm">
                  {request.from.username}
                </p>

                <p className="text-xs text-gray-500 mb-2">
                  wants to be your friend
                </p>


                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      acceptRequest(
                        request.from._id
                      )
                    }
                    className="flex-1 bg-green-500 text-white text-xs py-1 rounded"
                  >
                    Accept
                  </button>


                  <button
                    onClick={() =>
                      declineRequest(
                        request.from._id
                      )
                    }
                    className="flex-1 bg-gray-300 text-gray-700 text-xs py-1 rounded"
                  >
                    Decline
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}


      {/* CONTACTS */}

      <div className="p-3 flex-1 overflow-y-auto">

        <h3 className="text-sm font-semibold text-gray-500 mb-2">
          Contacts
        </h3>


        {contacts.length === 0 ? (

          <div className="text-center text-gray-400 text-sm mt-8">

            <div className="text-4xl mb-2">
              👥
            </div>

            <p>
              No contacts yet
            </p>

            <p className="text-xs mt-1">
              Search for a username above
            </p>

          </div>

        ) : (

          <div className="space-y-1">

            {contacts.map((friend) => {

              const room = [
                currentUser.id,
                friend._id,
              ]
                .sort()
                .join("_");

              // Check actual online status
              const isOnline = onlineUsers.some(
                (id) => String(id) === String(friend._id)
              );


              return (

                <button
                  key={friend._id}
                  onClick={() => {

                    setCurrentRoom(room);

                    setCurrentContact(friend);

                    onSelectFriend(friend);

                  }}
                  className={`w-full text-left px-3 py-3 rounded-xl transition ${currentRoom === room
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-50"
                    }`}
                >

                  <div className="flex items-center gap-3">

                    {/* AVATAR */}

                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold overflow-hidden ${currentRoom === room
                          ? "bg-white text-blue-500"
                          : "bg-blue-100 text-blue-600"
                        }`}
                    >
                      {friend.profilePicture ? (
                        <img
                          src={friend.profilePicture}
                          alt={friend.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        friend.username?.charAt(0)?.toUpperCase()
                      )}
                    </div>


                    {/* NAME + STATUS */}

                    <div className="flex-1 min-w-0">

                      <p className="font-medium truncate">
                        {friend.username}
                      </p>

                      <p
                        className={`text-xs ${isOnline
                          ? "text-green-500"
                          : "text-gray-400"
                          }`}
                      >
                        {isOnline
                          ? "Online"
                          : "Offline"}
                      </p>

                    </div>

                  </div>

                </button>

              );

            })}

          </div>

        )}

      </div>


      {/* USER FOOTER */}

      <div className="border-t p-3 relative">

        {/* SETTINGS PANEL */}

        {showSettings && (
          <div className="absolute bottom-16 left-3 right-3 bg-white border rounded-xl shadow-xl overflow-hidden z-50">

            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">
                Settings
              </h3>
            </div>

            <button
              onClick={() => {
                setShowProfile(true);
                setShowSettings(false);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
            >
              👤 Profile
            </button>

            <button
              onClick={() => alert("Notification settings coming soon!")}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
            >
              🔔 Notifications
            </button>

            <button
              onClick={() => alert("Appearance settings coming soon!")}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
            >
              🎨 Appearance
            </button>

            <button
              onClick={() => alert("Privacy settings coming soon!")}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
            >
              🔒 Privacy
            </button>

            <button
              onClick={() => alert("Help section coming soon!")}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
            >
              ❓ Help
            </button>

          </div>
        )}

        {/* PROFILE + SETTINGS BUTTON */}

        <div className="flex items-center gap-2">

          {/* PROFILE */}

          <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold overflow-hidden">
            {currentUser.profilePicture ? (
              <img
                src={currentUser.profilePicture}
                alt={currentUser.username}
                className="w-full h-full object-cover"
              />
            ) : (
              currentUser.username?.charAt(0)?.toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">

            <p className="font-semibold text-sm truncate">
              {currentUser.username}
            </p>

            <p className="text-xs text-green-500">
              Online
            </p>

          </div>

          {/* SETTINGS */}

          <button
            onClick={() =>
              setShowSettings(!showSettings)
            }
            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition ${showSettings
              ? "bg-blue-100 text-blue-600"
              : "hover:bg-gray-100 text-gray-600"
              }`}
            title="Settings"
          >
            ⚙️
          </button>

        </div>

      </div>
      {showProfile && (
        <Profile
          currentUser={currentUser}
          setUser={setUser}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}

export default Sidebar;
