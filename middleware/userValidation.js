const { body, param } = require("express-validator")
const { handleValidationErrors } = require("./validation")

const updateUserValidation = [
  param("id").isInt().withMessage("User ID must be a valid integer"),
  body("first_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("last_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("email").optional().isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("phone").optional().isMobilePhone().withMessage("Please provide a valid phone number"),
  handleValidationErrors,
]

const changePasswordValidation = [
  param("id").isInt().withMessage("User ID must be a valid integer"),
  body("current_password").notEmpty().withMessage("Current password is required"),
  body("new_password")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
  handleValidationErrors,
]

const addressValidation = [
  body("type").optional().isIn(["billing", "shipping"]).withMessage("Address type must be either billing or shipping"),
  body("first_name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("First name must be between 2 and 100 characters"),
  body("last_name").trim().isLength({ min: 2, max: 100 }).withMessage("Last name must be between 2 and 100 characters"),
  body("company").optional().trim().isLength({ max: 100 }).withMessage("Company name must not exceed 100 characters"),
  body("address_line_1")
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Address line 1 must be between 5 and 255 characters"),
  body("address_line_2")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Address line 2 must not exceed 255 characters"),
  body("city").trim().isLength({ min: 2, max: 100 }).withMessage("City must be between 2 and 100 characters"),
  body("state").trim().isLength({ min: 2, max: 100 }).withMessage("State must be between 2 and 100 characters"),
  body("postal_code")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Postal code must be between 3 and 20 characters"),
  body("country").trim().isLength({ min: 2, max: 100 }).withMessage("Country must be between 2 and 100 characters"),
  body("is_default").optional().isBoolean().withMessage("is_default must be a boolean value"),
  handleValidationErrors,
]

const updateAddressValidation = [
  param("id").isInt().withMessage("User ID must be a valid integer"),
  param("addressId").isInt().withMessage("Address ID must be a valid integer"),
  body("type").optional().isIn(["billing", "shipping"]).withMessage("Address type must be either billing or shipping"),
  body("first_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("First name must be between 2 and 100 characters"),
  body("last_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Last name must be between 2 and 100 characters"),
  body("company").optional().trim().isLength({ max: 100 }).withMessage("Company name must not exceed 100 characters"),
  body("address_line_1")
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Address line 1 must be between 5 and 255 characters"),
  body("address_line_2")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Address line 2 must not exceed 255 characters"),
  body("city")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),
  body("state")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("State must be between 2 and 100 characters"),
  body("postal_code")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Postal code must be between 3 and 20 characters"),
  body("country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Country must be between 2 and 100 characters"),
  body("is_default").optional().isBoolean().withMessage("is_default must be a boolean value"),
  handleValidationErrors,
]

module.exports = {
  updateUserValidation,
  changePasswordValidation,
  addressValidation,
  updateAddressValidation,
}
