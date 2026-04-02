import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utility/mailer.js";

// Generate 6 digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();


/* ===============================
   REGISTER USER + SEND OTP
================================*/
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    if (!user) {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpires,
        isVerified: false,
      });
    } else {
      user.name = name;
      user.password = hashedPassword;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    // Send OTP Email
  await sendEmail({
  to: email,
  subject: "PromptlyAI OTP Verification",
  text: `Your OTP is ${otp}`,
  html: `
    <div style="font-family: Arial; background:#f6f6f6; padding:20px;">
      <div style="max-width:400px; margin:auto; background:white; padding:20px; border-radius:8px;">
        <h2 style="text-align:center;">PromptlyAI</h2>
        <p>Verify your account using this code:</p>
        <div style="text-align:center; font-size:26px; font-weight:bold; margin:15px 0;">
          ${otp}
        </div>
        <p style="font-size:14px; color:gray;">
          Expires in 3 minutes
        </p>
      </div>
    </div>
  `,
});
    return res.status(200).json({
      success: true,
      message: "OTP sent to email. Please verify to complete registration",
    });

  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ===============================
   VERIFY OTP
================================*/
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already verified",
      });
    }

    if (!user.otp || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userSafe = user.toObject();
    delete userSafe.password;

    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        success: true,
        message: "OTP verified. Account created successfully",
        user: userSafe,
        token,
      });

  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ===============================
   RESEND OTP
================================*/
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already verified",
      });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;

    await user.save();

     await sendEmail({
  to: email,
  subject: "PromptlyAI OTP Verification",
  text: `Your OTP is ${otp}`,
  html: `
    <div style="font-family: Arial; background:#f6f6f6; padding:20px;">
      <div style="max-width:400px; margin:auto; background:white; padding:20px; border-radius:8px;">
        <h2 style="text-align:center;">PromptlyAI</h2>
        <p>Verify your account using this code:</p>
        <div style="text-align:center; font-size:26px; font-weight:bold; margin:15px 0;">
          ${otp}
        </div>
        <p style="font-size:14px; color:gray;">
          Expires in 3 minutes
        </p>
      </div>
    </div>
  `,
});

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });

  } catch (error) {
    console.error("Resend OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ===============================
   LOGIN USER
================================*/
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please verify OTP first.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userSafe = user.toObject();
    delete userSafe.password;

    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        user: userSafe,
        token,
      });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ===============================
   GET CURRENT USER
================================*/
const getUser = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("Get User Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { registerUser, verifyOtp, resendOtp, loginUser, getUser };