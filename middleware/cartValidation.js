const { body, param } = require("express-validator")
const { handleValidationErrors } = require("./validation")

const addToCartValidation = [
  body("product_id").isInt({ min: 1 }).withMessage("Product ID must be a valid positive integer"),
  body("quantity").optional().isInt({ min: 1, max: 10 }).withMessage("Quantity must be between 1 and 10"),
  handleValidationErrors,
]

const updateCartItemValidation = [
  param("id").isInt({ min: 1 }).withMessage("Cart item ID must be a valid positive integer"),
  body("quantity").isInt({ min: 1, max: 10 }).withMessage("Quantity must be between 1 and 10"),
  handleValidationErrors,
]

const addToWishlistValidation = [
  body("product_id").isInt({ min: 1 }).withMessage("Product ID must be a valid positive integer"),
  handleValidationErrors,
]

const moveToCartValidation = [
  param("id").isInt({ min: 1 }).withMessage("Wishlist item ID must be a valid positive integer"),
  body("quantity").optional().isInt({ min: 1, max: 10 }).withMessage("Quantity must be between 1 and 10"),
  handleValidationErrors,
]

module.exports = {
  addToCartValidation,
  updateCartItemValidation,
  addToWishlistValidation,
  moveToCartValidation,
}
