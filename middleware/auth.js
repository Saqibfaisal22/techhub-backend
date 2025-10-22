const { verifyToken } = require("../utils/jwt")
const { User } = require("../models")

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token required" })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ["password"] },
    })

    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Invalid token or user not found" })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" })
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" })
    }
    return res.status(500).json({ message: "Authentication error" })
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" })
    }

    next()
  }
}

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)

      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ["password"] },
      })

      if (user && user.is_active) {
        req.user = user
      }
    }

    next()
  } catch (error) {
    // Continue without authentication for optional auth
    next()
  }
}

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
}
