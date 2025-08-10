import { config } from "dotenv";
config();
import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
    host: "live.smtp.mailtrap.io",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "api",
        pass: process.env.MAILTRAP_TOKEN,
    },
});