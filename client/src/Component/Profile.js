import React, { useRef, useState } from "react";

function Profile({ currentUser, setUser, onClose }) {
    const [username, setUsername] = useState(
        currentUser.username || ""
    );

    const [profilePicture, setProfilePicture] = useState(
        currentUser.profilePicture || ""
    );

    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef(null);

    // ======================================================
    // SELECT PROFILE PICTURE
    // ======================================================

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        // Only images
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }

        // Maximum 2 MB
        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be smaller than 2MB.");
            return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
            setProfilePicture(reader.result);
        };

        reader.readAsDataURL(file);
    };

    // ======================================================
    // SAVE PROFILE
    // ======================================================

    const handleSave = async () => {
        if (!username.trim()) {
            alert("Username cannot be empty.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/api/auth/profile`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                        username: username.trim(),
                        profilePicture: profilePicture,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Failed to update profile.");
                return;
            }

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            setUser(data.user);

            alert("Profile updated successfully! ✅");

            onClose();

        } catch (error) {
            console.error("Profile update error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white w-96 rounded-2xl shadow-2xl overflow-hidden">

                {/* ==================================================
            HEADER
        ================================================== */}

                <div className="bg-blue-600 text-white px-5 py-4 flex items-center justify-between">

                    <h2 className="text-lg font-semibold">
                        👤 Profile
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-white text-xl hover:bg-blue-700 rounded-full w-8 h-8"
                    >
                        ×
                    </button>

                </div>


                {/* ==================================================
            BODY
        ================================================== */}

                <div className="p-6">

                    {/* ==================================================
              PROFILE PICTURE
          ================================================== */}

                    <div className="flex flex-col items-center mb-6">

                        <div className="relative">

                            {profilePicture ? (

                                <img
                                    src={profilePicture}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                                />

                            ) : (

                                <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold">

                                    {username
                                        ?.charAt(0)
                                        ?.toUpperCase()}

                                </div>

                            )}

                            {/* CAMERA BUTTON */}

                            <button
                                type="button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white hover:bg-blue-700"
                                title="Change profile picture"
                            >
                                📷
                            </button>

                        </div>


                        {/* HIDDEN FILE INPUT */}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />


                        {/* REMOVE PICTURE */}

                        {profilePicture && (

                            <button
                                type="button"
                                onClick={() => setProfilePicture("")}
                                className="text-xs text-red-500 mt-2 hover:underline"
                            >
                                Remove picture
                            </button>

                        )}

                    </div>


                    {/* ==================================================
              USERNAME
          ================================================== */}

                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Username
                    </label>

                    <input
                        type="text"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-blue-400"
                    />


                    {/* ==================================================
              EMAIL
          ================================================== */}

                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Email
                    </label>

                    <input
                        type="email"
                        value={currentUser.email || ""}
                        disabled
                        className="w-full border rounded-lg px-3 py-2 mb-5 bg-gray-100 text-gray-500"
                    />


                    {/* ==================================================
              SAVE BUTTON
          ================================================== */}

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
                    >
                        {loading
                            ? "Saving..."
                            : "Save Changes"}
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Profile;
