
const asyncHandler = require("express-async-handler");
const { User, Order, UserAddress } = require("../../models");
const { Op } = require("sequelize");

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";

  const offset = (page - 1) * limit;

  const whereClause = {};
  if (search) {
    whereClause[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    attributes: {
      exclude: ["password"],
    },
  });

  res.json({
    users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalUsers: count,
      limit,
    },
  });
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [
      {
        model: UserAddress,
        as: "addresses",
      },
      {
        model: Order,
        as: "orders",
        attributes: ["id", "created_at", "total", "status"],
        limit: 5,
        order: [["created_at", "DESC"]],
      },
    ],
    attributes: {
      exclude: ["password"],
    },
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const totalSpent = await Order.sum("total", { where: { userId: user.id } });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    joinedDate: user.created_at,
    address: user.addresses.find((a) => a.isDefault) || user.addresses[0] || null,
    stats: {
      totalOrders: user.orders.length,
      totalSpent: totalSpent || 0,
      averageOrderValue: user.orders.length > 0 ? totalSpent / user.orders.length : 0,
    },
    recentOrders: user.orders,
  });
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, email, phone, role, status } = req.body;

  user.name = name || user.name;
  user.email = email || user.email;
  user.phone = phone || user.phone;
  user.role = role || user.role;
  user.status = status || user.status;

  const updatedUser = await user.save();

  res.json({
    success: true,
    message: "User updated successfully",
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      status: updatedUser.status,
    },
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await user.destroy();

  res.json({ success: true, message: "User deleted successfully" });
});

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
