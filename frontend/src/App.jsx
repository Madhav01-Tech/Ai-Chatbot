import { Routes, Route } from "react-router-dom";
import './assets/prism.css';
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import Chatbox from "./components/Chatbox";
import Credit from "./pages/Credit";
import Community from "./pages/Community";
const App = () => {
  return (
    <div className="flex h-screen w-screen">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Chatbox />} />
        <Route path="/login" element={<Login />} />
        <Route path="/credit" element={<Credit />} />
        <Route path="/community" element={<Community />} />
        <Route path="/chat" element={<Chatbox />} />
      </Routes>
    </div>
  )
}

export default App