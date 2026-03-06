import express from "express";
import { textMessage, imageMessage } from "../controllers/message.controller.js";
import authmiddleware from "../middleware/auth.middleware.js";

const messageRouter = express.Router();

// POST TEXT MESSAGE
messageRouter.post("/text", authmiddleware, textMessage);

// POST IMAGE MESSAGE
messageRouter.post("/image", authmiddleware, imageMessage);

export default messageRouter;
