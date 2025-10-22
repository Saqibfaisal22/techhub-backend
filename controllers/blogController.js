const { BlogPost, User } = require("../models")
const logger = require("../utils/logger")
const { Op } = require("sequelize")

// @desc    Get all blog posts
// @route   GET /api/blog
// @access  Public
const getBlogPosts = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status, search } = req.query

    const whereClause = {}

    // Only show published posts to non-admin users
    if (req.user?.role !== "admin") {
      whereClause.status = "published"
      whereClause.published_at = { [Op.lte]: new Date() }
    } else if (status) {
      whereClause.status = status
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
        { excerpt: { [Op.like]: `%${search}%` } },
      ]
    }

    const { count, rows: posts } = await BlogPost.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
      limit,
      offset,
      order: [
        ["published_at", "DESC"],
        ["created_at", "DESC"],
      ],
    })

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    })
  } catch (error) {
    logger.error("Get blog posts error:", error)
    res.status(500).json({ message: "Failed to fetch blog posts" })
  }
}

// @desc    Get single blog post
// @route   GET /api/blog/:slug
// @access  Public
const getBlogPost = async (req, res) => {
  try {
    const { slug } = req.params

    const whereClause = { slug }
    if (req.user?.role !== "admin") {
      whereClause.status = "published"
      whereClause.published_at = { [Op.lte]: new Date() }
    }

    const post = await BlogPost.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
    })

    if (!post) {
      return res.status(404).json({ message: "Blog post not found" })
    }

    res.json({
      success: true,
      data: { post },
    })
  } catch (error) {
    logger.error("Get blog post error:", error)
    res.status(500).json({ message: "Failed to fetch blog post" })
  }
}

// @desc    Create blog post
// @route   POST /api/blog
// @access  Private/Admin
const createBlogPost = async (req, res) => {
  try {
    const { title, slug, content, excerpt, featured_image, status, meta_title, meta_description } = req.body

    // Check if slug already exists
    const existingPost = await BlogPost.findOne({ where: { slug } })
    if (existingPost) {
      return res.status(400).json({ message: "Blog post slug already exists" })
    }

    const postData = {
      title,
      slug,
      content,
      excerpt,
      featured_image,
      author_id: req.user.id,
      status,
      meta_title,
      meta_description,
    }

    // Set published_at if status is published
    if (status === "published") {
      postData.published_at = new Date()
    }

    const post = await BlogPost.create(postData)

    // Fetch the complete post with author
    const completePost = await BlogPost.findByPk(post.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
    })

    res.status(201).json({
      success: true,
      message: "Blog post created successfully",
      data: { post: completePost },
    })
  } catch (error) {
    logger.error("Create blog post error:", error)
    res.status(500).json({ message: "Failed to create blog post" })
  }
}

// @desc    Update blog post
// @route   PUT /api/blog/:id
// @access  Private/Admin
const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params
    const { title, slug, content, excerpt, featured_image, status, meta_title, meta_description } = req.body

    const post = await BlogPost.findByPk(id)
    if (!post) {
      return res.status(404).json({ message: "Blog post not found" })
    }

    // Check if slug already exists (excluding current post)
    if (slug && slug !== post.slug) {
      const existingPost = await BlogPost.findOne({
        where: { slug, id: { [Op.ne]: id } },
      })
      if (existingPost) {
        return res.status(400).json({ message: "Blog post slug already exists" })
      }
    }

    const updateData = {
      title: title || post.title,
      slug: slug || post.slug,
      content: content !== undefined ? content : post.content,
      excerpt: excerpt !== undefined ? excerpt : post.excerpt,
      featured_image: featured_image !== undefined ? featured_image : post.featured_image,
      status: status || post.status,
      meta_title: meta_title !== undefined ? meta_title : post.meta_title,
      meta_description: meta_description !== undefined ? meta_description : post.meta_description,
    }

    // Set published_at if status is being changed to published
    if (status === "published" && post.status !== "published") {
      updateData.published_at = new Date()
    }

    await post.update(updateData)

    // Fetch the updated post with author
    const updatedPost = await BlogPost.findByPk(id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "first_name", "last_name", "email"],
        },
      ],
    })

    res.json({
      success: true,
      message: "Blog post updated successfully",
      data: { post: updatedPost },
    })
  } catch (error) {
    logger.error("Update blog post error:", error)
    res.status(500).json({ message: "Failed to update blog post" })
  }
}

// @desc    Delete blog post
// @route   DELETE /api/blog/:id
// @access  Private/Admin
const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params

    const post = await BlogPost.findByPk(id)
    if (!post) {
      return res.status(404).json({ message: "Blog post not found" })
    }

    await post.destroy()

    res.json({
      success: true,
      message: "Blog post deleted successfully",
    })
  } catch (error) {
    logger.error("Delete blog post error:", error)
    res.status(500).json({ message: "Failed to delete blog post" })
  }
}

module.exports = {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
}
