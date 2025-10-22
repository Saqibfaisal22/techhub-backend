const express = require("express")
const { getPages, getPage, createPage, updatePage, deletePage } = require("../controllers/pageController")
const { authenticate, authorize, optionalAuth } = require("../middleware/auth")

const router = express.Router()

// Public routes (with optional auth for admin features)
router.get("/", optionalAuth, getPages)
router.get("/:slug", optionalAuth, getPage)

// Admin only routes
router.post("/", authenticate, authorize("admin"), createPage)
router.put("/:id", authenticate, authorize("admin"), updatePage)
router.delete("/:id", authenticate, authorize("admin"), deletePage)

module.exports = router
