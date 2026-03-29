import React from "react";
import { useAppContext } from "../context/App.Context";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";

const Profile = () => {
  const { user, loading, logout } = useAppContext();
  const navigate = useNavigate();

  if (loading) return <Loading />;

  if (!user) {
    // If somehow reached here without a user, redirect to login
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div
      className="w-full min-h-screen p-6 pt-16 xl:px-16 2xl:px-24"
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
      }}
    >
      <div className="max-w-md mx-auto bg-[var(--card-bg)] p-8 rounded-3xl shadow-lg">
        <h2 className="text-3xl font-bold mb-6">User Profile</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={assets.user_icon} className="w-6 h-6" alt="user" />
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <img src={assets.user_icon} className="w-6 h-6" alt="email" />
            <span className="font-medium">{user.email}</span>
          </div>
          {user.credits != null && (
            <div className="flex items-center gap-3">
              <img src={assets.diamond_icon} className="w-6 h-6" alt="credits" />
              <span className="font-medium">Credits: {user.credits}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 w-full py-3 rounded-xl font-semibold transition-all duration-300"
          style={{
            backgroundColor: "var(--primary-color)",
            color: "#fff",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
