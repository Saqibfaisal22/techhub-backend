
const asyncHandler = require("express-async-handler");
const { sequelize, Order, User, Product } = require("../../models");
const { Op } = require("sequelize");

// @desc    Get overview statistics for dashboard
// @route   GET /api/admin/analytics/stats
// @access  Private/Admin
const getStats = asyncHandler(async (req, res) => {
  // Get total revenue (sum of all paid orders)
  const revenueResult = await Order.findOne({
    attributes: [
      [sequelize.fn("SUM", sequelize.col("total_amount")), "totalRevenue"],
    ],
    where: {
      payment_status: "paid",
    },
    raw: true,
  });

  // Get total orders count
  const totalOrders = await Order.count();

  // Get total users count
  const totalUsers = await User.count({
    where: {
      role: "customer",
    },
  });

  // Get total products count
  const totalProducts = await Product.count();

  // Get this month's stats for comparison
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyRevenue = await Order.findOne({
    attributes: [
      [sequelize.fn("SUM", sequelize.col("total_amount")), "monthRevenue"],
    ],
    where: {
      payment_status: "paid",
      created_at: {
        [Op.gte]: startOfMonth,
      },
    },
    raw: true,
  });

  const monthlyOrders = await Order.count({
    where: {
      created_at: {
        [Op.gte]: startOfMonth,
      },
    },
  });

  const monthlyUsers = await User.count({
    where: {
      role: "customer",
      created_at: {
        [Op.gte]: startOfMonth,
      },
    },
  });

  // Calculate pending orders
  const pendingOrders = await Order.count({
    where: {
      status: "pending",
    },
  });

  // Get last month's stats for growth calculation
  const startOfLastMonth = new Date();
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  startOfLastMonth.setDate(1);
  startOfLastMonth.setHours(0, 0, 0, 0);
  
  const endOfLastMonth = new Date(startOfMonth);
  endOfLastMonth.setDate(endOfLastMonth.getDate() - 1);
  endOfLastMonth.setHours(23, 59, 59, 999);

  const lastMonthRevenue = await Order.findOne({
    attributes: [
      [sequelize.fn("SUM", sequelize.col("total_amount")), "revenue"],
    ],
    where: {
      payment_status: "paid",
      created_at: {
        [Op.between]: [startOfLastMonth, endOfLastMonth],
      },
    },
    raw: true,
  });

  const lastMonthOrders = await Order.count({
    where: {
      created_at: {
        [Op.between]: [startOfLastMonth, endOfLastMonth],
      },
    },
  });

  const lastMonthUsers = await User.count({
    where: {
      role: "customer",
      created_at: {
        [Op.between]: [startOfLastMonth, endOfLastMonth],
      },
    },
  });

  // Calculate growth percentages
  const revenueGrowth = lastMonthRevenue.revenue > 0
    ? (((parseFloat(monthlyRevenue.monthRevenue || 0) - parseFloat(lastMonthRevenue.revenue || 0)) / parseFloat(lastMonthRevenue.revenue || 0)) * 100).toFixed(1)
    : 0;

  const ordersGrowth = lastMonthOrders > 0
    ? (((monthlyOrders - lastMonthOrders) / lastMonthOrders) * 100).toFixed(1)
    : 0;

  const usersGrowth = lastMonthUsers > 0
    ? (((monthlyUsers - lastMonthUsers) / lastMonthUsers) * 100).toFixed(1)
    : 0;

  res.json({
    totalRevenue: parseFloat(revenueResult.totalRevenue || 0),
    totalOrders,
    totalUsers,
    totalProducts,
    monthlyRevenue: parseFloat(monthlyRevenue.monthRevenue || 0),
    monthlyOrders,
    monthlyUsers,
    pendingOrders,
    growth: {
      revenue: parseFloat(revenueGrowth),
      orders: parseFloat(ordersGrowth),
      users: parseFloat(usersGrowth),
      products: 0, // Products don't have monthly growth
    },
  });
});

// @desc    Get sales data for chart
// @route   GET /api/admin/analytics/sales
// @access  Private/Admin
const getSales = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  
  // Get sales data for the last N days
  const salesData = await Order.findAll({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
      [sequelize.fn("SUM", sequelize.col("total_amount")), "sales"],
      [sequelize.fn("COUNT", sequelize.col("id")), "orderCount"],
    ],
    where: {
      payment_status: "paid",
      created_at: {
        [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
    group: [sequelize.fn("DATE", sequelize.col("created_at"))],
    order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
    raw: true,
  });

  const formattedData = salesData.map((item) => ({
    date: item.date,
    sales: parseFloat(item.sales || 0),
    orderCount: parseInt(item.orderCount || 0),
  }));

  res.json({
    data: formattedData,
  });
});

// @desc    Get user growth data for chart
// @route   GET /api/admin/analytics/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  
  // Get user registration data for the last N days
  const userData = await User.findAll({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
      [sequelize.fn("COUNT", sequelize.col("id")), "newUsers"],
    ],
    where: {
      role: "customer",
      created_at: {
        [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
    group: [sequelize.fn("DATE", sequelize.col("created_at"))],
    order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
    raw: true,
  });

  // Calculate cumulative users
  let cumulative = await User.count({
    where: {
      role: "customer",
      created_at: {
        [Op.lt]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
  });

  const formattedData = userData.map((item) => {
    cumulative += parseInt(item.newUsers || 0);
    return {
      date: item.date,
      users: cumulative,
      newUsers: parseInt(item.newUsers || 0),
    };
  });

  res.json({
    data: formattedData,
  });
});

// @desc    Get orders data for chart
// @route   GET /api/admin/analytics/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  
  // Get orders data for the last N days
  const ordersData = await Order.findAll({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
      [sequelize.fn("COUNT", sequelize.col("id")), "orders"],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal("CASE WHEN status = 'completed' OR status = 'delivered' THEN 1 ELSE 0 END")
        ),
        "completed",
      ],
      [
        sequelize.fn(
          "SUM",
          sequelize.literal("CASE WHEN status = 'pending' THEN 1 ELSE 0 END")
        ),
        "pending",
      ],
    ],
    where: {
      created_at: {
        [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
    group: [sequelize.fn("DATE", sequelize.col("created_at"))],
    order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
    raw: true,
  });

  const formattedData = ordersData.map((item) => ({
    date: item.date,
    orders: parseInt(item.orders || 0),
    completed: parseInt(item.completed || 0),
    pending: parseInt(item.pending || 0),
  }));

  res.json({
    data: formattedData,
  });
});

// @desc    Get recent orders for dashboard
// @route   GET /api/admin/analytics/recent-orders
// @access  Private/Admin
const getRecentOrders = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const orders = await Order.findAll({
    limit,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
  });

  const formattedOrders = orders.map((order) => ({
    id: order.order_number,
    orderId: order.id,
    customer: order.user
      ? `${order.user.first_name} ${order.user.last_name}`.trim()
      : "Guest",
    email: order.user?.email || "N/A",
    amount: parseFloat(order.total_amount),
    status: order.status,
    paymentStatus: order.payment_status,
    date: order.created_at,
  }));

  res.json({
    orders: formattedOrders,
  });
});

module.exports = {
  getStats,
  getSales,
  getUsers,
  getOrders,
  getRecentOrders,
};
