
const asyncHandler = require("express-async-handler");
const {
  BlogPost,
  User,
} = require("../../models");
const { Op } = require("sequelize");

// @desc    Get all blog posts
// @route   GET /api/admin/blog/posts
// @access  Private/Admin
const getPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const status = req.query.status || "";

  const offset = (page - 1) * limit;

  const whereClause = {};
  if (search) {
    whereClause.title = { [Op.like]: `%${search}%` };
  }
  if (status) {
    whereClause.status = status;
  }

  const { count, rows: posts } = await BlogPost.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [["published_at", "DESC"]],
    include: [
      {
        model: User,
        as: "author",
        attributes: ["first_name", "last_name"],
      },
    ],
  });

  const formattedPosts = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    author: p.author ? `${p.author.first_name} ${p.author.last_name}` : "N/A",
    status: p.status,
    publishedDate: p.published_at,
    views: p.views,
    image: p.featured_image,
    excerpt: p.excerpt,
    content: p.content,
    category: p.category,
    tags: p.tags,
  }));

  res.json({
    posts: formattedPosts,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalPosts: count,
      limit,
    },
  });
});

// @desc    Get single blog post
// @route   GET /api/admin/blog/posts/:id
// @access  Private/Admin
const getPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "first_name", "last_name", "email"],
      },
    ],
  });

  if (!post) {
    res.status(404);
    throw new Error("Blog post not found");
  }

  res.json({
    id: post.id,
    title: post.title,
    slug: post.slug,
    author: post.author ? `${post.author.first_name} ${post.author.last_name}` : "N/A",
    authorId: post.author ? post.author.id : null,
    status: post.status,
    publishedDate: post.published_at,
    views: post.views,
    image: post.featured_image,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    tags: post.tags,
    metaTitle: post.meta_title,
    metaDescription: post.meta_description,
  });
});

// @desc    Create new blog post
// @route   POST /api/admin/blog/posts
// @access  Private/Admin
const createPost = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    content,
    excerpt,
    status,
    image,
    category,
    tags,
    metaTitle,
    metaDescription,
  } = req.body;

  const post = await BlogPost.create({
    title,
    slug,
    content,
    excerpt,
    author_id: req.user.id,
    status,
    featured_image: image,
    category,
    tags,
    meta_title: metaTitle,
    meta_description: metaDescription,
    published_at: status === "published" ? new Date() : null,
  });

  res.status(201).json({
    success: true,
    message: "Blog post created successfully",
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
    },
  });
});

// @desc    Update blog post
// @route   PUT /api/admin/blog/posts/:id
// @access  Private/Admin
const updatePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Blog post not found");
  }

  const {
    title,
    slug,
    content,
    excerpt,
    status,
    image,
    category,
    tags,
    metaTitle,
    metaDescription,
  } = req.body;

  post.title = title || post.title;
  post.slug = slug || post.slug;
  post.content = content || post.content;
  post.excerpt = excerpt || post.excerpt;
  post.status = status || post.status;
  post.featured_image = image || post.featured_image;
  post.category = category || post.category;
  post.tags = tags || post.tags;
  post.meta_title = metaTitle || post.meta_title;
  post.meta_description = metaDescription || post.meta_description;

  if (status === "published" && post.status !== "published") {
    post.published_at = new Date();
  }

  const updatedPost = await post.save();

  res.json({
    success: true,
    message: "Blog post updated successfully",
    post: {
      id: updatedPost.id,
      title: updatedPost.title,
      slug: updatedPost.slug,
      status: updatedPost.status,
      publishedDate: updatedPost.published_at,
      views: updatedPost.views,
      image: updatedPost.featured_image,
      excerpt: updatedPost.excerpt,
      content: updatedPost.content,
      category: updatedPost.category,
      tags: updatedPost.tags,
      metaTitle: updatedPost.meta_title,
      metaDescription: updatedPost.meta_description,
    },
  });
});

// @desc    Delete blog post
// @route   DELETE /api/admin/blog/posts/:id
// @access  Private/Admin
const deletePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Blog post not found");
  }

  await post.destroy();

  res.json({ success: true, message: "Blog post deleted successfully" });
});

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
};
