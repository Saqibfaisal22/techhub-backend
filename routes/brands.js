const express = require("express");
const router = express.Router();
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} = require("../controllers/brandController");
const { authenticate, authorize } = require("../middleware/auth");

// Public routes
router.get("/", getBrands);
router.get("/:id", getBrand);

// Admin only routes
router.post("/", authenticate, authorize("admin"), createBrand);
router.put("/:id", authenticate, authorize("admin"), updateBrand);
router.delete("/:id", authenticate, authorize("admin"), deleteBrand);

module.exports = router;
