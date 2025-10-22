const { Category } = require("../models")
const logger = require("../utils/logger")
const { Op } = require("sequelize")

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const { parent_id, include_children, active_only } = req.query

    const whereClause = {}
    if (parent_id !== undefined) {
      whereClause.parent_id = parent_id === "null" ? null : parent_id
    }
    if (active_only === "true") {
      whereClause.is_active = true
    }

    const includeOptions = []
    if (include_children === "true") {
      includeOptions.push({
        model: Category,
        as: "children",
        where: active_only === "true" ? { is_active: true } : {},
        required: false,
      })
    }

    const categories = await Category.findAll({
      where: whereClause,
      include: includeOptions,
      order: [
        ["sort_order", "ASC"],
        ["name", "ASC"],
      ],
    })

    res.json({
      success: true,
      data: { categories },
    })
  } catch (error) {
    logger.error("Get categories error:", error)
    res.status(500).json({ message: "Failed to fetch categories" })
  }
}

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Public
const getCategoryTree = async (req, res) => {
  try {
    const { active_only } = req.query

    const whereClause = { parent_id: null }
    if (active_only === "true") {
      whereClause.is_active = true
    }

    const buildTree = async (parentId = null, level = 0) => {
      const categories = await Category.findAll({
        where: {
          parent_id: parentId,
          ...(active_only === "true" && { is_active: true }),
        },
        order: [
          ["sort_order", "ASC"],
          ["name", "ASC"],
        ],
      })

      const result = []
      for (const category of categories) {
        const categoryData = category.toJSON()
        categoryData.level = level
        categoryData.children = await buildTree(category.id, level + 1)
        result.push(categoryData)
      }
      return result
    }

    const categoryTree = await buildTree()

    res.json({
      success: true,
      data: { categories: categoryTree },
    })
  } catch (error) {
    logger.error("Get category tree error:", error)
    res.status(500).json({ message: "Failed to fetch category tree" })
  }
}

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = async (req, res) => {
  try {
    const { id } = req.params

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Category,
          as: "parent",
        },
        {
          model: Category,
          as: "children",
          where: { is_active: true },
          required: false,
        },
      ],
    })

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    res.json({
      success: true,
      data: { category },
    })
  } catch (error) {
    logger.error("Get category error:", error)
    res.status(500).json({ message: "Failed to fetch category" })
  }
}

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, slug, description, image_url, parent_id, sort_order, is_active, meta_title, meta_description } =
      req.body

    // Check if slug already exists
    const existingCategory = await Category.findOne({ where: { slug } })
    if (existingCategory) {
      return res.status(400).json({ message: "Category slug already exists" })
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image_url,
      parent_id,
      sort_order,
      is_active,
      meta_title,
      meta_description,
    })

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category },
    })
  } catch (error) {
    logger.error("Create category error:", error)
    res.status(500).json({ message: "Failed to create category" })
  }
}

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name, slug, description, image_url, parent_id, sort_order, is_active, meta_title, meta_description } =
      req.body

    const category = await Category.findByPk(id)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Check if slug already exists (excluding current category)
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({
        where: { slug, id: { [Op.ne]: id } },
      })
      if (existingCategory) {
        return res.status(400).json({ message: "Category slug already exists" })
      }
    }

    await category.update({
      name: name || category.name,
      slug: slug || category.slug,
      description: description !== undefined ? description : category.description,
      image_url: image_url !== undefined ? image_url : category.image_url,
      parent_id: parent_id !== undefined ? parent_id : category.parent_id,
      sort_order: sort_order !== undefined ? sort_order : category.sort_order,
      is_active: is_active !== undefined ? is_active : category.is_active,
      meta_title: meta_title !== undefined ? meta_title : category.meta_title,
      meta_description: meta_description !== undefined ? meta_description : category.meta_description,
    })

    res.json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    })
  } catch (error) {
    logger.error("Update category error:", error)
    res.status(500).json({ message: "Failed to update category" })
  }
}

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    const category = await Category.findByPk(id)
    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Check if category has children
    const childrenCount = await Category.count({ where: { parent_id: id } })
    if (childrenCount > 0) {
      return res.status(400).json({ message: "Cannot delete category with subcategories" })
    }

    // Check if category has products
    const { Product } = require("../models")
    const productsCount = await Product.count({ where: { category_id: id } })
    if (productsCount > 0) {
      return res.status(400).json({ message: "Cannot delete category with products" })
    }

    await category.destroy()

    res.json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (error) {
    logger.error("Delete category error:", error)
    res.status(500).json({ message: "Failed to delete category" })
  }
}

module.exports = {
  getCategories,
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
}
