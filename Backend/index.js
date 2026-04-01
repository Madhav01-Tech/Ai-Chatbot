import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './src/utility/db.js';
import Userrouter from './src/Routes/user.routes.js';
import Chatrouter from './src/Routes/chat.route.js';
import messageRouter from './src/Routes/message.route.js';
import Ragroutes from './src/Routes/rag.routes.js';   // 👈 add this

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api/user",     Userrouter);
app.use("/api/chat",     Chatrouter);
app.use("/api/messages", messageRouter);
app.use("/api/rag",      Ragroutes);                  // 👈 add this

app.get('/', (req, res) => {
    res.send("Hello World");
});

app.listen(process.env.Port, () => {
    console.log(`Server is running on port http://localhost:${process.env.Port}`);
    connectDB();
});