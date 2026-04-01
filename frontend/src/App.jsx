import { Routes, Route, useLocation } from "react-router-dom";
import './assets/prism.css';
import { Toaster } from "react-hot-toast";
import Loading from "./pages/Loading";
import Sidebar from "./components/Sidebar";
import Chatbox from "./components/Chatbox";
import Credit from "./pages/Credit";
import Community from "./pages/Community";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import PlanAvailable from "./pages/plans";

const App = () => {
  const location = useLocation();

  // Hide sidebar on the login and signup pages
  const hideSidebarOn = ["/login", "/signup"];
  const showSidebar = !hideSidebarOn.includes(location.pathname); //gives current path location

  return (
    <div className="flex h-screen w-screen">
       <Toaster
       position="top-right"
       toastOptions={{
    style: {
      zIndex: 9999
    }
  }} />
      {showSidebar && <Sidebar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/" element={<Chatbox />} />
        <Route path="/chat" element={<Chatbox />} />
        <Route path="/credits" element={<Credit />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/plans" element={<PlanAvailable />} />
      </Routes>
    </div>
  );
};

export default App;
