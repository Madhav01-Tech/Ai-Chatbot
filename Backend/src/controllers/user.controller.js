import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utility/mailer.js";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "all fields are required" });
        }

        let user = await User.findOne({ email });
        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        if (user && user.isVerified) {
            return res.status(400).json({ message: "User already exists and is verified" });
        }

        if (!user) {
            user = await User.create({
                name,
                email,
                password: hashedPassword,
                isVerified: false,
                otp,
                otpExpires,
            });
        } else {
            user.name = name;
            user.password = hashedPassword;
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
        }

        const emailResult = await sendEmail({
            to: email,
            subject: "QuickChat Email Verification OTP",
            text: `Your OTP for QuickChat signup is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your OTP for QuickChat signup is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
        });

        return res.status(200).json({
            message: "OTP sent to email. Verify OTP to complete registration",
            previewUrl: emailResult.previewUrl || null,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "User already verified" });
        }

        if (!user.otp || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const userSafe = user.toObject ? user.toObject() : user;
        delete userSafe.password;

        return res.status(200)
            .cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000,
            })
            .json({
                message: "OTP verified, account created",
                user: userSafe,
                token,
            });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "User already verified" });
        }

        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        const emailResult = await sendEmail({
            to: email,
            subject: "QuickChat Email Verification OTP - Resend",
            text: `Your new OTP for QuickChat is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your new OTP for QuickChat is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
        });

        return res.status(200).json({
            message: "OTP resent to email",
            previewUrl: emailResult.previewUrl || null,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "all fields are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: "Email not verified. Please verify OTP first." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        const userSafe = user.toObject ? user.toObject() : user;
        delete userSafe.password;

        res.status(200)
            .cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000,
            })
            .json({ message: "Login successful", user: userSafe, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUser = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { registerUser, verifyOtp, resendOtp, loginUser, getUser };