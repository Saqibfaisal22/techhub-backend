const express = require("express")
const {
  getUsers,
  getUser,
  updateUser,
  changePassword,
  deleteUser,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
} = require("../controllers/userController")
const { authenticate, authorize } = require("../middleware/auth")
const {
  updateUserValidation,
  changePasswordValidation,
  addressValidation,
  updateAddressValidation,
} = require("../middleware/userValidation")

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Admin only routes
router.get("/", authorize("admin"), getUsers)
router.delete("/:id", authorize("admin"), deleteUser)

// User profile routes (own profile or admin)
router.get("/:id", getUser)
router.put("/:id", updateUserValidation, updateUser)
router.put("/:id/password", changePasswordValidation, changePassword)

// Address management routes (own addresses only)
router.get("/:id/addresses", getUserAddresses)
router.post("/:id/addresses", addressValidation, addUserAddress)
router.put("/:id/addresses/:addressId", updateAddressValidation, updateUserAddress)
router.delete("/:id/addresses/:addressId", deleteUserAddress)

module.exports = router
