// controllers/ragController.js
import fs from "fs";
import {
  buildChromaCollection,
  retrieveFromChroma,
  deleteCollection,
} from "../utility/prepare.js";
import { getAssistantMessage } from "../utility/openai.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";


const makeCollectionName = (chatId) => {
  return `chat-${chatId}`;  
  };


export const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: "No PDF file provided." });
    }

    return res.json({
      success:  true,
      filePath: req.file.path,
      fileName: req.file.originalname,
    });

  } catch (error) {
    console.error("[ragController] uploadPdf:", error);
    return res.json({ success: false, message: error.message });
  }
};


export const askRagQuestion = async (req, res) => {
  try {
    const { chatId, content, filePath, fileName } = req.body;
    const userId = req.userId;
 
   if (!chatId || !content || !filePath || !fileName) {
      return res.json({
        success: false,
        message: "chatId, content, filePath and fileName are all required.",
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.json({ success: false, message: "Chat not found." });

    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found." });

    if (user.credits <5) {
      return res.json({ success: false, message: "Insufficient credits." });
    }

    
   const collectionName = makeCollectionName(chatId);
    await buildChromaCollection(filePath, collectionName);

    
    const relevantChunks = await retrieveFromChroma(collectionName, content); // similar text in db according to query

    if (relevantChunks.length === 0) {
      return res.json({
        success: false,
        message: "No relevant content found in the document.",
      });
    }

    
    const context = relevantChunks.join("\n\n---\n\n");

    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant that answers questions based on the document context provided below.
Prioritize the document context when answering. Only use web search if the question cannot be answered from the context.
If the answer is not in the context and cannot be found via search, say "I couldn't find that in the document."

--- DOCUMENT CONTEXT ---
${context}
--- END CONTEXT ---`,
      },
      // Include previous chat history for multi-turn RAG conversations
      ...chat.messages.map((m) => ({
        role:    m.role,
        content: m.content,
      })),
      // Current user question
      {
        role:    "user",
        content: content,
      },
    ];

    // Step 4: Get answer from your Groq-powered assistant 
    const assistantMessage = await getAssistantMessage(messages);
    const answer = assistantMessage.content?.trim() || "No answer generated.";

    // Step 5: Persist both turns 
    chat.messages.push(
      { role: "user",      content,        isRag: true },
      { role: "assistant", content: answer, isRag: true }
    );
    await chat.save();

    //  Step 6: Deduct credit 
    user.credits = User.findByIdAndUpdate(userId, { $inc: { credits: -5 } }, { after: true });
    await user.save();

    //  Optional: cleanup temp PDF 
     // fs.unlinkSync(filePath);

    // Optional: cleanup Chroma collection 
     // await deleteCollection(collectionName);

    return res.json({
      success: true,
      message: answer,
      chat,
      user: { credits: user.credits },
    });

  } catch (error) {
    console.error("[ragController] askRagQuestion:", error);
    return res.json({ success: false, message: error.message });
  }
};
