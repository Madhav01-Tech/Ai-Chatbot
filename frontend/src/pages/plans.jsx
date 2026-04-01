import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
export default function PlanAvailable() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
const navigate = useNavigate();
  // Generate particles
  useEffect(() => {
    const container = document.getElementById("particles");
    if (!container) return;

    for (let i = 0; i < 30; i++) {
      const p = document.createElement("div");
      p.className = "absolute bg-purple-300 rounded-full";
      p.style.left = Math.random() * 100 + "%";
      p.style.width = p.style.height = 1 + Math.random() * 3 + "px";
      p.style.opacity = 0.3 + Math.random() * 0.7;
      p.style.animation = `floatUp ${4 + Math.random() * 8}s linear infinite`;
      container.appendChild(p);
    }
  }, []);

  const handleNotify = () => {
    if (!email.includes("@")) return;

    setSuccess(true);
    setEmail("");

    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-[#0A0614] overflow-hidden text-white">

      {/* Background Glow */}
      <div className="absolute w-[400px] h-[400px] bg-purple-600 opacity-30 blur-3xl top-[-100px] left-[-100px]" />
      <div className="absolute w-[300px] h-[300px] bg-purple-400 opacity-20 blur-3xl bottom-[-50px] right-[-80px]" />

      {/* Particles */}
      <div id="particles" className="absolute inset-0" />

      {/* Card */}
      <div className="relative z-10 text-center max-w-xl px-6 py-10">

        {/* Icon */}
        <div className="w-32 h-32 mx-auto mb-6 rounded-full border border-purple-500 flex items-center justify-center animate-pulse">
          <span className="text-3xl">✦</span>
        </div>

        {/* Badge */}
        <div className="text-xs tracking-widest uppercase text-purple-300 mb-4">
          Subscription Plans
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold mb-4">
          No Plans <span className="text-purple-400">Available</span>
        </h1>

        {/* Subtext */}
        <p className="text-gray-400 mb-6">
          We're crafting something amazing for you. Plans are temporarily unavailable.
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-4 py-2 bg-white/5 border border-purple-400 rounded-lg outline-none"
          />

          <button
            onClick={handleNotify}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
          >
            Notify
          </button>
        </div>

        {/* Success */}
        {success && (
          <p className="text-purple-300 text-sm mb-4">
            ✦ You’re on the list!
          </p>
        )}

        {/* Chips */}
        <div className="flex gap-3 justify-center flex-wrap text-xs text-gray-400 mt-4">
          <span className="border px-3 py-1 rounded-full">Under Maintenance</span>
          <span className="border px-3 py-1 rounded-full">Secure Billing</span>
          <span className="border px-3 py-1 rounded-full">Coming Soon</span>
        </div>

        {/* Back */}
        <button
          onClick={(e)=>(e.preventDefault(), (navigate("/credits")))}
          className="mt-6 text-md text-gray-400 hover:text-purple-400 cursor-pointer transition"
        >
          ← Back to Home
        </button>
      </div>

      {/* Animation */}
      <style>
        {`
          @keyframes floatUp {
            0% { transform: translateY(100vh); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100px); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
}