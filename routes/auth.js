const express = require("express")
const { register, login, getMe, forgotPassword, resetPassword, logout } = require("../controllers/authController")
const { authenticate } = require("../middleware/auth")
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../middleware/validation")

const router = express.Router()

// Public routes
router.post("/register", registerValidation, register)
router.post("/login", loginValidation, login)
router.post("/forgot-password", forgotPasswordValidation, forgotPassword)
router.post("/reset-password", resetPasswordValidation, resetPassword)

// Protected routes
router.get("/me", authenticate, getMe)
router.post("/logout", authenticate, logout)

module.exports = router
