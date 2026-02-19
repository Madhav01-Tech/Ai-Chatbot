import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/App.Context";
import { assets } from "../assets/assets";

/*
  Simplified Sidebar
  - Uses internal state by default.
  - If parent passes an `open` prop (boolean), Sidebar will mirror it
    and call `onOpen`/`onClose` callbacks when the user toggles.
  - Mobile open/close uses `assets.menu_icon` and `assets.close_icon`.
*/
const Sidebar = ({ open: propOpen, onOpen, onClose }) => {
  const { user, chats, selectedChat, setSelectedChat, setChats, theme, setTheme } = useAppContext();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // If parent controls open state, keep local state in sync for animation
  useEffect(() => {
    if (typeof propOpen === "boolean") setIsOpen(propOpen);
  }, [propOpen]);

  const handleOpen = () => {
    if (typeof propOpen === "boolean") onOpen && onOpen();
    else setIsOpen(true);
  };

  const handleClose = () => {
    if (typeof propOpen === "boolean") onClose && onClose();
    else setIsOpen(false);
  };

  // Create a new chat and open it
  const handleNewChat = () => {
    const newChat = {
      _id: Date.now().toString(),
      userId: user?._id || "local",
      name: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setChats && setChats((prev = []) => [newChat, ...prev]);
    setSelectedChat && setSelectedChat(newChat);
    navigate("/chat");
    handleClose();
  };

  // Delete a chat; stop event propagation so it doesn't also select it
  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation();
    setChats && setChats((prev = []) => {
      const updated = prev.filter((c) => c._id !== chatId);
      // if deleted chat was selected, pick the first one or null
      if (selectedChat?._id === chatId) {
        const next = updated[0] || null;
        setSelectedChat && setSelectedChat(next);
        if (next) navigate("/chat");
        else navigate("/");
      }
      return updated;
    });
  };

  // Filtered Chats
  const filteredChats = chats.filter((chat) => {
    const firstMessage =
      chat.messages && chat.messages.length > 0
        ? chat.messages[0].content
        : chat.name;

    return firstMessage?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      {/* Mobile Menu Button */}
      {/* Mobile open button */}
      <button
        onClick={handleOpen}
        aria-label="Open navigation"
        className="md:hidden fixed top-4 left-4 z-50 bg-[var(--primary-color)] text-black dark:text-white p-2 rounded-lg shadow-md"
      >
        <img src={assets.menu_icon} alt="open" className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {/* Backdrop for mobile when open */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={handleClose} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed md:static top-0 left-0 z-50 h-full
        w-4/5 sm:w-3/5 md:w-1/5
        transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        bg-[var(--bg-color)]
        border-r border-gray-200 dark:border-gray-800
        flex flex-col p-5 min-h-screen
      `}
        role="navigation"
      >
        {/* Close Button (Mobile Only) */}
        <div className="flex justify-end md:hidden mb-4">
          <button
            onClick={handleClose}
            aria-label="Close navigation"
            className="text-gray-600 dark:text-white p-1 rounded"
          >
            <img src={assets.close_icon} alt="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Logo */}
        <div className="mb-6">
          <img
            src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
            alt="Logo"
            className="w-full max-w-[160px]"
          />
        </div>

        {/* New Chat */}
        <button
          onClick={handleNewChat}
          className="w-full py-2 mb-5 rounded-xl text-sm font-medium bg-[var(--primary-color)] text-black dark:text-white hover:opacity-90 transition-all duration-300 shadow-md"
        >
          + New Chat
        </button>

        {/* Search */}
        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white">
          <img src={assets.search_icon} className="w-4 h-4 opacity-60" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search chats"
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto pr-1">
  {filteredChats.length > 0 && (
    <p className="text-sm font-medium mb-4 text-gray-500 dark:text-gray-400 tracking-wide">
      Recent Chats
    </p>
  )}

  {filteredChats.map((chat) => {
    const firstMessage =
      chat.messages && chat.messages.length > 0
        ? chat.messages[0]
        : null;

    const isActive = selectedChat?._id === chat._id;

    return (
      <div
        key={chat._id}
        onClick={() => {
          setSelectedChat && setSelectedChat(chat);
          navigate("/chat");
          handleClose();
        }}
        className={`
          p-3 rounded-xl mb-3 cursor-pointer
          transition-all duration-200
          ${isActive
            ? "bg-[var(--primary-color)] text-black dark:text-white border border-gray-300 dark:border-white shadow-md"
            : "bg-[var(--primary-color)] text-black dark:text-white hover:scale-[1.02]"
          }
        `}
      >
        <div className="flex items-center justify-between gap-3">
          
          {/* Chat Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {firstMessage
                ? firstMessage.content.slice(0, 35)
                : chat.name}
            </p>

            <p className="text-xs opacity-70 mt-1 truncate">
              {firstMessage
                ? new Date(
                    firstMessage.createdAt || firstMessage.timestamp
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "No messages"}
            </p>
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => handleDeleteChat(chat._id, e)}
            aria-label="Delete chat"
            className="p-1.5 rounded-md transition-colors duration-200 hover:bg-red-100 dark:hover:bg-red-900"
          >
            <img
              src={assets.bin_icon}
              alt="delete"
              className="w-4 h-4 opacity-80"
            />
          </button>

        </div>
      </div>
    );
  })}
</div>


        {/* Community */}
        <div
          onClick={() => {
            navigate("/community");
            handleClose();
          }}
          className="flex items-center gap-3 mt-3 p-2 rounded-xl
          bg-[var(--primary-color)]
          text-black dark:text-white
          hover:opacity-90 transition-all duration-300 shadow-md cursor-pointer"
        >
          <img src={assets.gallery_icon} className="w-5 opacity-80" />
          <p className="text-sm">Community Images</p>
        </div>

        {/* Credits */}
        <div
          onClick={() => {
            navigate("/credits");
            handleClose();
          }}
          className="flex items-center gap-3 mt-3 p-2 rounded-xl
          bg-[var(--primary-color)]
          text-black dark:text-white
          hover:opacity-90 transition-all duration-300 shadow-md cursor-pointer"
        >
          <img src={assets.diamond_icon} className="w-5 opacity-80" />
          <p className="text-sm">Credits: {user?.credits}</p>
        </div>

        {/* User Info */}
        <div
          onClick={() => {
            navigate("/user");
            handleClose();
          }}
          className="flex items-center justify-between gap-3 mt-3 p-2 rounded-xl
          bg-[var(--primary-color)]
          text-black dark:text-white
          hover:opacity-90 transition-all duration-300 shadow-md cursor-pointer"
        >
          <div className="flex gap-1">
            <img src={assets.user_icon} className="w-5 opacity-80" />
            <p className="text-sm">User Profile</p>
          </div>
          <div>
            <img src={assets.logout_icon} className="w-5 opacity-80" />
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="flex ">
          
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="mt-4  px-2 py-2 rounded-xl text-sm
        bg-[var(--primary-color)]
          text-black dark:text-white w-full max-w-[130px] mx-auto
          hover:opacity-90 transition-all duration-300 shadow-md cursor-pointer"
        >
         <span className="flex ">  <img src={assets.theme_icon} className="w-5 opacity-80 mx-auto" />
         {theme === "light" ? "Dark Mode" : "Light Mode"}</span>
        </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
