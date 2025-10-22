const express = require("express")
const router = express.Router()
const {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  createCheckoutSession,
  getPaymentStatus,
  capturePayment,
  cancelPayment,
} = require("../controllers/paymentController")
const { authenticate } = require("../middleware/auth")

// Webhook route (Stripe webhooks need raw body)
// This will be handled in server.js before JSON middleware
router.post("/webhook", handleWebhook)

// Protected routes
router.post("/create-payment-intent", authenticate, createPaymentIntent)
router.post("/confirm-payment", authenticate, confirmPayment)
router.post("/create-checkout-session", authenticate, createCheckoutSession)
router.get("/status/:paymentIntentId", authenticate, getPaymentStatus)

// Admin routes for payment capture/cancel
router.post("/capture-payment", authenticate, capturePayment)
router.post("/cancel-payment", authenticate, cancelPayment)

module.exports = router
