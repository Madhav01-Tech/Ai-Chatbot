import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/App.Context";
import { messageAPI } from "../utils/api";
import Message from "./message";
import { Navigate } from "react-router-dom";

const Chatbox = () => {
  const { selectedChat, theme, user, setSelectedChat, updateChatInList, setUser } = useAppContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("text");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [ragFile, setRagFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploadedFilePath, setUploadedFilePath] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const bottomRef = useRef(null);

  const handlePdfChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setRagFile(file);
    setSelectedFileName(file.name);
    setUploadStatus("Uploading PDF...");
    await uploadPdf(file);
  };

  const uploadPdf = async (file = null) => {
    const pdfFile = file || ragFile;
    if (!pdfFile) {
      setUploadStatus("Please choose a PDF file first.");
      return;
    }
    try {
      setUploadingFile(true);
      setUploadStatus("Uploading PDF...");
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      const response = await messageAPI.uploadPdf(formData);
      if (response.success) {
        setUploadedFilePath(response.filePath);
        setUploadStatus(`Uploaded: ${response.fileName}`);
      } else {
        setUploadStatus(response.message || "Upload failed.");
      }
    } catch (error) {
      console.error("PDF upload failed:", error);
      setUploadStatus(error.message || "Upload failed.");
    } finally {
      setUploadingFile(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    if (mode === "rag" && !uploadedFilePath) {
      setUploadStatus("Please upload a PDF before asking a RAG question.");
      return;
    }

    if (!selectedChat) {
      alert("Please create a new chat first");
      return;
    }

    if (!user) {
      Navigate("/login");
      return;
    }

    const userMessage = {
      role: "user",
      content: trimmedPrompt,
      isImage: mode === "img",
      isRag: mode === "rag",
    };

    try {
      setLoading(true);
      setMessages((prev) => [...prev, userMessage]);
      setPrompt("");

      let response;
     if (mode === "img") {
  response = await messageAPI.sendImageMessage(selectedChat._id, trimmedPrompt, isPublished);
} else if (mode === "rag") {
  response = await messageAPI.askRagQuestion(
    selectedChat._id,
    trimmedPrompt,
    uploadedFilePath,  // already in state from upload
    selectedFileName,  // already in state from upload
  );
} else {
  response = await messageAPI.sendTextMessage(selectedChat._id, trimmedPrompt);
}

      if (response.success) {
        setUser((prevUser) => ({ ...prevUser, credits: response.user.credits }));
        if (response.chat) {
          setSelectedChat(response.chat);
          updateChatInList(response.chat);
        } else if (mode === "img" && response.imageUrl) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: response.imageUrl,
              isImage: true,
              isPublished: isPublished,
            },
          ]);
        } else if (response.message) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: response.message,
              isImage: mode === "img",
            },
          ]);
        }
      } else {
        throw new Error(response.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.slice(0, -1));
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages || []);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Close mode menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest("#mode-menu-wrapper")) {
        setShowModeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col justify-between">

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">

        {!selectedChat && (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-80">
            <img
              src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
              alt="Logo"
              className="w-full max-w-[220px]"
            />
            <p className="text-center text-lg text-gray-500 dark:text-gray-400">
              🤖 Your AI assistant is ready! <br />
              Start a new chat and explore answers, ideas, and creativity.
            </p>
          </div>
        )}

        {selectedChat && messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-80">
            <img
              src={theme === "dark" ? assets.logo_full : assets.logo_full_dark}
              alt="Logo"
              className="w-full max-w-[200px]"
            />
            <p className="text-center text-lg text-gray-500 dark:text-gray-400">
              🧠 No messages yet. <br /> Let's create something amazing together!
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

        <div ref={bottomRef}></div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md">

        {/* Publish bar — image mode only */}
        {mode === "img" && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1f2e]">
            <input
              type="checkbox"
              id="publish-cb"
              className="w-3.5 h-3.5 cursor-pointer"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            <label
              htmlFor="publish-cb"
              className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none"
            >
              Publish to Community Gallery
            </label>
          </div>
        )}

        {/* Input form */}
        <form onSubmit={submit} className="p-3">
          <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827] overflow-visible">

            {/* Textarea */}
            <textarea
              rows={2}
              placeholder={
                mode === "img"
                  ? "Describe the image you want to generate..."
                  : mode === "rag"
                  ? "Ask about the uploaded document..."
                  : "Ask me something..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(e);
                }
              }}
              className="w-full resize-none border-0 bg-transparent px-3 pt-3 pb-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:outline-none"
              style={{ minHeight: "62px", maxHeight: "180px" }}
            />

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-2 pb-2 pt-1 border-t border-gray-100 dark:border-gray-700">

              {/* Mode selector */}
              <div id="mode-menu-wrapper" className="relative">
                <button
                  type="button"
                  onClick={() => setShowModeMenu((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1f1f2a] text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm">
                    {mode === "text" ? "💬" : mode === "rag" ? "📄" : "🎨"}
                  </span>
                  {mode === "text" ? "Text" : mode === "rag" ? "RAG" : "Image"}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-50">
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {showModeMenu && (
                  <div className="absolute bottom-[calc(100%+6px)] left-0 z-50 w-28 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827] p-1 shadow-lg">
                    {[
                      { value: "text", label: "Text", icon: "💬" },
                      { value: "rag", label: "RAG", icon: "📄" },
                      { value: "img", label: "Image", icon: "🎨" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setMode(item.value);
                          setShowModeMenu(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                          mode === item.value
                            ? "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RAG attach */}
              {mode === "rag" && (
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="rag-upload"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1f1f2a] text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:border-[var(--primary-color)] hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v7M3 5l3 3 3-3M2 10h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Attach PDF
                  </label>
                  <input
                    id="rag-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                    className="hidden"
                  />
                  {selectedFileName && (
                    <span className="text-[11px] text-gray-400 max-w-[110px] truncate">
                      {selectedFileName}
                    </span>
                  )}
                  {uploadStatus && !selectedFileName && (
                    <span className="text-[11px] text-gray-400">{uploadStatus}</span>
                  )}
                  {uploadingFile && (
                    <span className="text-[11px] text-gray-400 animate-pulse">Uploading...</span>
                  )}
                </div>
              )}

              <div className="flex-1" />

              {/* Keyboard hint */}
              <span className="text-[11px] text-gray-400 hidden sm:block">
                ⏎ send · ⇧⏎ newline
              </span>

              {/* Send button */}
              <button
                type="submit"
                disabled={loading || (mode === "rag" && !uploadedFilePath)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary-color)] text-xs font-semibold text-white hover:bg-[#3b82f6] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  "..."
                ) : (
                  <>
                    Send
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M1 6h10M7 2l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chatbox;