import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Loading = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/chat", { replace: true }); // prevent going back to loading
    }, 2000); // better UX than 5s

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="w-full
        h-screen
        flex flex-col
        items-center
        justify-center
        gap-6
        bg-gradient-to-br
        from-white
        to-gray-100
        dark:from-[#0f172a]
        dark:to-[#1e293b]
      "
      role="status"
      aria-live="polite"
    >
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>

        <div
          className="
            absolute inset-0
            rounded-full
            border-4
            border-transparent
            border-t-[var(--primary-color)]
            animate-spin
          "
        ></div>
      </div>

      {/* Text */}
      <p className="text-gray-700 dark:text-gray-300 text-sm tracking-wider animate-pulse">
        Preparing your chat experience...
      </p>
    </div>
  );
};

export default Loading;
