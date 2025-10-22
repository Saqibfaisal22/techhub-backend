const { Product, Category, Brand, ProductImage, ProductAttribute } = require("../models")
const logger = require("../utils/logger")
const { Op } = require("sequelize")

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 12
    const offset = (page - 1) * limit

    const {
      search,
      category,
      brand,
      min_price,
      max_price,
      status,
      featured,
      in_stock,
      sort_by = "created_at",
      sort_order = "DESC",
    } = req.query

    const whereClause = {}
    const includeOptions = [
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
      },
      {
        model: Brand,
        as: "brand",
        attributes: ["id", "name", "slug"],
      },
      {
        model: ProductImage,
        as: "images",
        order: [["sort_order", "ASC"]],
        required: false,
      },
    ]

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
      ]
    }

    // Category filter
    if (category) {
      const categoryInclude = includeOptions.find(
        (inc) => inc.model === Category
      )
      if (categoryInclude) {
        categoryInclude.where = { slug: category }
        categoryInclude.required = true
      }
    }

    // Brand filter
    if (brand) {
      whereClause.brand_id = brand
    }

    // Price range filter
    if (min_price || max_price) {
      whereClause.price = {}
      if (min_price) whereClause.price[Op.gte] = min_price
      if (max_price) whereClause.price[Op.lte] = max_price
    }

    // Status filter
    if (status) {
      whereClause.status = status
    } else {
      // Default to active products for public access
      whereClause.status = "active"
    }

    // Featured filter
    if (featured === "true") {
      whereClause.featured = true
    }

    // In stock filter
    if (in_stock === "true") {
      whereClause.stock_quantity = { [Op.gt]: 0 }
    }

    // Sorting
    const validSortFields = ["name", "price", "created_at", "stock_quantity"]
    const sortField = validSortFields.includes(sort_by) ? sort_by : "created_at"
    const sortDirection = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC"

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      limit,
      offset,
      order: [[sortField, sortDirection]],
      distinct: true,
    })

    // Format products with all images
    const formattedProducts = products.map((p) => {
      const allImages = [];
      
      // Add main image first
      if (p.image) {
        allImages.push({ image_url: p.image });
      }
      
      // Add gallery images from product_images table
      if (p.images && p.images.length > 0) {
        allImages.push(...p.images.map(img => ({ image_url: img.image_url })));
      }
      
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        short_description: p.short_description,
        sku: p.sku,
        slug: p.slug,
        price: p.price,
        compare_price: p.compare_price,
        stock_quantity: p.stock_quantity,
        featured: p.featured,
        status: p.status,
        category: p.category,
        brand: p.brand,
        images: allImages,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });

    res.json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    })
  } catch (error) {
    logger.error("Get products error:", error)
    res.status(500).json({ message: "Failed to fetch products" })
  }
}

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res) => {
  try {
    const { id } = req.params

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: "category",
        },
        {
          model: Brand,
          as: "brand",
        },
        {
          model: ProductImage,
          as: "images",
          order: [
            ["is_primary", "DESC"],
            ["sort_order", "ASC"],
          ],
        },
        {
          model: ProductAttribute,
          as: "attributes",
          order: [["sort_order", "ASC"]],
        },
      ],
    })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Format product with all images
    const allImages = [];
    
    // Add main image first
    if (product.image) {
      allImages.push({ image_url: product.image });
    }
    
    // Add gallery images from product_images table
    if (product.images && product.images.length > 0) {
      allImages.push(...product.images.map(img => ({ 
        image_url: img.image_url,
        alt_text: img.alt_text,
        sort_order: img.sort_order 
      })));
    }

    const formattedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      short_description: product.short_description,
      sku: product.sku,
      slug: product.slug,
      model: product.model,
      price: product.price,
      compare_price: product.compare_price,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level,
      weight: product.weight,
      dimensions: product.dimensions,
      featured: product.featured,
      status: product.status,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      category: product.category,
      brand: product.brand,
      images: allImages,
      attributes: product.attributes,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };

    res.json({
      success: true,
      data: { product: formattedProduct },
    })
  } catch (error) {
    logger.error("Get product error:", error)
    res.status(500).json({ message: "Failed to fetch product" })
  }
}

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params

    const product = await Product.findOne({
      where: { slug },
      include: [
        {
          model: Category,
          as: "category",
        },
        {
          model: Brand,
          as: "brand",
        },
        {
          model: ProductImage,
          as: "images",
          order: [
            ["is_primary", "DESC"],
            ["sort_order", "ASC"],
          ],
        },
        {
          model: ProductAttribute,
          as: "attributes",
          order: [["sort_order", "ASC"]],
        },
      ],
    })

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Format product with all images
    const allImages = [];
    
    // Add main image first
    if (product.image) {
      allImages.push({ image_url: product.image });
    }
    
    // Add gallery images from product_images table
    if (product.images && product.images.length > 0) {
      allImages.push(...product.images.map(img => ({ 
        image_url: img.image_url,
        alt_text: img.alt_text,
        sort_order: img.sort_order 
      })));
    }

    const formattedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      short_description: product.short_description,
      sku: product.sku,
      slug: product.slug,
      model: product.model,
      price: product.price,
      compare_price: product.compare_price,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level,
      weight: product.weight,
      dimensions: product.dimensions,
      featured: product.featured,
      status: product.status,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      category: product.category,
      brand: product.brand,
      images: allImages,
      attributes: product.attributes,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };

    res.json({
      success: true,
      data: { product: formattedProduct },
    })
  } catch (error) {
    logger.error("Get product by slug error:", error)
    res.status(500).json({ message: "Failed to fetch product" })
  }
}

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      short_description,
      sku,
      model,
      brand_id,
      category_id,
      price,
      compare_price,
      cost_price,
      stock_quantity,
      min_stock_level,
      weight,
      dimensions,
      status,
      featured,
      meta_title,
      meta_description,
      images,
      attributes,
    } = req.body

    // Check if slug and SKU already exist
    const existingProduct = await Product.findOne({
      where: {
        [Op.or]: [{ slug }, { sku }],
      },
    })

    if (existingProduct) {
      return res.status(400).json({ message: "Product slug or SKU already exists" })
    }

    const product = await Product.create({
      name,
      slug,
      description,
      short_description,
      sku,
      model,
      brand_id,
      category_id,
      price,
      compare_price,
      cost_price,
      stock_quantity,
      min_stock_level,
      weight,
      dimensions,
      status,
      featured,
      meta_title,
      meta_description,
    })

    // Add images if provided
    if (images && images.length > 0) {
      const imageData = images.map((img, index) => ({
        product_id: product.id,
        image_url: img.url,
        alt_text: img.alt_text,
        sort_order: img.sort_order || index,
        is_primary: img.is_primary || index === 0,
      }))
      await ProductImage.bulkCreate(imageData)
    }

    // Add attributes if provided
    if (attributes && attributes.length > 0) {
      const attributeData = attributes.map((attr, index) => ({
        product_id: product.id,
        attribute_name: attr.name,
        attribute_value: attr.value,
        sort_order: attr.sort_order || index,
      }))
      await ProductAttribute.bulkCreate(attributeData)
    }

    // Fetch the complete product with associations
    const completeProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: "category" },
        { model: Brand, as: "brand" },
        { model: ProductImage, as: "images" },
        { model: ProductAttribute, as: "attributes" },
      ],
    })

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product: completeProduct },
    })
  } catch (error) {
    logger.error("Create product error:", error)
    res.status(500).json({ message: "Failed to create product" })
  }
}

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const product = await Product.findByPk(id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check if slug or SKU already exists (excluding current product)
    if (updateData.slug || updateData.sku) {
      const whereClause = {
        id: { [Op.ne]: id },
        [Op.or]: [],
      }

      if (updateData.slug && updateData.slug !== product.slug) {
        whereClause[Op.or].push({ slug: updateData.slug })
      }
      if (updateData.sku && updateData.sku !== product.sku) {
        whereClause[Op.or].push({ sku: updateData.sku })
      }

      if (whereClause[Op.or].length > 0) {
        const existingProduct = await Product.findOne({ where: whereClause })
        if (existingProduct) {
          return res.status(400).json({ message: "Product slug or SKU already exists" })
        }
      }
    }

    await product.update(updateData)

    // Fetch the updated product with associations
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: "category" },
        { model: Brand, as: "brand" },
        { model: ProductImage, as: "images" },
        { model: ProductAttribute, as: "attributes" },
      ],
    })

    res.json({
      success: true,
      message: "Product updated successfully",
      data: { product: updatedProduct },
    })
  } catch (error) {
    logger.error("Update product error:", error)
    res.status(500).json({ message: "Failed to update product" })
  }
}

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    const product = await Product.findByPk(id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    await product.destroy()

    res.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    logger.error("Delete product error:", error)
    res.status(500).json({ message: "Failed to delete product" })
  }
}

module.exports = {
  getProducts,
  getProduct,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
}
