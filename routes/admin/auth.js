
const express = require("express");
const router = express.Router();
const { login } = require("../../controllers/admin/authController");
const { loginValidation } = require("../../middleware/validation");

router.post("/login", loginValidation, login);

module.exports = router;
