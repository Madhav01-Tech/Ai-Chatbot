import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/App.Context";
import { messageAPI } from "../utils/api";
import Message from "./message";
import { Navigate } from "react-router-dom";

const Chatbox = () => {
  const { selectedChat, theme, user, setSelectedChat, updateChatInList,setUser } = useAppContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("text");
  
  const submit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    if (!selectedChat) {
      console.error("No chat selected");
      alert("Please create a new chat first");
      return;
    }
    
    if (!user) {
      console.error("User not logged in");
      alert("Please log in first");
      Navigate("/login");
      return;
    }

    const userMessage = {
      role: "user",
      content: prompt,
      isImage: mode === "img"
    };

    try {
      setLoading(true);
      // Add user message to UI immediately
      setMessages(prev => [...prev, userMessage]);
      setPrompt("");

      // Send to API based on mode
      let response;
      if (mode === "img") {
        // Image generation
        response = await messageAPI.sendImageMessage(selectedChat._id, prompt, isPublished);
      } else {
        // Text message
        response = await messageAPI.sendTextMessage(selectedChat._id, prompt);
      }
      
      if (response.success) {
        // Use the updated chat from the backend with all messages
        setUser(prevUser => ({ ...prevUser, credits: response.user.credits }));
        if (response.chat) {
          setSelectedChat(response.chat);
          
          // Update the chat in the sidebar list
          updateChatInList(response.chat);
        } else if (mode === "img" && response.imageUrl) {
          // For image generation, imageUrl is returned separately
          setMessages(prev => [...prev, {
            role: "assistant",
            content: response.imageUrl,
            isImage: true,
            isPublished: isPublished
          }]);
        } else if (response.message) {
          // Fallback: if chat object not available, at least add the assistant response
          setMessages(prev => [...prev, {
            role: "assistant",
            content: response.message,
            isImage: mode === "img"
          }]);
        }
      } else {
        throw new Error(response.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove the user message if sending failed
      setMessages(prev => prev.slice(0, -1));
      // Show error message to user
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Correct bottomRef
  const bottomRef = useRef(null);

  // Load messages when chat changes
  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages || []);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="w-full min-h-screen flex flex-col justify-between">

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">

        {!selectedChat && (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-80">
            <img
              src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
              alt="Logo"
              className="w-full max-w-[180px]"
            />
            <p className="text-center text-lg text-gray-500 dark:text-gray-400">
             🤖 Your AI assistant is ready! <br/>
Start a new chat and explore answers, ideas, and creativity.
            </p>
          </div>
        )}

        {selectedChat && messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-80">
            <img
              src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
              alt="Logo"
              className="w-full max-w-[180px]"
            />
            <p className="text-center text-lg text-gray-500 dark:text-gray-400">
         🧠 No messages yet. <br/>Let’s create something amazing together!
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}

        {/* Typing Loader */}
        {loading && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--card-bg)] w-fit">
            <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-bounce [animation-delay:150ms]"></div>
            <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-bounce [animation-delay:300ms]"></div>
          </div>
        )}

        {/* ✅ Scroll Anchor */}
        <div ref={bottomRef}></div>
      </div>

      {
        mode === "img" && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-[#1f1835] dark:to-[#2a1f3d]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded cursor-pointer" 
                checked={isPublished} 
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                📸 Publish this image to Community Gallery
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-7">
              Share your AI-generated images with other users
            </p>
          </div>
        )
      }

      {/* Input Section */}
      <form onSubmit={submit}
  className="
    p-4
    border-t border-gray-200 dark:border-gray-700
    bg-white/80 dark:bg-[#111827]/80
    backdrop-blur-md
    flex items-center gap-3
  "
>
  {/* Mode Select */}
  <select
    onChange={(e) => setMode(e.target.value)}
    value={mode}
    className="
      px-4 py-2
      rounded-full
      bg-gray-100 dark:bg-gray-800
      text-gray-700 dark:text-white
      text-sm font-medium
      outline-none
      transition-all duration-300
      focus:ring-2 focus:ring-[var(--primary-color)]
      cursor-pointer
      hover:bg-gray-200 dark:hover:bg-gray-700
    "
  >
    <option value="text">💬 Text</option>
    <option value="img">🎨 Image</option>
  </select>

  {/* Input Field */}
  <input
    type="text"
    placeholder={mode === "img" ? "Describe the image you want to generate..." : "Ask me something..."}
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    className="
      flex-1
      px-5 py-3
      rounded-full
      bg-gray-100 dark:bg-gray-800
      text-gray-800 dark:text-white
      placeholder-gray-400
      outline-none
      transition-all duration-300
      focus:ring-2 focus:ring-[var(--primary-color)]
      focus:shadow-md
    "
  />

  {/* Send Button */}
  <button
    disabled={loading}
    type="submit"
    className="
     
      rounded-full
     
 
      transition-all duration-300
      hover:scale-105
      active:scale-95
      disabled:opacity-50
      disabled:cursor-not-allowed
      shadow-md
    "
  >
    <img
      src={loading ? assets.stop_icon : assets.send_icon}
      className="w-12 h-12"
      alt="send"
    />
  </button>
</form>

    </div>
  );
};

export default Chatbox;
