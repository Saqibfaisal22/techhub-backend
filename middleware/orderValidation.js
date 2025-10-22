const { body, param } = require("express-validator")
const { handleValidationErrors } = require("./validation")

const createOrderValidation = [
  body("shipping_address.first_name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shipping first name must be between 2 and 100 characters"),
  body("shipping_address.last_name")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 0, max: 100 })
    .withMessage("Shipping last name must not exceed 100 characters"),
  body("shipping_address.street_address")
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Shipping street address must be between 5 and 255 characters"),
  body("shipping_address.city")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shipping city must be between 2 and 100 characters"),
  body("shipping_address.state")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shipping state must be between 2 and 100 characters"),
  body("shipping_address.zip_code")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Shipping zip code must be between 3 and 20 characters"),
  body("shipping_address.country")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Shipping country must be between 2 and 100 characters"),
  body("billing_address.first_name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Billing first name must be between 2 and 100 characters"),
  body("billing_address.last_name")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 0, max: 100 })
    .withMessage("Billing last name must not exceed 100 characters"),
  body("billing_address.street_address")
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Billing street address must be between 5 and 255 characters"),
  body("billing_address.city")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Billing city must be between 2 and 100 characters"),
  body("billing_address.state")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Billing state must be between 2 and 100 characters"),
  body("billing_address.zip_code")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Billing zip code must be between 3 and 20 characters"),
  body("billing_address.country")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Billing country must be between 2 and 100 characters"),
  body("payment_method").trim().isLength({ min: 2, max: 50 }).withMessage("Payment method is required"),
  body("notes").optional().trim().isLength({ max: 1000 }).withMessage("Notes must not exceed 1000 characters"),
  handleValidationErrors,
]

const updateOrderStatusValidation = [
  param("id").isInt({ min: 1 }).withMessage("Order ID must be a valid positive integer"),
  body("status")
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"])
    .withMessage("Invalid order status"),
  body("message").optional().trim().isLength({ max: 500 }).withMessage("Message must not exceed 500 characters"),
  body("tracking_number")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Tracking number must not exceed 100 characters"),
  body("carrier").optional().trim().isLength({ max: 100 }).withMessage("Carrier must not exceed 100 characters"),
  handleValidationErrors,
]

module.exports = {
  createOrderValidation,
  updateOrderStatusValidation,
}
