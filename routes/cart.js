const express = require("express")
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  moveToWishlist,
} = require("../controllers/cartController")
const { authenticate } = require("../middleware/auth")
const { addToCartValidation, updateCartItemValidation } = require("../middleware/cartValidation")

const router = express.Router()

// All cart routes require authentication
router.use(authenticate)

router.get("/", getCart)
router.post("/", addToCartValidation, addToCart)
router.put("/:id", updateCartItemValidation, updateCartItem)
router.delete("/:id", removeFromCart)
router.delete("/", clearCart)
router.post("/:id/move-to-wishlist", moveToWishlist)

module.exports = router
