import React from "react";
import { assets } from "../assets/assets";
import prism from "prismjs";
import Markdown from "react-markdown";
import { useEffect } from "react";

const Message = ({ message }) => {
  const isUser = message.role === "user";
 useEffect(() => {
    prism.highlightAll();
  }, [message.content]);
  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"} my-5`}>
      
      <div className={`flex items-end gap-3 max-w-3xl ${isUser ? "flex-row-reverse" : ""}`}>
        
        {/* Avatar */}
        <img
          src={isUser ? assets.user_icon : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQzzBAMzvWruPW18GVPD26euSuP7AnhlYSxxaIDPbt5Q&s"}
          alt="avatar"
          className="w-8 h-8 rounded-full shadow-md"
        />

        {/* Bubble */}
        <div
          className={`
            flex flex-col px-5 py-3 rounded-2xl shadow-lg backdrop-blur-md
            transition-all duration-300
            ${isUser 
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-md" 
              : "bg-white/70 text-gray-800 dark:bg-[#2a1f3d] dark:text-gray-100 rounded-bl-md border border-purple-200 dark:border-purple-700"
            }
          `}
        >
          
          {/* Content */}
          {message.isImage ? (
            <img
              src={message.content}
              alt="Generated"
              className="rounded-xl mt-2 w-full max-w-md"
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words reset-tw">
             <Markdown>{message.content}</Markdown>
            </p>
          )}

          {/* Time */}
          <span className="text-[11px] mt-2 opacity-70 text-right">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Message;
