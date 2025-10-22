
const asyncHandler = require("express-async-handler");
const {
  Product,
  Category,
  ProductImage,
  ProductAttribute,
} = require("../../models");
const { Op } = require("sequelize");

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Private/Admin
const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const category = req.query.category || "";
  const status = req.query.status || "";

  const offset = (page - 1) * limit;

  const whereClause = {};
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } },
    ];
  }
  if (category) {
    whereClause.categoryId = category;
  }
  if (status) {
    whereClause.status = status;
  }

  const { count, rows: products } = await Product.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: Category,
        as: "category",
        attributes: ["name"],
      },
      {
        model: ProductImage,
        as: "images",
        order: [["sort_order", "ASC"]],
        required: false,
      },
    ],
  });

  const formattedProducts = products.map((p) => {
    // Get all images: main image + gallery images
    const allImages = [];
    
    // Add main image first
    if (p.image) {
      allImages.push(p.image);
    }
    
    // Add gallery images from product_images table
    if (p.images && p.images.length > 0) {
      const galleryUrls = p.images.map(img => img.image_url);
      allImages.push(...galleryUrls);
    }
    
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category ? p.category.name : null,
      price: p.price,
      stock: p.stock_quantity,
      status: p.status,
      image: allImages[0] || null, // First image for listing
      images: allImages, // All images array
    };
  });

  res.json({
    products: formattedProducts,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalProducts: count,
      limit,
    },
  });
});

// @desc    Get single product
// @route   GET /api/admin/products/:id
// @access  Private/Admin
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    include: [
      { model: Category, as: "category", attributes: ["name"] },
      { model: ProductImage, as: "images" },
      { model: ProductAttribute, as: "attributes" },
    ],
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    short_description: product.short_description,
    model: product.model,
    brand_id: product.brand_id,
    category_id: product.category_id,
    category: product.category ? product.category.name : null,
    price: product.price,
    compare_price: product.compare_price,
    cost_price: product.cost_price,
    stock_quantity: product.stock_quantity,
    min_stock_level: product.min_stock_level,
    weight: product.weight,
    dimensions: product.dimensions,
    status: product.status,
    featured: product.featured,
    meta_title: product.meta_title,
    meta_description: product.meta_description,
    images: product.images.map((i) => i.image_url),
    attributes: product.attributes?.reduce((acc, attr) => {
      acc[attr.attribute_name] = attr.attribute_value;
      return acc;
    }, {}),
    created_at: product.created_at,
    updated_at: product.updated_at,
  });
});

// @desc    Create new product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    sku,
    description,
    short_description,
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
  } = req.body;

  // Check for duplicate slug or SKU
  const existingProduct = await Product.findOne({
    where: {
      [Op.or]: [
        { slug },
        { sku },
      ],
    },
  });
  if (existingProduct) {
    return res.status(400).json({
      success: false,
      message: "Product slug or SKU already exists. Please use a unique value.",
    });
  }

  // Handle main image from media library or file upload
  let mainImage = null;
  if (req.body.image) {
    // Image selected from media library
    mainImage = req.body.image;
  } else if (req.files && req.files.length > 0) {
    // Direct file upload (fallback)
    mainImage = `/uploads/${req.files[0].filename}`;
  }

  const product = await Product.create({
    name,
    slug,
    sku,
    description,
    short_description,
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
    image: mainImage, // Main product image
  });

  // Handle gallery images from media library
  let galleryImages = [];
  const galleryFields = Object.keys(req.body).filter(key => key.startsWith('gallery_'));
  
  if (galleryFields.length > 0) {
    galleryImages = galleryFields.map((key, index) => ({
      product_id: product.id,
      image_url: req.body[key],
      alt_text: name,
      sort_order: index + 1, // Start from 1 since main image is 0
      is_primary: false,
    }));
  }

  // Handle additional uploaded files (if any)
  if (req.files && req.files.length > 1) {
    const additionalImages = req.files.slice(1).map((file, index) => ({
      product_id: product.id,
      image_url: `/uploads/${file.filename}`,
      alt_text: file.originalname,
      sort_order: galleryImages.length + index + 1,
      is_primary: false,
    }));
    galleryImages = [...galleryImages, ...additionalImages];
  }

  // Save gallery images to product_images table
  if (galleryImages.length > 0) {
    await ProductImage.bulkCreate(galleryImages);
  }

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock_quantity,
      status: product.status,
      image: mainImage,
      gallery: galleryImages.map(img => img.image_url),
    },
  });
});

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // For multipart/form-data, all fields are strings
  // Convert numeric fields
  function parseNum(val) {
    if (val === undefined || val === null || val === "") return undefined;
    return isNaN(val) ? val : Number(val);
  }

  product.name = req.body.name || product.name;
  product.slug = req.body.slug || product.slug;
  product.sku = req.body.sku || product.sku;
  product.description = req.body.description || product.description;
  product.short_description = req.body.short_description || product.short_description;
  product.model = req.body.model || product.model;
  product.brand_id = parseNum(req.body.brand_id) || product.brand_id;
  product.category_id = parseNum(req.body.category_id) || product.category_id;
  product.price = parseNum(req.body.price) || product.price;
  product.compare_price = parseNum(req.body.compare_price) || product.compare_price;
  product.cost_price = parseNum(req.body.cost_price) || product.cost_price;
  product.stock_quantity = parseNum(req.body.stock_quantity) || product.stock_quantity;
  product.min_stock_level = parseNum(req.body.min_stock_level) || product.min_stock_level;
  product.weight = parseNum(req.body.weight) || product.weight;
  product.dimensions = req.body.dimensions || product.dimensions;
  product.status = req.body.status || product.status;
  product.featured = typeof req.body.featured !== 'undefined' ? (req.body.featured === 'true' || req.body.featured === true) : product.featured;
  product.meta_title = req.body.meta_title || product.meta_title;
  product.meta_description = req.body.meta_description || product.meta_description;

  // Handle main image from media library
  if (req.body.image) {
    product.image = req.body.image;
  }

  await product.save();

  // Handle gallery images from media library
  const galleryFields = Object.keys(req.body).filter(key => key.startsWith('gallery_'));
  
  if (galleryFields.length > 0) {
    // Delete existing gallery images
    await ProductImage.destroy({ where: { product_id: product.id } });
    
    // Create new gallery images
    const galleryImages = galleryFields.map((key, index) => ({
      product_id: product.id,
      image_url: req.body[key],
      alt_text: product.name,
      sort_order: index + 1,
      is_primary: false,
    }));
    
    await ProductImage.bulkCreate(galleryImages);
  }

  // Handle uploaded files (fallback)
  if (req.files && req.files.length > 0) {
    await ProductImage.destroy({ where: { product_id: product.id } });
    
    // First file as main image
    product.image = `/uploads/${req.files[0].filename}`;
    await product.save();
    
    // Rest as gallery
    if (req.files.length > 1) {
      const images = req.files.slice(1).map((file, index) => ({
        product_id: product.id,
        image_url: `/uploads/${file.filename}`,
        alt_text: file.originalname,
        sort_order: index + 1,
        is_primary: false,
      }));
      await ProductImage.bulkCreate(images);
    }
  }

  const updatedProduct = await Product.findByPk(req.params.id);

  res.json({
    success: true,
    message: "Product updated successfully",
    product: updatedProduct,
  });
});

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await product.destroy();

  res.json({ success: true, message: "Product deleted successfully" });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
