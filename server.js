const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
const path = require("path")
require("dotenv").config()

const { sequelize } = require("./models")
const logger = require("./utils/logger")
const errorHandler = require("./middleware/errorHandler")

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const productRoutes = require("./routes/products")
const categoryRoutes = require("./routes/categories")
const cartRoutes = require("./routes/cart")
const wishlistRoutes = require("./routes/wishlist")
const orderRoutes = require("./routes/orders")
const pageRoutes = require("./routes/pages")
const blogRoutes = require("./routes/blog")
const supportRoutes = require("./routes/support")
const adminRoutes = require("./routes/admin")
const brandRoutes = require("./routes/brands")
const paymentRoutes = require("./routes/payments")
const mediaRoutes = require("./routes/media")

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
)

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again later.",
// })
// app.use("/api/", limiter)

// Logging
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }))

// Stripe webhook needs raw body - must be before JSON middleware
app.use("/api/payments/webhook", express.raw({ type: "application/json" }))

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

app.use("/api/brands", brandRoutes)

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() })
})

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/products", productRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/wishlist", wishlistRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/pages", pageRoutes)
app.use("/api/blog", blogRoutes)
app.use("/api/support", supportRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/media", mediaRoutes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

// Error handling middleware
app.use(errorHandler)

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate()
    logger.info("Database connection established successfully.")

    // Sync database (in production, use migrations instead)
    // if (process.env.NODE_ENV !== "production") {
    //   await sequelize.sync()
    //   logger.info("Database synchronized.")
    // }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    logger.error("Unable to start server:", error)
    process.exit(1)
  }
}

startServer()

module.exports = app
