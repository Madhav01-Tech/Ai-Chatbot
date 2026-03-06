import express from "express";
import { registerUser, loginUser, getUser }  from "../controllers/user.controller.js"
import authmiddleware from "../middleware/auth.middleware.js";


const Userrouter = express.Router();

Userrouter.post("/register", registerUser);
Userrouter.post("/login", loginUser);
Userrouter.get("/get", authmiddleware, getUser);

export default Userrouter;