const { WishlistItem, Product, ProductImage, Brand, Category } = require("../models")
const logger = require("../utils/logger")

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id

    const wishlistItems = await WishlistItem.findAll({
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

    // Filter out items with inactive or deleted products
    const validItems = []
    for (const item of wishlistItems) {
      if (item.product && item.product.status === "active") {
        validItems.push({
          ...item.toJSON(),
          in_stock: item.product.stock_quantity > 0,
          stock_quantity: item.product.stock_quantity,
        })
      } else {
        // Remove items for inactive or deleted products
        await item.destroy()
      }
    }

    res.json({
      success: true,
      data: {
        items: validItems,
        total_items: validItems.length,
      },
    })
  } catch (error) {
    logger.error("Get wishlist error:", error)
    res.status(500).json({ message: "Failed to fetch wishlist" })
  }
}

// @desc    Add item to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id
    const { product_id } = req.body

    // Validate product exists and is active
    const product = await Product.findByPk(product_id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (product.status !== "active") {
      return res.status(400).json({ message: "Product is not available" })
    }

    // Check if item already exists in wishlist
    const existingItem = await WishlistItem.findOne({
      where: { user_id: userId, product_id },
    })

    if (existingItem) {
      return res.status(400).json({ message: "Item already in wishlist" })
    }

    const wishlistItem = await WishlistItem.create({
      user_id: userId,
      product_id,
    })

    // Fetch the wishlist item with product details
    const wishlistItemWithProduct = await WishlistItem.findByPk(wishlistItem.id, {
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
      message: "Item added to wishlist successfully",
      data: { wishlistItem: wishlistItemWithProduct },
    })
  } catch (error) {
    logger.error("Add to wishlist error:", error)
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Item already in wishlist" })
    }
    res.status(500).json({ message: "Failed to add item to wishlist" })
  }
}

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/:id
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const wishlistItem = await WishlistItem.findOne({
      where: { id, user_id: userId },
    })

    if (!wishlistItem) {
      return res.status(404).json({ message: "Wishlist item not found" })
    }

    await wishlistItem.destroy()

    res.json({
      success: true,
      message: "Item removed from wishlist successfully",
    })
  } catch (error) {
    logger.error("Remove from wishlist error:", error)
    res.status(500).json({ message: "Failed to remove item from wishlist" })
  }
}

// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist
// @access  Private
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id

    await WishlistItem.destroy({
      where: { user_id: userId },
    })

    res.json({
      success: true,
      message: "Wishlist cleared successfully",
    })
  } catch (error) {
    logger.error("Clear wishlist error:", error)
    res.status(500).json({ message: "Failed to clear wishlist" })
  }
}

// @desc    Move item from wishlist to cart
// @route   POST /api/wishlist/:id/move-to-cart
// @access  Private
const moveToCart = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { quantity = 1 } = req.body

    const wishlistItem = await WishlistItem.findOne({
      where: { id, user_id: userId },
      include: [{ model: Product, as: "product" }],
    })

    if (!wishlistItem) {
      return res.status(404).json({ message: "Wishlist item not found" })
    }

    // Check product availability
    if (wishlistItem.product.stock_quantity < quantity) {
      return res.status(400).json({
        message: "Insufficient stock",
        available_stock: wishlistItem.product.stock_quantity,
      })
    }

    const { CartItem } = require("../models")

    // Check if item already exists in cart
    const existingCartItem = await CartItem.findOne({
      where: { user_id: userId, product_id: wishlistItem.product_id },
    })

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity

      if (newQuantity > wishlistItem.product.stock_quantity) {
        return res.status(400).json({
          message: "Cannot add more items than available stock",
          available_stock: wishlistItem.product.stock_quantity,
          current_cart_quantity: existingCartItem.quantity,
        })
      }

      if (newQuantity > 10) {
        return res.status(400).json({
          message: "Maximum 10 items per product allowed in cart",
        })
      }

      await existingCartItem.update({ quantity: newQuantity })
    } else {
      await CartItem.create({
        user_id: userId,
        product_id: wishlistItem.product_id,
        quantity,
      })
    }

    // Remove from wishlist
    await wishlistItem.destroy()

    res.json({
      success: true,
      message: "Item moved to cart successfully",
    })
  } catch (error) {
    logger.error("Move to cart error:", error)
    res.status(500).json({ message: "Failed to move item to cart" })
  }
}

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
const checkWishlistStatus = async (req, res) => {
  try {
    const userId = req.user.id
    const { productId } = req.params

    const wishlistItem = await WishlistItem.findOne({
      where: { user_id: userId, product_id: productId },
    })

    res.json({
      success: true,
      data: {
        in_wishlist: !!wishlistItem,
        wishlist_item_id: wishlistItem ? wishlistItem.id : null,
      },
    })
  } catch (error) {
    logger.error("Check wishlist status error:", error)
    res.status(500).json({ message: "Failed to check wishlist status" })
  }
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart,
  checkWishlistStatus,
}
