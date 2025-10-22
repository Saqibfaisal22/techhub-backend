
const express = require("express");
const router = express.Router();
const {
  getPages,
  getPage,
  updatePage,
} = require("../../controllers/admin/cmsController");
const { authenticate, authorize } = require("../../middleware/auth");

// All routes in this file are protected and only accessible by admins
router.use(authenticate, authorize("admin"));

router.get("/pages", getPages);
router.get("/pages/:id", getPage);
router.put("/pages/:id", updatePage);

module.exports = router;
