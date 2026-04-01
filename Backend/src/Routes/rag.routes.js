import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import uploadMiddleware from "../middleware/upload.middleware.js";
import { uploadPdf, askRagQuestion } from "../controllers/rag.controller.js"; // adjust path if needed

const Ragroutes = express.Router();

Ragroutes.post(
  "/upload",
  authMiddleware,
  uploadMiddleware.single("pdf"), // ✅ correct usage
  uploadPdf
);

Ragroutes.post(
  "/ask",
  authMiddleware,
  askRagQuestion
);

export default Ragroutes;