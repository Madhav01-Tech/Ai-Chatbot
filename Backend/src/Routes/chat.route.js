import { createdChat, getChat, deleteChat } from "../controllers/chat.controller.js";
import authmiddleware from "../middleware/auth.middleware.js";
import express from "express";

const Chatrouter = express.Router();

// CREATE CHAT
Chatrouter.post("/create", authmiddleware, createdChat);

// GET ALL CHATS
Chatrouter.get("/", authmiddleware, getChat);

// DELETE CHAT
Chatrouter.delete("/delete/:chatId", authmiddleware, deleteChat);

export default Chatrouter;