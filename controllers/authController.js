const crypto = require("crypto")
const { User } = require("../models")
const { generateToken, generateRefreshToken } = require("../utils/jwt")
const { sendPasswordResetEmail, sendWelcomeEmail } = require("../utils/email")
const logger = require("../utils/logger")

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Create user
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone,
    })

    // Generate tokens
    const token = generateToken({ userId: user.id, role: user.role })
    const refreshToken = generateRefreshToken({ userId: user.id })

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.first_name)
    } catch (emailError) {
      logger.error("Failed to send welcome email:", emailError)
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token,
        refreshToken,
      },
    })
  } catch (error) {
    logger.error("Registration error:", error)
    res.status(500).json({ message: "Registration failed" })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user and include password for comparison
    const user = await User.findOne({
      where: { email },
      attributes: { include: ["password"] },
    })

    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate tokens
    const token = generateToken({ userId: user.id, role: user.role })
    const refreshToken = generateRefreshToken({ userId: user.id })

    // Remove password from response
    const userResponse = user.toJSON()

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token,
        refreshToken,
      },
    })
  } catch (error) {
    logger.error("Login error:", error)
    res.status(500).json({ message: "Login failed" })
  }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: ["addresses"],
    })

    res.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    logger.error("Get me error:", error)
    res.status(500).json({ message: "Failed to get user data" })
  }
}

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ where: { email } })
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: "If an account with that email exists, we have sent a password reset link",
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token to user
    await user.update({
      password_reset_token: resetToken,
      password_reset_expires: resetTokenExpiry,
    })

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.first_name)
    } catch (emailError) {
      logger.error("Failed to send password reset email:", emailError)
      await user.update({
        password_reset_token: null,
        password_reset_expires: null,
      })
      return res.status(500).json({ message: "Failed to send reset email" })
    }

    res.json({
      success: true,
      message: "Password reset link sent to your email",
    })
  } catch (error) {
    logger.error("Forgot password error:", error)
    res.status(500).json({ message: "Failed to process forgot password request" })
  }
}

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: {
          [require("sequelize").Op.gt]: new Date(),
        },
      },
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" })
    }

    // Update password and clear reset token
    await user.update({
      password,
      password_reset_token: null,
      password_reset_expires: null,
    })

    // Generate new tokens
    const newToken = generateToken({ userId: user.id, role: user.role })
    const refreshToken = generateRefreshToken({ userId: user.id })

    res.json({
      success: true,
      message: "Password reset successful",
      data: {
        user: user.toJSON(),
        token: newToken,
        refreshToken,
      },
    })
  } catch (error) {
    logger.error("Reset password error:", error)
    res.status(500).json({ message: "Failed to reset password" })
  }
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({
      success: true,
      message: "Logout successful",
    })
  } catch (error) {
    logger.error("Logout error:", error)
    res.status(500).json({ message: "Logout failed" })
  }
}

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
}
