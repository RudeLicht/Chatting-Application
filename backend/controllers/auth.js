import { User } from "../models/users.js";
import { OtpModel } from "../models/otp.js";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import bcrypt from "bcrypt"
import validator from "deep-email-validator";
import { transporter } from "../utils/nodemailer.js";
import crypto from "crypto"

config();

export function getMainFunction(req, res) {
    res.json({ message: "Hello from backend" });
}

export async function postRegisterController(req, res) {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: "Username already taken", success: false });
        }

        const existingEmail = await User.findOne({ email })
        if (existingEmail) {
            return res.status(409).json({ message: "Email already used", success: false })
        }

        const result = await validator.validate(email);
        if (!result.valid) {
            const validatorReason = result.validators[result.reason]?.reason || 'Unknown reason';
            return res.status(400).json({
                message: `Invalid email: ${result.reason}, ${validatorReason}`,
                success: false
            });
        }


        const user = new User({ username, email, password });
        await user.save();

        const token = jwt.sign(
            {
                username: user.username,
                email: user.email
            },
            process.env.SECRET,
            { expiresIn: "1h" }
        );

        res.status(201)
            .cookie("token", token, {
                maxAge: 3600 * 1000,
                httpOnly: true,
                sameSite: "Lax"
            })
            .json({
                success: true,
                message: "User registered successfully",
                token
            })
        let emailResult = await transporter.sendMail({
            from: "Licht Chatting App <info@licht.ink>",
            to: user.email,
            subject: "Welcome to Licht Chatting App 🎉",
            html: `
                    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 20px; text-align: center;">
                            <h1 style="color: #333333;">Welcome to Licht Chatting App!</h1>
                            <p style="color: #555555; font-size: 16px;">
                                Thank you for registering! We're excited to have you join our community.  
                                You can now connect with friends, chat instantly, and enjoy all the features we’ve built for you.
                            </p>
                            <a href="http://localhost/login/" style="display: inline-block; padding: 12px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
                                Go to Login
                            </a>
                            <p style="margin-top: 30px; font-size: 12px; color: #888888;">
                                If you didn’t register for this account, please ignore this email.
                            </p>
                        </div>
                    </div>
                `
        });

        console.log("Email sent:", emailResult)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Couldn't register the user", success: false });
    }
}

export async function postLoginController(req, res) {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ success: false, message: "No user found" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ success: false, message: "Wrong password" });
        }

        const token = jwt.sign({
            username: user.username,
            email: user.email
        }, process.env.SECRET, {
            expiresIn: "1h",
        });

        res
            .cookie("token", token, {
                httpOnly: true,
                sameSite: "Lax",
                maxAge: 3600 * 1000,
            })
            .status(200)
            .json({ success: true, message: "Logged in successfully" });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Error logging in" });
    }
}

export function getMeController(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        res.json({
            success: true,
            username: decoded.username,
            email: decoded.email
        });
    } catch (err) {
        res.status(401).json({ success: false, message: "Invalid token" });
    }
};

export function postLogoutController(req, res) {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "Lax",
        secure: false,
        path: "/"
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
}

export async function postForgotPasswordController(req, res) {

    try {
        const { email } = req.body;

        const existingEmail = await User.findOne({ email });
        if (!existingEmail) {
            return res.status(404).json({ message: "Email doesn't exist", success: false })
        }

        const result = await validator.validate(email);
        if (!result.valid) {
            const validatorReason = result.validators[result.reason]?.reason || 'Unknown reason';
            return res.status(400).json({
                message: `Invalid email: ${result.reason}, ${validatorReason}`,
                success: false
            });
        }

        const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        function generateOTP() {
            let otp = '';
            for (let i = 0; i < 4; i++) {
                otp += numbers[crypto.randomInt(numbers.length)];
            }
            return otp;
        }

        let otpCode = generateOTP();

        let emailResult = await transporter.sendMail({
            from: "Licht Chatting App <no-reply@licht.ink>",
            to: email,
            subject: "Your OTP Code for Password Reset",
            html: `
            <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
                    <div style="background-color: #4a90e2; color: white; padding: 15px; text-align: center;">
                        <h2 style="margin: 0;">Licht Chatting App</h2>
                    </div>
                    <div style="padding: 20px; color: #333;">
                        <p>Hello,</p>
                        <p>We received a request to reset your password. Use the One-Time Password (OTP) below to proceed:</p>
                        <div style="text-align: center; margin: 25px 0;">
                            <span style="display: inline-block; background-color: #f2f2f2; padding: 12px 24px; font-size: 24px; letter-spacing: 4px; font-weight: bold; border-radius: 5px; border: 1px solid #ccc;">
                                ${otpCode}
                            </span>
                        </div>
                        <p>This code will expire in <strong>10 minutes</strong>. If you didn’t request a password reset, please ignore this email.</p>
                        <p>Thank you,<br>The Licht Chatting App Team</p>
                    </div>
                    <div style="background-color: #f4f4f4; text-align: center; padding: 10px; font-size: 12px; color: #777;">
                        &copy; ${new Date().getFullYear()} Licht Chatting App. All rights reserved.
                    </div>
                </div>
            </div>
            `
        });

        await OtpModel.create({
            email,
            otp: otpCode
        });

        console.log("Email sent:", emailResult)
        const token = jwt.sign({
            email: email
        }, process.env.SECRET, {
            expiresIn: "10m",
        });
        res.status(200)
            .cookie("reset-password", token, {
                httpOnly: true,
                sameSite: "Lax",
                maxAge: 3600 * 1000,
            })
            .json({ message: "Email has been sent!", success: true })
    } catch (err) {
        res.status(401).json({ success: false, message: `Error sending the email ${err}` });
    }
}

export async function postCheckOTPController(req, res) {
    const { email, otp } = req.body;
    const record = await OtpModel.findOne({ email, otp });
    console.log(email, otp)
    if (!record) {
        return res.status(400).json({ message: "Invalid OTP", success: false });
    }

    if (record.expires < new Date()) {
        return res.status(400).json({ message: "OTP has expired", success: false });
    }



    res
        .status(200)
        .json({ message: "Correct OTP", success: true })
}

export function validateResetTokenController(req, res) {
    const token = req.cookies["reset-password"];
    if (!token) {
        return res.status(401).json({ success: false, message: "No reset token" });
    }
    try {
        const payload = jwt.verify(token, process.env.SECRET);
        res.json({ success: true, message: "Valid token", email: payload.email });
    } catch (err) {
        res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
}

export async function postResetPasswordController(req, res) {
    try {
        const token = req.cookies["reset-password"];
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized or session expired" });
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        const { email } = payload;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.findOneAndUpdate(
            { email },
            { password: hashedPassword }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.clearCookie("reset-password", {
            httpOnly: true,
            sameSite: "Lax",
            path: "/"
        });

        res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}