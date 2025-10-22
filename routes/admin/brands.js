const express = require("express");
const router = express.Router();
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} = require("../../controllers/brandController");
const { authenticate, authorize } = require("../../middleware/auth");

// List all brands
router.get("/", authenticate, authorize("admin"), getBrands);
// Get single brand
router.get("/:id", authenticate, authorize("admin"), getBrand);
// Create brand
router.post("/", authenticate, authorize("admin"), createBrand);
// Update brand
router.put("/:id", authenticate, authorize("admin"), updateBrand);
// Delete brand
router.delete("/:id", authenticate, authorize("admin"), deleteBrand);

module.exports = router;
