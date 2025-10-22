
const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../../controllers/admin/productController");
const { authenticate, authorize } = require("../../middleware/auth");

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
  },
});
const upload = multer({ storage });

// All routes in this file are protected and only accessible by admins
router.use(authenticate, authorize("admin"));

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", upload.array("images"), createProduct);
router.put("/:id", upload.array("images"), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
