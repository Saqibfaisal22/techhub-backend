const { User, UserAddress } = require("../models")
const logger = require("../utils/logger")
const bcrypt = require("bcryptjs")

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const search = req.query.search || ""
    const role = req.query.role || ""
    const status = req.query.status || ""

    const whereClause = {}

    if (search) {
      whereClause[require("sequelize").Op.or] = [
        { first_name: { [require("sequelize").Op.like]: `%${search}%` } },
        { last_name: { [require("sequelize").Op.like]: `%${search}%` } },
        { email: { [require("sequelize").Op.like]: `%${search}%` } },
      ]
    }

    if (role) {
      whereClause.role = role
    }

    if (status) {
      whereClause.is_active = status === "active"
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: UserAddress,
          as: "addresses",
        },
      ],
    })

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    })
  } catch (error) {
    logger.error("Get users error:", error)
    res.status(500).json({ message: "Failed to fetch users" })
  }
}

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin or Own Profile
const getUser = async (req, res) => {
  try {
    const userId = req.params.id

    // Check if user is accessing their own profile or is admin
    if (req.user.role !== "admin" && req.user.id !== Number.parseInt(userId)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserAddress,
          as: "addresses",
        },
      ],
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    logger.error("Get user error:", error)
    res.status(500).json({ message: "Failed to fetch user" })
  }
}

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private/Admin or Own Profile
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id
    const { first_name, last_name, phone, email } = req.body

    // Check if user is updating their own profile or is admin
    if (req.user.role !== "admin" && req.user.id !== Number.parseInt(userId)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } })
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" })
      }
    }

    const updateData = {}
    if (first_name) updateData.first_name = first_name
    if (last_name) updateData.last_name = last_name
    if (phone) updateData.phone = phone
    if (email) updateData.email = email

    await user.update(updateData)

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    })
  } catch (error) {
    logger.error("Update user error:", error)
    res.status(500).json({ message: "Failed to update user" })
  }
}

// @desc    Change password
// @route   PUT /api/users/:id/password
// @access  Private/Own Profile
const changePassword = async (req, res) => {
  try {
    const userId = req.params.id
    const { current_password, new_password } = req.body

    // Users can only change their own password
    if (req.user.id !== Number.parseInt(userId)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const user = await User.findByPk(userId, {
      attributes: { include: ["password"] },
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(current_password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    // Update password
    await user.update({ password: new_password })

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    logger.error("Change password error:", error)
    res.status(500).json({ message: "Failed to change password" })
  }
}

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Soft delete by setting is_active to false
    await user.update({ is_active: false })

    res.json({
      success: true,
      message: "User deactivated successfully",
    })
  } catch (error) {
    logger.error("Delete user error:", error)
    res.status(500).json({ message: "Failed to delete user" })
  }
}

// @desc    Get user addresses
// @route   GET /api/users/:id/addresses
// @access  Private/Own Profile
const getUserAddresses = async (req, res) => {
  try {
    const userId = req.params.id

    // Users can only access their own addresses
    if (req.user.id !== Number.parseInt(userId)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const addresses = await UserAddress.findAll({
      where: { user_id: userId },
      order: [
        ["is_default", "DESC"],
        ["created_at", "DESC"],
      ],
    })

    res.json({
      success: true,
      data: { addresses },
    })
  } catch (error) {
    logger.error("Get user addresses error:", error)
    res.status(500).json({ message: "Failed to fetch addresses" })
  }
}

// @desc    Add user address
// @route   POST /api/users/:id/addresses
// @access  Private/Own Profile
const addUserAddress = async (req, res) => {
  try {
    const userId = req.params.id

    // Users can only add addresses to their own profile
    if (req.user.id !== Number.parseInt(userId)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const {
      type,
      first_name,
      last_name,
      company,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      is_default,
    } = req.body

    // If this is set as default, unset other default addresses of the same type
    if (is_default) {
      await UserAddress.update({ is_default: false }, { where: { user_id: userId, type } })
    }

    const address = await UserAddress.create({
      user_id: userId,
      type,
      first_name,
      last_name,
      company,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      is_default,
    })

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: { address },
    })
  } catch (error) {
    logger.error("Add user address error:", error)
    res.status(500).json({ message: "Failed to add address" })
  }
}

// @desc    Update user address
// @route   PUT /api/users/:id/addresses/:addressId
// @access  Private/Own Profile
const updateUserAddress = async (req, res) => {
  try {
    const userId = req.params.id
    const addressId = req.params.addressId

    // Users can only update their own addresses
    if (req.user.id !== Number.parseInt(userId)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const address = await UserAddress.findOne({
      where: { id: addressId, user_id: userId },
    })

    if (!address) {
      return res.status(404).json({ message: "Address not found" })
    }

    const {
      type,
      first_name,
      last_name,
      company,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      is_default,
    } = req.body

    // If this is set as default, unset other default addresses of the same type
    if (is_default && !address.is_default) {
      await UserAddress.update(
        { is_default: false },
        { where: { user_id: userId, type: type || address.type, id: { [require("sequelize").Op.ne]: addressId } } },
      )
    }

    await address.update({
      type: type || address.type,
      first_name: first_name || address.first_name,
      last_name: last_name || address.last_name,
      company: company !== undefined ? company : address.company,
      address_line_1: address_line_1 || address.address_line_1,
      address_line_2: address_line_2 !== undefined ? address_line_2 : address.address_line_2,
      city: city || address.city,
      state: state || address.state,
      postal_code: postal_code || address.postal_code,
      country: country || address.country,
      is_default: is_default !== undefined ? is_default : address.is_default,
    })

    res.json({
      success: true,
      message: "Address updated successfully",
      data: { address },
    })
  } catch (error) {
    logger.error("Update user address error:", error)
    res.status(500).json({ message: "Failed to update address" })
  }
}

// @desc    Delete user address
// @route   DELETE /api/users/:id/addresses/:addressId
// @access  Private/Own Profile
const deleteUserAddress = async (req, res) => {
  try {
    const userId = req.params.id
    const addressId = req.params.addressId

    // Users can only delete their own addresses
    if (req.user.id !== Number.parseInt(userId)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const address = await UserAddress.findOne({
      where: { id: addressId, user_id: userId },
    })

    if (!address) {
      return res.status(404).json({ message: "Address not found" })
    }

    await address.destroy()

    res.json({
      success: true,
      message: "Address deleted successfully",
    })
  } catch (error) {
    logger.error("Delete user address error:", error)
    res.status(500).json({ message: "Failed to delete address" })
  }
}

module.exports = {
  getUsers,
  getUser,
  updateUser,
  changePassword,
  deleteUser,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
}
