const express = require("express")
const {
  getProducts,
  getProduct,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController")
const { authenticate, authorize } = require("../middleware/auth")

const router = express.Router()

// Public routes
router.get("/", getProducts)
router.get("/slug/:slug", getProductBySlug)
router.get("/:id", getProduct)

// Admin only routes
router.post("/", authenticate, authorize("admin"), createProduct)
router.put("/:id", authenticate, authorize("admin"), updateProduct)
router.delete("/:id", authenticate, authorize("admin"), deleteProduct)

module.exports = router
