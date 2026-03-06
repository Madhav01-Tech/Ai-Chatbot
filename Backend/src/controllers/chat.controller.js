import mongoose from "mongoose";
import { Chat } from "../models/chat.model.js";


const createdChat = async (req, res) => {
  try {
    const { userId } = req;

    const chat = await Chat.create({
      userId,
      
      name: "New Chat",
      messages: [],
    });

    return res.status(201).json({
      success: true,
      chat,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



const getChat = async (req, res) => {
  try {
    const { userId } = req;

    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      chats,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



const deleteChat = async (req, res) => {
  try {
    const { userId } = req;
    const { chatId } = req.params;

    const deletedChat = await Chat.findOneAndDelete({
      _id: chatId,
      userId,
    });

    if (!deletedChat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export { createdChat, getChat, deleteChat };