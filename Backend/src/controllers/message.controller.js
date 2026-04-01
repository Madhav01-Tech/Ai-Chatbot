import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { generateImageFromHF, getAssistantMessage } from "../utility/openai.js";
import ImageKit from "imagekit";



/* 
   TEXT MESSAGE CONTROLLER
 */

const textMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId, content, prompt } = req.body;

    // Handle both "content" and "prompt" parameter names
    const messageContent = content || prompt;

    // 1️⃣ Validate inputs
    if (!messageContent) {
      return res.status(400).json({ success: false, message: "Message content is required" });
    }

    if (!chatId) {
      return res.status(400).json({ success: false, message: "chatId is required" });
    }

    // 2️⃣ Find chat
    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // 3️⃣ Save user message
    chat.messages.push({ role: "user", content: messageContent, timeStamp: Date.now(), isImage: false, isPublished: false });
    await chat.save();

    // 4️⃣ Ensure user has enough credits (do not deduct until AI responds)
    const userDoc = await User.findById(userId).select("credits");
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if ((userDoc.credits || 0) < 1) {
      return res.status(402).json({ success: false, message: "Not enough credits" });
    }

    // 5️⃣ Prepare messages for AI
    const systemMessage = {
      role: "system",
      content: `You are a jarvis assistant who gives helpful information.
        You have access to:
        1. WebSearch({searchQuery}) - for realtime web information and you focused on recent information first .`,
    };

    const messagesForAI = [
      systemMessage,
      ...chat.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // 6️⃣ Get AI response
    const aiResponse = await getAssistantMessage(messagesForAI);
    const assistantText = aiResponse?.content || "";

    // 7️⃣ Save assistant message
    chat.messages.push({ role: "assistant", content: assistantText, timeStamp: Date.now(), isImage: false, isPublished: false });
    await chat.save();

    // 8️⃣ Decrease user credits after successful response
    const updatedUser = await User.findByIdAndUpdate(userId, { $inc: { credits: -1 } }, { after: true });

    return res.status(200).json({ success: true, message: assistantText, chat, user: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===========================
   IMAGE MESSAGE CONTROLLER
=========================== */

const imageMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { chatId, prompt, isPublished = false } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required" });
    }

    if (!chatId) {
      return res.status(400).json({ success: false, message: "chatId is required" });
    }

    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    const userDoc = await User.findById(userId).select("credits");
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if ((userDoc.credits || 0) < 2) {
      return res.status(402).json({ success: false, message: "Not enough credits" });
    }

    // Save user prompt
    chat.messages.push({
      role: "user",
      content: prompt,
      timeStamp: Date.now(),
      isImage: false,
    });

// Generate image
const imageBase64 = await generateImageFromHF(prompt);

// Create data URL
const imageUrl = `data:image/png;base64,${imageBase64}`;

// Save assistant image message
chat.messages.push({
  role: "assistant",
  content: imageUrl,
  timeStamp: Date.now(),
  isImage: true,
  isPublished,
});

await chat.save();

// Deduct credits
const updatedUser = await User.findByIdAndUpdate(
  userId,
  { $inc: { credits: -2 } },
  { after: true }
);

return res.status(200).json({
  success: true,
  imageUrl,
  chat,
  user: updatedUser,
});

  } catch (error) {
    console.error("Image Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPublishedImages = async (req, res) => {
  try {
    const chats = await Chat.find({ "messages.isImage": true, "messages.isPublished": true });

    const images = chats
      .flatMap((chat) => {
        const authorName = chat.userName || "Anonymous";
        return chat.messages
          .filter((msg) => msg.isImage && msg.isPublished)
          .map((msg) => ({
            imageUrl: msg.content,
            userName: authorName,
            timeStamp: msg.timeStamp || chat.updatedAt,
          }));
      })
      .sort((a, b) => (b.timeStamp || 0) - (a.timeStamp || 0));

    return res.status(200).json({ success: true, images });
  } catch (error) {
    console.error("Get Published Images Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { textMessage, imageMessage, getPublishedImages };