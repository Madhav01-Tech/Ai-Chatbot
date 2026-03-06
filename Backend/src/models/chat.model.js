import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  userName: {
    type: String,
    
  },

  name: {
    type: String,
    required: true,
  },

  messages: [
    {
      isImage: {
        type: Boolean,
        default: false,
      },

      role: {
        type: String,
        enum: ["user", "assistant"],
        required: true,
      },

      isPublished: {
        type: Boolean,
        default: false,
      },

      content: {
        type: String,
        required: true,
      },

      timeStamp: {
        type: Number,
        default: Date.now,
      },
    },
  ],
}, { timestamps: true });

export const Chat =  mongoose.model("Chat", chatSchema);