const express = require("express")
const {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} = require("../controllers/blogController")
const { authenticate, authorize, optionalAuth } = require("../middleware/auth")

const router = express.Router()

// Public routes (with optional auth for admin features)
router.get("/", optionalAuth, getBlogPosts)
router.get("/:slug", optionalAuth, getBlogPost)

// Admin only routes
router.post("/", authenticate, authorize("admin"), createBlogPost)
router.put("/:id", authenticate, authorize("admin"), updateBlogPost)
router.delete("/:id", authenticate, authorize("admin"), deleteBlogPost)

module.exports = router
