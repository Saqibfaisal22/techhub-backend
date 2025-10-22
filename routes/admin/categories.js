const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../../controllers/categoryController");
const { authenticate, authorize } = require("../../middleware/auth");

// List all categories
router.get("/", authenticate, authorize("admin"), getCategories);
// Get single category
router.get("/:id", authenticate, authorize("admin"), getCategory);
// Create category
router.post("/", authenticate, authorize("admin"), createCategory);
// Update category
router.put("/:id", authenticate, authorize("admin"), updateCategory);
// Delete category
router.delete("/:id", authenticate, authorize("admin"), deleteCategory);

module.exports = router;
