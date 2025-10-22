const express = require("express")
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart,
  checkWishlistStatus,
} = require("../controllers/wishlistController")
const { authenticate } = require("../middleware/auth")
const { addToWishlistValidation, moveToCartValidation } = require("../middleware/cartValidation")

const router = express.Router()

// All wishlist routes require authentication
router.use(authenticate)

router.get("/", getWishlist)
router.post("/", addToWishlistValidation, addToWishlist)
router.delete("/:id", removeFromWishlist)
router.delete("/", clearWishlist)
router.post("/:id/move-to-cart", moveToCartValidation, moveToCart)
router.get("/check/:productId", checkWishlistStatus)

module.exports = router
