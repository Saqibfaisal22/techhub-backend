
const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../../controllers/admin/userController");
const { authenticate, authorize } = require("../../middleware/auth");

// All routes in this file are protected and only accessible by admins
router.use(authenticate, authorize("admin"));

router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
