const { Order, OrderItem, OrderAddress, OrderTracking, Product, CartItem, User } = require("../models")
const logger = require("../utils/logger")
const { Op } = require("sequelize")

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `TH${timestamp.slice(-6)}${random}`
}

// Calculate tax (simple 8.5% tax rate - in real app, this would be based on location)
const calculateTax = (subtotal) => {
  const taxRate = 0.085
  return Number.parseFloat((subtotal * taxRate).toFixed(2))
}

// Calculate shipping (simple flat rate - in real app, this would be based on weight/location)
const calculateShipping = (subtotal, items) => {
  if (subtotal >= 100) return 0 // Free shipping over $100
  return 15.99 // Flat rate shipping
}

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const userId = req.user.id
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const status = req.query.status

    const whereClause = { user_id: userId }
    if (status) {
      whereClause.status = status
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: "items",
        },
        {
          model: OrderAddress,
          as: "addresses",
        },
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]],
    })

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    })
  } catch (error) {
    logger.error("Get orders error:", error)
    res.status(500).json({ message: "Failed to fetch orders" })
  }
}

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/admin
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status, payment_status, search } = req.query

    const whereClause = {}
    if (status) whereClause.status = status
    if (payment_status) whereClause.payment_status = payment_status

    if (search) {
      whereClause[Op.or] = [
        { order_number: { [Op.like]: `%${search}%` } },
        { "$user.email$": { [Op.like]: `%${search}%` } },
        { "$user.first_name$": { [Op.like]: `%${search}%` } },
        { "$user.last_name$": { [Op.like]: `%${search}%` } },
      ]
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "first_name", "last_name"],
        },
        {
          model: OrderItem,
          as: "items",
        },
        {
          model: OrderAddress,
          as: "addresses",
        },
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]],
      distinct: true,
    })

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    })
  } catch (error) {
    logger.error("Get all orders error:", error)
    res.status(500).json({ message: "Failed to fetch orders" })
  }
}

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const whereClause = { id }
    if (req.user.role !== "admin") {
      whereClause.user_id = userId
    }

    const order = await Order.findOne({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "slug"],
            },
          ],
        },
        {
          model: OrderAddress,
          as: "addresses",
        },
        {
          model: OrderTracking,
          as: "tracking",
          order: [["created_at", "DESC"]],
        },
        ...(req.user.role === "admin"
          ? [
              {
                model: User,
                as: "user",
                attributes: ["id", "email", "first_name", "last_name"],
              },
            ]
          : []),
      ],
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    res.json({
      success: true,
      data: { order },
    })
  } catch (error) {
    logger.error("Get order error:", error)
    res.status(500).json({ message: "Failed to fetch order" })
  }
}

// @desc    Create order from cart
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const transaction = await require("../models").sequelize.transaction()

  try {
    const userId = req.user.id
    const { shipping_address, billing_address, payment_method, notes } = req.body

    // Get user's cart items
    const cartItems = await CartItem.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          as: "product",
        },
      ],
    })

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" })
    }

    // Validate stock availability and calculate totals
    let subtotal = 0
    const orderItems = []

    for (const cartItem of cartItems) {
      const product = cartItem.product

      if (!product || product.status !== "active") {
        await transaction.rollback()
        return res.status(400).json({
          message: `Product ${product ? product.name : "unknown"} is not available`,
        })
      }

      if (product.stock_quantity < cartItem.quantity) {
        await transaction.rollback()
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`,
        })
      }

      const itemTotal = Number.parseFloat(product.price) * cartItem.quantity
      subtotal += itemTotal

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: cartItem.quantity,
        unit_price: product.price,
        total_price: itemTotal,
      })
    }

    // Calculate tax and shipping
    const taxAmount = calculateTax(subtotal)
    const shippingAmount = calculateShipping(subtotal, orderItems)
    const totalAmount = subtotal + taxAmount + shippingAmount

    // Create order with pending payment status
    const order = await Order.create(
      {
        order_number: generateOrderNumber(),
        user_id: userId,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        shipping_amount: shippingAmount.toFixed(2),
        total_amount: totalAmount.toFixed(2),
        payment_method,
        payment_status: "pending", // Payment authorized but not captured yet
        status: "pending", // Order pending admin confirmation
        stripe_payment_id: req.body.stripe_payment_id || null, // Store Stripe Payment Intent ID
        notes,
      },
      { transaction },
    )

    // Create order items
    const orderItemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }))
    await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction })

    // Create order addresses
    await OrderAddress.create(
      {
        order_id: order.id,
        type: "shipping",
        ...shipping_address,
      },
      { transaction },
    )

    await OrderAddress.create(
      {
        order_id: order.id,
        type: "billing",
        ...billing_address,
      },
      { transaction },
    )

    // Create initial tracking entry
    await OrderTracking.create(
      {
        order_id: order.id,
        status: "pending",
        message: "Order placed successfully. Payment authorized. Awaiting admin confirmation.",
      },
      { transaction },
    )

    // Update product stock quantities
    for (const cartItem of cartItems) {
      await Product.update(
        {
          stock_quantity: cartItem.product.stock_quantity - cartItem.quantity,
        },
        {
          where: { id: cartItem.product.id },
          transaction,
        },
      )
    }

    // Clear user's cart
    await CartItem.destroy({
      where: { user_id: userId },
      transaction,
    })

    await transaction.commit()

    // Fetch complete order with associations (after commit, so no rollback if this fails)
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
        },
        {
          model: OrderAddress,
          as: "addresses",
        },
        {
          model: OrderTracking,
          as: "tracking",
        },
      ],
    })

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order: completeOrder },
    })
  } catch (error) {
    // Only rollback if transaction hasn't been committed yet
    if (!transaction.finished) {
      await transaction.rollback()
    }
    logger.error("Create order error:", error)
    res.status(500).json({ message: "Failed to create order" })
  }
}

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, message, tracking_number, carrier } = req.body

    const order = await Order.findByPk(id)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Update order status
    const updateData = { status }
    if (status === "shipped") {
      updateData.shipped_at = new Date()
    } else if (status === "delivered") {
      updateData.delivered_at = new Date()
    }

    await order.update(updateData)

    // Create tracking entry
    await OrderTracking.create({
      order_id: order.id,
      status,
      message: message || `Order status updated to ${status}`,
      tracking_number,
      carrier,
    })

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: { order },
    })
  } catch (error) {
    logger.error("Update order status error:", error)
    res.status(500).json({ message: "Failed to update order status" })
  }
}

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  const transaction = await require("../models").sequelize.transaction()

  try {
    const { id } = req.params
    const userId = req.user.id

    const whereClause = { id }
    if (req.user.role !== "admin") {
      whereClause.user_id = userId
    }

    const order = await Order.findOne({
      where: whereClause,
      include: [{ model: OrderItem, as: "items" }],
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (order.status === "shipped" || order.status === "delivered") {
      return res.status(400).json({ message: "Cannot cancel shipped or delivered orders" })
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" })
    }

    // Update order status
    await order.update({ status: "cancelled" }, { transaction })

    // Restore product stock quantities
    for (const item of order.items) {
      await Product.increment("stock_quantity", {
        by: item.quantity,
        where: { id: item.product_id },
        transaction,
      })
    }

    // Create tracking entry
    await OrderTracking.create(
      {
        order_id: order.id,
        status: "cancelled",
        message: "Order cancelled by user",
      },
      { transaction },
    )

    await transaction.commit()

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: { order },
    })
  } catch (error) {
    await transaction.rollback()
    logger.error("Cancel order error:", error)
    res.status(500).json({ message: "Failed to cancel order" })
  }
}

// @desc    Confirm order and capture payment (Admin only)
// @route   POST /api/orders/:id/confirm
// @access  Private/Admin
const confirmOrderAndCapturePayment = async (req, res) => {
  const transaction = await require("../models").sequelize.transaction()

  try {
    const { id } = req.params
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

    // Get order with details
    const order = await Order.findByPk(id, { transaction })

    if (!order) {
      await transaction.rollback()
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if order is already confirmed
    if (order.payment_status === "paid") {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        message: "Payment already captured for this order",
      })
    }

    // Check if order is cancelled
    if (order.status === "cancelled") {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        message: "Cannot confirm a cancelled order",
      })
    }

    // Capture payment from Stripe if payment method is stripe
    if (order.payment_method === "stripe" && order.stripe_payment_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.capture(order.stripe_payment_id)
        logger.info(`Payment captured: ${paymentIntent.id} for order ${order.order_number}`)
      } catch (stripeError) {
        await transaction.rollback()
        logger.error("Stripe capture error:", stripeError)
        return res.status(500).json({
          success: false,
          message: "Failed to capture payment from Stripe",
          error: stripeError.message,
        })
      }
    }

    // Update order status
    await order.update(
      {
        status: "processing",
        payment_status: "paid",
      },
      { transaction },
    )

    // Create tracking entry
    await OrderTracking.create(
      {
        order_id: order.id,
        status: "processing",
        message: "Order confirmed by admin. Payment captured successfully.",
      },
      { transaction },
    )

    await transaction.commit()

    // Fetch updated order with all details
    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
        },
        {
          model: OrderAddress,
          as: "addresses",
        },
        {
          model: OrderTracking,
          as: "tracking",
        },
      ],
    })

    res.json({
      success: true,
      message: "Order confirmed and payment captured successfully",
      data: { order: updatedOrder },
    })
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback()
    }
    logger.error("Confirm order error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to confirm order",
      error: error.message,
    })
  }
}

// @desc    Reject order and cancel payment (Admin only)
// @route   POST /api/orders/:id/reject
// @access  Private/Admin
const rejectOrderAndCancelPayment = async (req, res) => {
  const transaction = await require("../models").sequelize.transaction()

  try {
    const { id } = req.params
    const { reason } = req.body
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

    // Get order with items
    const order = await Order.findOne({
      where: { id },
      include: [{ model: OrderItem, as: "items" }],
      transaction,
    })

    if (!order) {
      await transaction.rollback()
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if payment is already captured
    if (order.payment_status === "paid") {
      await transaction.rollback()
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order - payment already captured. Please process a refund instead.",
      })
    }

    // Cancel payment from Stripe if payment method is stripe
    if (order.payment_method === "stripe" && order.stripe_payment_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.cancel(order.stripe_payment_id)
        logger.info(`Payment cancelled: ${paymentIntent.id} for order ${order.order_number}`)
      } catch (stripeError) {
        logger.error("Stripe cancel error:", stripeError)
        // Continue with order cancellation even if Stripe fails
      }
    }

    // Update order status
    await order.update(
      {
        status: "cancelled",
        payment_status: "cancelled",
      },
      { transaction },
    )

    // Restore product stock quantities
    for (const item of order.items) {
      await Product.increment("stock_quantity", {
        by: item.quantity,
        where: { id: item.product_id },
        transaction,
      })
    }

    // Create tracking entry
    await OrderTracking.create(
      {
        order_id: order.id,
        status: "cancelled",
        message: `Order rejected by admin. Payment authorization released. Reason: ${reason || "Not specified"}`,
      },
      { transaction },
    )

    await transaction.commit()

    // Fetch updated order with all details
    const updatedOrder = await Order.findOne({
      where: { id },
      include: [
        {
          model: OrderItem,
          as: "items",
        },
        {
          model: OrderAddress,
          as: "addresses",
        },
        {
          model: OrderTracking,
          as: "tracking",
        },
      ],
    })

    res.json({
      success: true,
      message: "Order rejected and payment authorization released. Amount will be returned to customer.",
      data: { order: updatedOrder },
    })
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback()
    }
    logger.error("Reject order error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to reject order",
      error: error.message,
    })
  }
}

module.exports = {
  getOrders,
  getAllOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  confirmOrderAndCapturePayment, // NEW: Admin confirms and captures payment
  rejectOrderAndCancelPayment, // NEW: Admin rejects and cancels payment
}
