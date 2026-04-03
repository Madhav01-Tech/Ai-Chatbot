// controllers/ragController.js
import fs from "fs";
import path from "path";

import {
  buildChromaCollection,
  retrieveFromChroma,
} from "../utility/prepare.js";

import { getAssistantMessage } from "../utility/openai.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";

// ================= HELPERS =================
const makeCollectionName = (chatId) => {
  return `chat-${chatId}`;
};

// ================= UPLOAD =================
export const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: "No PDF file provided." });
    }

    return res.json({
      success: true,
      filePath: req.file.path,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error("[ragController] uploadPdf:", error);
    return res.json({ success: false, message: error.message });
  }
};

// ================= ASK =================
export const askRagQuestion = async (req, res) => {
  try {
    const { chatId, content, filePath, fileName } = req.body;
    const userId = req.userId;

    if (!chatId || !content || !filePath || !fileName) {
      return res.json({
        success: false,
        message: "chatId, content, filePath, fileName required",
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.json({ success: false, message: "Chat not found." });

    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found." });

    if (user.credits < 5) {
      return res.json({ success: false, message: "Insufficient credits." });
    }

    const collectionName = makeCollectionName(chatId);

    // ================= 🔥 BUILD ONLY ONCE =================
    if (!chat.isRagInitialized) {
      console.log("[RAG] First time processing PDF...");

      await buildChromaCollection(filePath, collectionName);

      chat.isRagInitialized = true;
      chat.fileName = fileName;
      await chat.save();
    }

    // ================= 🔍 RETRIEVE =================
    const relevantChunks = await retrieveFromChroma(collectionName, content);

    if (!relevantChunks || relevantChunks.length === 0) {
      return res.json({
        success: false,
        message: "No relevant content found in the document.",
      });
    }

    // ================= 🧠 BUILD CONTEXT =================
    const context = relevantChunks
      .map(
        (c) =>
          `[Source: ${c.source || "unknown"}, Page: ${c.page}]\n${c.text}`
      )
      .join("\n\n---\n\n");

    // ================= 💬 MESSAGES =================
    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant.

Answer ONLY using the provided document context.
If answer is not in context, say:
"I couldn't find that in the document."

--- DOCUMENT CONTEXT ---
${context}
--- END CONTEXT ---`,
      },

      ...chat.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),

      {
        role: "user",
        content: content,
      },
    ];

    // ================= 🤖 LLM =================
    const assistantMessage = await getAssistantMessage(messages);
    const answer =
      assistantMessage?.content?.trim() || "No answer generated.";

    // ================= 💾 SAVE =================
    chat.messages.push(
      { role: "user", content, isRag: true },
      { role: "assistant", content: answer, isRag: true }
    );

    await chat.save();

    // ================= 💰 FIXED CREDIT DEDUCTION =================
    const updatedUser = await User.findByIdAndUpdate(userId, { $inc: { credits: -1 } }, { after: true });

    // ================= 🧹 OPTIONAL CLEANUP =================
    // fs.unlinkSync(filePath); // remove temp file

    return res.json({
      success: true,
      message: answer,
      sources: relevantChunks,
      user: updatedUser, // 🔥 send sources to frontend
      chat,
    });
  } catch (error) {
    console.error("[ragController] askRagQuestion:", error);
    return res.json({ success: false, message: error.message });
  }
};