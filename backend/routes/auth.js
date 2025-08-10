import { Router } from "express";
import {
    getMainFunction,
    postRegisterController,
    postLoginController,
    getMeController,
    postLogoutController,
    postForgotPasswordController,
    postCheckOTPController,
    validateResetTokenController,
    postResetPasswordController
} from "../controllers/auth.js";

export const router = Router();

router.get("/", getMainFunction)
router.get("/me", getMeController)
router.get("/validate-reset-token", validateResetTokenController)

router.post("/register", postRegisterController)
router.post("/login", postLoginController)
router.post("/logout", postLogoutController)
router.post("/forgot-password", postForgotPasswordController)
router.post("/verify-OTP", postCheckOTPController)
router.post("/reset-password", postResetPasswordController)