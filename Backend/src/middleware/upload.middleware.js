import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsDir = path.resolve("uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname}`;
    cb(null, safeName);
  },
});

 const uploadMiddleware = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF uploads are allowed."), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
});


export default uploadMiddleware;