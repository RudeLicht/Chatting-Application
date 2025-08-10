import mongoose from "mongoose";

const otpSchema = mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }
});

export const OtpModel = mongoose.model("Otp", otpSchema);
