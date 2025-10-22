
const asyncHandler = require("express-async-handler");
const { Page } = require("../../models");

// @desc    Get all CMS pages
// @route   GET /api/admin/cms/pages
// @access  Private/Admin
const getPages = asyncHandler(async (req, res) => {
  const pages = await Page.findAll({
    order: [["title", "ASC"]],
    attributes: ["id", "title", "slug", "status", ["updatedAt", "lastModified"]],
  });

  res.json({ pages });
});

// @desc    Get single CMS page
// @route   GET /api/admin/cms/pages/:id
// @access  Private/Admin
const getPage = asyncHandler(async (req, res) => {
  const page = await Page.findByPk(req.params.id);

  if (!page) {
    res.status(404);
    throw new Error("Page not found");
  }

  res.json(page);
});

// @desc    Update CMS page
// @route   PUT /api/admin/cms/pages/:id
// @access  Private/Admin
const updatePage = asyncHandler(async (req, res) => {
  const page = await Page.findByPk(req.params.id);

  if (!page) {
    res.status(404);
    throw new Error("Page not found");
  }

  const {
    title,
    slug,
    content,
    metaTitle,
    metaDescription,
    status,
  } = req.body;

  page.title = title || page.title;
  page.slug = slug || page.slug;
  page.content = content || page.content;
  page.metaTitle = metaTitle || page.metaTitle;
  page.metaDescription = metaDescription || page.metaDescription;
  page.status = status || page.status;

  const updatedPage = await page.save();

  res.json({
    success: true,
    message: "Page updated successfully",
    page: {
      id: updatedPage.id,
      title: updatedPage.title,
      slug: updatedPage.slug,
      status: updatedPage.status,
    },
  });
});

module.exports = {
  getPages,
  getPage,
  updatePage,
};
