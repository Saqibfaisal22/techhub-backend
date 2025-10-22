
const express = require("express");
const router = express.Router();
const {
  getStats,
  getSales,
  getUsers,
  getOrders,
  getRecentOrders,
} = require("../../controllers/admin/analyticsController");
const { authenticate, authorize } = require("../../middleware/auth");

// All routes in this file are protected and only accessible by admins
router.use(authenticate, authorize("admin"));

router.get("/stats", getStats);
router.get("/sales", getSales);
router.get("/users", getUsers);
router.get("/orders", getOrders);
router.get("/recent-orders", getRecentOrders);

module.exports = router;
