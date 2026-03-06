import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const registerUser = async (req, res) => {


    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "all fields are required " });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ name, email, password: hashedPassword });

        if (!user) {
            return res.status(500).json({ message: "something went wrong while registering user" });
        }

        const created = user.toObject ? user.toObject() : user;
        delete created.password;
        res.status(201).json({ message: "User registered successfully", user: created });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export { registerUser };



const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "all fields are required " });
        }
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
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
            .json({ message: "Login successful", user: userSafe, token: token });

    } catch (error) {
        res.status(500).json({ message: error.message });

    }
}


export { loginUser };

const getUser = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export { getUser };