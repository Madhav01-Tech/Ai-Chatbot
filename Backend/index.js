import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from "path";
import { fileURLToPath } from "url";

import connectDB from './src/utility/db.js';
import Userrouter from './src/Routes/user.routes.js';
import Chatrouter from './src/Routes/chat.route.js';
import messageRouter from './src/Routes/message.route.js';
import Ragroutes from './src/Routes/rag.routes.js';

const app = express();

// Fix __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: "10mb" })); // for AI payloads
app.use(cookieParser());

// ✅ API Routes
app.use("/api/user", Userrouter);
app.use("/api/chat", Chatrouter);
app.use("/api/messages", messageRouter);
app.use("/api/rag", Ragroutes);

// ✅ Health check (important for Render)
app.get('/api', (req, res) => {
  res.status(200).send("API working ✅");
});

// ✅ Serve frontend (React/Vite build)
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// ✅ Handle React routing
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ❗ Connect DB FIRST, then start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
  });