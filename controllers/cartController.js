const { CartItem, Product, ProductImage, Brand, Category } = require("../models")
const logger = require("../utils/logger")
const { Op } = require("sequelize")

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const userId = req.user.id

    const cartItems = await CartItem.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          as: "product",
          include: [
            {
              model: ProductImage,
              as: "images",
              where: { is_primary: true },
              required: false,
              limit: 1,
            },
            {
              model: Brand,
              as: "brand",
              attributes: ["id", "name", "slug"],
            },
            {
              model: Category,
              as: "category",
              attributes: ["id", "name", "slug"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    })

    // Calculate cart totals
    let subtotal = 0
    let totalItems = 0
    const validItems = []

    for (const item of cartItems) {
      if (item.product && item.product.status === "active" && item.product.stock_quantity > 0) {
        const itemTotal = Number.parseFloat(item.product.price) * item.quantity
        subtotal += itemTotal
        totalItems += item.quantity
        validItems.push({
          ...item.toJSON(),
          item_total: itemTotal.toFixed(2),
          available_stock: item.product.stock_quantity,
          max_quantity: Math.min(item.product.stock_quantity, 10), // Limit to 10 per item
        })
      } else {
        // Remove items for inactive or out-of-stock products
        await item.destroy()
      }
    }

    const cartSummary = {
      subtotal: subtotal.toFixed(2),
      total_items: totalItems,
      items_count: validItems.length,
    }

    res.json({
      success: true,
      data: {
        items: validItems,
        summary: cartSummary,
      },
    })
  } catch (error) {
    logger.error("Get cart error:", error)
    res.status(500).json({ message: "Failed to fetch cart" })
  }
}

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id
    const { product_id, quantity = 1 } = req.body

    // Validate product exists and is active
    const product = await Product.findByPk(product_id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (product.status !== "active") {
      return res.status(400).json({ message: "Product is not available" })
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        message: "Insufficient stock",
        available_stock: product.stock_quantity,
      })
    }

    // Check if item already exists in cart
    const existingItem = await CartItem.findOne({
      where: { user_id: userId, product_id },
    })

    let cartItem

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity

      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({
          message: "Cannot add more items than available stock",
          available_stock: product.stock_quantity,
          current_quantity: existingItem.quantity,
        })
      }

      if (newQuantity > 10) {
        return res.status(400).json({
          message: "Maximum 10 items per product allowed",
        })
      }

      await existingItem.update({ quantity: newQuantity })
      cartItem = existingItem
    } else {
      if (quantity > 10) {
        return res.status(400).json({
          message: "Maximum 10 items per product allowed",
        })
      }

      cartItem = await CartItem.create({
        user_id: userId,
        product_id,
        quantity,
      })
    }

    // Fetch the cart item with product details
    const cartItemWithProduct = await CartItem.findByPk(cartItem.id, {
      include: [
        {
          model: Product,
          as: "product",
          include: [
            {
              model: ProductImage,
              as: "images",
              where: { is_primary: true },
              required: false,
              limit: 1,
            },
          ],
        },
      ],
    })

    res.status(201).json({
      success: true,
      message: "Item added to cart successfully",
      data: { cartItem: cartItemWithProduct },
    })
  } catch (error) {
    logger.error("Add to cart error:", error)
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Item already in cart" })
    }
    res.status(500).json({ message: "Failed to add item to cart" })
  }
}

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { quantity } = req.body

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" })
    }

    if (quantity > 10) {
      return res.status(400).json({ message: "Maximum 10 items per product allowed" })
    }

    const cartItem = await CartItem.findOne({
      where: { id, user_id: userId },
      include: [{ model: Product, as: "product" }],
    })

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" })
    }

    if (quantity > cartItem.product.stock_quantity) {
      return res.status(400).json({
        message: "Insufficient stock",
        available_stock: cartItem.product.stock_quantity,
      })
    }

    await cartItem.update({ quantity })

    // Fetch updated cart item with product details
    const updatedCartItem = await CartItem.findByPk(id, {
      include: [
        {
          model: Product,
          as: "product",
          include: [
            {
              model: ProductImage,
              as: "images",
              where: { is_primary: true },
              required: false,
              limit: 1,
            },
          ],
        },
      ],
    })

    res.json({
      success: true,
      message: "Cart item updated successfully",
      data: { cartItem: updatedCartItem },
    })
  } catch (error) {
    logger.error("Update cart item error:", error)
    res.status(500).json({ message: "Failed to update cart item" })
  }
}

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const cartItem = await CartItem.findOne({
      where: { id, user_id: userId },
    })

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" })
    }

    await cartItem.destroy()

    res.json({
      success: true,
      message: "Item removed from cart successfully",
    })
  } catch (error) {
    logger.error("Remove from cart error:", error)
    res.status(500).json({ message: "Failed to remove item from cart" })
  }
}

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id

    await CartItem.destroy({
      where: { user_id: userId },
    })

    res.json({
      success: true,
      message: "Cart cleared successfully",
    })
  } catch (error) {
    logger.error("Clear cart error:", error)
    res.status(500).json({ message: "Failed to clear cart" })
  }
}

// @desc    Move item from cart to wishlist
// @route   POST /api/cart/:id/move-to-wishlist
// @access  Private
const moveToWishlist = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const cartItem = await CartItem.findOne({
      where: { id, user_id: userId },
    })

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" })
    }

    const { WishlistItem } = require("../models")

    // Check if item already exists in wishlist
    const existingWishlistItem = await WishlistItem.findOne({
      where: { user_id: userId, product_id: cartItem.product_id },
    })

    if (!existingWishlistItem) {
      await WishlistItem.create({
        user_id: userId,
        product_id: cartItem.product_id,
      })
    }

    // Remove from cart
    await cartItem.destroy()

    res.json({
      success: true,
      message: "Item moved to wishlist successfully",
    })
  } catch (error) {
    logger.error("Move to wishlist error:", error)
    res.status(500).json({ message: "Failed to move item to wishlist" })
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  moveToWishlist,
}
