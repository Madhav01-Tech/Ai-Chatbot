import React, { useEffect } from "react";
import { createContext } from "react";
import { useNavigate } from "react-router-dom";
import { dummyUserData } from "../assets/assets.js";
import { dummyChats } from "../assets/assets.js";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [chats, setChats] = React.useState([]);
  const [selectedChat, setSelectedChat] = React.useState(null);
  const [theme, setTheme] = React.useState("light");

  const fetchUser = async () => {
    setUser(dummyUserData);
  };

  const fetchChats = async () => {
    setChats(dummyChats);
    setSelectedChat(dummyChats[0]);
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (user) {
      fetchChats();
    } else {
      setChats([]);
      setSelectedChat(null);
    }
    fetchUser();
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => React.useContext(AppContext);

export default AppContext;
