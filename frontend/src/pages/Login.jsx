import React from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { userAPI } from "../utils/api";
import { useAppContext } from "../context/App.Context";
import toste from "react-hot-toast";
const Auth = () => {
  const navigate = useNavigate();
  const { setUser } = useAppContext();

  const [isLogin, setIsLogin] = React.useState(true);
  const [otpMode, setOtpMode] = React.useState(false);

  const [pendingEmail, setPendingEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
  });

  const resetStates = () => {
    setError("");
    setInfo("");
    setOtp("");
    setPendingEmail("");
    setOtpMode(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setInfo("");

    try {
      let response;

      /* ================= LOGIN ================= */
      if (isLogin) {

        if (!formData.email || !formData.password) {
          setError("Email and password are required");
          return;
        }

        response = await userAPI.login(formData.email, formData.password);

        if (response.token) {
          localStorage.setItem("authToken", response.token);
          localStorage.setItem("user", JSON.stringify(response.user));

          setUser(response.user);
          navigate("/");
        }
      }

      /*  VERIFY OTP */
      else if (otpMode) {

        if (!otp || otp.length !== 6) {
          setError("Please enter valid 6 digit OTP");
          return;
        }

        response = await userAPI.verifyOtp(pendingEmail, otp);

        if (response.token) {
          localStorage.setItem("authToken", response.token);
          localStorage.setItem("user", JSON.stringify(response.user));

          setUser(response.user);
          navigate("/");
          toste.success("Registration successful! Welcome aboard.");
        }
      }

      /*REGISTER  */
      else {

        if (!formData.name || !formData.email || !formData.password) {
          setError("All fields are required");
          return;
        }

        response = await userAPI.register(
          formData.name,
          formData.email,
          formData.password
        );
        
        if(!response.success){
          setError("Request failed. Please try again.");
          return;
        }

        setPendingEmail(formData.email);
        setOtpMode(true);

        setInfo("OTP sent to your email. Please verify.");
        
      }

    } catch (err) {
      setError(err.message || "Something went wrong");
      console.error("Auth Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /*  RESEND OTP  */

  const handleResendOtp = async () => {
    if (!pendingEmail) return;

    setLoading(true);
    setError("");
    setInfo("");

    try {
      await userAPI.resendOtp(pendingEmail);

      setInfo("OTP resent successfully. Check your email.");
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row"
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
      }}
    >

      {/* LEFT SIDE */}
      <div
        className="lg:w-1/2 w-full flex items-center justify-center p-10"
        style={{
          background: "linear-gradient(135deg, var(--primary-color), #9333ea)",
          color: "#fff",
        }}
      >
        <div className="max-w-md text-center lg:text-left">

          <h1 className="text-4xl font-bold flex items-center gap-3">
            Welcome to
            <img src={assets.logo_full} alt="Logo" className="w-55" />
          </h1>

          <p className="text-lg opacity-90 mt-4">
            Build, create and explore amazing things with powerful features
            and seamless experience.
          </p>

        </div>
      </div>

      {/* RIGHT SIDE FORM */}

      <div className="lg:w-1/2 w-full flex items-center justify-center p-10">

        <div
          className="w-full max-w-md p-8 rounded-3xl shadow-2xl"
          style={{
            backgroundColor: "var(--card-bg)",
          }}
        >

          {/* TOGGLE BUTTONS */}

          <div
            className="flex mb-8 rounded-xl overflow-hidden border"
            style={{ borderColor: "var(--primary-color)" }}
          >

            <button
              onClick={() => {
                setIsLogin(true);
                resetStates();
              }}
              className="w-1/2 py-3 font-semibold"
              style={{
                backgroundColor: isLogin ? "var(--primary-color)" : "transparent",
                color: isLogin ? "#fff" : "var(--text-color)",
              }}
            >
              Login
            </button>

            <button
              onClick={() => {
                setIsLogin(false);
                resetStates();
              }}
              className="w-1/2 py-3 font-semibold"
              style={{
                backgroundColor: !isLogin ? "var(--primary-color)" : "transparent",
                color: !isLogin ? "#fff" : "var(--text-color)",
              }}
            >
              Sign Up
            </button>

          </div>

          {/* FORM */}

          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}

            {info && (
              <div className="p-3 rounded-lg bg-blue-100 text-blue-700 text-sm">
                {info}
              </div>
            )}

            {/* NAME */}

            {!isLogin && !otpMode && (
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border outline-none"
                  style={{
                    borderColor: "var(--primary-color)",
                  }}
                />
              </div>
            )}

            {/* EMAIL */}

            <div>
              <label className="block mb-2 text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={otpMode}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl border outline-none"
                style={{
                  borderColor: "var(--primary-color)",
                }}
              />
            </div>

            {/* PASSWORD */}

            {!otpMode && (
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border outline-none"
                  style={{
                    borderColor: "var(--primary-color)",
                  }}
                />
              </div>
            )}

            {/* OTP */}

            {otpMode && (
              <>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    Enter OTP
                  </label>

                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    placeholder="6 digit OTP"
                    className="w-full px-4 py-3 rounded-xl border outline-none"
                    style={{
                      borderColor: "var(--primary-color)",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="w-full py-2 rounded-xl font-semibold"
                  style={{
                    backgroundColor: "#f59e0b",
                    color: "#fff",
                  }}
                >
                  Resend OTP
                </button>
              </>
            )}

            {/* SUBMIT BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold"
              style={{
                backgroundColor: "var(--primary-color)",
                color: "#fff",
              }}
            >
              {loading
                ? "Please wait..."
                : otpMode
                ? "Verify OTP"
                : isLogin
                ? "Login"
                : "Create Account"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;   