import React, { useEffect, useState } from "react";

function Appearance({
    appearance,
    setAppearance,
    onBack,
}) {
    const [saving, setSaving] = useState(false);

    // =====================================================
    // SAVE APPEARANCE TO BACKEND
    // =====================================================

    const updateSetting = async (key, value) => {
        const updatedAppearance = {
            ...appearance,
            [key]: value,
        };

        // Update UI immediately
        setAppearance(updatedAppearance);

        try {
            setSaving(true);

            const token =
                localStorage.getItem("token");
            console.log(" TOKEN:", token);

            const res = await fetch(
                `${process.env.REACT_APP_API_URL}/api/auth/appearance`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: JSON.stringify(
                        updatedAppearance
                    ),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                console.log("STATUS:", res.status);
                console.log("RESPONSE:", data);
                alert(JSON.stringify(data));
                return;
            }

            // Keep React state synchronized
            setAppearance(data);

        } catch (error) {
            console.log("ACTUAL ERROR:", error);
            alert(error.message);
        

    } finally {
        setSaving(false);
    }
};

return (
    <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto">

            {/* Header */}

            <div className="flex items-center gap-3 mb-6">

                <button
                    onClick={onBack}
                    className="text-2xl text-gray-600 hover:text-black"
                >
                    ←
                </button>

                <div>

                    <h1 className="text-2xl font-bold">
                        Appearance
                    </h1>

                    <p className="text-sm text-gray-500">
                        Customize the look of your ChatApp
                    </p>

                </div>

            </div>


            {/* Saving indicator */}

            {saving && (
                <div className="text-sm text-gray-500 mb-4">
                    Saving...
                </div>
            )}


            {/* Theme */}

            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">

                <h2 className="text-lg font-semibold">
                    🌙 Theme
                </h2>

                <p className="text-sm text-gray-500 mb-4">
                    Choose how ChatApp looks
                </p>

                <div className="grid grid-cols-3 gap-3">

                    <button
                        onClick={() =>
                            updateSetting(
                                "theme",
                                "light"
                            )
                        }
                        className={`p-4 rounded-xl border ${appearance.theme === "light"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200"
                            }`}
                    >
                        ☀️
                        <br />

                        <span className="text-sm">
                            Light
                        </span>

                    </button>


                    <button
                        onClick={() =>
                            updateSetting(
                                "theme",
                                "dark"
                            )
                        }
                        className={`p-4 rounded-xl border ${appearance.theme === "dark"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200"
                            }`}
                    >
                        🌙
                        <br />

                        <span className="text-sm">
                            Dark
                        </span>

                    </button>


                    <button
                        onClick={() =>
                            updateSetting(
                                "theme",
                                "system"
                            )
                        }
                        className={`p-4 rounded-xl border ${appearance.theme === "system"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200"
                            }`}
                    >
                        💻
                        <br />

                        <span className="text-sm">
                            System
                        </span>

                    </button>

                </div>

            </div>


            {/* Accent Color */}

            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">

                <h2 className="text-lg font-semibold">
                    🎨 Accent Color
                </h2>

                <p className="text-sm text-gray-500 mb-4">
                    Choose your main app color
                </p>

                <div className="flex gap-4">

                    <button
                        onClick={() =>
                            updateSetting(
                                "accentColor",
                                "blue"
                            )
                        }
                        className={`w-10 h-10 rounded-full bg-blue-500 ${appearance.accentColor === "blue"
                                ? "ring-4 ring-blue-200"
                                : ""
                            }`}
                    />

                    <button
                        onClick={() =>
                            updateSetting(
                                "accentColor",
                                "purple"
                            )
                        }
                        className={`w-10 h-10 rounded-full bg-purple-500 ${appearance.accentColor === "purple"
                                ? "ring-4 ring-purple-200"
                                : ""
                            }`}
                    />

                    <button
                        onClick={() =>
                            updateSetting(
                                "accentColor",
                                "green"
                            )
                        }
                        className={`w-10 h-10 rounded-full bg-green-500 ${appearance.accentColor === "green"
                                ? "ring-4 ring-green-200"
                                : ""
                            }`}
                    />

                    <button
                        onClick={() =>
                            updateSetting(
                                "accentColor",
                                "pink"
                            )
                        }
                        className={`w-10 h-10 rounded-full bg-pink-500 ${appearance.accentColor === "pink"
                                ? "ring-4 ring-pink-200"
                                : ""
                            }`}
                    />

                    <button
                        onClick={() =>
                            updateSetting(
                                "accentColor",
                                "orange"
                            )
                        }
                        className={`w-10 h-10 rounded-full bg-orange-500 ${appearance.accentColor === "orange"
                                ? "ring-4 ring-orange-200"
                                : ""
                            }`}
                    />

                </div>

            </div>


            {/* Chat Background */}

            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">

                <h2 className="text-lg font-semibold">
                    💬 Chat Background
                </h2>

                <p className="text-sm text-gray-500 mb-4">
                    Choose your chat background
                </p>

                <div className="grid grid-cols-2 gap-3">

                    {[
                        ["default", "Default"],
                        ["white", "White"],
                        ["gray", "Soft Gray"],
                        ["blue", "Soft Blue"],
                    ].map(([value, label]) => (

                        <button
                            key={value}
                            onClick={() =>
                                updateSetting(
                                    "chatBackground",
                                    value
                                )
                            }
                            className={`p-3 rounded-xl border ${appearance.chatBackground === value
                                    ? "border-blue-500 bg-blue-50 text-blue-600"
                                    : "border-gray-200"
                                }`}
                        >
                            {label}
                        </button>

                    ))}

                </div>

            </div>


            {/* Font Size */}

            <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">

                <h2 className="text-lg font-semibold">
                    🔤 Font Size
                </h2>

                <p className="text-sm text-gray-500 mb-4">
                    Change message text size
                </p>

                <div className="grid grid-cols-3 gap-3">

                    {[
                        "small",
                        "medium",
                        "large",
                    ].map((size) => (

                        <button
                            key={size}
                            onClick={() =>
                                updateSetting(
                                    "fontSize",
                                    size
                                )
                            }
                            className={`p-3 rounded-xl border capitalize ${appearance.fontSize === size
                                    ? "border-blue-500 bg-blue-50 text-blue-600"
                                    : "border-gray-200"
                                }`}
                        >
                            {size}
                        </button>

                    ))}

                </div>

            </div>


            {/* Bubble Style */}

            <div className="bg-white rounded-2xl shadow-sm p-5">

                <h2 className="text-lg font-semibold">
                    💭 Message Bubble
                </h2>

                <p className="text-sm text-gray-500 mb-4">
                    Choose your message bubble style
                </p>

                <div className="grid grid-cols-3 gap-3">

                    {[
                        "rounded",
                        "compact",
                        "minimal",
                    ].map((style) => (

                        <button
                            key={style}
                            onClick={() =>
                                updateSetting(
                                    "bubbleStyle",
                                    style
                                )
                            }
                            className={`p-3 rounded-xl border capitalize ${appearance.bubbleStyle === style
                                    ? "border-blue-500 bg-blue-50 text-blue-600"
                                    : "border-gray-200"
                                }`}
                        >
                            {style}
                        </button>

                    ))}

                </div>

            </div>

        </div>
    </div>
);
}

export default Appearance;