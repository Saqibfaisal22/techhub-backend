const { body, validationResult } = require("express-validator")

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    })
  }
  next()
}

const registerValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  body("first_name").trim().isLength({ min: 2, max: 50 }).withMessage("First name must be between 2 and 50 characters"),
  body("last_name").trim().isLength({ min: 2, max: 50 }).withMessage("Last name must be between 2 and 50 characters"),
  body("phone").optional().isMobilePhone().withMessage("Please provide a valid phone number"),
  handleValidationErrors,
]

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
]

const forgotPasswordValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  handleValidationErrors,
]

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  handleValidationErrors,
]

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  handleValidationErrors,
}
