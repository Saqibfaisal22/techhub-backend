
const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrder,
  updateOrderStatus,
  createOrder,
} = require("../../controllers/admin/orderController");
const { authenticate, authorize } = require("../../middleware/auth");

// All routes in this file are protected and only accessible by admins
router.use(authenticate, authorize("admin"));

router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:id", getOrder);
router.put("/:id/status", updateOrderStatus);

module.exports = router;
