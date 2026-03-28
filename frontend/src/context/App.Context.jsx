import React, { useEffect } from "react";
import { createContext } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI, chatAPI } from "../utils/api";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [chats, setChats] = React.useState([]);
  const [selectedChat, setSelectedChat] = React.useState(null);
  const [theme, setTheme] = React.useState("light");
  const [loading, setLoading] = React.useState(true);

  // Fetch user from API when logged in
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setUser(null);
        setChats([]);
        setLoading(false);
        return;
      }

      const response = await userAPI.getUser();
      if (response.user) {
        setUser(response.user);
      } else {
        // Token might be invalid
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chats from API
  const fetchChats = async () => {
    try {
      const response = await chatAPI.getChats();
      if (response.success && response.chats) {
        setChats(response.chats);
        // Update selected chat if it exists in the new list
        if (selectedChat) {
          const updatedSelectedChat = response.chats.find(chat => chat._id === selectedChat._id);
          if (updatedSelectedChat) {
            setSelectedChat(updatedSelectedChat);
          } else if (response.chats.length > 0) {
            // If selected chat was deleted, select the latest one
            setSelectedChat(response.chats[0]);
          }
        } else if (response.chats.length > 0) {
          // Set the first chat as selected if available
          setSelectedChat(response.chats[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      setChats([]);
    }
  };

  // Update a specific chat in the chats array (for syncing after messages)
  const updateChatInList = (updatedChat) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => 
        chat._id === updatedChat._id ? updatedChat : chat
      );
      // Sort by most recent first
      return updatedChats.sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    });
    // Also update selected chat if it's the one being updated
    if (selectedChat?._id === updatedChat._id) {
      setSelectedChat(updatedChat);
    }
  };

  // Create a new chat
  const createNewChat = async () => {
    try {
      const response = await chatAPI.createChat();
      if (response.success && response.chat) {
        setChats([response.chat, ...chats]);
        setSelectedChat(response.chat);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  // Delete a chat
  const deleteChat = async (chatId) => {
    try {
      await chatAPI.deleteChat(chatId);
      const updatedChats = chats.filter(chat => chat._id !== chatId);
      setChats(updatedChats);
      
      // If deleted chat was selected, select the next one
      if (selectedChat?._id === chatId) {
        setSelectedChat(updatedChats[0] || null);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  // Theme effect
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Logout helper
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setChats([]);
    setSelectedChat(null);
    // add slight delay so UI change feels smoother
    setTimeout(() => {
      navigate("/login");
    }, 1000); // 1s delay
  };

  // Initial user fetch
  useEffect(() => {
    fetchUser();
  }, []);

  // Fetch chats when user is available
  useEffect(() => {
    if (user) {
      fetchChats();
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        navigate,
        user,
        setUser,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        theme,
        setTheme,
        loading,
        createNewChat,
        deleteChat,
        fetchChats,
        updateChatInList,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);

export default AppContext;
