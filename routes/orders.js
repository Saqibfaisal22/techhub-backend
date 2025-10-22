const express = require("express")
const {
  getOrders,
  getAllOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  confirmOrderAndCapturePayment,
  rejectOrderAndCancelPayment,
} = require("../controllers/orderController")
const { authenticate, authorize } = require("../middleware/auth")
const { createOrderValidation, updateOrderStatusValidation } = require("../middleware/orderValidation")

const router = express.Router()

// All order routes require authentication
router.use(authenticate)

// Customer routes
router.get("/", getOrders)
router.get("/:id", getOrder)
router.post("/", createOrderValidation, createOrder)
router.put("/:id/cancel", cancelOrder)

// Admin routes
router.get("/admin/all", authorize("admin"), getAllOrders)
router.put("/:id/status", authorize("admin"), updateOrderStatusValidation, updateOrderStatus)
router.post("/:id/confirm", authorize("admin"), confirmOrderAndCapturePayment) // NEW: Confirm and capture payment
router.post("/:id/reject", authorize("admin"), rejectOrderAndCancelPayment) // NEW: Reject and cancel payment

module.exports = router
