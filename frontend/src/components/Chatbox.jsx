import React, { useEffect, useRef, useState } from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/App.Context";
import Message from "./message";

const Chatbox = () => {
  const { selectedChat, theme } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  // Load messages when chat changes
  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages || []);
    } else {
      setMessages([]);
    }
    setLoading(false);
  }, [selectedChat]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="w-full min-h-screen flex flex-col justify-between">

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">

        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-80">
            <img
              src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
              alt="Logo"
              className="w-full max-w-[180px]"
            />
            <p className="text-center text-lg text-gray-500 dark:text-gray-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}

        {/* Typing Loader */}
        {loading && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl 
          bg-[var(--card-bg)] dark:bg-[#1f2937] w-fit">
            <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-bounce [animation-delay:150ms]"></div>
            <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-bounce [animation-delay:300ms]"></div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Section */}
      <form className="p-5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827]">
        {/* Add input here */}
      </form>
    </div>
  );
};

export default Chatbox;
