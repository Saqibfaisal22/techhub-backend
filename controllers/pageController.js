const { Page } = require("../models")
const logger = require("../utils/logger")
const { Op } = require("sequelize")

// @desc    Get all pages
// @route   GET /api/pages
// @access  Public
const getPages = async (req, res) => {
  try {
    const { status = "published" } = req.query

    const whereClause = {}
    if (req.user?.role !== "admin") {
      whereClause.status = "published"
    } else if (status) {
      whereClause.status = status
    }

    const pages = await Page.findAll({
      where: whereClause,
      attributes: ["id", "title", "slug", "excerpt", "status", "created_at", "updated_at"],
      order: [["title", "ASC"]],
    })

    res.json({
      success: true,
      data: { pages },
    })
  } catch (error) {
    logger.error("Get pages error:", error)
    res.status(500).json({ message: "Failed to fetch pages" })
  }
}

// @desc    Get single page
// @route   GET /api/pages/:slug
// @access  Public
const getPage = async (req, res) => {
  try {
    const { slug } = req.params

    const whereClause = { slug }
    if (req.user?.role !== "admin") {
      whereClause.status = "published"
    }

    const page = await Page.findOne({
      where: whereClause,
    })

    if (!page) {
      return res.status(404).json({ message: "Page not found" })
    }

    res.json({
      success: true,
      data: { page },
    })
  } catch (error) {
    logger.error("Get page error:", error)
    res.status(500).json({ message: "Failed to fetch page" })
  }
}

// @desc    Create page
// @route   POST /api/pages
// @access  Private/Admin
const createPage = async (req, res) => {
  try {
    const { title, slug, content, excerpt, status, meta_title, meta_description } = req.body

    // Check if slug already exists
    const existingPage = await Page.findOne({ where: { slug } })
    if (existingPage) {
      return res.status(400).json({ message: "Page slug already exists" })
    }

    const page = await Page.create({
      title,
      slug,
      content,
      excerpt,
      status,
      meta_title,
      meta_description,
    })

    res.status(201).json({
      success: true,
      message: "Page created successfully",
      data: { page },
    })
  } catch (error) {
    logger.error("Create page error:", error)
    res.status(500).json({ message: "Failed to create page" })
  }
}

// @desc    Update page
// @route   PUT /api/pages/:id
// @access  Private/Admin
const updatePage = async (req, res) => {
  try {
    const { id } = req.params
    const { title, slug, content, excerpt, status, meta_title, meta_description } = req.body

    const page = await Page.findByPk(id)
    if (!page) {
      return res.status(404).json({ message: "Page not found" })
    }

    // Check if slug already exists (excluding current page)
    if (slug && slug !== page.slug) {
      const existingPage = await Page.findOne({
        where: { slug, id: { [Op.ne]: id } },
      })
      if (existingPage) {
        return res.status(400).json({ message: "Page slug already exists" })
      }
    }

    await page.update({
      title: title || page.title,
      slug: slug || page.slug,
      content: content !== undefined ? content : page.content,
      excerpt: excerpt !== undefined ? excerpt : page.excerpt,
      status: status || page.status,
      meta_title: meta_title !== undefined ? meta_title : page.meta_title,
      meta_description: meta_description !== undefined ? meta_description : page.meta_description,
    })

    res.json({
      success: true,
      message: "Page updated successfully",
      data: { page },
    })
  } catch (error) {
    logger.error("Update page error:", error)
    res.status(500).json({ message: "Failed to update page" })
  }
}

// @desc    Delete page
// @route   DELETE /api/pages/:id
// @access  Private/Admin
const deletePage = async (req, res) => {
  try {
    const { id } = req.params

    const page = await Page.findByPk(id)
    if (!page) {
      return res.status(404).json({ message: "Page not found" })
    }

    await page.destroy()

    res.json({
      success: true,
      message: "Page deleted successfully",
    })
  } catch (error) {
    logger.error("Delete page error:", error)
    res.status(500).json({ message: "Failed to delete page" })
  }
}

module.exports = {
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
}
