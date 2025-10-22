
const asyncHandler = require("express-async-handler");
const {
  sequelize,
  Order,
  OrderItem,
  OrderAddress,
  OrderTracking,
  User,
  Product,
} = require("../../models");
const { Op } = require("sequelize");

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status || "";
  const paymentStatus = req.query.payment_status || "";
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const userId = req.query.userId;

  const offset = (page - 1) * limit;

  const whereClause = {};
  if (status) {
    whereClause.status = status;
  }
  if (paymentStatus) {
    whereClause.payment_status = paymentStatus;
  }
  if (startDate && endDate) {
    whereClause.created_at = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }
  if (userId) {
    whereClause.userId = userId;
  }

  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email"],
      },
      {
        model: OrderItem,
        as: "items",
        attributes: ["id"],
      },
    ],
  });

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    customer: o.user ? `${o.user.first_name} ${o.user.last_name}`.trim() : "N/A",
    email: o.user ? o.user.email : "N/A",
    total: parseFloat(o.total_amount),
    status: o.status,
    date: o.created_at,
    items: o.items.length,
  }));

  res.json({
    orders: formattedOrders,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalOrders: count,
      limit,
    },
  });
});

// @desc    Get single order
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "email", "phone"],
      },
      {
        model: OrderAddress,
        as: "addresses",
      },
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "sku"],
            include: [
              {
                model: require("../../models").ProductImage,
                as: "images",
                where: { is_primary: true },
                required: false,
                limit: 1,
              },
            ],
          },
        ],
      },
      { model: OrderTracking, as: "tracking" },
    ],
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  console.log("Order payment_status from DB:", order.payment_status);
  console.log("Order stripe_payment_id from DB:", order.stripe_payment_id);

  // Find shipping address
  const shippingAddressRaw = order.addresses?.find((addr) => addr.type === "shipping") || {};
  const shippingAddress = {
    street: shippingAddressRaw.address_line_1 || "",
    city: shippingAddressRaw.city || "",
    state: shippingAddressRaw.state || "",
    zip: shippingAddressRaw.postal_code || "",
    country: shippingAddressRaw.country || "",
  };

  // Customer info
  const customer = order.user
    ? {
        id: order.user.id,
        name: `${order.user.first_name} ${order.user.last_name}`.trim(),
        email: order.user.email,
        phone: order.user.phone,
      }
    : null;

  // Items
  const items = order.items.map((i) => ({
    id: i.id,
    productId: i.product_id,
    name: i.product_name,
    sku: i.product_sku,
    quantity: i.quantity,
    price: parseFloat(i.unit_price),
    total: parseFloat(i.total_price),
    image:
      i.product && i.product.images && i.product.images.length > 0
        ? i.product.images[0].image_url
        : null,
  }));

  res.json({
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    date: order.created_at,
    customer,
    shippingAddress,
    items,
    summary: {
      subtotal: parseFloat(order.subtotal),
      shipping: parseFloat(order.shipping_amount),
      tax: parseFloat(order.tax_amount),
      total: parseFloat(order.total_amount),
    },
    payment: {
      method: order.payment_method,
      status: order.payment_status,
      transactionId: order.payment_reference,
    },
    stripe_payment_id: order.stripe_payment_id, // For Stripe payment actions
    payment_status: order.payment_status, // pending, paid, cancelled, failed
    timeline: order.tracking,
  });
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const { status, note } = req.body;

  order.status = status;
  await order.save();

  await OrderTracking.create({
    order_id: order.id,
    status,
    message: note,
  });

  res.json({
    success: true,
    message: "Order status updated successfully",
    order: {
      id: order.id,
      status: order.status,
    },
  });
});

// @desc    Create order (Admin)
// @route   POST /api/admin/orders
// @access  Private/Admin
const createOrder = asyncHandler(async (req, res) => {
  const {
    userId,
    customerInfo,
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    shippingAmount,
    taxAmount,
    notes,
  } = req.body;

  // Validate required fields
  if (items && items.length === 0) {
    res.status(400);
    throw new Error("Order items are required");
  }

  if (!shippingAddress || !shippingAddress.address_line_1 || !shippingAddress.city) {
    res.status(400);
    throw new Error("Shipping address is required");
  }

  // Start transaction
  const t = await sequelize.transaction();

  try {
    let user;
    
    // Check if userId is provided (existing user) or customerInfo (new customer)
    if (userId) {
      // Verify user exists
      user = await User.findByPk(userId);
      if (!user) {
        if (!t.finished) await t.rollback();
        res.status(404);
        throw new Error("User not found");
      }
    } else if (customerInfo) {
      // Create new guest user/customer
      // Check if email already exists
      const existingUser = await User.findOne({ 
        where: { email: customerInfo.email } 
      });
      
      if (existingUser) {
        user = existingUser;
      } else {
        // Create new user with random password (can be reset later)
        const bcrypt = require("bcryptjs");
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        user = await User.create(
          {
            first_name: customerInfo.first_name,
            last_name: customerInfo.last_name,
            email: customerInfo.email,
            phone: customerInfo.phone || null,
            role: "customer",
            password: hashedPassword,
          },
          { transaction: t }
        );
      }
    } else {
      if (!t.finished) await t.rollback();
      res.status(400);
      throw new Error("Either userId or customerInfo is required");
    }

    // Validate and calculate order totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      
      if (!product) {
        if (!t.finished) await t.rollback();
        res.status(404);
        throw new Error(`Product with ID ${item.product_id} not found`);
      }

      if (product.stock_quantity < item.quantity) {
        if (!t.finished) await t.rollback();
        res.status(400);
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      const itemTotal = item.quantity * item.unit_price;
      subtotal += itemTotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: itemTotal,
      });

      // Update product stock
      product.stock_quantity -= item.quantity;
      await product.save({ transaction: t });
    }

    const shipping = parseFloat(shippingAmount) || 0;
    const tax = parseFloat(taxAmount) || 0;
    const total = subtotal + shipping + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create order
    const order = await Order.create(
      {
        order_number: orderNumber,
        user_id: user.id,
        status: "pending",
        payment_status: "pending",
        payment_method: paymentMethod || "cash",
        payment_reference: null,
        stripe_payment_id: null,
        subtotal,
        tax_amount: tax,
        shipping_amount: shipping,
        discount_amount: 0,
        total_amount: total,
        currency: "USD",
        notes: notes || null,
      },
      { transaction: t }
    );

    // Create order items
    for (const item of validatedItems) {
      await OrderItem.create(
        {
          order_id: order.id,
          ...item,
        },
        { transaction: t }
      );
    }

    // Create shipping address
    await OrderAddress.create(
      {
        order_id: order.id,
        type: "shipping",
        first_name: customerInfo.first_name,
        last_name: customerInfo.last_name,
        street_address: shippingAddress.address_line_1,
        address_line_2: shippingAddress.address_line_2 || null,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip_code: shippingAddress.postal_code,
        country: shippingAddress.country || "USA",
        phone: shippingAddress.phone || customerInfo.phone || null,
      },
      { transaction: t }
    );

    // Create billing address (use shipping if not provided)
    const billAddr = billingAddress || shippingAddress;
    await OrderAddress.create(
      {
        order_id: order.id,
        type: "billing",
        first_name: customerInfo.first_name,
        last_name: customerInfo.last_name,
        street_address: billAddr.address_line_1,
        address_line_2: billAddr.address_line_2 || null,
        city: billAddr.city,
        state: billAddr.state,
        zip_code: billAddr.postal_code,
        country: billAddr.country || "USA",
        phone: billAddr.phone || customerInfo.phone || null,
      },
      { transaction: t }
    );

    // Create initial order tracking
    await OrderTracking.create(
      {
        order_id: order.id,
        status: "pending",
        message: "Order created by admin",
      },
      { transaction: t }
    );

    // Commit transaction
    await t.commit();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        total: parseFloat(order.total_amount),
      },
    });
  } catch (error) {
    // Rollback transaction on error (only if not already finished)
    if (!t.finished) {
      await t.rollback();
    }
    throw error;
  }
});

module.exports = {
  getOrders,
  getOrder,
  updateOrderStatus,
  createOrder,
};
