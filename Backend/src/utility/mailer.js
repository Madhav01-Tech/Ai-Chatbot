import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

// Create transporter using env variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send email
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });

    

    return { success: true };
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw new Error("Failed to send email");
  }
};